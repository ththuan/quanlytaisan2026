/**
 * Inventory Service
 * Xử lý logic kiểm kê hàng năm theo quy trình 2 tầng duyệt
 * Tầng 1: Trưởng đơn vị duyệt
 * Tầng 2: Admin tổng hợp và duyệt
 */

import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import {
  InventoryRound,
  InventoryReport,
  InventoryReportDetail,
  Asset,
  User,
  Department,
  AuditLog,
} from '../models';
import notificationService from './notification.service';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset } from '../utils/pagination';

/**
 * Map condition (backend enum) to asset_condition (frontend format)
 * Since we can't map back exactly (fair -> usable/needs_repair, poor -> damaged/disposed),
 * we use default mappings
 */
const mapConditionToAssetCondition = (condition: string | undefined | null): string => {
  if (!condition) return 'good';

  const mapping: Record<string, string> = {
    good: 'good',
    fair: 'usable',
    poor: 'damaged',
  };

  return mapping[condition] || 'good';
};

/**
 * Map asset_condition (frontend) to condition (backend enum)
 */
const mapAssetConditionToCondition = (value: string | undefined): 'good' | 'fair' | 'poor' => {
  if (!value) return 'good';

  if (value === 'good' || value === 'fair' || value === 'poor') {
    return value as 'good' | 'fair' | 'poor';
  }

  const mapping: Record<string, 'good' | 'fair' | 'poor'> = {
    usable: 'fair',
    needs_repair: 'fair',
    damaged: 'poor',
    disposed: 'poor',
  };

  return mapping[value] || 'good';
};

export interface CreateInventoryRoundInput {
  round_name: string;
  round_year: number;
  description?: string;
  start_date: Date;
  end_date: Date;
}

export interface InventoryDetailInput {
  assigned_quantity?: number;
  actual_quantity: number;
  actual_value?: number;
  asset_condition?: string;
  check_status?: string;
  condition?: 'good' | 'fair' | 'poor';
  suggest_disposal?: boolean;
  suggest_repair?: boolean;
  disposal_reason?: string;
  notes?: string;
  scan_method?: 'qr_scan' | 'manual_confirm' | 'area_manual' | 'batch';
  manual_reason?: string;
  image_urls?: string[];
  discrepancy_reason?: string;
  responsibility?: string;
  compensation_amount?: number;
}

const NON_SCANNABLE_UNITS = ['m2', 'm²', 'ha', 'km2', 'km²', 'cm2', 'cm²'];

/**
 * Xây dựng thuộc tính InventoryReportDetail từ asset + dữ liệu form.
 * Dùng chung cho thêm lẻ và thêm hàng loạt để đảm bảo cùng quy tắc nghiệp vụ.
 */
const buildDetailAttributes = (asset: any, data: InventoryDetailInput) => {
  const isAreaAsset = asset.unit && NON_SCANNABLE_UNITS.includes(String(asset.unit).toLowerCase().trim());

  let assignedQuantity = data.assigned_quantity;
  if (assignedQuantity === undefined || assignedQuantity === null) {
    assignedQuantity = isAreaAsset ? asset.quantity || 1 : 1;
  }

  // "Thiếu" luôn tương ứng số lượng thực tế = 0, tránh trường hợp người dùng
  // chọn Thiếu nhưng giữ nguyên số lượng sổ sách khiến hệ thống coi là khớp.
  const requestedQuantity = Number(data.actual_quantity);
  const actualQuantity = data.check_status === 'missing'
    ? 0
    : (Number.isFinite(requestedQuantity) ? requestedQuantity : 0);

  const discrepancy = actualQuantity - assignedQuantity;
  const conditionValue = data.condition || data.asset_condition || 'good';
  const condition = mapAssetConditionToCondition(conditionValue);
  const originalAssetCondition = data.asset_condition || conditionValue;
  const isPendingDisposal = asset.status === 'pending_disposal';

  // NGUYÊN TẮC: Không thể vừa sửa chữa vừa thanh lý
  let suggestDisposal = false;
  let suggestRepair = false;

  if (data.suggest_disposal === true || isPendingDisposal) {
    suggestDisposal = true;
    suggestRepair = false;
  } else if (data.suggest_repair === true || originalAssetCondition === 'needs_repair') {
    suggestRepair = true;
    suggestDisposal = false;
  } else if (originalAssetCondition === 'damaged') {
    suggestDisposal = true;
    suggestRepair = false;
  }

  return {
    assigned_quantity: assignedQuantity,
    actual_quantity: actualQuantity,
    quantity_discrepancy: discrepancy,
    condition: isPendingDisposal && !data.condition ? 'poor' : condition,
    original_asset_condition: isPendingDisposal && !data.asset_condition ? 'damaged' : originalAssetCondition,
    suggest_disposal: suggestDisposal,
    suggest_repair: suggestRepair,
    disposal_reason: data.disposal_reason || (isPendingDisposal ? 'Chi phí sửa chữa vượt quá giá trị tài sản' : undefined),
    notes: data.notes,
    scan_method: data.scan_method,
    manual_reason: data.manual_reason,
    image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
    discrepancy_reason: data.discrepancy_reason ?? null,
    responsibility: data.responsibility ?? null,
    compensation_amount: data.compensation_amount ?? null,
  };
};

/** Suy ra kết quả kiểm kê từ dữ liệu thực tế (dùng chung cho API trả về). */
const deriveDetailCheckStatus = (detail: any): string => {
  const discrepancy = Number(detail?.quantity_discrepancy ?? 0);
  if (discrepancy < 0) return 'missing';
  if (discrepancy > 0) return 'surplus';
  if (detail?.suggest_repair) return 'needs_repair';
  if (detail?.condition === 'poor' || detail?.suggest_disposal) return 'damaged';
  return 'matched';
};

/** Chặn thao tác khi đợt kiểm kê đã hoàn tất hoặc quá hạn. */
const assertRoundOpenForEditing = (round: any): void => {
  if (!round) return;
  if (round.status === 'completed') {
    throw new ValidationError('Đợt kiểm kê đã hoàn tất, không thể chỉnh sửa.');
  }
  if (round.end_date) {
    const endDate = new Date(round.end_date);
    // Cho phép thao tác hết ngày kết thúc (end_date thường chỉ lưu ngày).
    endDate.setHours(23, 59, 59, 999);
    if (endDate.getTime() < Date.now()) {
      throw new ValidationError(
        `Đợt kiểm kê đã hết hạn vào ${new Date(round.end_date).toLocaleDateString('vi-VN')}. Vui lòng liên hệ admin để gia hạn.`
      );
    }
  }
};

const INVENTORY_ASSET_STATUSES = [
  'active',
  'inactive',
  'damaged',
  'pending_disposal',
  'pending_repair',
] as const;

interface RoundUnitState {
  root: any;
  requiredDeptIds: number[];
  allCompleted: boolean;
  allSubmitted: boolean;
  hasAnyReport: boolean;
}

/**
 * Tính trạng thái hoàn tất của từng đơn vị gốc dựa trên toàn bộ cây đơn vị con/cháu.
 * Một đơn vị gốc hoàn tất khi mọi đơn vị có tài sản trong cây đều có báo cáo
 * ở trạng thái completed (đã được duyệt cấp 1 và admin duyệt cuối).
 */
