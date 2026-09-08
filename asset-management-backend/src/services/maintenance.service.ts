import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { MaintenanceRequest, MaintenanceDamageImage, Asset, Department, User, RequestApproval, AssetCategory, Procurement, AssetDisposalCase, AssetDisposalItem, AuditLog, InventoryReport, InventoryRound } from '../models';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import { MaintenanceStatus } from '../models/MaintenanceRequest';
import { UserRole } from '../models/User';
import { saveBase64Image } from '../utils/fileStorage';

export interface CreateMaintenanceInput {
  request_type?: 'procurement' | 'repair';
  asset_id?: number;
  department_id?: number;
  description?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  status?: MaintenanceStatus;
  cost?: number;
  notes?: string;
  // Procurement fields
  category?: string;
  device_name?: string;
  technical_specs?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  norm_limit?: number;
  current_quantity?: number;
  justification?: string;
  // Repair fields
  estimated_cost?: number;
  damage_images?: string | string[] | null;
}

export interface UpdateMaintenanceInput extends Partial<CreateMaintenanceInput> {
  status?: MaintenanceStatus;
  assigned_to?: number;
  start_date?: Date;
  completion_date?: Date;
  damage_images?: string | string[] | null; // For repair requests
}

export interface ApprovalInput {
  decision: 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  assigned_to?: number;
  estimated_cost?: number;
}

export interface FulfillProcurementAssetInput {
  asset_code?: string | null;
  asset_code_prefix?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  category_id?: number | null;
  category_code?: string | null;
  unit?: string | null;
  asset_type?: string | null;
  year_in_use?: number | null;
  quantity?: number;
  purchase_price?: number | null;
  current_value?: number | null;
  residual_value?: number | null;
  useful_life?: number | null;
  is_depreciable?: boolean;
  depreciation_rate?: number | null;
  serial_number?: string | null;
  warranty_date?: Date | null;
  location?: string | null;
  asset_condition?: any;
  land_parcel_id?: number | null;
}

export interface FulfillProcurementInput {
  department_id?: number | null; // receiving department
  purchase_date?: Date | null;
  assets: FulfillProcurementAssetInput[];
}

export interface ApproverInfo {
  id: number;
  role: UserRole;
  fullname?: string;
  email?: string;
  department_id?: number;
}

class MaintenanceService {
  private normalizeAssetCode(code: string): string {
    return code.trim().replace(/\s+/g, '-');
  }

  private async generateUniqueAssetCode(
    preferredCode: string,
    transaction: any
  ): Promise<string> {
    const base = this.normalizeAssetCode(preferredCode);
    if (!base) {
      throw new ConflictError('Asset code không hợp lệ');
    }

    // Try base first, then base-2, base-3...
    for (let i = 0; i < 5000; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const existing = await Asset.findOne({
        where: { asset_code: candidate },
        transaction,
      });
      if (!existing) return candidate;
    }

    throw new ConflictError('Không thể tạo mã tài sản duy nhất (quá nhiều trùng lặp)');
  }

  /**
   * Helper function to save damage images from base64 JSON array
   * @param maintenanceId - Maintenance request ID
   * @param damageImagesJson - JSON string containing array of base64 images
   * @param transaction - Optional transaction
   */
  private async saveDamageImages(
    maintenanceId: number,
    damageImagesJson: string | null,
    transaction?: any
  ): Promise<string[]> {
    console.log(`🖼️ [Service] saveDamageImages for ID ${maintenanceId}:`, {
      hasData: !!damageImagesJson,
      length: damageImagesJson ? damageImagesJson.length : 0,
    });

    try {
      // 1. Luôn xóa hoặc quản lý ảnh hiện tại
      const existingImages = await MaintenanceDamageImage.findAll({
        where: { maintenance_id: maintenanceId },
        transaction,
      });

      if (damageImagesJson === null || !damageImagesJson || damageImagesJson.trim().length === 0) {
        console.log('🗑️ [Service] No images provided, deleting all current images');
        await MaintenanceDamageImage.destroy({
          where: { maintenance_id: maintenanceId },
          transaction
        });
        return [];
      }

      const imagesArray: any[] = JSON.parse(damageImagesJson);
      if (!Array.isArray(imagesArray)) {
        console.warn('⚠️ [Service] damage_images is not an array after parsing');
        return [];
      }

      console.log(`📊 [Service] Processing ${imagesArray.length} images for maintenance ${maintenanceId}`);

      // Phân loại ảnh
      const imagesToKeep: MaintenanceDamageImage[] = [];
      const newBase64Images: string[] = [];

      for (const img of imagesArray) {
        if (typeof img === 'string') {
          if (img.startsWith('data:image')) {
            newBase64Images.push(img);
          } else {
            // Kiểm tra xem có trùng với ảnh cũ nào không
            const cleanPath = img.replace(/^\/storage\//, '').replace(/^storage\//, '');
            const existing = existingImages.find(ei => ei.image_path === cleanPath || ei.image_path === img);
            if (existing) {
              imagesToKeep.push(existing);
            }
          }
        }
      }

      console.log(`🧹 [Service] Image breakdown: Keep=${imagesToKeep.length}, New=${newBase64Images.length}, Old_Total=${existingImages.length}`);

      // 2. Xóa các ảnh cũ không còn trong danh sách giữ lại
      const idsToKeep = imagesToKeep.map(img => img.id);
      await MaintenanceDamageImage.destroy({
        where: {
          maintenance_id: maintenanceId,
          id: { [Op.notIn]: idsToKeep }
        },
        transaction
      });

      // 3. Lưu các ảnh mới
      let savedCount = imagesToKeep.length;
      for (let i = 0; i < newBase64Images.length; i++) {
        const base64Image = newBase64Images[i];
        const nextOrderNumber = savedCount + 1;
        
        try {
          const imagePath = saveBase64Image(base64Image, maintenanceId, nextOrderNumber);
          await MaintenanceDamageImage.create({
            maintenance_id: maintenanceId,
            image_path: imagePath,
            order_number: nextOrderNumber
          }, { transaction });
          savedCount++;
        } catch (err) {
          console.error(`❌ [Service] Failed to save image ${i + 1} for maintenance ${maintenanceId}:`, err);
          // Re-throw to ensure transaction rollback
          throw err;
        }
      }

      // 4. Cập nhật lại order_number cho tất cả ảnh để đảm bảo liên tục
      const finalImages = await MaintenanceDamageImage.findAll({
        where: { maintenance_id: maintenanceId },
        order: [['id', 'ASC']],
        transaction
      });

      for (let i = 0; i < finalImages.length; i++) {
        const img = finalImages[i];
        if (img.order_number !== i + 1) {
          await img.update({ order_number: i + 1 }, { transaction });
        }
      }

      console.log(`✅ [Service] saveDamageImages completed. Total images in DB: ${finalImages.length}`);
      
      // Return list of relative paths for fallback
      return finalImages.map(img => img.image_path);
    } catch (error) {
      console.error('❌ [Service] Error in saveDamageImages:', error);
      throw error;
    }
  }

  async getAllMaintenanceRequests(query: any): Promise<PaginationResult<MaintenanceRequest>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.request_type) {
      where.request_type = query.request_type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.urgency) {
      where.urgency = query.urgency;
    }

    if (query.asset_id) {
      where.asset_id = query.asset_id;
    }

    if (query.department_id) {
      where.department_id = query.department_id;
    }

    if (query.assigned_to) {
      where.assigned_to = query.assigned_to;
    }

