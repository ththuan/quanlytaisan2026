import { Op } from 'sequelize';
import sequelize from '../config/database';
import {
  Asset,
  AssetDisposalCase,
  AssetDisposalItem,
  AuditLog,
  Department,
  InventoryReport,
  InventoryReportDetail,
  MaintenanceRequest,
  User,
} from '../models';
import { ConflictError, NotFoundError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import notificationService from './notification.service';

const normalizeCode = (code: string): string => code.trim().replace(/\s+/g, '-');

class AssetDisposalService {
  private async generateCaseCode(id: number, year: number): Promise<string> {
    return `GTS-${year}-${String(id).padStart(6, '0')}`;
  }

  async ensureDisposalCaseFromInventoryReport(
    reportId: number,
    approvedBy: number,
    transaction?: any
  ): Promise<AssetDisposalCase> {
    const report = await InventoryReport.findByPk(reportId, { transaction });
    if (!report) throw new NotFoundError('Inventory report not found');

    const existing = await AssetDisposalCase.findOne({
      where: { source_type: 'inventory', source_inventory_report_id: reportId },
      transaction,
    });
    if (existing) return existing;

    const created = await AssetDisposalCase.create(
      {
        code: 'TEMP',
        source_type: 'inventory',
        source_inventory_report_id: reportId,
        origin_department_id: (report as any).department_id,
        status: 'pending',
        created_by: approvedBy,
        approved_by: approvedBy,
        approved_at: new Date(),
      } as any,
      { transaction }
    );

    const year = new Date().getFullYear();
    const code = await this.generateCaseCode(created.id, year);
    await created.update({ code: normalizeCode(code) }, { transaction });

    return created;
  }

  async addItemFromInventoryDetail(
    disposalCaseId: number,
    detail: InventoryReportDetail,
    movedBy: number,
    movedFromDepartmentId?: number | null,
    transaction?: any
  ): Promise<void> {
    const assetId = (detail as any).asset_id;
    if (!assetId) return;

    const exists = await AssetDisposalItem.findOne({
      where: {
        disposal_case_id: disposalCaseId,
        asset_id: assetId,
      },
      transaction,
    });
    if (exists) return;

    await AssetDisposalItem.create(
      {
        disposal_case_id: disposalCaseId,
        asset_id: assetId,
        inventory_report_detail_id: (detail as any).id,
        moved_from_department_id: movedFromDepartmentId ?? undefined,
        moved_at: new Date(),
        moved_by: movedBy,
        reason: (detail as any).disposal_reason,
      } as any,
      { transaction }
    );
  }

  async listCases(query: any): Promise<PaginationResult<any>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.origin_department_id) where.origin_department_id = Number(query.origin_department_id);
    if (query.search) {
      where[Op.or] = [{ code: { [Op.iLike]: `%${query.search}%` } }];
    }

    // Filter theo asset_id: tìm các case có chứa tài sản này
    const itemInclude: any = {
      model: AssetDisposalItem,
      as: 'items',
      required: !!query.asset_id,
      attributes: ['id', 'asset_id', 'reason'],
      ...(query.asset_id ? { where: { asset_id: Number(query.asset_id) } } : {}),
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'asset_code', 'name'], required: false }],
    };

    const { count, rows } = await AssetDisposalCase.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
      include: [
        { model: Department, as: 'origin_department', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'username', 'fullname'], required: false },
        itemInclude,
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getCaseById(id: number): Promise<any> {
    const c = await AssetDisposalCase.findByPk(id, {
      include: [
        { model: Department, as: 'origin_department', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'username', 'fullname'], required: false },
        {
          model: AssetDisposalItem,
          as: 'items',
          required: false,
          include: [
            { model: Asset, as: 'asset', required: false },
            {
              model: InventoryReportDetail,
              as: 'inventory_detail',
              required: false,
            },
            { model: Department, as: 'moved_from_department', required: false, attributes: ['id', 'name'] },
          ],
        },
        {
          model: InventoryReport,
          as: 'source_inventory_report',
          required: false,
        },
      ],
    });
    if (!c) throw new NotFoundError('Disposal case not found');
    return c;
  }

  async completeCase(
    id: number,
    userId: number,
    payload: { decision_no: string; decision_date?: string; decision_file_url?: string; notes?: string; revenue?: number }
  ): Promise<any> {
    const c = await AssetDisposalCase.findByPk(id, { include: [{ model: AssetDisposalItem, as: 'items' }] });
    if (!c) throw new NotFoundError('Disposal case not found');
    if ((c as any).status !== 'pending') throw new ConflictError('Chỉ được hoàn tất hồ sơ đang chờ');

    const transaction = await sequelize.transaction();
    try {
      await c.update(
        {
          status: 'completed',
          decision_no: payload.decision_no,
          decision_date: payload.decision_date ? new Date(payload.decision_date) : null,
          decision_file_url: payload.decision_file_url,
          notes: payload.notes,
          revenue: payload.revenue ?? 0,
        } as any,
        { transaction }
      );

      const items = ((c as any).items || []) as AssetDisposalItem[];
      const assetIds = items.map((it: any) => it.asset_id).filter(Boolean);

      if (assetIds.length) {
        const assets = await Asset.findAll({ where: { id: assetIds }, transaction });
        for (const a of assets) {
          const oldValue = { status: (a as any).status, current_department_id: (a as any).current_department_id };
          await a.update({ status: 'disposed' } as any, { transaction });
          await AuditLog.create(
            {
              user_id: userId,
              action: 'update',
              table_name: 'assets',
              record_id: (a as any).id,
              old_value: oldValue,
              new_value: { status: 'disposed', disposal_case_id: id },
            } as any,
            { transaction }
          );
        }
      }

      await transaction.commit();

      // Thông báo: hồ sơ đã hoàn tất
      try {
        const recipientIds: number[] = [];
        if ((c as any).created_by) recipientIds.push((c as any).created_by);
        const headIds = await notificationService.getUserIdsByDepartmentRoles((c as any).origin_department_id, ['department_head']);
        await notificationService.notify({
          userIds: [...recipientIds, ...headIds],
          type: 'disposal',
          title: 'Hồ sơ thanh lý/tiêu hủy đã hoàn tất',
          message: `Hồ sơ ${(c as any).code || ''} đã hoàn tất, tài sản đã được cập nhật trạng thái thanh lý.`,
          link: '/asset-disposals',
          entityType: 'asset_disposal_case',
          entityId: id,
          excludeUserId: userId,
        });
      } catch { /* bỏ qua lỗi thông báo */ }

      return this.getCaseById(id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Sửa thông tin hồ sơ khi CHƯA hoàn tất (status = pending).
   */
  async updatePendingCase(
    id: number,
    userId: number,
    payload: {
      disposal_type?: 'liquidation' | 'destruction';
      destruction_method?: string | null;
      disposal_method?: string | null;
      notes?: string | null;
      origin_department_id?: number | null;
      decision_no?: string | null;
      decision_date?: string | null;
      asset_ids?: number[];
    }
  ): Promise<any> {
    const c = await AssetDisposalCase.findByPk(id);
    if (!c) throw new NotFoundError('Hồ sơ không tồn tại');
    if ((c as any).status !== 'pending') {
      throw new ConflictError('Chỉ chỉnh sửa được hồ sơ đang chờ xử lý');
    }

    const updateData: any = {};
    const allowed = ['disposal_type', 'destruction_method', 'disposal_method', 'notes', 'origin_department_id', 'decision_no', 'decision_date'];
    for (const key of allowed) {
      if ((payload as any)[key] !== undefined) updateData[key] = (payload as any)[key];
    }

    const replaceAssets = Array.isArray(payload.asset_ids);
    const newIds = replaceAssets
      ? [...new Set(payload.asset_ids!.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0))]
      : [];

    if (replaceAssets && newIds.length === 0) {
      throw new ConflictError('Hồ sơ phải có ít nhất 1 tài sản');
    }

    const transaction = await sequelize.transaction();
    try {
      if (Object.keys(updateData).length > 0) {
        await c.update(updateData, { transaction });
      }

      if (replaceAssets) {
        // Không cho chọn tài sản đang nằm trong hồ sơ chờ xử lý KHÁC
        const conflicts = await AssetDisposalItem.findAll({
          where: { asset_id: { [Op.in]: newIds } },
          include: [
            {
              model: AssetDisposalCase,
              as: 'disposal_case',
              attributes: [],
              required: true,
              where: { status: 'pending', id: { [Op.ne]: id } },
            },
          ],
          attributes: ['asset_id'],
          transaction,
        });
        if (conflicts.length > 0) {
          const names = await Asset.findAll({
            where: { id: { [Op.in]: conflicts.map((x: any) => x.asset_id) } },
            attributes: ['asset_code'],
            transaction,
          });
          throw new ConflictError(
            `Một số tài sản đã nằm trong hồ sơ chờ xử lý khác: ${names.map((a: any) => a.asset_code).join(', ')}`
          );
        }

        const assets = await Asset.findAll({
          where: { id: { [Op.in]: newIds } },
          attributes: ['id', 'status', 'current_department_id'],
          transaction,
        });
        if (assets.length !== newIds.length) {
          throw new NotFoundError('Một số tài sản không tồn tại');
        }

        // Bỏ các tài sản không còn trong danh sách (giữ trạng thái pending_disposal)
        await AssetDisposalItem.destroy({
          where: { disposal_case_id: id, asset_id: { [Op.notIn]: newIds } },
          transaction,
        });

        const existingItems = await AssetDisposalItem.findAll({
          where: { disposal_case_id: id },
          attributes: ['asset_id'],
          transaction,
        });
        const existingIds = new Set(existingItems.map((i: any) => i.asset_id));

        for (const a of assets as any[]) {
          if (existingIds.has(a.id)) continue;
          await AssetDisposalItem.create(
            {
              disposal_case_id: id,
              asset_id: a.id,
              moved_from_department_id: a.current_department_id ?? null,
              moved_at: new Date(),
              moved_by: userId,
              reason: null,
            } as any,
            { transaction }
          );
          if (a.status !== 'pending_disposal') {
            await a.update({ status: 'pending_disposal' }, { transaction });
          }
        }
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    await AuditLog.create({
      user_id: userId,
      action: 'update',
      table_name: 'asset_disposal_cases',
      record_id: id,
      old_value: null,
      new_value: { ...updateData, ...(replaceAssets ? { asset_ids: newIds } : {}) },
    } as any);

    return this.getCaseById(id);
  }

  /**
   * Xóa hồ sơ khi CHƯA hoàn tất (status = pending).
   * Tài sản trong hồ sơ được giữ trạng thái pending_disposal để có thể lập hồ sơ mới.
   */
  async deletePendingCase(id: number, userId: number): Promise<void> {
    const c = await AssetDisposalCase.findByPk(id);
    if (!c) throw new NotFoundError('Hồ sơ không tồn tại');
    if ((c as any).status !== 'pending') {
      throw new ConflictError('Chỉ xóa được hồ sơ đang chờ xử lý');
    }

    const transaction = await sequelize.transaction();
    try {
      // Gỡ liên kết từ đề nghị sửa chữa (nếu có) để tránh trỏ tới hồ sơ đã xóa
      await MaintenanceRequest.update(
        { linked_disposal_case_id: null } as any,
        { where: { linked_disposal_case_id: id } as any, transaction }
      );

      await AssetDisposalItem.destroy({ where: { disposal_case_id: id }, transaction });
      await c.destroy({ transaction });

      await AuditLog.create(
        {
          user_id: userId,
          action: 'delete',
          table_name: 'asset_disposal_cases',
          record_id: id,
          old_value: { code: (c as any).code, status: 'pending' },
          new_value: null,
        } as any,
        { transaction }
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Tạo hồ sơ xử lý tài sản thủ công (tiêu hủy hoặc thanh lý đơn lẻ).
   * Theo Điều 23 (Thanh lý) và Điều 24 (Tiêu hủy) Quy chế.
   */
  async createManualCase(
    userId: number,
    payload: {
      disposal_type: 'liquidation' | 'destruction';
      origin_department_id?: number;
      destruction_method?: string;
      disposal_method?: string;
      notes?: string;
      decision_no?: string;
      decision_date?: string;
      asset_ids: number[];
    }
  ): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      // Kiểm tra xem tài sản nào đã có trong hồ sơ đang chờ xử lý (tránh hồ sơ trùng lặp)
      const existingItems = await AssetDisposalItem.findAll({
        where: { asset_id: payload.asset_ids },
        include: [
          {
            model: AssetDisposalCase,
            as: 'disposal_case',
            where: { status: 'pending' },
            required: true,
            attributes: ['id', 'code'],
          },
        ],
        attributes: ['asset_id'],
        transaction,
      });

      if (existingItems.length > 0) {
        const conflictAssetIds = existingItems.map((i: any) => i.asset_id);
        const conflictAssets = await Asset.findAll({
          where: { id: conflictAssetIds },
          attributes: ['id', 'asset_code', 'name'],
          transaction,
        });
        const names = conflictAssets.map((a: any) => `${a.asset_code} – ${a.name}`).join(', ');
        await transaction.rollback();
        throw new ConflictError(
          `Các tài sản sau đã có trong hồ sơ đề nghị giảm tài sản đang chờ xử lý, không thể tạo thêm: ${names}`
        );
      }

      const year = new Date().getFullYear();
      const prefix = payload.disposal_type === 'destruction' ? 'TH' : 'TL';

      const created = await AssetDisposalCase.create(
        {
          code: 'TEMP',
          source_type: 'manual',
          disposal_type: payload.disposal_type,
          destruction_method: payload.destruction_method ?? null,
          disposal_method: payload.disposal_method ?? null,
          origin_department_id: payload.origin_department_id ?? null,
          status: 'pending',
          notes: payload.notes ?? null,
          decision_no: payload.decision_no ?? null,
          decision_date: payload.decision_date ? new Date(payload.decision_date) : null,
          created_by: userId,
        } as any,
        { transaction }
      );

      const code = `${prefix}-${year}-${String(created.id).padStart(6, '0')}`;
      await created.update({ code }, { transaction });

      // Thêm các tài sản vào hồ sơ
      for (const assetId of payload.asset_ids) {
        const asset = await Asset.findByPk(assetId, { transaction });
        if (!asset) continue;
        await AssetDisposalItem.create(
          {
            disposal_case_id: created.id,
            asset_id: assetId,
            moved_from_department_id: (asset as any).current_department_id ?? null,
            moved_at: new Date(),
            moved_by: userId,
            reason: payload.notes ?? null,
          } as any,
          { transaction }
        );
        await AuditLog.create(
          {
            user_id: userId,
            action: 'update',
            table_name: 'assets',
            record_id: assetId,
            old_value: { status: (asset as any).status },
            new_value: { status: 'pending_disposal' },
          } as any,
          { transaction }
        );
        await asset.update({ status: 'pending_disposal' }, { transaction });
      }

      await transaction.commit();

      // Thông báo: hồ sơ thanh lý mới cần xử lý (trưởng đơn vị gốc + admin)
      try {
        const headIds = await notificationService.getUserIdsByDepartmentRoles(payload.origin_department_id, ['department_head']);
        const adminIds = await notificationService.getAdminIds();
        await notificationService.notify({
          userIds: [...headIds, ...adminIds],
          type: 'disposal',
          title: 'Hồ sơ thanh lý/tiêu hủy mới',
          message: `Hồ sơ ${code} vừa được tạo và đang chờ xử lý.`,
          link: '/asset-disposals',
          entityType: 'asset_disposal_case',
          entityId: created.id,
          excludeUserId: userId,
        });
      } catch { /* bỏ qua lỗi thông báo */ }

      return this.getCaseById(created.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Tạo hồ sơ thanh lý/tiêu hủy từ đề nghị sửa chữa khi chi phí sửa chữa vượt quá giá trị tài sản.
   */
  async createFromMaintenance(
    maintenanceId: number,
    userId: number,
    disposalType: 'liquidation' | 'destruction' = 'liquidation'
  ): Promise<any> {
    const maintenance = await MaintenanceRequest.findByPk(maintenanceId, {
      include: [{ model: Asset, as: 'asset', required: false }],
    });
    if (!maintenance) throw new NotFoundError('Đề nghị sửa chữa không tồn tại');
    if (maintenance.request_type !== 'repair') {
      throw new ConflictError('Chỉ áp dụng cho đề nghị sửa chữa');
    }

    // Nếu đã có hồ sơ liên kết, trả về hồ sơ đó
    if ((maintenance as any).linked_disposal_case_id) {
      return this.getCaseById((maintenance as any).linked_disposal_case_id);
    }

    const assetId = maintenance.asset_id;
    const asset = assetId ? await Asset.findByPk(assetId) : null;
    const departmentId = (maintenance as any).department_id ?? (asset ? (asset as any).department_id : null);

    const transaction = await sequelize.transaction();
    try {
      const year = new Date().getFullYear();
      const prefix = disposalType === 'destruction' ? 'TH' : 'TL';

      const disposalCase = await AssetDisposalCase.create(
        {
          code: 'TEMP',
          source_type: 'maintenance',
          source_maintenance_request_id: maintenanceId,
          disposal_type: disposalType,
          origin_department_id: departmentId ?? null,
          status: 'pending',
          notes: `Chuyển từ đề nghị sửa chữa #${maintenanceId} – chi phí vượt quá giá trị tài sản`,
          created_by: userId,
        } as any,
        { transaction }
      );

      const code = `${prefix}-${year}-${String(disposalCase.id).padStart(6, '0')}`;
      await disposalCase.update({ code }, { transaction });

      // Thêm tài sản vào hồ sơ nếu có
      if (asset) {
        await AssetDisposalItem.create(
          {
            disposal_case_id: disposalCase.id,
            asset_id: assetId,
            moved_at: new Date(),
            moved_by: userId,
            reason: `Chi phí sửa chữa vượt quá giá trị tài sản (từ đề nghị #${maintenanceId})`,
          } as any,
          { transaction }
        );
        await AuditLog.create(
          {
            user_id: userId,
            action: 'update',
            table_name: 'assets',
            record_id: assetId,
            old_value: { status: (asset as any).status },
            new_value: { status: 'pending_disposal' },
          } as any,
          { transaction }
        );
        await asset.update({ status: 'pending_disposal' }, { transaction });
      }

      // Cập nhật trạng thái đề nghị sửa chữa
      await maintenance.update(
        {
          status: 'rejected_due_to_high_cost',
          linked_disposal_case_id: disposalCase.id,
        } as any,
        { transaction }
      );

      await transaction.commit();
      return this.getCaseById(disposalCase.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}

export default new AssetDisposalService();