const computeRoundUnitStates = (
  departments: any[],
  reports: any[],
  assetDeptIds: Set<number>
): RoundUnitState[] => {
  const roots: any[] = [];
  const childrenByParent = new Map<number, number[]>();
  for (const dept of departments) {
    if (dept.parent_department_id == null) {
      roots.push(dept);
    } else {
      const parentId = Number(dept.parent_department_id);
      const children = childrenByParent.get(parentId) || [];
      children.push(Number(dept.id));
      childrenByParent.set(parentId, children);
    }
  }

  const subtreeIds = (rootId: number): number[] => {
    const result: number[] = [];
    const seen = new Set<number>();
    const stack = [rootId];
    while (stack.length > 0) {
      const id = stack.pop() as number;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
      for (const childId of childrenByParent.get(id) || []) {
        stack.push(childId);
      }
    }
    return result;
  };

  const reportsByDept = new Map<number, any[]>();
  for (const report of reports) {
    const deptId = Number(report.department_id);
    const items = reportsByDept.get(deptId) || [];
    items.push(report);
    reportsByDept.set(deptId, items);
  }

  const submittedStatuses = ['pending', 'approved_by_head', 'approved_by_admin', 'completed'];

  return roots.map((root) => {
    const subtree = subtreeIds(Number(root.id));
    const requiredDeptIds = subtree.filter((deptId) => assetDeptIds.has(deptId));
    const allCompleted = requiredDeptIds.length === 0
      ? true
      : requiredDeptIds.every((deptId) => {
        const deptReports = reportsByDept.get(deptId) || [];
        return deptReports.length > 0 && deptReports.every((report) => report.status === 'completed');
      });
    const allSubmitted = requiredDeptIds.length === 0
      ? true
      : requiredDeptIds.every((deptId) => {
        const deptReports = reportsByDept.get(deptId) || [];
        return deptReports.length > 0
          && deptReports.every((report) => submittedStatuses.includes(report.status));
      });
    const hasAnyReport = subtree.some((deptId) => (reportsByDept.get(deptId) || []).length > 0);

    return { root, requiredDeptIds, allCompleted, allSubmitted, hasAnyReport };
  });
};

/** Tập đơn vị đang có tài sản thuộc phạm vi kiểm kê (để xác định đơn vị bắt buộc có báo cáo). */
const getDepartmentIdsWithAssets = async (): Promise<Set<number>> => {
  const rows: any[] = await sequelize.query(
    `SELECT DISTINCT current_department_id
     FROM assets
     WHERE current_department_id IS NOT NULL
       AND status IN (:statuses)`,
    {
      replacements: { statuses: INVENTORY_ASSET_STATUSES },
      type: QueryTypes.SELECT,
    }
  );
  return new Set(
    rows
      .map((row) => Number(row.current_department_id))
      .filter((deptId) => Number.isFinite(deptId))
  );
};

/** Map một detail (model) về đúng shape API trả về cho frontend. */
const toDetailResponse = (detail: any) => {
  const detailData = detail.toJSON ? detail.toJSON() : detail;
  return {
    ...detailData,
    asset_condition: detailData.original_asset_condition || mapConditionToAssetCondition(detailData.condition),
    check_status: deriveDetailCheckStatus(detailData),
    actual_value: null,
  };
};