    if (query.category) {
      where.category = query.category;
    }

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status', 'serial_number', 'year_in_use', 'unit', 'quantity', 'asset_condition', 'current_value', 'purchase_price', 'residual_value', 'category', 'category_code'],
          required: false,
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'headApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'adminApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'directorApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'rejector',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: MaintenanceDamageImage,
          as: 'damageImages',
          required: false,
          order: [['order_number', 'ASC']],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  /**
   * Hoàn tất mua sắm/cấp phát:
   * - Chỉ áp dụng cho request_type=procurement đã được duyệt cấp cuối
   * - Tự động tạo tài sản và gán về phòng ban nhận
   * - Lưu created_asset_ids để tránh tạo trùng
   */
  async fulfillProcurement(
    id: number,
    fulfiller: ApproverInfo,
    input: FulfillProcurementInput
  ): Promise<{ maintenance: MaintenanceRequest; created_assets: Asset[] }> {
    const maintenance = await MaintenanceRequest.findByPk(id);
    if (!maintenance) throw new NotFoundError('Maintenance request not found');

    if (maintenance.request_type !== 'procurement') {
      throw new ConflictError('Chỉ có thể hoàn tất với đề nghị mua sắm (procurement)');
    }

    // Only allow after final approval
    if (!['approved_by_admin', 'approved_by_director'].includes(maintenance.status)) {
      throw new ConflictError('Chỉ có thể hoàn tất khi đề nghị đã được Admin phê duyệt');
    }

    // Idempotency
    if ((maintenance as any).procurement_fulfilled) {
      const existingIds: number[] = Array.isArray((maintenance as any).created_asset_ids)
        ? (maintenance as any).created_asset_ids
        : [];
      const existingAssets = existingIds.length
        ? await Asset.findAll({ where: { id: existingIds } })
        : [];
      return { maintenance, created_assets: existingAssets };
    }

    const receivingDepartmentId = (input.department_id ?? (maintenance as any).receiving_department_id ?? maintenance.department_id) as
      | number
      | undefined;
    if (!receivingDepartmentId) {
      throw new ConflictError('Thiếu phòng ban nhận (department_id)');
    }

    const receivingDept = await Department.findByPk(receivingDepartmentId);
    if (!receivingDept) {
      throw new NotFoundError('Phòng ban nhận không tồn tại');
    }

    const purchaseDate = input.purchase_date ? new Date(input.purchase_date) : null;
    const procurementYear = purchaseDate ? purchaseDate.getFullYear() : new Date().getFullYear();

    const transaction = await sequelize.transaction();
    const createdAssets: Asset[] = [];
    const createdAssetIds: number[] = [];

    try {
      // Create assets
      for (let lineIndex = 0; lineIndex < input.assets.length; lineIndex++) {
        const line = input.assets[lineIndex];
        const qty = Math.max(1, Number(line.quantity || 1));

        const prefixRaw =
          (line.asset_code_prefix || line.asset_code || '').toString().trim() ||
          `MS-${procurementYear}-${maintenance.id}-${lineIndex + 1}`;
        const prefix = this.normalizeAssetCode(prefixRaw);

        for (let i = 0; i < qty; i++) {
          const suffix = qty > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
          const preferredCode = `${prefix}${suffix}`;
          const uniqueCode = await this.generateUniqueAssetCode(preferredCode, transaction);

          // Lookup category to auto-fill fields similar to assetService.createAsset
          let category: any = null;
          if (line.category_id) {
            category = await AssetCategory.findByPk(line.category_id, { transaction });
          } else if (line.category_code) {
            category = await AssetCategory.findOne({
              where: { code: line.category_code, is_active: true },
              transaction,
            });
          }

          const createData: any = {
            asset_code: uniqueCode,
            name: line.name,
            description: line.description ?? undefined,
            category: line.category ?? undefined,
            category_id: line.category_id ?? undefined,
            category_code: line.category_code ?? undefined,
            unit: line.unit ?? undefined,
            asset_type: line.asset_type ?? undefined,
            year_in_use: line.year_in_use ?? (purchaseDate ? purchaseDate.getFullYear() : procurementYear),
            purchase_date: purchaseDate ?? undefined,
            purchase_price: line.purchase_price != null ? Number(line.purchase_price) : undefined,
            current_value: line.current_value != null ? Number(line.current_value) : undefined,
            residual_value: line.residual_value != null ? Number(line.residual_value) : undefined,
            useful_life: line.useful_life != null ? Number(line.useful_life) : undefined,
            is_depreciable: line.is_depreciable,
            depreciation_rate: line.depreciation_rate != null ? Number(line.depreciation_rate) : undefined,
            serial_number: line.serial_number ?? undefined,
            warranty_date: line.warranty_date ?? undefined,
            current_department_id: receivingDepartmentId,
            location: line.location ?? receivingDept.name,
            asset_condition: line.asset_condition ?? undefined,
            land_parcel_id: line.land_parcel_id ?? undefined,
            status: 'active',
            quantity: 1, // hệ thống đang thiết kế 1 asset = 1 bản ghi
          };

          if (category) {
            if (!createData.category) createData.category = category.name;
            if (!createData.category_id) createData.category_id = category.id;
            if (!createData.category_code) createData.category_code = category.code;
            if (!createData.unit) createData.unit = category.unit;
            if (createData.is_depreciable === undefined) createData.is_depreciable = category.is_depreciable;
            if (!createData.depreciation_rate && category.depreciation_rate) {
              createData.depreciation_rate = Number(category.depreciation_rate);
            }
            if (!createData.useful_life && category.useful_life_years) {
              createData.useful_life = Number(category.useful_life_years);
            }
          }

          const asset = await Asset.create(createData, { transaction });
          createdAssets.push(asset);
          createdAssetIds.push(asset.id);
        }
      }

      await maintenance.update(
        {
          receiving_department_id: receivingDepartmentId,
          procurement_fulfilled: true,
          fulfilled_at: new Date(),
          fulfilled_by: fulfiller.id,
          created_asset_ids: createdAssetIds,
          procurement_year: procurementYear,
          status: 'completed',
        } as any,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Best-effort QR generation after commit (avoid blocking fulfillment)
    try {
      const { default: qrcodeService } = await import('./qrcode.service');
      for (const a of createdAssets) {
        try {
          await qrcodeService.generateQRCodeForAsset(a);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    const updated = await this.getMaintenanceById(id);
    const createdAssetsReloaded = createdAssetIds.length
      ? await Asset.findAll({
          where: { id: createdAssetIds },
          order: [['id', 'ASC']],
        })
      : [];
    return { maintenance: updated, created_assets: createdAssetsReloaded };
  }

  /**
   * Admin bắt đầu thực hiện sửa chữa: approved_by_director → in_progress
   */
  async startRepair(id: number, user: ApproverInfo): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);
    if (!maintenance) throw new NotFoundError('Maintenance request not found');

    if (maintenance.request_type !== 'repair') {
      throw new ConflictError('Thao tác này chỉ áp dụng cho đề nghị sửa chữa');
    }
    if (!['approved_by_admin', 'approved_by_director'].includes(maintenance.status)) {
      throw new ConflictError('Yêu cầu phải được Admin phê duyệt mới có thể bắt đầu sửa chữa');
    }
    if (user.role !== 'admin') {
      throw new ForbiddenError('Chỉ Admin mới có thể bắt đầu thực hiện sửa chữa');
    }

    await maintenance.update({ status: 'in_progress', start_date: new Date() });

    await RequestApproval.create({
      entity_type: 'maintenance_request',
      entity_id: id,
      approver_id: user.id,
      approver_role: user.role as any,
      approver_name: user.fullname,
      approver_email: user.email,
      decision: 'approved',
      notes: 'Bắt đầu thực hiện sửa chữa',
      approval_level: 4,
      decided_at: new Date(),
    });

    return this.getMaintenanceById(id);
  }

  /**
   * Admin xác nhận hoàn thành sửa chữa: in_progress → repair_completed
   */
  async completeRepair(id: number, user: ApproverInfo, notes?: string): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);
    if (!maintenance) throw new NotFoundError('Maintenance request not found');

    if (maintenance.request_type !== 'repair') {
      throw new ConflictError('Thao tác này chỉ áp dụng cho đề nghị sửa chữa');
    }
    if (maintenance.status !== 'in_progress') {
      throw new ConflictError('Yêu cầu phải ở trạng thái "Đang thực hiện" mới có thể đánh dấu hoàn thành');
    }
    if (user.role !== 'admin') {
      throw new ForbiddenError('Chỉ Admin mới có thể xác nhận hoàn thành sửa chữa');
    }

    await maintenance.update({
      status: 'completed',
      completion_date: new Date(),
      ...(notes ? { notes } : {}),
    });

    await RequestApproval.create({
      entity_type: 'maintenance_request',
      entity_id: id,
      approver_id: user.id,
      approver_role: user.role as any,
      approver_name: user.fullname,
      approver_email: user.email,
      decision: 'approved',
      notes: notes || 'Admin xác nhận hoàn thành sửa chữa',
      approval_level: 5,
      decided_at: new Date(),
    });

    // Cập nhật trạng thái tài sản về active sau khi hoàn thành sửa chữa
    if (maintenance.asset_id) {
      const asset = await Asset.findByPk(maintenance.asset_id);
      if (asset) {
        await asset.update({ status: 'active' });
      }
    }

    return this.getMaintenanceById(id);
  }

  async getMaintenanceById(id: number): Promise<MaintenanceRequest> {
    console.log('🔍 [getMaintenanceById] Loading maintenance ID:', id);
    
    // First, check if damage images exist in database
    const dbImageCount = await MaintenanceDamageImage.count({
      where: { maintenance_id: id },
    });
    console.log('🔍 [getMaintenanceById] Database check - damage images count:', dbImageCount);
    
    // Load maintenance with all relationships including damageImages
    // NOTE: We ONLY use damageImages association, NOT the damage_images field
    // CRITICAL: Use fresh query (not cached) to ensure we get latest data
    const maintenance = await MaintenanceRequest.findByPk(id, {
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status', 'serial_number', 'year_in_use', 'unit', 'quantity', 'asset_condition', 'current_value', 'purchase_price', 'residual_value', 'category', 'category_code'],
          required: false,
        },
        {
          model: Department,
          as: 'department',
          required: false,
        },
        {
          model: User,
          as: 'requester',
          required: false,
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'approver',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'assignee',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'headApprover',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'adminApprover',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'directorApprover',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'rejector',
          required: false,
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: MaintenanceDamageImage,
          as: 'damageImages',
          required: false,
          order: [['order_number', 'ASC']],
        },
        {
          model: Procurement,
          as: 'linkedProcurement',
          required: false,
          attributes: ['id', 'code', 'title', 'status'],
        },
        {
          model: AssetDisposalCase,
          as: 'linkedDisposalCase',
          required: false,
          attributes: ['id', 'code', 'status', 'disposal_type'],
        },
        {
          model: InventoryReport,
          as: 'sourceInventoryReport',
          required: false,
          attributes: ['id', 'status'],
          include: [{ model: InventoryRound, as: 'inventory_round', attributes: ['id', 'round_name', 'round_year'], required: false }],
        },
      ],
    });

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    // Verify damageImages were loaded correctly
    const damageImagesCount = maintenance.damageImages ? maintenance.damageImages.length : 0;
    
