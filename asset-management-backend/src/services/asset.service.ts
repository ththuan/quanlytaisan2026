import { Asset, Department, AssetTransfer, AssetCondition, AssetCategory, User, RequestApproval } from '../models';
import MaintenanceRequest from '../models/MaintenanceRequest';
import AssetDisposalItem from '../models/AssetDisposalItem';
import InventoryReportDetail from '../models/InventoryReportDetail';
import { NotFoundError, ConflictError } from '../utils/errorHandler';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import depreciationCalculatorService, {
  type DepreciationCalculationResult,
  type DepreciationPrecachedCategory,
} from './depreciationCalculator.service';

export interface CreateAssetInput {
  asset_code: string;
  name: string;
  description?: string;
  category?: string;
  category_id?: number;
  category_code?: string;
  unit?: string;
  asset_type?: string;
  year_in_use?: number;
  quantity?: number;
  purchase_date?: Date;
  purchase_price?: number;
  current_value?: number;
  residual_value?: number;
  useful_life?: number;
  is_depreciable?: boolean;
  depreciation_rate?: number;
  serial_number?: string;
  warranty_date?: Date;
  current_department_id?: number;
  status?: 'active' | 'inactive' | 'damaged' | 'lost' | 'disposed';
  location?: string;
  image_url?: string;
  asset_condition?: AssetCondition;
  land_parcel_id?: number;
}

export interface AssetWithDepreciation extends Asset {
  depreciation_info?: DepreciationCalculationResult;
}

class AssetService {
  private async getDescendantDepartmentIds(rootId: number): Promise<number[]> {
    const rows = await sequelize.query(
      `
      WITH RECURSIVE dept AS (
        SELECT id
        FROM departments
        WHERE id = :rootId
        UNION ALL
        SELECT d.id
        FROM departments d
        JOIN dept ON d.parent_department_id = dept.id
      )
      SELECT id FROM dept
      `,
      { type: QueryTypes.SELECT, replacements: { rootId } }
    );

    return (rows as any[]).map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
  }

