import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Procurement, ProcurementItem, Department, User, Asset, AssetCategory } from '../models';
import MaintenanceRequest from '../models/MaintenanceRequest';
import { NotFoundError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';

export interface CreateProcurementInput {
  code?: string;
  title: string;
  description?: string;
  receiving_department_id: number;
  purchase_date?: Date;
  items: Array<{
    asset_code_prefix?: string;
    name: string;
    description?: string;
    category?: string;
    category_id?: number;
    category_code?: string;
    unit?: string;
    quantity: number;
    purchase_price?: number;
    residual_value?: number;
    asset_type?: string;
    serial_number?: string;
    warranty_date?: Date;
    location?: string;
    asset_condition?: 'good' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';
    land_parcel_id?: number;
    is_depreciable?: boolean;
    useful_life?: number;
    depreciation_rate?: number;
    purchase_date?: Date;
    year_in_use?: number;
    current_department_id?: number;
  }>;
}

export interface UpdateProcurementInput extends Partial<CreateProcurementInput> {
  status?: 'draft' | 'cancelled';
}

class ProcurementService {
  private normalizeCode(code: string): string {
    return code.trim().replace(/\s+/g, '-');
  }

  private async generateProcurementCode(id: number, purchaseDate?: Date | null): Promise<string> {
    const year = purchaseDate ? new Date(purchaseDate).getFullYear() : new Date().getFullYear();
    return `MS-${year}-${String(id).padStart(6, '0')}`;
  }

  private async generateUniqueAssetCode(preferred: string, transaction: any): Promise<string> {
    const base = this.normalizeCode(preferred);
    if (!base) throw new ConflictError('Asset code không hợp lệ');
    for (let i = 0; i < 5000; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const existing = await Asset.findOne({ where: { asset_code: candidate }, transaction });
      if (!existing) return candidate;
    }
    throw new ConflictError('Không thể tạo mã tài sản duy nhất (quá nhiều trùng lặp)');
  }

  async getAll(query: any): Promise<PaginationResult<any>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${query.search}%` } },
        { title: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.receiving_department_id) where.receiving_department_id = query.receiving_department_id;

    const include: any[] = [
      { model: Department, as: 'receiving_department', attributes: ['id', 'name', 'type'] },
      { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'] },
      { model: User, as: 'fulfiller', attributes: ['id', 'username', 'fullname'], required: false },
      { model: ProcurementItem, as: 'items', required: false },
    ];

    if (query.year) {
      const year = parseInt(String(query.year), 10);
      if (!Number.isFinite(year) || year < 1990 || year > 2100) {
        throw new ConflictError('Năm không hợp lệ');
      }

      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);

      // Only filter by procurement.purchase_date to avoid SQL error (items alias is not available in subquery)
      where.purchase_date = { [Op.between]: [start, end] };
    }

    const { count, rows } = await Procurement.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include,
      distinct: true,
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getById(id: number): Promise<any> {
    const procurement = await Procurement.findByPk(id, {
      include: [
        { model: Department, as: 'receiving_department' },
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullname', 'email'] },
        { model: User, as: 'fulfiller', attributes: ['id', 'username', 'fullname', 'email'], required: false },
        { model: ProcurementItem, as: 'items' },
        {
          model: MaintenanceRequest,
          as: 'sourceMaintenanceRequest',
          required: false,
          attributes: ['id', 'device_name', 'justification', 'quantity', 'department_id'],
        },
      ],
    });
    if (!procurement) throw new NotFoundError('Procurement not found');
    return procurement;
  }

  async create(data: CreateProcurementInput, userId: number): Promise<any> {
    const dept = await Department.findByPk(data.receiving_department_id);
    if (!dept) throw new NotFoundError('Department not found');

    const transaction = await sequelize.transaction();
    try {
      let code = data.code ? this.normalizeCode(data.code) : '';
      if (code) {
        const exists = await Procurement.findOne({ where: { code }, transaction });
        if (exists) throw new ConflictError('Procurement code already exists');
      }

      const procurement = await Procurement.create(
        {
          code: code || 'TEMP',
          title: data.title,
          description: data.description,
          receiving_department_id: data.receiving_department_id,
          purchase_date: data.purchase_date,
          supplier_name: (data as any).supplier_name,
          contract_no: (data as any).contract_no,
          invoice_no: (data as any).invoice_no,
          order_code: (data as any).order_code,
          status: 'draft',
          created_by: userId,
          created_asset_ids: [],
        } as any,
        { transaction }
      );

      if (!code) {
        code = await this.generateProcurementCode(procurement.id, data.purchase_date || null);
        await procurement.update({ code }, { transaction });
      }

      for (const item of data.items) {
        await ProcurementItem.create(
          {
            procurement_id: procurement.id,
            asset_code_prefix: item.asset_code_prefix,
            name: item.name,
            description: item.description,
            category: item.category,
            category_id: item.category_id,
            category_code: item.category_code,
            unit: item.unit,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            residual_value: (item as any).residual_value,
            asset_type: (item as any).asset_type,
            serial_number: (item as any).serial_number,
            warranty_date: (item as any).warranty_date,
            location: (item as any).location,
            asset_condition: (item as any).asset_condition,
            land_parcel_id: (item as any).land_parcel_id,
            is_depreciable: item.is_depreciable,
            useful_life: item.useful_life,
            depreciation_rate: item.depreciation_rate,
            purchase_date: (item as any).purchase_date,
            year_in_use: (item as any).year_in_use,
            current_department_id: (item as any).current_department_id || (item as any).currentDepartmentId || data.receiving_department_id,
          } as any,
          { transaction }
        );
      }

      await transaction.commit();
      return this.getById(procurement.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Tạo phiếu Tăng tài sản (Procurement) từ đề nghị mua sắm đã được duyệt cấp 3.
   * Phiếu mới ở trạng thái 'draft', admin/director sẽ vào bổ sung chi tiết và hoàn tất.
   */
  async createFromMaintenance(maintenanceId: number, userId: number): Promise<any> {
    const maintenance = await MaintenanceRequest.findByPk(maintenanceId, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    });
    if (!maintenance) throw new NotFoundError('Đề nghị mua sắm không tồn tại');
    if (maintenance.request_type !== 'procurement') {
      throw new ConflictError('Chỉ áp dụng cho đề nghị mua sắm');
    }
    if (maintenance.status !== 'approved_by_director') {
      throw new ConflictError('Đề nghị phải ở trạng thái "Giám hiệu đã duyệt" mới có thể chuyển sang phiếu Tăng tài sản');
    }
    if ((maintenance as any).linked_procurement_id) {
      // Already linked – return existing procurement
      return this.getById((maintenance as any).linked_procurement_id);
    }

    const departmentId = (maintenance as any).department_id;
    if (departmentId) {
      const dept = await Department.findByPk(departmentId);
      if (!dept) throw new NotFoundError('Department not found');
    }

    const transaction = await sequelize.transaction();
    try {
      const procurement = await Procurement.create(
        {
          code: 'TEMP',
          title: (maintenance as any).device_name
            ? `Mua sắm: ${(maintenance as any).device_name}`
            : `Phiếu từ đề nghị #${maintenanceId}`,
          description: (maintenance as any).justification || undefined,
          receiving_department_id: departmentId || 1,
          maintenance_request_id: maintenanceId,
          status: 'draft',
          created_by: userId,
          created_asset_ids: [],
        } as any,
        { transaction }
      );

      const code = await this.generateProcurementCode(procurement.id);
      await procurement.update({ code }, { transaction });

      // Pre-fill one procurement item from the maintenance request data
      await ProcurementItem.create(
        {
          procurement_id: procurement.id,
          name: (maintenance as any).device_name || 'Thiết bị chưa đặt tên',
          description: (maintenance as any).technical_specs || undefined,
          unit: (maintenance as any).unit || undefined,
          quantity: (maintenance as any).quantity || 1,
          purchase_price: (maintenance as any).unit_price || (maintenance as any).estimated_unit_price || undefined,
          current_department_id: departmentId || undefined,
        } as any,
        { transaction }
      );

      // Link back to the maintenance request
      await maintenance.update({ linked_procurement_id: procurement.id } as any, { transaction });

      await transaction.commit();
      return this.getById(procurement.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async update(id: number, data: UpdateProcurementInput): Promise<any> {
    const procurement = await Procurement.findByPk(id, { include: [{ model: ProcurementItem, as: 'items' }] });
    if (!procurement) throw new NotFoundError('Procurement not found');

    if (procurement.status === 'fulfilled') {
      throw new ConflictError('Không thể sửa phiếu đã hoàn tất');
    }

    const transaction = await sequelize.transaction();
    try {
      await procurement.update(
        {
          title: data.title ?? procurement.title,
          description: data.description ?? (procurement as any).description,
          receiving_department_id: data.receiving_department_id ?? (procurement as any).receiving_department_id,
          purchase_date: data.purchase_date ?? (procurement as any).purchase_date,
          supplier_name: (data as any).supplier_name ?? (procurement as any).supplier_name,
          contract_no: (data as any).contract_no ?? (procurement as any).contract_no,
          invoice_no: (data as any).invoice_no ?? (procurement as any).invoice_no,
          order_code: (data as any).order_code ?? (procurement as any).order_code,
          status: (data.status as any) ?? procurement.status,
        } as any,
        { transaction }
      );

      if (data.items) {
        // replace all items
        await ProcurementItem.destroy({ where: { procurement_id: id }, transaction });
        for (const item of data.items) {
          await ProcurementItem.create(
            {
              procurement_id: id,
              asset_code_prefix: item.asset_code_prefix,
              name: item.name,
              description: item.description,
              category: item.category,
              category_id: item.category_id,
              category_code: item.category_code,
              unit: item.unit,
              quantity: item.quantity,
              purchase_price: item.purchase_price,
              residual_value: (item as any).residual_value,
              asset_type: (item as any).asset_type,
              serial_number: (item as any).serial_number,
              warranty_date: (item as any).warranty_date,
              location: (item as any).location,
              asset_condition: (item as any).asset_condition,
              land_parcel_id: (item as any).land_parcel_id,
              is_depreciable: item.is_depreciable,
              useful_life: item.useful_life,
              depreciation_rate: item.depreciation_rate,
              purchase_date: (item as any).purchase_date,
              year_in_use: (item as any).year_in_use,
              current_department_id: (item as any).current_department_id || (item as any).currentDepartmentId || (data.receiving_department_id ?? (procurement as any).receiving_department_id),
            } as any,
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getById(id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async delete(id: number): Promise<void> {
    const procurement = await Procurement.findByPk(id);
    if (!procurement) throw new NotFoundError('Procurement not found');
    if (procurement.status === 'fulfilled') throw new ConflictError('Không thể xóa phiếu đã hoàn tất');
    await procurement.destroy();
  }

  async fulfill(id: number, userId: number, payload?: any): Promise<{ procurement: any; created_assets: any[] }> {
    const procurement = await Procurement.findByPk(id, { include: [{ model: ProcurementItem, as: 'items' }] });
    if (!procurement) throw new NotFoundError('Procurement not found');

    if (procurement.status === 'cancelled') throw new ConflictError('Phiếu đã hủy');

    if (procurement.status === 'fulfilled') {
      const ids: number[] = Array.isArray((procurement as any).created_asset_ids) ? (procurement as any).created_asset_ids : [];
      const assets = ids.length ? await Asset.findAll({ where: { id: ids } }) : [];
      return { procurement: await this.getById(id), created_assets: assets };
    }

    const dept = await Department.findByPk((procurement as any).receiving_department_id);
    if (!dept) throw new NotFoundError('Department not found');

    const defaultPurchaseDate = payload?.purchase_date
      ? new Date(payload.purchase_date)
      : (procurement as any).purchase_date
        ? new Date((procurement as any).purchase_date)
        : null;

    const transaction = await sequelize.transaction();
    const createdIds: number[] = [];
    try {
      const items = (procurement as any).items as ProcurementItem[];
      for (const item of items) {
        // Fallback: Check both snake_case and camelCase, and finally use procurement's receiving_department_id
        const itemDepartmentId = (item as any).current_department_id 
          || (item as any).currentDepartmentId 
          || (procurement as any).receiving_department_id;

        if (!itemDepartmentId) {
          throw new ConflictError(`Thiếu phòng ban cho tài sản "${(item as any).name || 'không tên'}" trong phiếu`);
        }

        const itemDept = await Department.findByPk(itemDepartmentId, { transaction });
        if (!itemDept) throw new NotFoundError('Department not found');

        const itemPurchaseDate = (item as any).purchase_date ? new Date((item as any).purchase_date) : defaultPurchaseDate;
        const itemYearInUse = (item as any).year_in_use != null
          ? Number((item as any).year_in_use)
          : itemPurchaseDate
            ? itemPurchaseDate.getFullYear()
            : new Date().getFullYear();

        const qty = Math.max(1, Number((item as any).quantity || 1));
        const prefixRaw = (item as any).asset_code_prefix || `${(procurement as any).code}-${item.id}`;
        const prefix = this.normalizeCode(prefixRaw);

        // category lookup
        let category: any = null;
        if ((item as any).category_id) {
          category = await AssetCategory.findByPk((item as any).category_id, { transaction });
        } else if ((item as any).category_code) {
          category = await AssetCategory.findOne({ where: { code: (item as any).category_code, is_active: true }, transaction });
        }

        for (let i = 0; i < qty; i++) {
          const suffix = qty > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
          const preferredCode = `${prefix}${suffix}`;
          const assetCode = await this.generateUniqueAssetCode(preferredCode, transaction);

          const createData: any = {
            asset_code: assetCode,
            name: (item as any).name,
            description: (item as any).description || undefined,
            category: (item as any).category || undefined,
            category_id: (item as any).category_id || undefined,
            category_code: (item as any).category_code || undefined,
            unit: (item as any).unit || undefined,
            quantity: 1,
            purchase_date: itemPurchaseDate || undefined,
            purchase_price: (item as any).purchase_price != null ? Number((item as any).purchase_price) : undefined,
            residual_value: (item as any).residual_value != null ? Number((item as any).residual_value) : undefined,
            year_in_use: itemYearInUse,
            current_department_id: itemDepartmentId,
            location: (item as any).location || (itemDept ? itemDept.name : dept.name),
            status: 'active',
            asset_type: (item as any).asset_type || undefined,
            serial_number: (item as any).serial_number || undefined,
            warranty_date: (item as any).warranty_date || undefined,
            asset_condition: (item as any).asset_condition || undefined,
            land_parcel_id: (item as any).land_parcel_id != null ? Number((item as any).land_parcel_id) : undefined,
            is_depreciable: (item as any).is_depreciable,
            useful_life: (item as any).useful_life != null ? Number((item as any).useful_life) : undefined,
            depreciation_rate: (item as any).depreciation_rate != null ? Number((item as any).depreciation_rate) : undefined,
          };

          if (category) {
            if (!createData.category) createData.category = category.name;
            if (!createData.category_id) createData.category_id = category.id;
            if (!createData.category_code) createData.category_code = category.code;
            if (!createData.unit) createData.unit = category.unit;
            if (createData.is_depreciable === undefined) createData.is_depreciable = category.is_depreciable;
            if (!createData.depreciation_rate && category.depreciation_rate) createData.depreciation_rate = Number(category.depreciation_rate);
            if (!createData.useful_life && category.useful_life_years) createData.useful_life = Number(category.useful_life_years);
          }

          const created = await Asset.create(createData, { transaction });
          createdIds.push(created.id);
        }
      }

      await procurement.update(
        {
          status: 'fulfilled',
          fulfilled_by: userId,
          fulfilled_at: new Date(),
          created_asset_ids: createdIds,
          purchase_date: defaultPurchaseDate || (procurement as any).purchase_date,
        } as any,
        { transaction }
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    // best-effort QR
    try {
      const { default: qrcodeService } = await import('./qrcode.service');
      const assets = await Asset.findAll({ where: { id: createdIds } });
      for (const a of assets) {
        try {
          await qrcodeService.generateQRCodeForAsset(a as any);
        } catch (_e) {
          // no-op
        }
      }
    } catch (_e) {
      // no-op
    }

    const assets = createdIds.length ? await Asset.findAll({ where: { id: createdIds }, order: [['id', 'ASC']] }) : [];

    // Nếu phiếu này được tạo từ đề nghị mua sắm, cập nhật trạng thái đề nghị → hoàn tất
    if ((procurement as any).maintenance_request_id) {
      try {
        const linked = await MaintenanceRequest.findByPk((procurement as any).maintenance_request_id);
        if (linked) {
          await linked.update({
            procurement_fulfilled: true,
            fulfilled_at: new Date(),
            fulfilled_by: userId,
            created_asset_ids: createdIds,
            status: 'done',
          } as any);
        }
      } catch (_e) {
        // best-effort – không làm hỏng response chính
      }
    }

    return { procurement: await this.getById(id), created_assets: assets };
  }

  async getYearlySummary(query: any): Promise<any[]> {
    const yearRaw = query?.year ?? query?.purchase_year;
    const year = parseInt(String(yearRaw || ''), 10);
    if (!year || year < 1990 || year > 2100) {
      throw new ConflictError('Năm không hợp lệ');
    }

    const receivingDepartmentId = query?.receiving_department_id ? parseInt(String(query.receiving_department_id), 10) : null;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    // Only count fulfilled procurements (actually created assets)
    const whereProc: any = {
      status: 'fulfilled',
      purchase_date: { [Op.between]: [start, end] },
    };
    if (receivingDepartmentId) whereProc.receiving_department_id = receivingDepartmentId;

    // Group by category (prefer category_id/code/name), sum quantities and total money
    const rows = await ProcurementItem.findAll({
      attributes: [
        'category_id',
        'category_code',
        'category',
        'name',
        'unit',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal('COALESCE("ProcurementItem"."purchase_price", 0) * COALESCE("ProcurementItem"."quantity", 0)')
          ),
          'total_amount',
        ],
      ],
      include: [
        {
          model: Procurement,
          as: 'procurement',
          attributes: [],
          where: whereProc,
          required: true,
        },
      ],
      group: ['category_id', 'category_code', 'category', 'name', 'unit'],
      order: [
        [sequelize.literal('"total_amount"'), 'DESC'],
        [sequelize.literal('"total_quantity"'), 'DESC'],
      ],
      raw: true,
    });

    return rows as any[];
  }
}

export default new ProcurementService();