    // Use dbImageCount that was already queried above
    console.log('✅ [getMaintenanceById] Loaded maintenance:', {
      id: maintenance.id,
      hasDamageImages: !!maintenance.damageImages,
      damageImagesCount,
      dbImageCount,
      match: dbImageCount === damageImagesCount ? '✅' : '❌ MISMATCH',
      damageImagesArray: maintenance.damageImages ? maintenance.damageImages.map((img: any) => ({
        id: img.id,
        path: img.image_path,
        order: img.order_number,
        url: img.getUrl ? img.getUrl() : (img as any).dataValues?.url,
      })) : [],
    });
    
    // If there's a mismatch, manually load images and assign to maintenance
    if (dbImageCount !== damageImagesCount) {
      console.error('❌ [getMaintenanceById] MISMATCH DETECTED:', {
        maintenanceId: id,
        dbImageCount,
        associationCount: damageImagesCount,
        message: 'Database has images but association is not loading them correctly',
      });
      
      // If database has images but association is empty, manually load them
      if (dbImageCount > 0 && damageImagesCount === 0) {
        console.log('🔄 [getMaintenanceById] Manually loading damageImages from database...');
        const manualImages = await MaintenanceDamageImage.findAll({
          where: { maintenance_id: id },
          order: [['order_number', 'ASC']],
        });
        
        console.log('🔄 [getMaintenanceById] Manually loaded images:', {
          count: manualImages.length,
          images: manualImages.map(img => ({
            id: img.id,
            path: img.image_path,
            order: img.order_number,
          })),
        });
        
        // Assign to maintenance object
        (maintenance as any).damageImages = manualImages;
        (maintenance as any).dataValues.damageImages = manualImages;
        
        console.log('✅ [getMaintenanceById] Manually assigned damageImages to maintenance');
      }
    }