class InventoryService {
  /** Toàn bộ đơn vị trong cây (chính nó + con/cháu/chắt...). */
  async getSubtreeDepartmentIds(rootId: number): Promise<number[]> {
    const rows: any[] = await sequelize.query(
      `WITH RECURSIVE dept AS (
         SELECT id FROM departments WHERE id = :rootId
         UNION ALL
         SELECT d.id
         FROM departments d
         JOIN dept ON d.parent_department_id = dept.id
       )
       SELECT id FROM dept`,
      { replacements: { rootId }, type: QueryTypes.SELECT }
    );
    return rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id));
  }

  async createInventoryRound(data: CreateInventoryRoundInput, createdBy: number): Promise<InventoryRound> {
    const activeRound = await InventoryRound.findOne({
      where: { status: { [Op.in]: ['in_progress', 'awaiting_approval'] } },
      attributes: ['id', 'round_name', 'round_year'],
    });
    if (activeRound) {
      throw new ConflictError(
        `Đang có đợt kiểm kê "${(activeRound as any).round_name}" (${(activeRound as any).round_year}) chưa hoàn tất. Vui lòng hoàn tất đợt hiện tại trước khi tạo đợt mới.`
      );
    }

    // Only count root (parent) departments — child reports roll up to parent unit
    const totalDepartments = await Department.count({ where: { parent_department_id: null } });

    const round = await InventoryRound.create({
      ...data,
      total_departments: totalDepartments,
      created_by: createdBy,
      status: 'in_progress',
    });

    // Thông báo cho trưởng đơn vị + nhân viên biết đợt kiểm kê mới
    const participantIds = await notificationService.getUserIdsByRoles(['department_head', 'staff']);
    await notificationService.notify({
      userIds: participantIds,
      type: 'inventory',
      title: 'Đợt kiểm kê mới đã bắt đầu',
      message: `Đợt kiểm kê "${round.round_name}" đã bắt đầu. Vui lòng thực hiện kiểm kê tài sản của đơn vị trước hạn.`,
      link: '/inventory',
      entityType: 'inventory_round',
      entityId: round.id,
      excludeUserId: createdBy,
    });

    return this.getInventoryRoundById(round.id);
  }

  async getAllInventoryRounds(query: any) {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};
    if (query.year) where.round_year = query.year;
    if (query.status) where.status = query.status;

    const { count, rows } = await InventoryRound.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy || 'round_year', sortOrder || 'DESC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullname'] }],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getInventoryRoundById(id: number): Promise<any> {
    // Ensure accurate round statistics
    await this.updateRoundStatistics(id);

    const [round, departments, assetDeptIds] = await Promise.all([
      InventoryRound.findByPk(id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'fullname'] },
          {
            model: InventoryReport,
            as: 'reports',
            include: [
              { model: Department, as: 'department', attributes: ['id', 'name'] },
              { model: User, as: 'creator', attributes: ['id', 'fullname'] },
            ],
          },
        ],
      }),
      Department.findAll({
        attributes: ['id', 'name', 'parent_department_id'],
      }),
      getDepartmentIdsWithAssets(),
    ]);

    if (!round) {
      throw new NotFoundError('Inventory round not found');
    }

    const reports = (round as any).reports || [];
    const states = computeRoundUnitStates(departments as any[], reports, assetDeptIds);

    const unsubmitted_departments = states
      .filter((state) => !state.allCompleted && !state.hasAnyReport)
      .map((state) => state.root);
    const incomplete_departments = states
      .filter((state) => !state.allCompleted && state.hasAnyReport)
      .map((state) => state.root);
    const not_submitted_departments = states
      .filter((state) => !state.allSubmitted)
      .map((state) => state.root);

    return {
      ...round.toJSON(),
      unsubmitted_departments,
      incomplete_departments,
      not_submitted_departments,
    };
  }

  async getActiveInventoryRound(): Promise<InventoryRound | null> {
    return InventoryRound.findOne({
      where: {
        status: {
          [Op.in]: ['in_progress', 'awaiting_approval'],
        },
      },
      order: [['created_at', 'DESC']],
    });
  }

  async updateRoundStatistics(roundId: number): Promise<void> {
    const [reports, departments, assetDeptIds] = await Promise.all([
      InventoryReport.findAll({
        where: { inventory_round_id: roundId },
        attributes: ['department_id', 'status'],
        raw: true,
      }),
      Department.findAll({
        attributes: ['id', 'parent_department_id'],
        raw: true,
      }),
      getDepartmentIdsWithAssets(),
    ]);

    const states = computeRoundUnitStates(departments as any[], reports as any[], assetDeptIds);
    const completedDepts = states.filter((state) => state.allCompleted).length;
    const pending = (reports as any[]).filter((r) => ['pending', 'draft'].includes(r.status)).length;
    const rejected = (reports as any[]).filter((r) => ['rejected_by_head', 'rejected_by_admin'].includes(r.status)).length;

    await InventoryRound.update(
      {
        completed_reports: completedDepts,
        pending_reports: pending,
        rejected_reports: rejected,
      },
      { where: { id: roundId } }
    );
  }

  async completeInventoryRound(roundId: number): Promise<InventoryRound> {
    const round = await InventoryRound.findByPk(roundId);
    if (!round) {
      throw new NotFoundError('Inventory round not found');
    }

    // Chỉ hoàn tất khi mọi đơn vị có tài sản trong từng cây đơn vị
    // đều đã có báo cáo được duyệt cấp 1 và admin duyệt cuối (completed).
    const [reports, departments, assetDeptIds] = await Promise.all([
      InventoryReport.findAll({
        where: { inventory_round_id: roundId },
        attributes: ['department_id', 'status'],
        raw: true,
      }),
      Department.findAll({
        attributes: ['id', 'name', 'parent_department_id'],
        raw: true,
      }),
      getDepartmentIdsWithAssets(),
    ]);

    const states = computeRoundUnitStates(departments as any[], reports as any[], assetDeptIds);
    const notCompleted = states.filter((state) => !state.allCompleted);

    if (notCompleted.length > 0) {
      const names = notCompleted.slice(0, 5).map((state: any) => state.root.name).join(', ');
      throw new ValidationError(
        `Không thể hoàn tất: còn ${notCompleted.length} đơn vị chưa hoàn tất kiểm kê (${names}${notCompleted.length > 5 ? '...' : ''}). `
        + 'Mọi đơn vị có tài sản (kể cả đơn vị cha) phải có báo cáo được duyệt đầy đủ.',
      );
    }

    await round.update({ status: 'completed' });
    return round.reload();
  }

  async extendInventoryRound(roundId: number, endDate: string, adminId: number): Promise<any> {
    const round = await InventoryRound.findByPk(roundId);
    if (!round) {
      throw new NotFoundError('Inventory round not found');
    }
    if (round.status === 'completed') {
      throw new ValidationError('Đợt kiểm kê đã hoàn tất, không thể gia hạn');
    }
    if (new Date(endDate) <= new Date(round.end_date)) {
      throw new ValidationError('Hạn mới phải sau hạn hiện tại của đợt kiểm kê');
    }

    const oldEndDate = round.end_date;
    const oldStatus = round.status;

    await InventoryRound.update(
      {
        end_date: new Date(endDate),
        status: 'in_progress'
      },
      { where: { id: roundId } }
    );

    // Save audit log to track the extension
    await AuditLog.create({
      user_id: adminId,
      action: 'update',
      table_name: 'inventory_rounds',
      record_id: roundId,
      old_value: { end_date: oldEndDate, status: oldStatus },
      new_value: { end_date: endDate, status: 'in_progress' },
    });

    return this.getInventoryRoundById(roundId);
  }

  async createInventoryReport(roundId: number, userId: number, departmentId: number): Promise<InventoryReport> {
    const tx = await sequelize.transaction();
    let reportId: number;
    try {
      // Khóa đợt kiểm kê để tránh 2 nhân viên cùng tạo 2 báo cáo cho một đơn vị.
      const round = await InventoryRound.findByPk(roundId, { transaction: tx, lock: true });
      if (!round) {
        throw new NotFoundError('Inventory round not found');
      }
      if (round.status !== 'in_progress') {
        throw new ValidationError('Inventory round is not active');
      }
      assertRoundOpenForEditing(round);

      // Mỗi đơn vị chỉ có 1 báo cáo trong 1 đợt kiểm kê.
      const existing = await InventoryReport.findOne({
        where: { inventory_round_id: roundId, department_id: departmentId },
        order: [['created_at', 'DESC']],
        transaction: tx,
      });
      if (existing) {
        await tx.commit();
        return this.getInventoryReportById(existing.id);
      }

      const reportCode = `INV-${round.round_year}-${departmentId}-${userId}-${Date.now()}`;
      const report = await InventoryReport.create({
        report_code: reportCode,
        inventory_round_id: roundId,
        created_by: userId,
        department_id: departmentId,
        status: 'draft',
      }, { transaction: tx });
      reportId = report.id;
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    return this.getInventoryReportById(reportId);
  }

  /** Lấy metadata nhẹ (không kèm details) để kiểm tra quyền trước khi ghi. */
  async getInventoryReportMeta(id: number): Promise<InventoryReport | null> {
    return InventoryReport.findByPk(id, {
      attributes: ['id', 'created_by', 'department_id', 'status'],
    });
  }

  async getInventoryReportById(id: number): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(id, {
      include: [
        { model: InventoryRound, as: 'inventory_round' },
        { model: Department, as: 'department' },
        { model: User, as: 'creator', attributes: ['id', 'fullname'] },
        { model: User, as: 'headApprover', attributes: ['id', 'fullname'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'fullname'] },
        {
          model: InventoryReportDetail,
          as: 'details',
          include: [
            {
              model: Asset,
              as: 'asset',
              attributes: [
                'id',
                'asset_code',
                'name',
                'category',
                'category_code',
                'unit',
                'quantity',
                'purchase_price',
                'current_value',
                'condition',
                'status',
              ],
            },
          ],
        },
      ],
    });

    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }

    const reportData = report.toJSON() as any;
    if (reportData.details && Array.isArray(reportData.details)) {
      reportData.details = reportData.details.map((detail: any) => {
        const assetData = detail.asset
          ? {
              ...detail.asset,
              original_value: detail.asset.purchase_price || 0,
            }
          : null;

        return {
          ...detail,
          asset: assetData,
          book_quantity: detail.assigned_quantity || 0,
          quantity_difference: detail.quantity_discrepancy || 0,
          asset_condition: detail.original_asset_condition || mapConditionToAssetCondition(detail.condition),
          check_status: deriveDetailCheckStatus(detail),
          actual_value: null,
        };
      });
    }

    return reportData;
  }

  async getInventoryReportsByRole(userId: number, role: string, departmentId: number, query: any) {
    const { page, limit } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.round_id) {
      where.inventory_round_id = query.round_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (role === 'admin' || role === 'director') {
      // all
    } else if (role === 'department_head') {
      // Trưởng đơn vị thấy báo cáo của đơn vị mình và toàn bộ đơn vị con/cháu.
      const subtreeIds = await this.getSubtreeDepartmentIds(departmentId);
      where.department_id = subtreeIds.length > 0
        ? { [Op.in]: subtreeIds }
        : departmentId;
    } else {
      // Nhân viên: dùng chung báo cáo của đơn vị hiện tại (nhiều nhân viên
      // cùng tham gia kiểm kê), không tạo mỗi người một báo cáo riêng.
      if (departmentId) {
        where.department_id = departmentId;
      } else {
        where.created_by = userId;
      }
    }

    const { count, rows } = await InventoryReport.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: InventoryRound, as: 'inventory_round', attributes: ['id', 'round_name', 'round_year'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullname'] },
      ],
    });

    // Thống kê theo lô bằng 1 query aggregate thay vì load toàn bộ details/assets
    // cho từng báo cáo (trước đây rất nặng khi mỗi đơn vị có hàng nghìn tài sản).
    const reportIds = rows.map((report: any) => Number(report.id));
    let statsRows: any[] = [];
    if (reportIds.length > 0) {
      statsRows = await sequelize.query(
        `SELECT d.inventory_report_id AS report_id,
                COUNT(*)::int AS total_assets,
                SUM(CASE
                      WHEN d.quantity_discrepancy > 0
                        OR (d.quantity_discrepancy = 0
                            AND NOT COALESCE(d.suggest_repair, false)
                            AND NOT (COALESCE(d.condition = 'poor', false) OR COALESCE(d.suggest_disposal, false)))
                      THEN 1 ELSE 0 END)::int AS matched_assets,
                SUM(CASE WHEN d.quantity_discrepancy < 0 THEN 1 ELSE 0 END)::int AS missing_assets,
                SUM(CASE
                      WHEN d.quantity_discrepancy = 0 AND COALESCE(d.suggest_repair, false)
                      THEN 1 ELSE 0 END)::int AS needs_repair_assets,
                SUM(CASE
                      WHEN d.quantity_discrepancy = 0
                        AND NOT COALESCE(d.suggest_repair, false)
                        AND (COALESCE(d.condition = 'poor', false) OR COALESCE(d.suggest_disposal, false))
                      THEN 1 ELSE 0 END)::int AS damaged_assets,
                COALESCE(SUM(a.purchase_price * COALESCE(d.actual_quantity, 0)), 0) AS total_original_value,
                COALESCE(SUM(a.current_value * COALESCE(d.actual_quantity, 0)), 0) AS total_current_value
         FROM inventory_report_details d
         JOIN assets a ON a.id = d.asset_id
         WHERE d.inventory_report_id IN (:reportIds)
         GROUP BY d.inventory_report_id`,
        { replacements: { reportIds }, type: QueryTypes.SELECT }
      );
    }

    const statsByReport = new Map<number, any>(
      statsRows.map((row: any) => [Number(row.report_id), row])
    );

    const reportsWithStats = rows.map((report: any) => {
      const reportData = report.toJSON();
      const stats = statsByReport.get(Number(report.id)) || {};

      return {
        ...reportData,
        total_assets: Number(stats.total_assets || 0),
        matched_assets: Number(stats.matched_assets || 0),
        missing_assets: Number(stats.missing_assets || 0),
        damaged_assets: Number(stats.damaged_assets || 0),
        needs_repair_assets: Number(stats.needs_repair_assets || 0),
        total_original_value: Number(stats.total_original_value || 0),
        total_current_value: Number(stats.total_current_value || 0),
        details: undefined,
      };
    });

    return buildPaginationResult(reportsWithStats, count, page, limit);
  }

  async addInventoryDetail(
    reportId: number,
    assetId: number,
    data: InventoryDetailInput
  ): Promise<InventoryReportDetail> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only add details to draft reports or rejected reports that need resubmission');
    }
    assertRoundOpenForEditing((report as any).inventory_round);

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (Number((asset as any).current_department_id) !== Number((report as any).department_id)) {
      const ownerDepartmentId = (asset as any).current_department_id;
      const ownerDepartment = ownerDepartmentId
        ? await Department.findByPk(ownerDepartmentId, { attributes: ['id', 'name'] })
        : null;
      const ownerDepartmentName = (ownerDepartment as any)?.name || 'chưa xác định';
      throw new ForbiddenError(
        `Tài sản "${asset.name}" (mã ${asset.asset_code}) đang thuộc đơn vị "${ownerDepartmentName}", không thuộc đơn vị của báo cáo kiểm kê. ` +
        'Vui lòng thực hiện điều chuyển tài sản trên hệ thống (nếu đơn vị hiện tại đã tiếp nhận) hoặc đưa tài sản trở về đúng đơn vị trước khi kiểm kê.'
      );
    }

    // Chặn kiểm kê trùng trong cùng đợt, kể cả khi tài sản đã bị điều chuyển
    // sang đơn vị khác và đơn vị mới quét lại.
    const existingDetail = await InventoryReportDetail.findOne({
      where: { asset_id: assetId },
      include: [{
        model: InventoryReport,
        as: 'inventory_report',
        attributes: ['id', 'department_id'],
        where: { inventory_round_id: report.inventory_round_id },
        required: true,
      }],
    });
    if (existingDetail) {
      if (Number(existingDetail.inventory_report_id) === Number(reportId)) {
        throw new ValidationError('Tài sản này đã được kiểm kê trong đợt này rồi');
      }
      const otherDepartmentId = (existingDetail as any).inventory_report?.department_id;
      const otherDepartment = otherDepartmentId
        ? await Department.findByPk(otherDepartmentId, { attributes: ['id', 'name'] })
        : null;
      const otherDepartmentName = (otherDepartment as any)?.name || 'đơn vị khác';
      throw new ConflictError(
        `Tài sản "${asset.name}" (mã ${asset.asset_code}) đã được kiểm kê ở đơn vị "${otherDepartmentName}" trong đợt này. ` +
        'Không thể kiểm kê trùng. Vui lòng liên hệ đơn vị đó hoặc admin để xử lý.'
      );
    }

    const detail = await InventoryReportDetail.create({
      inventory_report_id: reportId,
      asset_id: assetId,
      ...buildDetailAttributes(asset, data),
    });

    await this.updateReportSummary(reportId);

    return toDetailResponse(detail);
  }

  /**
   * Thêm nhiều kết quả kiểm kê trong một lần (dùng khi đánh dấu hàng loạt
   * tài sản chưa quét là "Thiếu" hoặc nộp báo cáo). Tránh N request × nhiều query.
   */
  async addInventoryDetailsBulk(
    reportId: number,
    items: Array<InventoryDetailInput & { asset_id: number }>
  ): Promise<any[]> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only add details to draft reports or rejected reports that need resubmission');
    }
    assertRoundOpenForEditing((report as any).inventory_round);
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Danh sách tài sản kiểm kê rỗng');
    }

    const assetIds = [
      ...new Set(
        items
          .map((item) => Number(item.asset_id))
          .filter((assetId) => Number.isFinite(assetId))
      ),
    ];

    const [assets, roundDetails] = await Promise.all([
      Asset.findAll({
        where: {
          id: { [Op.in]: assetIds },
          current_department_id: report.department_id,
        },
      }),
      InventoryReportDetail.findAll({
        where: { asset_id: { [Op.in]: assetIds } },
        include: [{
          model: InventoryReport,
          as: 'inventory_report',
          attributes: ['id', 'department_id'],
          where: { inventory_round_id: report.inventory_round_id },
          required: true,
        }],
      }),
    ]);

    const assetById = new Map<number, any>(assets.map((asset: any) => [Number(asset.id), asset]));
    const existingByAsset = new Map<number, any>();
    const checkedElsewhere = new Set<number>();
    for (const detail of roundDetails as any[]) {
      const detailAssetId = Number(detail.asset_id);
      if (Number(detail.inventory_report_id) === Number(reportId)) {
        existingByAsset.set(detailAssetId, detail);
      } else {
        checkedElsewhere.add(detailAssetId);
      }
    }
    const existingDetails = [...existingByAsset.values()];

    const seen = new Set<number>();
    const rowsToCreate: any[] = [];
    for (const item of items) {
      const assetId = Number(item.asset_id);
      if (!Number.isFinite(assetId) || seen.has(assetId)) continue;
      seen.add(assetId);

      const asset = assetById.get(assetId);
      if (!asset || existingByAsset.has(assetId) || checkedElsewhere.has(assetId)) continue;

      rowsToCreate.push({
        inventory_report_id: reportId,
        asset_id: assetId,
        ...buildDetailAttributes(asset, item),
      });
    }

    const created: InventoryReportDetail[] = [];
    const tx = await sequelize.transaction();
    try {
      for (let i = 0; i < rowsToCreate.length; i += 500) {
        const chunk = await InventoryReportDetail.bulkCreate(rowsToCreate.slice(i, i + 500), {
          transaction: tx,
          validate: true,
        });
        created.push(...chunk);
      }
      if (created.length > 0) {
        await this.updateReportSummary(reportId, tx);
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    return [...existingDetails, ...created].map((detail) => toDetailResponse(detail));
  }

  async updateInventoryDetail(
    detailId: number,
    reportId: number,
    data: Partial<{
      actual_quantity: number;
      actual_value?: number;
      asset_condition?: string;
      check_status?: string;
      condition: 'good' | 'fair' | 'poor';
      suggest_disposal: boolean;
      suggest_repair: boolean;
      disposal_reason: string;
      notes: string;
      scan_method: 'qr_scan' | 'manual_confirm' | 'area_manual' | 'batch';
      manual_reason?: string;
      image_urls?: string[];
      discrepancy_reason?: string;
      responsibility?: string;
      compensation_amount?: number;
    }>
  ): Promise<InventoryReportDetail> {
    const detail = await InventoryReportDetail.findByPk(detailId, {
      include: [{ model: InventoryReport, as: 'inventory_report' }],
    });

    if (!detail || Number(detail.inventory_report_id) !== Number(reportId)) {
      throw new NotFoundError('Detail not found');
    }

    const report = await InventoryReport.findByPk(detail.inventory_report_id, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (report && report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only update details of draft reports or rejected reports that need resubmission');
    }
    assertRoundOpenForEditing((report as any)?.inventory_round);

    const updateData: any = { ...data };
    if (data.asset_condition && !data.condition) {
      updateData.condition = mapAssetConditionToCondition(data.asset_condition);
      updateData.original_asset_condition = data.asset_condition;
      delete updateData.asset_condition;
    } else if (data.condition) {
      updateData.condition = mapAssetConditionToCondition(data.condition);
      if (!updateData.original_asset_condition && data.asset_condition) {
        updateData.original_asset_condition = data.asset_condition;
      }
    }

    delete updateData.check_status;
    delete updateData.actual_value;

    if (data.check_status === 'missing') {
      updateData.actual_quantity = 0;
      updateData.quantity_discrepancy = -Number(detail.assigned_quantity);
    } else if (data.actual_quantity !== undefined) {
      updateData.quantity_discrepancy = Number(data.actual_quantity) - Number(detail.assigned_quantity);
    }
    
    // NGUYÊN TẮC: Không thể vừa sửa chữa vừa thanh lý
    if (data.suggest_disposal === true) {
      updateData.suggest_disposal = true;
      updateData.suggest_repair = false; // Bắt buộc false
    } else if (data.suggest_repair === true) {
      updateData.suggest_repair = true;
      updateData.suggest_disposal = false; // Bắt buộc false
    } else if (data.suggest_disposal === false) {
      updateData.suggest_disposal = false;
    } else if (data.suggest_repair === false) {
      updateData.suggest_repair = false;
    }

    await detail.update(updateData);

    await this.updateReportSummary(detail.inventory_report_id);

    await detail.reload();

    return toDetailResponse(detail) as any;
  }

  async updateReportImages(reportId: number, imageUrls: string[]): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Chỉ cập nhật ảnh khi báo cáo đang nháp hoặc bị từ chối');
    }
    assertRoundOpenForEditing((report as any).inventory_round);
    await report.update({ image_urls: Array.isArray(imageUrls) ? imageUrls : [] });
    return this.getInventoryReportById(reportId);
  }

  /** Xóa kết quả kiểm kê của cả nhóm công cụ dụng cụ để làm lại. */
  async resetBatchGroupDetails(reportId: number, categoryId: number): Promise<number> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Chỉ xóa kết quả nhóm khi báo cáo đang nháp hoặc bị từ chối');
    }
    assertRoundOpenForEditing((report as any).inventory_round);

    const assets = await Asset.findAll({
      where: { category_id: categoryId, current_department_id: report.department_id },
      attributes: ['id'],
      raw: true,
    });
    const assetIds = (assets as any[]).map((asset) => Number(asset.id));
    if (assetIds.length === 0) return 0;

    const tx = await sequelize.transaction();
    try {
      const deleted = await InventoryReportDetail.destroy({
        where: { inventory_report_id: reportId, asset_id: { [Op.in]: assetIds } },
        transaction: tx,
      });
      if (deleted > 0) {
        await this.updateReportSummary(reportId, tx);
      }
      await tx.commit();
      return deleted;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async updateReportSummary(reportId: number, transaction?: any): Promise<void> {
    const rows: any[] = await sequelize.query(
      `SELECT COALESCE(SUM(assigned_quantity), 0) AS total_assigned,
              COALESCE(SUM(actual_quantity), 0) AS total_actual,
              COALESCE(SUM(ABS(quantity_discrepancy)), 0) AS total_discrepancy,
              COALESCE(SUM(CASE WHEN suggest_disposal THEN 1 ELSE 0 END), 0) AS total_disposal
       FROM inventory_report_details
       WHERE inventory_report_id = :reportId`,
      { replacements: { reportId }, type: QueryTypes.SELECT, transaction }
    );
    const summary = rows[0] || {};

    await InventoryReport.update(
      {
        total_assigned_quantity: Number(summary.total_assigned || 0),
        total_actual_quantity: Number(summary.total_actual || 0),
        total_discrepancy: Number(summary.total_discrepancy || 0),
        total_disposal_suggestions: Number(summary.total_disposal || 0),
      },
      { where: { id: reportId }, transaction }
    );
  }

  async submitInventoryReport(reportId: number, userId: number): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'end_date', 'status'] }],
    });
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }

    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only submit draft reports or resubmit rejected reports');
    }
    assertRoundOpenForEditing((report as any).inventory_round);

    // Bắt buộc có ít nhất 1 ảnh tổng thể đơn vị trước khi nộp
    const reportImages = Array.isArray(report.image_urls) ? report.image_urls : [];
    if (reportImages.length === 0) {
      throw new ValidationError('Cần chụp ít nhất 1 ảnh tổng thể đơn vị trước khi nộp báo cáo kiểm kê');
    }

    // Bắt buộc mọi tài sản còn thuộc đơn vị phải có kết quả kiểm kê.
    const inventoryStatuses = ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'];
    const countRows: any[] = await sequelize.query(
      `SELECT COUNT(*)::int AS missing_count
       FROM assets a
       LEFT JOIN inventory_report_details d
         ON d.asset_id = a.id AND d.inventory_report_id = :reportId
       WHERE a.current_department_id = :departmentId
         AND a.status IN (:inventoryStatuses)
         AND d.id IS NULL
         AND NOT EXISTS (
           SELECT 1
           FROM inventory_report_details d2
           JOIN inventory_reports r2 ON r2.id = d2.inventory_report_id
           WHERE d2.asset_id = a.id
             AND r2.inventory_round_id = :roundId
         )`,
      {
        replacements: {
          reportId,
          departmentId: report.department_id,
          inventoryStatuses,
          roundId: report.inventory_round_id,
        },
        type: QueryTypes.SELECT,
      }
    );
    const missingCount = Number(countRows[0]?.missing_count || 0);
    if (missingCount > 0) {
      const sampleRows: any[] = await sequelize.query(
        `SELECT a.asset_code, a.name
         FROM assets a
         LEFT JOIN inventory_report_details d
           ON d.asset_id = a.id AND d.inventory_report_id = :reportId
         WHERE a.current_department_id = :departmentId
           AND a.status IN (:inventoryStatuses)
           AND d.id IS NULL
           AND NOT EXISTS (
             SELECT 1
             FROM inventory_report_details d2
             JOIN inventory_reports r2 ON r2.id = d2.inventory_report_id
             WHERE d2.asset_id = a.id
               AND r2.inventory_round_id = :roundId
           )
         ORDER BY a.asset_code ASC
         LIMIT 5`,
        {
          replacements: {
            reportId,
            departmentId: report.department_id,
            inventoryStatuses,
            roundId: report.inventory_round_id,
          },
          type: QueryTypes.SELECT,
        }
      );
      const sample = sampleRows.map((row: any) => `${row.asset_code} - ${row.name}`).join('; ');
      throw new ValidationError(
        `Còn ${missingCount} tài sản chưa có kết quả kiểm kê${sample ? ` (VD: ${sample})` : ''}. `
        + 'Vui lòng kiểm kê hoặc đánh dấu thiếu trước khi nộp báo cáo.'
      );
    }

    // Không chặn nộp vì thiếu giải trình từng tài sản: khi nộp, giao diện sẽ cảnh báo
    // và đơn vị có trách nhiệm giải trình sau (tránh phải nhập thủ công từng món).

    await report.update({
      status: 'pending',
      submitted_at: new Date(),
      rejection_reason: null,
    });

    await this.updateRoundStatistics(report.inventory_round_id);

    // Thông báo cho Trưởng đơn vị (cấp 1) duyệt báo cáo
    const approverIds = await notificationService.getInventoryLevel1ApproverIds(report.department_id);
    await notificationService.notify({
      userIds: approverIds,
      type: 'inventory',
      title: 'Báo cáo kiểm kê chờ duyệt',
      message: `Báo cáo ${report.report_code} đã được nộp và đang chờ Trưởng đơn vị phê duyệt.`,
      link: '/inventory',
      entityType: 'inventory_report',
      entityId: reportId,
      excludeUserId: userId,
    });

    return this.getInventoryReportById(reportId);
  }

  async processInventoryApproval(
    reportId: number,
    approverId: number,
    approverRole: string,
    decision: 'approved' | 'rejected',
    reason?: string,
    notes?: string,
    approverDepartmentId?: number,
    repairApprovedAssetIds?: number[]
  ): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(reportId, {
      include: [{ model: Department, as: 'department' }],
    });

    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }

    if (approverRole === 'department_head') {
      if (report.status !== 'pending') {
        throw new ValidationError('Report is not waiting for department head approval');
      }

      // Verify the dept head has authority: own dept OR parent dept head approving child dept
      if (!approverDepartmentId) {
        throw new ForbiddenError('Tài khoản trưởng đơn vị chưa được gán đơn vị.');
      }

      const reportDeptId = Number(report.department_id);
      const isOwnDept = reportDeptId === Number(approverDepartmentId);
      if (!isOwnDept) {
        // Trưởng đơn vị cấp trên (cha/ông/kỵ...) được duyệt báo cáo của toàn bộ
        // đơn vị con cháu trong cây của mình.
        const subtreeIds = await this.getSubtreeDepartmentIds(Number(approverDepartmentId));
        if (!subtreeIds.includes(reportDeptId)) {
          throw new ForbiddenError('Bạn không có quyền duyệt báo cáo của đơn vị này');
        }
      }

      if (Number(report.created_by) === Number(approverId)) {
        throw new ForbiddenError(
          'Bạn không thể tự duyệt báo cáo do chính mình lập. Vui lòng để admin duyệt hoặc chuyển cho trưởng đơn vị cấp trên.'
        );
      }

      if (decision === 'approved') {
        await report.update({
          status: 'approved_by_head',
          head_approved_by: approverId,
          head_approved_at: new Date(),
          head_notes: notes,
        });
      } else {
        const currentRejectionCount = report.rejection_count || 0;
        await report.update({
          status: 'rejected_by_head',
          head_approved_by: approverId,
          head_approved_at: new Date(),
          head_notes: notes,
          rejection_reason: reason,
          rejection_count: currentRejectionCount + 1,
        });
      }
    } else if (approverRole === 'admin') {
      // Admin duyệt bước cuối; đồng thời được duyệt thẳng báo cáo do trưởng
      // đơn vị tự lập (trường hợp không còn cấp duyệt phù hợp).
      if (!['pending', 'approved_by_head'].includes(report.status)) {
        throw new ValidationError('Report is not waiting for admin approval');
      }

      if (decision === 'approved') {
        const tx = await sequelize.transaction();
        try {
          await report.update(
            {
              status: 'completed',
              admin_approved_by: approverId,
              admin_approved_at: new Date(),
              admin_notes: notes,
              completed_at: new Date(),
            },
            { transaction: tx }
          );

          await this.updateAssetsFromInventory(reportId, approverId, tx, repairApprovedAssetIds);

          await tx.commit();
        } catch (e) {
          await tx.rollback();
          throw e;
        }
      } else {
        const currentRejectionCount = report.rejection_count || 0;
        await report.update({
          status: 'rejected_by_admin',
          admin_approved_by: approverId,
          admin_approved_at: new Date(),
          admin_notes: notes,
          rejection_reason: reason,
          rejection_count: currentRejectionCount + 1,
        });
      }
    } else {
      throw new ForbiddenError('You do not have permission to approve this report');
    }

    await this.updateRoundStatistics(report.inventory_round_id);

    // Thông báo theo bước duyệt
    const deptName = (report as any).department?.name || '';
    if (approverRole === 'department_head') {
      if (decision === 'approved') {
        const adminIds = await notificationService.getAdminIds();
        await notificationService.notify({
          userIds: adminIds,
          type: 'inventory',
          title: 'Báo cáo kiểm kê chờ admin duyệt',
          message: `Báo cáo ${report.report_code}${deptName ? ` (${deptName})` : ''} đã được Trưởng đơn vị duyệt, đang chờ admin duyệt.`,
          link: '/inventory',
          entityType: 'inventory_report',
          entityId: reportId,
          excludeUserId: approverId,
        });
      } else {
        await notificationService.notify({
          userIds: [report.created_by],
          type: 'inventory',
          title: 'Báo cáo kiểm kê bị từ chối',
          message: `Báo cáo ${report.report_code} bị Trưởng đơn vị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
          link: '/inventory',
          entityType: 'inventory_report',
          entityId: reportId,
          excludeUserId: approverId,
        });
      }
    } else if (approverRole === 'admin') {
      await notificationService.notify({
        userIds: [report.created_by],
        type: 'inventory',
        title: decision === 'approved' ? 'Báo cáo kiểm kê đã được duyệt' : 'Báo cáo kiểm kê bị từ chối',
        message:
          decision === 'approved'
            ? `Báo cáo ${report.report_code} đã được admin duyệt và hoàn tất.`
            : `Báo cáo ${report.report_code} bị admin từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
        link: '/inventory',
        entityType: 'inventory_report',
        entityId: reportId,
        excludeUserId: approverId,
      });
    }

    return this.getInventoryReportById(reportId);
  }

  async updateAssetsFromInventory(
    reportId: number,
    approvedBy?: number,
    transaction?: any,
    _repairApprovedAssetIds?: number[]
  ): Promise<void> {
    const details = await InventoryReportDetail.findAll({
      where: { inventory_report_id: reportId },
      transaction,
      include: [{ model: InventoryReport, as: 'inventory_report', attributes: ['id', 'department_id', 'created_by'] }],
    });

    // KHÔNG tự tạo hồ sơ thanh lý khi duyệt kiểm kê.
    // Tài sản chỉ chuyển sang trạng thái "chờ xử lý" (pending_disposal);
    // admin sẽ chủ động lập hồ sơ riêng cho "bán thanh lý" hoặc "tiêu hủy".

    const detailRows = details as any[];
    const inventoryDate = new Date();

    // Load trước toàn bộ asset trong 1 query thay vì findByPk cho từng detail.
    const assetIds = [
      ...new Set(
        detailRows
          .map((detail) => Number(detail.asset_id))
          .filter((assetId) => Number.isFinite(assetId))
      ),
    ];
    const assets = assetIds.length > 0
      ? await Asset.findAll({ where: { id: { [Op.in]: assetIds } }, transaction })
      : [];
    const assetById = new Map<number, any>(assets.map((asset: any) => [Number(asset.id), asset]));

    const entries: Array<{ detail: any; asset: any; updateData: any }> = [];
    for (const detail of detailRows) {
      const updateData: any = {
        last_inventory_date: inventoryDate,
        condition: detail.condition,
      };

      if (detail.quantity_discrepancy === 0) {
        updateData.inventory_status = 'verified';
      } else if (detail.actual_quantity === 0) {
        updateData.inventory_status = 'missing';
      } else {
        updateData.inventory_status = 'discrepancy';
      }

      if (detail.actual_quantity === 0) {
        updateData.status = 'lost';
        // lost = mất, không phải thanh lý
        // không map asset_condition sang disposed để tránh hiểu nhầm về pháp lý
      } else if (detail.suggest_disposal) {
        updateData.status = 'pending_disposal';
        updateData.asset_condition = 'damaged';
        // Giữ lại current_department_id để đơn vị vẫn thấy tài sản của mình.
        // Không tự tạo hồ sơ thanh lý — admin sẽ lập hồ sơ riêng (bán thanh lý / tiêu hủy).
      } else if (detail.suggest_repair) {
        // Chưa tự động duyệt sửa chữa: chuyển sang chờ xử lý thanh lý.
        updateData.status = 'pending_disposal';
        updateData.asset_condition = 'damaged';
      } else if (detail.condition === 'poor' || detail.original_asset_condition === 'damaged') {
        updateData.status = 'damaged';
        updateData.asset_condition = 'damaged';
      } else if (detail.condition === 'good' || detail.original_asset_condition === 'good') {
        updateData.status = 'active';
        updateData.asset_condition = 'good';
      } else if (detail.condition === 'fair' || detail.original_asset_condition === 'usable') {
        updateData.status = 'active';
        updateData.asset_condition = 'usable';
      } else if (detail.original_asset_condition === 'needs_repair') {
        updateData.status = 'pending_repair';
        updateData.asset_condition = 'needs_repair';
      }

      const asset = assetById.get(Number(detail.asset_id));
      if (!asset) continue;

      // Bỏ qua tài sản đã được điều chuyển sang đơn vị khác trong lúc kiểm kê:
      // không cập nhật trạng thái theo kết quả của đơn vị cũ.
      const reportDepartmentId = Number(detail.inventory_report?.department_id);
      if (reportDepartmentId && Number(asset.current_department_id) !== reportDepartmentId) {
        continue;
      }

      entries.push({ detail, asset, updateData });
    }

    // Gộp các asset có cùng updateData thành 1 UPDATE ... WHERE id IN (...)
    // thay vì N lệnh UPDATE riêng lẻ.
    const groups = new Map<string, { updateData: any; ids: number[]; entries: typeof entries }>();
    for (const entry of entries) {
      const key = JSON.stringify(entry.updateData);
      let group = groups.get(key);
      if (!group) {
        group = { updateData: entry.updateData, ids: [], entries: [] };
        groups.set(key, group);
      }
      group.ids.push(Number(entry.asset.id));
      group.entries.push(entry);
    }

    for (const group of groups.values()) {
      try {
        await Asset.update(group.updateData, {
          where: { id: { [Op.in]: group.ids } },
          transaction,
        });
      } catch (error: any) {
        if (error.message?.includes('enum_assets_status') && group.updateData.status === 'pending_repair') {
          group.updateData = { ...group.updateData, status: 'inactive' };
          await Asset.update(group.updateData, {
            where: { id: { [Op.in]: group.ids } },
            transaction,
          });
        } else {
          throw error;
        }
      }
    }

    if (approvedBy) {
      const auditRows: any[] = [];
      for (const entry of entries) {
        if (!entry.detail.suggest_disposal) continue;
        const group = groups.get(JSON.stringify(entry.updateData));
        auditRows.push({
          user_id: approvedBy,
          action: 'approve',
          table_name: 'assets',
          record_id: Number(entry.asset.id),
          old_value: {
            status: entry.asset.status,
            current_department_id: entry.asset.current_department_id,
          },
          new_value: {
            status: group?.updateData?.status ?? entry.updateData.status,
            current_department_id: entry.asset.current_department_id,
          },
        });
      }

      for (let i = 0; i < auditRows.length; i += 1000) {
        await AuditLog.bulkCreate(auditRows.slice(i, i + 1000), { transaction });
      }
    }
  }

  async getAssetsForInventory(departmentId: number, query: any) {
    // Không dùng getPaginationParams vì hàm đó chặn limit tối đa 1000 —
    // kiểm kê cần tải đủ tài sản của đơn vị (tối đa 10.000/lần).
    const page = Math.max(1, parseInt(query.page) || 1);
    const parsedLimit = query.limit ? parseInt(query.limit) : 10000;
    const limit = Math.min(10000, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 10000));
    const offset = (page - 1) * limit;
    const includeTotal = String(query.include_total ?? 'true').toLowerCase() !== 'false';

    const where: any = {
      current_department_id: departmentId,
      status: { [Op.in]: ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'] },
    };

    // Ẩn tài sản đã được kiểm kê ở báo cáo khác trong cùng đợt
    // (trường hợp tài sản được điều chuyển giữa lúc kiểm kê).
    const roundId = parseInt(String(query.round_id || ''), 10);
    if (Number.isFinite(roundId)) {
      const reportId = parseInt(String(query.report_id || ''), 10);
      const excludeCurrentReport = Number.isFinite(reportId)
        ? ` AND d.inventory_report_id <> ${reportId}`
        : '';
      where.id = {
        [Op.notIn]: sequelize.literal(
          '(SELECT d.asset_id FROM inventory_report_details d '
          + 'JOIN inventory_reports r ON r.id = d.inventory_report_id '
          + `WHERE r.inventory_round_id = ${roundId}${excludeCurrentReport})`
        ),
      };
    }

    const queryOptions: any = {
      where,
      limit,
      offset,
      order: [['asset_code', 'ASC']],
      attributes: [
        'id',
        'asset_code',
        'name',
        'category',
        'category_id',
        'category_code',
        'unit',
        'quantity',
        'purchase_price',
        'current_value',
        'condition',
        'status',
        'location',
        'description',
      ],
    };

    let rows: any[];
    let count: number;
    if (includeTotal) {
      const result = await Asset.findAndCountAll(queryOptions);
      rows = result.rows;
      count = result.count;
    } else {
      // Frontend kiểm kê chỉ cần danh sách, bỏ COUNT(*) để tránh quét toàn bảng.
      rows = await Asset.findAll(queryOptions);
      count = offset + rows.length;
    }

    const mappedRows = rows.map((asset: any) => {
      const assetData = asset.toJSON();
      return {
        ...assetData,
        original_value: assetData.purchase_price || null,
      };
    });

    return buildPaginationResult(mappedRows, count, page, limit);
  }

  async getPendingReportsByRole(role: string, departmentId?: number) {
    let where: any = {};

    if ((role === 'department_head' || role === 'staff') && !departmentId) {
      return { count: 0, reports: [] };
    }

    if (role === 'department_head') {
      // Báo cáo chờ duyệt của đơn vị mình và toàn bộ đơn vị con/cháu.
      const deptIds = departmentId ? await this.getSubtreeDepartmentIds(departmentId) : [];
      where = {
        department_id: deptIds.length > 1 ? { [Op.in]: deptIds } : (deptIds[0] ?? departmentId),
        status: 'pending',
      };
    } else if (role === 'staff') {
      // Nhân viên dùng chung báo cáo của đơn vị.
      where = {
        department_id: departmentId,
      };
    } else if (role === 'admin') {
      where = {
        status: 'approved_by_head',
      };
    }

    const count = await InventoryReport.count({ where });
    const reports = await InventoryReport.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullname'] },
      ],
      order: [['submitted_at', 'ASC']],
      limit: 10,
    });

    return { count, reports };
  }

  async findAssetByCode(assetCodeOrQR: string, departmentId?: number) {
    // Hỗ trợ format URL: https://domain/scan/ASSET_CODE
    const trimmed = assetCodeOrQR.trim();
    let resolvedCode = trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlParts = trimmed.split('/');
      const scanIndex = urlParts.indexOf('scan');
      resolvedCode = scanIndex !== -1 && urlParts[scanIndex + 1]
        ? urlParts[scanIndex + 1]
        : urlParts[urlParts.length - 1];
    }

    let assetCode = resolvedCode;
    try {
      const qrData = JSON.parse(resolvedCode);
      if (qrData?.asset_code) assetCode = String(qrData.asset_code);
    } catch {
      // Không phải JSON → dùng nguyên mã đã quét
    }

    const scannableStatuses = ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'];
    const assetAttributes = [
      'id',
      'asset_code',
      'name',
      'category',
      'category_code',
      'unit',
      'quantity',
      'purchase_price',
      'current_value',
      'condition',
      'status',
      'location',
      'description',
      'current_department_id',
    ];

    const asset = await Asset.findOne({
      where: {
        asset_code: assetCode,
        ...(departmentId ? { current_department_id: departmentId } : {}),
        status: { [Op.in]: scannableStatuses },
      },
      attributes: assetAttributes,
    });

    if (asset) {
      const assetData = asset.toJSON();
      return {
        ...assetData,
        original_value: (assetData as any).purchase_price || null,
      };
    }

    // Không tìm thấy trong đơn vị đang kiểm kê → kiểm tra tài sản có tồn tại
    // ở đơn vị/trạng thái khác để báo chính xác cho người dùng.
    const existingAsset = await Asset.findOne({
      where: { asset_code: assetCode },
      attributes: ['id', 'asset_code', 'name', 'current_department_id', 'status'],
    });

    if (existingAsset) {
      const ownerDepartmentId = (existingAsset as any).current_department_id;
      if (departmentId && Number(ownerDepartmentId) === Number(departmentId)) {
        throw new ValidationError(
          `Tài sản "${existingAsset.name}" (mã ${existingAsset.asset_code}) đang ở trạng thái "${existingAsset.status}" nên không thể kiểm kê.`
        );
      }

      const ownerDepartment = ownerDepartmentId
        ? await Department.findByPk(ownerDepartmentId, { attributes: ['id', 'name'] })
        : null;
      const ownerDepartmentName = (ownerDepartment as any)?.name || 'chưa xác định';

      throw new ConflictError(
        `Tài sản "${existingAsset.name}" (mã ${existingAsset.asset_code}) đang thuộc đơn vị "${ownerDepartmentName}", không thuộc đơn vị đang kiểm kê. ` +
        'Vui lòng thực hiện điều chuyển tài sản trên hệ thống (nếu đơn vị hiện tại đã tiếp nhận) hoặc đưa tài sản trở về đúng đơn vị trước khi kiểm kê.'
      );
    }

    throw new NotFoundError(`Không tìm thấy tài sản với mã "${resolvedCode}" trong hệ thống`);
  }
}

export default new InventoryService();