  async getAllAssets(query: any): Promise<PaginationResult<any>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { asset_code: { [Op.iLike]: `%${query.search}%` } },
        { name: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Filter theo category_code (ưu tiên) hoặc category
    if (query.category_code) {
      where.category_code = query.category_code;
    } else if (query.category) {
      where.category = query.category;
    }
    if (query.asset_type) where.asset_type = query.asset_type;
    if (query.status) {
      const statuses = String(query.status).split(',').map((s: string) => s.trim()).filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
    } else if (query.exclude_disposed === 'true') {
      where.status = { [Op.ne]: 'disposed' };
    }
    if (query.current_department_id) {
      const deptId = parseInt(String(query.current_department_id), 10);
      const includeChildren = String(query.include_children ?? '').toLowerCase() === 'true';
      if (includeChildren && Number.isFinite(deptId)) {
        const ids = await this.getDescendantDepartmentIds(deptId);
        where.current_department_id = { [Op.in]: ids.length ? ids : [deptId] };
      } else {
        where.current_department_id = query.current_department_id;
      }
    }

    const { count, rows } = await Asset.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: AssetCategory,
          as: 'assetCategory',
          required: false,
          attributes: [
            'id',
            'code',
            'name',
            'category_group',
            'unit',
            'is_depreciable',
            'useful_life_years',
            'depreciation_rate',
            'description',
          ],
        },
        {
          model: Department,
          as: 'current_department',
          attributes: ['id', 'name', 'type'],
        },
      ],
    });

    // Tính year_in_use từ purchase_date cho các tài sản chưa có
    const assetsWithYearInUse = rows.map(asset => {
      const assetData: any = asset.toJSON();
      if (!assetData.year_in_use) {
        // Ưu tiên: year_in_use > purchase_date > created_at
        if (assetData.purchase_date) {
          assetData.year_in_use = new Date(assetData.purchase_date).getFullYear();
        } else if (assetData.created_at) {
          assetData.year_in_use = new Date(assetData.created_at).getFullYear();
        }
      }
      return assetData;
    });

    // Đồng bộ "giá trị còn lại" — tính khấu hao đồng bộ (không Promise/async theo từng dòng) + 1 query bổ sung cho danh mục thiếu JOIN
    const codesMissingJoin = [
      ...new Set(
        assetsWithYearInUse
          .filter((a: any) => a.category_code && !(a.assetCategory && a.assetCategory.code))
          .map((a: any) => String(a.category_code))
      ),
    ];
    let supplementalByCode = new Map<string, InstanceType<typeof AssetCategory>>();
    if (codesMissingJoin.length > 0) {
      const extra = await AssetCategory.findAll({
        where: { code: { [Op.in]: codesMissingJoin }, is_active: true },
        attributes: [
          'code',
          'name',
          'category_group',
          'is_depreciable',
          'useful_life_years',
          'depreciation_rate',
          'description',
        ],
      });
      supplementalByCode = new Map(extra.map((row) => [row.code, row]));
    }

    const toPrecached = (ac: any): DepreciationPrecachedCategory | undefined => {
      if (!ac?.code) return undefined;
      return {
        code: ac.code,
        name: ac.name,
        category_group: ac.category_group,
        is_depreciable: ac.is_depreciable !== false,
        useful_life_years: ac.useful_life_years ?? null,
        depreciation_rate: ac.depreciation_rate != null ? Number(ac.depreciation_rate) : null,
        description: ac.description ?? null,
      };
    };

    const assetsWithCalculatedValues = assetsWithYearInUse.map((assetData: any) => {
      try {
        const ac = assetData.assetCategory;
        let precachedCategory = toPrecached(ac);
        if (!precachedCategory && assetData.category_code) {
          precachedCategory = toPrecached(supplementalByCode.get(String(assetData.category_code)));
        }

        const depreciation = depreciationCalculatorService.calculateDepreciationSync({
          assetId: assetData.id,
          categoryCode: assetData.category_code || ac?.code || undefined,
          originalValue: Number(assetData.purchase_price) || 0,
          yearInUse: assetData.year_in_use || undefined,
          precachedCategory,
          customUsefulLife: assetData.useful_life || undefined,
          customDepreciationRate: assetData.depreciation_rate ? Number(assetData.depreciation_rate) : undefined,
          isDepreciable: assetData.is_depreciable !== undefined ? assetData.is_depreciable : undefined,
        });

        assetData.current_value = depreciation.remainingValue;
        assetData.residual_value = depreciation.remainingValue;
        assetData.accumulated_depreciation = depreciation.accumulatedDepreciation;

        if (!assetData.assetCategory && depreciation.categoryInfo) {
          assetData.assetCategory = {
            code: depreciation.categoryInfo.code,
            name: depreciation.categoryInfo.name,
            category_group: depreciation.categoryInfo.categoryGroup,
            unit: assetData.unit,
          };
        }

        if (!assetData.useful_life && depreciation.usefulLifeYears) {
          assetData.useful_life = depreciation.usefulLifeYears;
        }
        if (!assetData.depreciation_rate && depreciation.depreciationRate) {
          assetData.depreciation_rate = depreciation.depreciationRate;
        }
      } catch {
        // Giữ dữ liệu DB nếu tính toán lỗi (vd. 0504 thiếu thông tin)
      }
      return assetData;
    });

    return buildPaginationResult(assetsWithCalculatedValues as any, count, page, limit);
  }

  async getAssetById(id: number): Promise<any> {
    const asset = await Asset.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'current_department',
        },
        {
          model: AssetCategory,
          as: 'assetCategory',
          required: false,
        },
      ],
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Tính year_in_use từ purchase_date nếu chưa có
    const assetData: any = asset.toJSON();
    if (!assetData.year_in_use) {
      // Ưu tiên: purchase_date > created_at
      if (assetData.purchase_date) {
        assetData.year_in_use = new Date(assetData.purchase_date).getFullYear();
      } else if (assetData.created_at) {
        assetData.year_in_use = new Date(assetData.created_at).getFullYear();
      }
    }

    // Lấy category_code từ asset hoặc từ category relation
    const assetWithCategory = asset as any;
    const categoryCode = asset.category_code || assetWithCategory.assetCategory?.code || undefined;
    
    // Tính thông tin khấu hao từ database (sử dụng category_code)
    // Ưu tiên sử dụng dữ liệu từ database (depreciation_rate, useful_life, is_depreciable)
    let depreciationInfo;
    try {
      const ac = assetWithCategory.assetCategory as
        | { code: string; name: string; category_group: string; is_depreciable: boolean; useful_life_years?: number | null; depreciation_rate?: number | null; description?: string | null }
        | null
        | undefined;
      depreciationInfo = await depreciationCalculatorService.calculateDepreciation({
        assetId: asset.id,
        categoryCode: categoryCode,
        originalValue: Number(asset.purchase_price) || 0,
        yearInUse: asset.year_in_use || assetData.year_in_use || undefined, // CHỈ DÙNG year_in_use
        customUsefulLife: asset.useful_life || undefined,
        customDepreciationRate: asset.depreciation_rate ? Number(asset.depreciation_rate) : undefined,
        isDepreciable: asset.is_depreciable !== undefined ? asset.is_depreciable : undefined,
        precachedCategory: ac
          ? {
              code: ac.code,
              name: ac.name,
              category_group: ac.category_group,
              is_depreciable: ac.is_depreciable,
              useful_life_years: ac.useful_life_years ?? null,
              depreciation_rate: ac.depreciation_rate != null ? Number(ac.depreciation_rate) : null,
              description: ac.description ?? null,
            }
          : undefined,
      });
    } catch (error: any) {
      console.error('Error calculating depreciation:', error);
      // Fallback: sử dụng DepreciationService nếu có lỗi
      const DepreciationService = (await import('./depreciation.service')).default;
      const fallbackInfo = DepreciationService.calculateDepreciation(
        Number(asset.purchase_price) || 0,
        asset.purchase_date,
        asset.category || assetData.category || assetWithCategory.assetCategory?.name,
        asset.asset_type,
        asset.useful_life || undefined,
        asset.year_in_use || assetData.year_in_use || undefined,
        asset.depreciation_rate ? Number(asset.depreciation_rate) : undefined,
        asset.is_depreciable !== undefined ? asset.is_depreciable : undefined
      );
      depreciationInfo = {
        originalValue: fallbackInfo.originalValue,
        isDepreciable: fallbackInfo.isDepreciable,
        usefulLifeYears: fallbackInfo.usefulLife,
        depreciationRate: fallbackInfo.annualDepreciationRate,
        annualDepreciationAmount: fallbackInfo.annualDepreciationAmount,
        yearsUsed: fallbackInfo.yearsUsed,
        accumulatedDepreciation: fallbackInfo.accumulatedDepreciation,
        remainingValue: fallbackInfo.currentValue,
        remainingUsefulLife: fallbackInfo.remainingUsefulLife,
        isFullyDepreciated: fallbackInfo.isFullyDepreciated,
        calculationMethod: 'fallback' as any,
        calculationNotes: 'Sử dụng fallback do lỗi query database'
      };
    }

    // Nếu asset chưa có category_id (assetCategory null) nhưng có category_code,
    // fallback lấy danh mục theo code để frontend luôn có tên chi tiết loại tài sản.
    if (!assetData.assetCategory && assetData.category_code) {
      try {
        const categoryByCode = await AssetCategory.findOne({
          where: { code: assetData.category_code, is_active: true },
          attributes: ['id', 'code', 'name', 'parent_code', 'unit', 'category_group', 'is_depreciable', 'depreciation_rate', 'useful_life_years'],
        });
        if (categoryByCode) {
          assetData.assetCategory = categoryByCode.toJSON();
        }
      } catch {
        // ignore fallback errors
      }
    }

    return {
      ...assetData,
      current_value: depreciationInfo.remainingValue,
      residual_value: depreciationInfo.remainingValue,
      accumulated_depreciation: depreciationInfo.accumulatedDepreciation,
      depreciation_info: depreciationInfo,
    };
  }

  /**
   * Lấy lịch sử khấu hao theo từng năm
   */
  async getDepreciationHistory(id: number): Promise<any[]> {
    const asset = await Asset.findByPk(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Sử dụng year_in_use nếu có, nếu không thì dùng purchase_date
    const startYear = asset.year_in_use || (asset.purchase_date ? new Date(asset.purchase_date).getFullYear() : new Date().getFullYear());
    
    return depreciationCalculatorService.generateDepreciationSchedule({
      categoryCode: asset.category_code || undefined,
      originalValue: Number(asset.purchase_price) || 0,
      yearInUse: asset.year_in_use || startYear, // CHỈ DÙNG year_in_use
      customUsefulLife: asset.useful_life || undefined,
      customDepreciationRate: asset.depreciation_rate ? Number(asset.depreciation_rate) : undefined,
      isDepreciable: asset.is_depreciable !== undefined ? asset.is_depreciable : undefined
    });
  }

  /**
   * Cập nhật giá trị hiện tại dựa trên khấu hao tự động
   */
  async recalculateCurrentValue(id: number): Promise<Asset> {
    const asset = await Asset.findByPk(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Tính toán khấu hao từ database
    const depreciationResult = await depreciationCalculatorService.calculateDepreciation({
      assetId: asset.id,
      categoryCode: asset.category_code || undefined,
      originalValue: Number(asset.purchase_price) || 0,
      yearInUse: asset.year_in_use || undefined, // CHỈ DÙNG year_in_use
      customUsefulLife: asset.useful_life || undefined,
      customDepreciationRate: asset.depreciation_rate ? Number(asset.depreciation_rate) : undefined,
      isDepreciable: asset.is_depreciable !== undefined ? asset.is_depreciable : undefined
    });

    // Cập nhật giá trị hiện tại và các thông tin khấu hao
    await asset.update({ 
      current_value: depreciationResult.remainingValue,
      accumulated_depreciation: depreciationResult.accumulatedDepreciation,
      depreciation_rate: depreciationResult.depreciationRate,
      useful_life: depreciationResult.usefulLifeYears,
      residual_value: depreciationResult.remainingValue
    });
    
    return this.getAssetById(id);
  }

  async createAsset(data: CreateAssetInput): Promise<Asset> {
    const existing = await Asset.findOne({ where: { asset_code: data.asset_code } });
    if (existing) {
      throw new ConflictError('Asset code already exists');
    }

    // Tự động lấy thông tin từ category nếu có category_id hoặc category_code
    let category: AssetCategory | null = null;
    if (data.category_id) {
      category = await AssetCategory.findByPk(data.category_id);
    } else if (data.category_code) {
      category = await AssetCategory.findOne({ 
        where: { code: data.category_code, is_active: true } 
      });
    }

    // Nếu có category, ưu tiên sử dụng thông tin từ category
    const finalData: any = {
      ...data,
      purchase_price: data.purchase_price ? Number(data.purchase_price) : undefined,
      residual_value: data.residual_value ? Number(data.residual_value) : undefined,
      current_value: data.current_value ? Number(data.current_value) : undefined,
      quantity: 1, // Luôn luôn là 1 - mỗi tài sản là một đơn vị riêng biệt
      depreciation_rate: data.depreciation_rate ? Number(data.depreciation_rate) : undefined,
      year_in_use: data.year_in_use ? Number(data.year_in_use) : undefined,
    };

    // Điền thông tin từ category nếu chưa có
    if (category) {
      if (!finalData.category) finalData.category = category.name;
      if (!finalData.category_id) finalData.category_id = category.id;
      if (!finalData.category_code) finalData.category_code = category.code;
      if (!finalData.unit) finalData.unit = category.unit;
      if (finalData.is_depreciable === undefined) finalData.is_depreciable = category.is_depreciable;

      // Chỉ set mặc định thông tin khấu hao khi danh mục có khấu hao.
      // Với nhóm không khấu hao (is_depreciable=false), không ép depreciation_rate/useful_life
      // để tránh “mặc định cách tính khấu hao” sai cho tài sản.
      if (category.is_depreciable) {
        if (!finalData.depreciation_rate && category.depreciation_rate) {
          finalData.depreciation_rate = Number(category.depreciation_rate);
        }
        if (!finalData.useful_life && category.useful_life_years) {
          finalData.useful_life = Number(category.useful_life_years);
        }
      } else {
        // Nếu client không truyền, giữ null/undefined. Nếu client cố truyền rate/life cho nhóm không khấu hao,
        // thì cũng không tự động override theo danh mục.
      }
    }

    const asset = await Asset.create(finalData);
    
    // Tự động generate QR code cho tài sản mới
    try {
      // Dynamic import để tránh circular dependency
      const { default: qrcodeService } = await import('./qrcode.service');
      await qrcodeService.generateQRCodeForAsset(asset);
    } catch (error) {
      console.warn('Failed to generate QR code for asset:', error);
      // Không throw error, chỉ log warning
    }
    
    return this.getAssetById(asset.id);
  }

  async updateAsset(id: number, data: Partial<CreateAssetInput>): Promise<Asset> {
    const asset = await Asset.findByPk(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (data.asset_code && data.asset_code !== asset.asset_code) {
      const existing = await Asset.findOne({ where: { asset_code: data.asset_code } });
      if (existing) {
        throw new ConflictError('Asset code already exists');
      }
    }

    // ─── Bảo vệ vòng đời tài sản ───────────────────────────────────────────
    // Không cho phép thay đổi status trực tiếp về các trạng thái workflow.
    // Các trạng thái này chỉ được gán qua đúng module nghiệp vụ:
    //   pending_repair   → chỉ qua tạo yêu cầu bảo trì
    //   pending_disposal → chỉ qua tạo hồ sơ thanh lý/tiêu hủy
    //   disposed         → chỉ khi hoàn tất hồ sơ xử lý tài sản
    const WORKFLOW_STATUSES = ['pending_repair', 'pending_disposal', 'disposed'];
    if (data.status && WORKFLOW_STATUSES.includes(data.status)) {
      throw Object.assign(
        new Error(
          `Không thể cập nhật trạng thái "${data.status}" trực tiếp. ` +
          'Trạng thái này phải được xử lý qua đúng quy trình nghiệp vụ ' +
          '(Bảo trì / Thanh lý / Tiêu hủy).'
        ),
        { statusCode: 422 }
      );
    }

    // Sanitize numeric fields
    const sanitizedData = {
      ...data,
      purchase_price: data.purchase_price ? Number(data.purchase_price) : undefined,
      residual_value: data.residual_value ? Number(data.residual_value) : undefined,
      current_value: data.current_value ? Number(data.current_value) : undefined,
      quantity: 1, // Luôn luôn là 1 - không cho phép thay đổi
      depreciation_rate: data.depreciation_rate ? Number(data.depreciation_rate) : undefined,
      year_in_use: data.year_in_use ? Number(data.year_in_use) : undefined,
    };

    await asset.update(sanitizedData as any);
    return this.getAssetById(id);
  }

  async deleteAsset(id: number): Promise<void> {
    const asset = await Asset.findByPk(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // ─── Bảo vệ vòng đời tài sản ───────────────────────────────────────────
    // Chỉ cho xóa tài sản khi nhập liệu sai và chưa tham gia bất kỳ quy trình nào.
    // Nếu đã có lịch sử thì phải xử lý qua quy trình thanh lý/tiêu hủy.

    const BLOCKED_STATUSES = ['pending_repair', 'pending_disposal', 'disposed'];
    if (BLOCKED_STATUSES.includes(asset.status)) {
      throw Object.assign(
        new Error(
          `Tài sản đang ở trạng thái "${asset.status}", đang trong quy trình xử lý. ` +
          'Không thể xóa. Hãy hoàn tất hoặc hủy quy trình hiện tại trước.'
        ),
        { statusCode: 409 }
      );
    }

    const [transferCount, maintenanceCount, disposalCount, inventoryCount] = await Promise.all([
      AssetTransfer.count({ where: { asset_id: id } }),
      MaintenanceRequest.count({ where: { asset_id: id } }),
      AssetDisposalItem.count({ where: { asset_id: id } }),
      InventoryReportDetail.count({ where: { asset_id: id } }),
    ]);

    const totalHistory = transferCount + maintenanceCount + disposalCount + inventoryCount;
    if (totalHistory > 0) {
      const breakdown: string[] = [];
      if (transferCount > 0) breakdown.push(`${transferCount} lần điều chuyển`);
      if (maintenanceCount > 0) breakdown.push(`${maintenanceCount} yêu cầu bảo trì`);
      if (disposalCount > 0) breakdown.push(`${disposalCount} hồ sơ xử lý`);
      if (inventoryCount > 0) breakdown.push(`${inventoryCount} kết quả kiểm kê`);
      throw Object.assign(
        new Error(
          `Không thể xóa tài sản vì đã có lịch sử nghiệp vụ: ${breakdown.join(', ')}. ` +
          'Tài sản chỉ có thể được xóa khi mới nhập liệu sai và chưa qua bất kỳ quy trình nào. ' +
          'Để loại bỏ tài sản khỏi hệ thống, hãy thực hiện quy trình Thanh lý hoặc Tiêu hủy.'
        ),
        { statusCode: 409 }
      );
    }

    await asset.destroy();
  }

  async getAssetHistory(assetId: number): Promise<AssetTransfer[]> {
    const transfers = await AssetTransfer.findAll({
      where: { asset_id: assetId },
      order: [['transfer_date', 'DESC']],
      include: [
        { model: Department, as: 'from_department' },
        { model: Department, as: 'to_department' },
      ],
    });

    return transfers;
  }

  /**
   * Lấy thống kê tổng hợp tài sản theo trạng thái
   * Áp dụng tất cả các filter (department, category, status) để thống kê chính xác
   */
  async getStatistics(query: any): Promise<any> {
    const where: any = {};

    // Áp dụng filter theo department (đồng bộ getAllAssets; include_children=true = cả nhánh — vd. từ Dashboard)
    if (query.current_department_id) {
      const deptId = parseInt(String(query.current_department_id), 10);
      const includeChildren = String(query.include_children ?? '').toLowerCase() === 'true';
      if (includeChildren && Number.isFinite(deptId)) {
        const ids = await this.getDescendantDepartmentIds(deptId);
        where.current_department_id = { [Op.in]: ids.length ? ids : [deptId] };
      } else {
        where.current_department_id = deptId;
      }
    }

    // Áp dụng filter theo category nếu có
    if (query.category_code) {
      where.category_code = query.category_code;
    } else if (query.category) {
      where.category = query.category;
    }

    // Áp dụng filter theo status nếu có - đây là điểm quan trọng!
    // Nếu có filter status, chỉ đếm các tài sản có status đó
    if (query.status) {
      where.status = query.status;
    }

    // Nếu có filter status, chỉ đếm tài sản có status đó cho tất cả các thống kê
    if (query.status) {
      const filteredCount = await Asset.count({ where });
      // Khi có filter status, chỉ hiển thị số liệu cho status đó
      return {
        total: filteredCount,
        active: query.status === 'active' ? filteredCount : 0,
        inactive: query.status === 'inactive' ? filteredCount : 0,
        damaged: query.status === 'damaged' ? filteredCount : 0,
        lost: query.status === 'lost' ? filteredCount : 0,
        disposed: query.status === 'disposed' ? filteredCount : 0,
        pending_disposal: query.status === 'pending_disposal' ? filteredCount : 0,
        pending_repair: query.status === 'pending_repair' ? filteredCount : 0,
      };
    }

    // Nếu không có filter status, đếm breakdown theo từng status
    const [
      totalAssets,
      activeAssets,
      inactiveAssets,
      damagedAssets,
      lostAssets,
      disposedAssets,
      pendingDisposal,
      pendingRepair,
    ] = await Promise.all([
      Asset.count({ where }),
      Asset.count({ where: { ...where, status: 'active' } }),
      Asset.count({ where: { ...where, status: 'inactive' } }),
      Asset.count({ where: { ...where, status: 'damaged' } }),
      // Đếm mất: status = lost hoặc inventory_status = missing
      Asset.count({
        where: {
          ...where,
          [Op.or]: [
            { status: 'lost' },
            { inventory_status: 'missing' },
          ],
        },
      }),
      Asset.count({ where: { ...where, status: 'disposed' } }),
      Asset.count({ where: { ...where, status: 'pending_disposal' } }),
      Asset.count({ where: { ...where, status: 'pending_repair' } }),
    ]);

    return {
      total: totalAssets,
      active: activeAssets,
      inactive: inactiveAssets,
      damaged: damagedAssets,
      lost: lostAssets,
      disposed: disposedAssets,
      pending_disposal: pendingDisposal,
      pending_repair: pendingRepair,
    };
  }

  async getPendingDisposalGrouped(departmentId?: number): Promise<any[]> {
    // Tìm tất cả asset_id đã có trong hồ sơ đang chờ xử lý (pending), để loại trừ
    const { AssetDisposalCase } = await import('../models');
    const activeCaseItems = await AssetDisposalItem.findAll({
      include: [
        {
          model: AssetDisposalCase,
          as: 'disposal_case',
          where: { status: 'pending' },
          required: true,
          attributes: [],
        },
      ],
      attributes: ['asset_id'],
    });
    const alreadyInCaseIds = activeCaseItems.map((i: any) => i.asset_id).filter(Boolean);

    const where: any = { status: 'pending_disposal' };
    if (alreadyInCaseIds.length > 0) {
      where.id = { [Op.notIn]: alreadyInCaseIds };
    }
    if (departmentId) {
      where.current_department_id = departmentId;
    }

    const assets = await Asset.findAll({
      where,
      include: [
        { model: Department, as: 'current_department', attributes: ['id', 'name'] },
      ],
      order: [['current_department_id', 'ASC'], ['asset_code', 'ASC']],
      attributes: ['id', 'asset_code', 'name', 'purchase_price', 'current_value', 'status', 'current_department_id'],
    });

    const grouped: Record<string, { department_id: number | null; department_name: string; assets: any[] }> = {};
    for (const a of assets) {
      const json = a.toJSON() as any;
      const deptId = json.current_department_id ?? 0;
      const deptName = json.current_department?.name || 'Chưa phân bổ';
      const key = String(deptId);
      if (!grouped[key]) {
        grouped[key] = { department_id: json.current_department_id, department_name: deptName, assets: [] };
      }
      grouped[key].assets.push({
        id: json.id,
        asset_code: json.asset_code,
        name: json.name,
        purchase_price: json.purchase_price,
        current_value: json.current_value,
      });
    }

    return Object.values(grouped);
  }

  async getRepairHistory(assetId: number): Promise<any[]> {
    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const repairs = await MaintenanceRequest.findAll({
      where: {
        asset_id: assetId,
        request_type: 'repair',
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullname', 'username'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullname', 'username'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 'description', 'status', 'estimated_cost',
        'start_date', 'completion_date', 'created_at', 'updated_at',
        'head_approved_at', 'admin_approved_at', 'director_approved_at',
        'rejection_reason', 'admin_notes', 'head_notes', 'director_notes',
      ],
    });

    const result = [];
    for (const repair of repairs) {
      const approvals = await RequestApproval.findAll({
        where: {
          entity_type: 'maintenance_request',
          entity_id: repair.id,
        },
        order: [['decided_at', 'ASC']],
        attributes: ['approval_level', 'approver_role', 'approver_name', 'decision', 'notes', 'decided_at'],
      });

      result.push({
        ...repair.toJSON(),
        approvals,
      });
    }

    return result;
  }
}

export default new AssetService();