    return maintenance;
  }

  // Legacy method - keeping for reference but not using raw query anymore
  private async getMaintenanceByIdLegacy(id: number): Promise<MaintenanceRequest> {
    // First, check raw data from database to ensure damage_images exists
    let rawDamageImages: string | null = null;
    try {
      // CRITICAL: Use explicit TEXT cast to ensure large TEXT fields are retrieved correctly
      const rawResults = await sequelize.query(
        `SELECT id, 
         damage_images::text as damage_images, 
         LENGTH(damage_images::text) as damage_images_length 
         FROM maintenance_requests 
         WHERE id = $1`,
        {
          bind: [id],
          type: QueryTypes.SELECT,
        }
      ) as any[];

      if (rawResults && rawResults.length > 0) {
        const rawData = rawResults[0];
        rawDamageImages = rawData.damage_images;
        const dbLength = rawData.damage_images_length || 0;
        console.log('🔍 [getMaintenanceById] Raw database query result:', {
          id: rawData.id,
          hasDamageImages: !!rawData.damage_images,
          damageImagesLength: dbLength,
          retrievedLength: rawDamageImages ? rawDamageImages.length : 0,
          damageImagesPreview: rawData.damage_images ? rawData.damage_images.substring(0, 100) + '...' : 'null',
          matchesLength: rawDamageImages && dbLength > 0 ? (rawDamageImages.length === dbLength ? 'YES ✅' : `NO ❌ (got ${rawDamageImages.length}, expected ${dbLength})`) : 'N/A',
        });
        
        // If length mismatch, log warning
        if (rawDamageImages && dbLength > 0 && rawDamageImages.length !== dbLength) {
          console.error('❌ [getMaintenanceById] CRITICAL: Length mismatch! Retrieved', rawDamageImages.length, 'but DB has', dbLength);
        }
      }
    } catch (error) {
      console.error('❌ [getMaintenanceById] Error checking raw database:', error);
    }

    const maintenance = await MaintenanceRequest.findByPk(id, {
      attributes: { include: ['damage_images'] }, // Explicitly include damage_images
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status', 'serial_number', 'year_in_use', 'unit', 'quantity', 'asset_condition', 'current_value', 'purchase_price', 'residual_value', 'category', 'category_code'],
        },
        {
          model: Department,
          as: 'department',
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'headApprover',
          attributes: ['id', 'username', 'fullname', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'adminApprover',
          attributes: ['id', 'username', 'fullname', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'directorApprover',
          attributes: ['id', 'username', 'fullname', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'rejector',
          attributes: ['id', 'username', 'fullname', 'email'],
          required: false,
        },
        {
          model: MaintenanceDamageImage,
          as: 'damageImages',
          required: false,
        },
      ],
    });

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    // Always use raw query value if available (more reliable for TEXT fields)
    // If raw query shows damage_images exists, use it (even if null)
    if (rawDamageImages !== undefined) {
      if (rawDamageImages !== maintenance.damage_images) {
        console.log('🔧 [getMaintenanceById] Using raw query damage_images value (more reliable)');
        (maintenance as any).damage_images = rawDamageImages;
        (maintenance as any).dataValues.damage_images = rawDamageImages;
      }
    } else if (!maintenance.damage_images) {
      // If raw query failed but Sequelize also doesn't have it, set to null explicitly
      console.log('🔧 [getMaintenanceById] Setting damage_images to null (not found in DB)');
      (maintenance as any).damage_images = null;
      (maintenance as any).dataValues.damage_images = null;
    }

    // Log damage_images to debug
    console.log('🔍 [getMaintenanceById] Retrieved maintenance:', {
      id: maintenance.id,
      requestType: maintenance.request_type,
      hasDamageImages: 'damage_images' in maintenance,
      damageImagesValue: maintenance.damage_images ? (typeof maintenance.damage_images === 'string' ? maintenance.damage_images.substring(0, 100) + '...' : 'object') : 'null',
      damageImagesType: typeof maintenance.damage_images,
      damageImagesLength: maintenance.damage_images ? maintenance.damage_images.length : 0,
      rawDataValues: (maintenance as any).dataValues?.damage_images ? (typeof (maintenance as any).dataValues.damage_images === 'string' ? (maintenance as any).dataValues.damage_images.substring(0, 100) + '...' : 'object') : 'null',
      rawDataValuesLength: (maintenance as any).dataValues?.damage_images ? ((maintenance as any).dataValues.damage_images?.length || 0) : 0,
    });

    return maintenance;
  }

  async createMaintenance(data: CreateMaintenanceInput, requestedBy: number): Promise<MaintenanceRequest> {
    const departmentId = data.department_id;
    const requestType = data.request_type || (data.asset_id ? 'repair' : 'procurement');

    // Procurement requests don't need asset_id since assets don't exist yet

    // Prepare data for creation
    // IMPORTANT: Procurement requests (đề nghị mua sắm) không cần asset_id 
    // vì tài sản chưa tồn tại. Chỉ khi nào mua xong thì mới thêm tài sản vào phần quản lý tài sản.
    // Status mặc định là 'draft' để người dùng có thể chỉnh sửa trước khi gửi phê duyệt
    const createData: any = {
      request_type: requestType,
      department_id: departmentId,
      requested_by: requestedBy,
      status: data.status || 'draft', // Mặc định là draft, có thể gửi phê duyệt sau
      urgency: data.urgency || 'normal',
    };

    // Extract damage_images JSON string (will be saved to maintenance_damage_images table, NOT to damage_images field)
    // CRITICAL: Handle both string and already-parsed array
    let damageImagesJson: string | null = null;
    
    if (data.damage_images !== undefined && data.damage_images !== null) {
      if (typeof data.damage_images === 'string') {
        const trimmed = data.damage_images.trim();
        // Check if it's an empty string, "null", or empty JSON array "[]"
        if (trimmed.length === 0 || trimmed === 'null' || trimmed === '""' || trimmed === '[]') {
          damageImagesJson = null;
          console.log('ℹ️ [createMaintenance] damage_images is empty string, "null", or "[]", setting to null');
        } else {
          damageImagesJson = trimmed;
        }
      } else if (Array.isArray(data.damage_images)) {
        // If it's already an array, stringify it
        const imagesArray = data.damage_images as string[];
        if (imagesArray.length === 0) {
          damageImagesJson = null;
          console.log('ℹ️ [createMaintenance] damage_images is empty array, setting to null');
        } else {
          damageImagesJson = JSON.stringify(imagesArray);
        }
      } else {
        console.warn('⚠️ [createMaintenance] damage_images is neither string nor array:', typeof data.damage_images);
        damageImagesJson = null;
      }
    } else {
      console.log('ℹ️ [createMaintenance] damage_images is undefined or null, will not save images');
    }
    
    // Helper to safely get damage_images info for logging
    const getDamageImagesInfo = () => {
      const value: any = data.damage_images;
      if (!value) return { type: 'null/undefined', length: 0, preview: 'null/undefined' };
      if (typeof value === 'string') return { type: 'string', length: value.length, preview: value.substring(0, 200) + '...' };
      if (Array.isArray(value)) {
        const arr = value as any[];
        return { type: 'array', length: arr.length, preview: `Array(${arr.length})` };
      }
      return { type: typeof value, length: 'N/A', preview: String(value) };
    };
    
    const damageImagesInfo = getDamageImagesInfo();
    
    console.log('🔍 [createMaintenance] Extracted damage_images from data:', {
      hasDamageImages: 'damage_images' in data,
      damageImagesValue: damageImagesInfo.preview,
      damageImagesType: damageImagesInfo.type,
      damageImagesIsArray: Array.isArray(data.damage_images),
      damageImagesLength: damageImagesInfo.length,
      damageImagesJson: damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.substring(0, 200) + '...' : typeof damageImagesJson) : 'null',
      damageImagesJsonType: typeof damageImagesJson,
      damageImagesJsonLength: damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.length : 'N/A') : 0,
      damageImagesJsonIsEmpty: damageImagesJson ? damageImagesJson.trim().length === 0 : true,
    });
    
    // Copy all fields from data (EXCEPT damage_images - we handle it separately)
    Object.keys(data).forEach(key => {
      // Skip asset_id for procurement requests
      if (key === 'asset_id' && requestType === 'procurement') {
        return; // Don't include asset_id for procurement
      }
      
      // Skip damage_images - we'll save it to maintenance_damage_images table, not to damage_images field
      if (key === 'damage_images') {
        return;
      }
      
      const value = data[key as keyof CreateMaintenanceInput];
      if (value !== undefined) {
        createData[key] = value;
      }
    });
    
    // Explicitly set asset_id to null for procurement requests
    // This ensures database receives null instead of undefined
    if (requestType === 'procurement') {
      createData.asset_id = null;
    }
    
    // For repair requests, asset_id is required and we need to update asset status
    if (requestType === 'repair') {
      if (!data.asset_id) {
        throw new ConflictError('Vui lòng chọn tài sản cần sửa chữa');
      }
      
      // Verify asset exists
      const asset = await Asset.findByPk(data.asset_id);
      if (!asset) {
        throw new NotFoundError('Tài sản không tồn tại');
      }
      
      // Check if asset is in a valid state for repair request
      if (asset.status !== 'active') {
        throw new ConflictError(`Tài sản đang ở trạng thái "${asset.status}", không thể tạo đề nghị sửa chữa. Chỉ tài sản đang sử dụng mới có thể tạo đề nghị sửa chữa.`);
      }
    }

    
    console.log('🔧 Creating maintenance with data:', {
      requestType,
      hasAssetId: 'asset_id' in createData,
      departmentId: createData.department_id,
      deviceName: createData.device_name,
      requestedBy: createData.requested_by,
      hasDamageImagesJson: !!damageImagesJson,
      damageImagesJsonLength: damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.length : 'N/A') : 0,
      keys: Object.keys(createData).filter(k => k !== 'asset_id' || requestType !== 'procurement'),
    });

    try {
      
      // Use transaction to ensure atomicity
      const transaction = await sequelize.transaction();
      let maintenance: MaintenanceRequest;
      
      try {
        // Create maintenance request without damage_images
        maintenance = await MaintenanceRequest.create(createData, { transaction });
        
        console.log('✅ [Service] Maintenance record created, ID:', maintenance.id);
        
        // IMPORTANT (Business rule):
        // - KHÔNG cập nhật trạng thái tài sản khi tạo yêu cầu sửa chữa hoặc khi submit lên duyệt.
        // - Chỉ cập nhật trạng thái tài sản khi TRƯỞNG ĐƠN VỊ duyệt (level 1).
        // Điều này tránh việc tài sản bị chuyển sang "đang đề nghị sửa chữa" quá sớm (admin không thể sửa lại).
        if (requestType === 'repair' && maintenance.asset_id) {
          console.log('ℹ️ [Service] createMaintenance: asset status unchanged (will be updated at department head approval).', {
            assetId: maintenance.asset_id,
            maintenanceStatus: maintenance.status,
          });
        }
        
        // Save damage images as files (if provided)
        console.log('🖼️ [createMaintenance] About to save damage images:', {
          maintenanceId: maintenance.id,
          hasDamageImagesJson: !!damageImagesJson,
          damageImagesJsonType: typeof damageImagesJson,
          damageImagesJsonLength: damageImagesJson ? damageImagesJson.length : 0,
          damageImagesJsonIsString: typeof damageImagesJson === 'string',
          damageImagesJsonTrimmedLength: damageImagesJson && typeof damageImagesJson === 'string' ? damageImagesJson.trim().length : 0,
          willCallSaveDamageImages: !!(damageImagesJson && typeof damageImagesJson === 'string' && damageImagesJson.trim().length > 0),
        });
        
        // CRITICAL: Save damage images if provided
        // Check both damageImagesJson and original data.damage_images to ensure we don't miss it
        const shouldSaveImages = damageImagesJson && typeof damageImagesJson === 'string' && damageImagesJson.trim().length > 0;
        
        if (shouldSaveImages) {
          console.log('✅ [createMaintenance] Calling saveDamageImages with:', {
            maintenanceId: maintenance.id,
            jsonLength: damageImagesJson.length,
            jsonPreview: damageImagesJson.substring(0, 100) + '...',
          });
          try {
            const savedPaths = await this.saveDamageImages(maintenance.id, damageImagesJson, transaction);
            console.log('✅ [createMaintenance] saveDamageImages completed successfully. Paths:', savedPaths);
            
            // Sync back to damage_images field as a JSON fallback
            if (savedPaths && savedPaths.length > 0) {
              await maintenance.update({ damage_images: JSON.stringify(savedPaths) }, { transaction });
              console.log('✅ [createMaintenance] Updated damage_images fallback field in main table');
            }
          } catch (saveError: any) {
            console.error('❌ [createMaintenance] saveDamageImages failed:', {
              error: saveError.message,
              stack: saveError.stack,
              maintenanceId: maintenance.id,
            });
            // Re-throw to trigger transaction rollback
            throw saveError;
          }
        } else {
          console.warn('⚠️ [createMaintenance] NOT calling saveDamageImages because:', {
            damageImagesJsonIsNull: damageImagesJson === null,
            damageImagesJsonIsUndefined: damageImagesJson === undefined,
            damageImagesJsonType: typeof damageImagesJson,
            damageImagesJsonLength: damageImagesJson ? damageImagesJson.length : 0,
            trimmedLength: damageImagesJson && typeof damageImagesJson === 'string' ? damageImagesJson.trim().length : 'N/A',
            originalDataHasDamageImages: 'damage_images' in data,
            originalDataDamageImagesType: typeof data.damage_images,
            originalDataDamageImagesValue: (() => {
              const val: any = data.damage_images;
              if (!val) return 'null/undefined';
              if (typeof val === 'string') return val.substring(0, 100) + '...';
              if (Array.isArray(val)) {
                const arr = val as any[];
                return `Array(${arr.length})`;
              }
              return String(val);
            })(),
          });
        }
        
        // Commit transaction
        await transaction.commit();
        console.log('✅ [Service] Transaction committed for maintenance ID:', maintenance.id);
        
        // IMPORTANT: After commit, we need to reload from a fresh query to ensure we get the latest data
        // This is because Sequelize might cache the instance
        console.log('🔄 [createMaintenance] Reloading maintenance with damageImages association (fresh query)...');
        
        // Use findByPk instead of reload to get a fresh instance after transaction commit
        const reloadedMaintenance = await MaintenanceRequest.findByPk(maintenance.id, {
          include: [
            {
              model: MaintenanceDamageImage,
              as: 'damageImages',
              required: false,
              order: [['order_number', 'ASC']],
            },
          ],
        });
        
        if (reloadedMaintenance) {
          console.log('✅ [createMaintenance] Successfully reloaded maintenance with associations');
          return reloadedMaintenance;
        } else {
          console.warn('⚠️ [createMaintenance] Could not reload maintenance after commit, returning initial instance');
          return maintenance;
        }
      } catch (transactionError: any) {
        // Rollback transaction on any error
        await transaction.rollback();
        console.error('❌ [Service] Transaction error, rolled back:', {
          message: transactionError.message,
          stack: transactionError.stack,
        });
        throw transactionError;
      }
    } catch (error: any) {
      // Rollback transaction if it exists (check if transaction is in scope)
      // Note: transaction variable might not be in scope here, so we handle it in the inner catch
      console.error('❌ Database error creating maintenance:', {
        message: error.message,
        name: error.name,
        sql: error.sql,
        parameters: error.parameters,
        original: error.original,
      });
      throw error;
    }
  }

  async updateMaintenance(id: number, data: UpdateMaintenanceInput, user?: ApproverInfo): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    // Admin centrally manages procurement and may edit requests. Department
    // users may edit only requests they created themselves.
    if (user && !['admin', 'staff', 'department_head'].includes(user.role)) {
      throw new ForbiddenError('Bạn không có quyền sửa yêu cầu');
    }
    
    if (user && user.role !== 'admin' && maintenance.requested_by !== user.id) {
      throw new ForbiddenError('Bạn chỉ có thể sửa yêu cầu do chính mình tạo');
    }

    // Check if assignee exists
    if (data.assigned_to) {
      const assignee = await User.findByPk(data.assigned_to);
      if (!assignee) {
        throw new NotFoundError('Assignee not found');
      }
    }

    // If status is changing to 'in_progress', set start_date
    // Only allow transition from approved_by_director to in_progress
    if (data.status === 'in_progress' && maintenance.status !== 'in_progress') {
      if (maintenance.status !== 'approved_by_director') {
        throw new ConflictError('Chỉ có thể bắt đầu sửa chữa sau khi giám hiệu đã duyệt');
      }
      data.start_date = new Date();
    }

    // If status is changing to 'repair_completed', set completion_date
    // Only allow transition from in_progress to repair_completed
    if (data.status === 'repair_completed' && maintenance.status !== 'repair_completed') {
      if (maintenance.status !== 'in_progress') {
        throw new ConflictError('Chỉ có thể đánh dấu hoàn thành khi đang trong quá trình sửa chữa');
      }
      data.completion_date = new Date();
      // Asset status remains pending_repair until admin approves
    }

    // Legacy support for 'done' status (deprecated)
    if ((data.status as string) === 'done' && (maintenance.status as string) !== 'done') {
      data.completion_date = new Date();
    }

    // Log update data for debugging
    let updateDamageImagesLength = 0;
    if (data.damage_images && typeof data.damage_images === 'string') {
      try {
        const parsed = JSON.parse(data.damage_images);
        updateDamageImagesLength = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        updateDamageImagesLength = 0;
      }
    }
    
    console.log('🔧 Updating maintenance with data:', {
      id,
      requestType: maintenance.request_type,
      hasDamageImages: !!data.damage_images,
      damageImagesValue: data.damage_images ? (typeof data.damage_images === 'string' ? data.damage_images.substring(0, 100) + '...' : 'object') : 'null/undefined',
      damageImagesLength: updateDamageImagesLength,
      keys: Object.keys(data),
    });

      // Extract damage_images JSON string (will be saved to maintenance_damage_images table, NOT to damage_images field)
      // CRITICAL: Only process damage_images if it's explicitly provided in the request
      // If damage_images is undefined, we should NOT update images (preserve existing ones)
      let damageImagesJson: string | null | undefined = undefined;
      
      if ('damage_images' in data) {
        // damage_images field is present in the request
        if (data.damage_images === null || data.damage_images === undefined) {
          // Explicitly set to null means delete all images
          damageImagesJson = null;
        } else if (typeof data.damage_images === 'string') {
          // String format (JSON array)
          damageImagesJson = data.damage_images.trim();
        } else if (Array.isArray(data.damage_images)) {
          // Already an array, stringify it
          damageImagesJson = JSON.stringify(data.damage_images);
        } else {
          console.warn('⚠️ [updateMaintenance] damage_images is neither string nor array:', typeof data.damage_images);
          damageImagesJson = null;
        }
      }
      // If 'damage_images' is not in data, damageImagesJson remains undefined (don't update images)
      
      console.log('🔍 [updateMaintenance] Extracted damage_images from data:', {
        hasDamageImagesKey: 'damage_images' in data,
        damageImagesValue: data.damage_images ? (typeof data.damage_images === 'string' ? data.damage_images.substring(0, 200) + '...' : typeof data.damage_images) : 'null/undefined',
        damageImagesType: typeof data.damage_images,
        damageImagesLength: data.damage_images ? (typeof data.damage_images === 'string' ? data.damage_images.length : 'N/A') : 0,
        damageImagesJson: damageImagesJson !== undefined ? (damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.substring(0, 200) + '...' : typeof damageImagesJson) : 'null') : 'undefined (will preserve existing)',
        damageImagesJsonType: typeof damageImagesJson,
        damageImagesJsonLength: damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.length : 'N/A') : 0,
        willUpdateImages: damageImagesJson !== undefined,
      });
      
      // Copy all fields from data (EXCEPT damage_images - we handle it separately)
      const updateData: any = {};
      Object.keys(data).forEach(key => {
        // Skip damage_images and custom admin tracking fields
        if (key === 'damage_images') {
          return;
        }
        updateData[key] = data[key as keyof UpdateMaintenanceInput];
      });

    // Use transaction to ensure atomicity
    const transaction = await sequelize.transaction();
    
    try {
      // Update maintenance request
      const oldStatus = maintenance.status;
      await maintenance.update(updateData, { transaction });
      const newStatus = updateData.status || oldStatus;
      
      // IMPORTANT (Business rule):
      // - KHÔNG cập nhật trạng thái tài sản khi chuyển draft/new -> pending.
      // - Chỉ cập nhật khi TRƯỞNG ĐƠN VỊ duyệt (level 1).
      if (maintenance.request_type === 'repair' && maintenance.asset_id) {
        if (oldStatus === 'draft' && newStatus === 'pending') {
          console.log('ℹ️ [Service] updateMaintenance: moved draft->pending, asset status unchanged (will update at department head approval).', {
            assetId: maintenance.asset_id,
          });
        }
      }
      
      // Save damage images as files (only if explicitly provided in request)
      console.log('🖼️ [updateMaintenance] About to save damage images:', {
        maintenanceId: id,
        hasDamageImagesKey: 'damage_images' in data,
        damageImagesJsonType: typeof damageImagesJson,
        damageImagesJsonLength: damageImagesJson ? (typeof damageImagesJson === 'string' ? damageImagesJson.length : 'N/A') : 0,
        willCallSaveDamageImages: damageImagesJson !== undefined,
      });
      
      // Only update images if damage_images was explicitly provided in the request
      if (damageImagesJson !== undefined) {
        console.log('✅ [updateMaintenance] Calling saveDamageImages...');
        const savedPaths = await this.saveDamageImages(id, damageImagesJson, transaction);
        console.log('✅ [updateMaintenance] saveDamageImages completed. Paths:', savedPaths);
        
        // Sync back to damage_images field as a JSON fallback
        // If damageImagesJson was null, savedPaths will be empty []
        await maintenance.update({ damage_images: savedPaths.length > 0 ? JSON.stringify(savedPaths) : null }, { transaction });
        console.log('✅ [updateMaintenance] Updated damage_images fallback field in main table');
      } else {
        console.log('ℹ️ [updateMaintenance] NOT updating damage images (damage_images not in request, preserving existing images)');
      }
      
      // Commit transaction
      await transaction.commit();
      console.log('✅ [updateMaintenance] Transaction committed for maintenance ID:', id);
      
      // IMPORTANT: After commit, we need to reload from a fresh query to ensure we get the latest data
      // This is because Sequelize might cache the instance
      console.log('🔄 [updateMaintenance] Reloading maintenance with damageImages association (fresh query)...');
      
      // Use findByPk instead of reload to get a fresh instance after transaction commit
      const reloadedMaintenance = await MaintenanceRequest.findByPk(id, {
        include: [
          {
            model: MaintenanceDamageImage,
            as: 'damageImages',
            required: false,
            order: [['order_number', 'ASC']],
          },
        ],
      });
      
      if (reloadedMaintenance) {
        console.log('✅ [updateMaintenance] Successfully reloaded maintenance with associations');
        return reloadedMaintenance;
      }
      
      return maintenance;
    } catch (error: any) {
      await transaction.rollback();
      console.error('❌ [Service] Error updating maintenance:', error);
      throw error;
    }
  }

  async approveMaintenance(id: number, approvedBy: number, assignedTo?: number): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    if (maintenance.status !== 'new') {
      throw new ConflictError('Only new maintenance requests can be approved');
    }

    await maintenance.update({
      status: 'approved',
      approved_by: approvedBy,
      assigned_to: assignedTo,
    });

    return this.getMaintenanceById(id);
  }

  async rejectMaintenance(id: number, approvedBy: number, notes?: string): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    if (maintenance.status !== 'new') {
      throw new ConflictError('Only new maintenance requests can be rejected');
    }

    await maintenance.update({
      status: 'rejected',
      approved_by: approvedBy,
      notes: notes || maintenance.notes,
    });

    return this.getMaintenanceById(id);
  }

  /**
   * Submit maintenance request for approval
   * Chuyển từ draft/new sang pending để gửi lên trưởng phòng phê duyệt
   * Nếu resubmit sau khi bị từ chối, reset các trường approval
   * @param id - Maintenance request ID
   * @param requestedBy - User ID của người submit (có thể là người tạo hoặc admin/director)
   * @param approverInfo - Thông tin người submit (optional, để kiểm tra quyền admin/director)
   */
  async submitForApproval(id: number, requestedBy: number, approverInfo?: ApproverInfo): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    console.log('🔍 submitForApproval - Debug info:', {
      maintenanceId: id,
      maintenanceRequestedBy: maintenance.requested_by,
      maintenanceRequestedByType: typeof maintenance.requested_by,
      requestedBy,
      requestedByType: typeof requestedBy,
      approverInfo: approverInfo ? {
        id: approverInfo.id,
        role: approverInfo.role,
      } : null,
      maintenanceStatus: maintenance.status,
    });

    // Chỉ cho phép gửi phê duyệt nếu status là draft, new, hoặc rejected (sửa lại)
    if (!['draft', 'new', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'].includes(maintenance.status)) {
      throw new ConflictError('Chỉ có thể gửi phê duyệt các yêu cầu ở trạng thái nháp hoặc đã bị từ chối');
    }

    // Kiểm tra quyền: chỉ người tạo hoặc admin/director mới được gửi
    // Xử lý trường hợp requested_by có thể là null hoặc undefined
    if (!maintenance.requested_by) {
      console.error('❌ Maintenance request has no requested_by:', {
        maintenanceId: id,
        maintenance: {
          id: maintenance.id,
          status: maintenance.status,
          requested_by: maintenance.requested_by,
        },
      });
      throw new ForbiddenError('Yêu cầu này chưa có người tạo. Vui lòng liên hệ quản trị viên.');
    }

    // So sánh với kiểu number để đảm bảo chính xác
    const requestedById = Number(maintenance.requested_by);
    const userId = Number(requestedBy);

    console.log('🔍 submitForApproval - After conversion:', {
      requestedById,
      userId,
      areEqual: requestedById === userId,
      requestedByIdType: typeof requestedById,
      userIdType: typeof userId,
    });

    // Cho phép admin/director submit thay cho user
    const isOwner = requestedById === userId;
    const isAdminOrDirector = approverInfo?.role === 'admin';

    console.log('🔍 submitForApproval - Permission check:', {
      isOwner,
      isAdminOrDirector,
      approverRole: approverInfo?.role,
      willAllow: isOwner || isAdminOrDirector,
    });

    if (!isOwner && !isAdminOrDirector) {
      console.error('❌ Permission denied for submitForApproval:', {
        maintenanceId: id,
        maintenanceRequestedBy: maintenance.requested_by,
        requestedById,
        userId,
        requestedBy,
        approverRole: approverInfo?.role,
        isOwner,
        isAdminOrDirector,
        types: {
          maintenanceRequestedBy: typeof maintenance.requested_by,
          requestedBy: typeof requestedBy,
        },
      });
      throw new ForbiddenError(`Bạn chỉ có thể gửi phê duyệt yêu cầu của chính mình. Yêu cầu này được tạo bởi user ID: ${requestedById}, bạn là user ID: ${userId}`);
    }

    // Nếu resubmit sau khi bị từ chối, reset các trường approval
    const updateData: any = {
      status: 'pending',
      current_approval_level: 1,
    };

    // Reset approval fields nếu đang resubmit sau khi bị từ chối
    if (maintenance.status.startsWith('rejected')) {
      updateData.head_approved_by = null;
      updateData.head_approved_at = null;
      updateData.head_notes = null;
      updateData.admin_approved_by = null;
      updateData.admin_approved_at = null;
      updateData.admin_notes = null;
      updateData.director_approved_by = null;
      updateData.director_approved_at = null;
      updateData.director_notes = null;
      // Giữ lại rejection_reason để người dùng có thể xem lý do từ chối trước đó
      // Nhưng reset rejected_by và rejected_at vì đây là lần submit mới
      updateData.rejected_by = null;
      updateData.rejected_at = null;
    }

    console.log('🔧 submitForApproval - Updating maintenance:', {
      id,
      updateData,
      currentStatus: maintenance.status,
      requestType: maintenance.request_type,
    });

    try {
      await maintenance.update(updateData);
      console.log('✅ submitForApproval - Update successful');
    } catch (updateError: any) {
      console.error('❌ submitForApproval - Update failed:', {
        error: updateError.message,
        name: updateError.name,
        stack: updateError.stack,
        original: updateError.original,
        updateData,
      });
      throw updateError;
    }

    // IMPORTANT (Business rule):
    // - Submit chỉ chuyển trạng thái YÊU CẦU sang pending để trưởng đơn vị duyệt.
    // - KHÔNG cập nhật trạng thái tài sản ở bước này.
    if (maintenance.asset_id) {
      console.log('ℹ️ submitForApproval - Asset status unchanged (will update at department head approval).', {
        assetId: maintenance.asset_id,
      });
    }

    return this.getMaintenanceById(id);
  }

  async deleteMaintenance(id: number, user?: ApproverInfo): Promise<void> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    // Only allow deletion of draft or new requests (chưa gửi phê duyệt)
    // Một khi đã gửi phê duyệt thì không được xóa nữa
    if (!['draft', 'new'].includes(maintenance.status)) {
      throw new ConflictError('Chỉ có thể xóa các yêu cầu ở trạng thái nháp (chưa gửi phê duyệt). Yêu cầu đã gửi phê duyệt không thể xóa.');
    }

    // Check permission: only the creator can delete their own request
    // Admin và Director không thấy được draft/new nên không cần quyền xóa
    if (user) {
      const isCreator = maintenance.requested_by === user.id;

      if (!isCreator) {
        throw new ForbiddenError('Bạn chỉ có thể xóa yêu cầu do chính mình tạo');
      }
    } else {
      throw new ForbiddenError('Bạn không có quyền xóa yêu cầu này');
    }

    await maintenance.destroy();
  }

  /** Một cấp phê duyệt cho mua sắm/sửa chữa: chỉ Admin. */
  async processApproval(
    id: number,
    approver: ApproverInfo,
    input: ApprovalInput
  ): Promise<MaintenanceRequest> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    const { decision, reason, notes, assigned_to, estimated_cost } = input;
    const now = new Date();

    // Validate rejection reason is provided
    if (decision === 'rejected' && !reason) {
      throw new ConflictError('Lý do từ chối là bắt buộc');
    }

    if (approver.role !== 'admin') {
      throw new ForbiddenError('Chỉ Admin có quyền phê duyệt đề nghị mua sắm/sửa chữa');
    }

    // Hỗ trợ cả trạng thái mới và trạng thái phân cấp cũ còn tồn đọng.
    const approvableStatuses = ['new', 'pending', 'approved_by_head', 'approved_by_admin'];
    if (!approvableStatuses.includes(maintenance.status) && maintenance.status !== 'repair_completed') {
      throw new ConflictError('Yêu cầu này không ở trạng thái chờ Admin duyệt');
    }

    let newStatus: MaintenanceStatus;
    let approvalLevel: number;
    const approverRole: 'admin' = 'admin';
    const updateData: any = {};

    if (maintenance.status === 'repair_completed') {
      approvalLevel = 2;
      if (decision === 'approved') {
        newStatus = 'repair_approved';
        updateData.admin_approved_by = approver.id;
        updateData.admin_approved_at = now;
        updateData.admin_notes = notes;
        updateData.completion_date = now;
      } else {
        newStatus = 'in_progress';
        updateData.rejection_reason = reason;
        updateData.rejected_by = approver.id;
        updateData.rejected_at = now;
      }
    } else {
      approvalLevel = 1;
      if (decision === 'approved') {
        newStatus = maintenance.request_type === 'repair' ? 'in_progress' : 'approved_by_admin';
        updateData.admin_approved_by = approver.id;
        updateData.admin_approved_at = now;
        updateData.admin_notes = notes;
        updateData.approved_by = approver.id;
        updateData.current_approval_level = 1;
        if (maintenance.request_type === 'repair') updateData.start_date = now;
        if (assigned_to) updateData.assigned_to = assigned_to;
        if (estimated_cost !== undefined && estimated_cost !== null) updateData.estimated_cost = estimated_cost;
      } else {
        newStatus = 'rejected_by_admin';
        updateData.rejection_reason = reason;
        updateData.rejected_by = approver.id;
        updateData.rejected_at = now;
      }
    }

    // Update status
    updateData.status = newStatus;

    // Save approval to audit trail
    await RequestApproval.create({
      entity_type: 'maintenance_request',
      entity_id: id,
      approver_id: approver.id,
      approver_role: approverRole,
      approver_name: approver.fullname,
      approver_email: approver.email,
      decision: decision,
      reason: reason,
      notes: notes,
      approval_level: approvalLevel,
      decided_at: now,
    });

    // Update maintenance request
    await maintenance.update(updateData);

    // Handle asset status updates for repair requests
    if (maintenance.request_type === 'repair' && maintenance.asset_id) {
      const asset = await Asset.findByPk(maintenance.asset_id);
      if (!asset) {
        console.warn('⚠️ Asset not found for repair request:', maintenance.asset_id);
      } else {
        // Handle rejection: chuyển tài sản sang chờ thanh lý (pending_disposal)
        // và tự động tạo hồ sơ thanh lý
        if (decision === 'rejected') {
          try {
            const oldStatus = asset.status;
            await asset.update({ status: 'pending_disposal' });
            console.log('✅ Asset status changed to pending_disposal after repair rejection');

            // Tạo hồ sơ thanh lý nếu chưa có
            if (!(maintenance as any).linked_disposal_case_id) {
              try {
                const year = new Date().getFullYear();
                const roleLabel = 'Quản trị viên';

                const disposalCase = await AssetDisposalCase.create({
                  code: 'TEMP',
                  source_type: 'maintenance',
                  source_maintenance_request_id: id,
                  disposal_type: 'liquidation',
                  origin_department_id: maintenance.department_id ?? null,
                  status: 'pending',
                  notes: `Tự động tạo từ đề nghị sửa chữa #${id} bị ${roleLabel} từ chối. Lý do: ${reason || 'Không rõ'}`,
                  created_by: approver.id,
                } as any);

                const code = `TL-${year}-${String(disposalCase.id).padStart(6, '0')}`;
                await disposalCase.update({ code });

                await AssetDisposalItem.create({
                  disposal_case_id: disposalCase.id,
                  asset_id: maintenance.asset_id,
                  moved_at: new Date(),
                  moved_by: approver.id,
                  reason: `Đề nghị sửa chữa #${id} bị từ chối bởi ${roleLabel}`,
                } as any);

                await AuditLog.create({
                  user_id: approver.id,
                  action: 'update',
                  table_name: 'assets',
                  record_id: maintenance.asset_id,
                  old_value: { status: oldStatus },
                  new_value: { status: 'pending_disposal' },
                } as any);

                await maintenance.update({ linked_disposal_case_id: disposalCase.id } as any);
                console.log('✅ Auto-created disposal case:', code);
              } catch (disposalError: any) {
                console.warn('⚠️ Could not auto-create disposal case:', disposalError.message);
              }
            }
          } catch (error: any) {
            console.error('❌ Error updating asset status after rejection:', error);
          }
        }

        // Admin duyệt sửa chữa: đánh dấu tài sản đang chờ/đang sửa chữa.
        if (decision === 'approved' && maintenance.request_type === 'repair' && newStatus === 'in_progress') {
            try {
              await asset.update({ status: 'pending_repair' });
              console.log('✅ Asset status updated to pending_repair after department head approval');
            } catch (statusError: any) {
              console.error('❌ Error updating asset status to pending_repair:', statusError);
            }
          }
        // Note: kiểm tra 30% nguyên giá được thực hiện TRƯỚC khi ghi DB (pre-check ở trên).
        // Nếu director đã xác nhận (force=true), tiếp tục phê duyệt bình thường.
        
        // Handle completion: when repair is completed and approved by admin, set asset back to active
        // Cost check was already done at director approval level, so just complete the repair
        if (newStatus === 'repair_approved') {
          // Update maintenance request to completed
          await maintenance.update({ status: 'completed' });
          
          // Set asset back to active (repair was successful)
          try {
            await asset.update({ status: 'active' });
            console.log('✅ Asset status updated to active after successful repair completion');
          } catch (error: any) {
            console.error('❌ Error updating asset status to active:', error);
          }
        }
      }
    }

    return this.getMaintenanceById(id);
  }

  /**
   * Get all maintenance requests filtered by user role and department
   */
  async getMaintenanceRequestsByRole(
    query: any,
    user: ApproverInfo
  ): Promise<PaginationResult<MaintenanceRequest>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    // Apply role-based filtering
    if (user.role === 'admin') {
      // Admin quản lý tập trung và phải thấy cả nháp, mới, chờ duyệt và đã hoàn tất.
      if (query.status) where.status = query.status;
    } else if (user.role === 'director') {
      // Giữ nhánh đọc tương thích cho dữ liệu/tài khoản cũ; route hiện tại đã khóa admin-only.
      if (query.status) where.status = query.status;
    } else if (user.role === 'department_head') {
      // Department head can see requests from their department
      where.department_id = user.department_id;
    } else if (user.role === 'staff') {
      // Staff can only see their own requests
      where.requested_by = user.id;
    }

    // Apply additional filters from query
    if (query.request_type) {
      where.request_type = query.request_type;
    }

    // Status filter for legacy non-admin role access.
    if (query.status && user.role !== 'admin' && user.role !== 'director') {
      where.status = query.status;
    }

    if (query.urgency) {
      where.urgency = query.urgency;
    }

    // Filter by department - Admin and Director can filter by any department
    if (query.department_id && (user.role === 'admin' || user.role === 'director')) {
      where.department_id = query.department_id;
    }

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status', 'serial_number', 'year_in_use', 'unit', 'quantity', 'asset_condition', 'current_value', 'purchase_price', 'residual_value', 'category', 'category_code'],
          required: false,
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'headApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'adminApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'directorApprover',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: User,
          as: 'rejector',
          attributes: ['id', 'username', 'fullname'],
          required: false,
        },
        {
          model: MaintenanceDamageImage,
          as: 'damageImages',
          required: false,
          order: [['order_number', 'ASC']],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  /**
   * Get approval history (audit trail) for a maintenance request
   */
  async getApprovalHistory(id: number): Promise<RequestApproval[]> {
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    const approvals = await RequestApproval.findAll({
      where: {
        entity_type: 'maintenance_request',
        entity_id: id,
      },
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname', 'email', 'role'],
        },
      ],
      order: [['decided_at', 'ASC']],
    });

    return approvals;
  }

  /**
   * Get pending requests count by approval level
   */
  async getPendingCountByLevel(): Promise<{ level1: number; level2: number; level3: number }> {
    const level1 = await MaintenanceRequest.count({
      where: { status: ['new', 'pending'] },
    });

    const level2 = await MaintenanceRequest.count({
      where: { status: 'approved_by_head' },
    });

    const level3 = await MaintenanceRequest.count({
      where: { status: 'approved_by_admin' },
    });

    return { level1, level2, level3 };
  }
}

export default new MaintenanceService();
