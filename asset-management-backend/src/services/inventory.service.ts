/**
 * Inventory Service
 * Xử lý logic kiểm kê hàng năm theo quy trình 2 tầng duyệt
 * Tầng 1: Trưởng đơn vị duyệt
 * Tầng 2: Admin tổng hợp và duyệt
 */

import { Op } from 'sequelize';
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
import assetDisposalService from './assetDisposal.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errorHandler';
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

class InventoryService {
  async createInventoryRound(data: CreateInventoryRoundInput, createdBy: number): Promise<InventoryRound> {
    // Only count root (parent) departments — child reports roll up to parent unit
    const totalDepartments = await Department.count({ where: { parent_department_id: null } });

    const round = await InventoryRound.create({
      ...data,
      total_departments: totalDepartments,
      created_by: createdBy,
      status: 'in_progress',
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
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullname', 'email'] }],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getInventoryRoundById(id: number): Promise<any> {
    // Ensure accurate round statistics
    await this.updateRoundStatistics(id);

    const round = await InventoryRound.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'email'] },
        {
          model: InventoryReport,
          as: 'reports',
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'fullname'] },
          ],
        },
      ],
    });

    if (!round) {
      throw new NotFoundError('Inventory round not found');
    }

    // Determine unsubmitted / uncompleted root departments
    const parentDepts = await Department.findAll({
      where: { parent_department_id: null },
      attributes: ['id', 'name'],
    });

    const reports = (round as any).reports || [];
    const completedDepts = [];
    const inProgressDepts = []; // Has some draft or pending reports

    for (const parent of parentDepts) {
      const parentId = (parent as any).id;
      const children = await Department.findAll({
        where: { parent_department_id: parentId },
        attributes: ['id'],
      });
      const allDeptIds = [parentId, ...children.map((c: any) => c.id)];
      const unitReports = reports.filter((r: any) => allDeptIds.includes(r.department_id));
      
      if (unitReports.length === 0) {
        // No reports at all
        continue;
      }

      // Check if all are completed or approved_by_head
      const allDone = unitReports.every((r: any) => ['approved_by_head', 'completed'].includes(r.status));
      if (allDone) {
        completedDepts.push(parentId);
      } else {
        inProgressDepts.push(parentId);
      }
    }

    const unsubmitted_departments = parentDepts.filter(
      (dept: any) => !completedDepts.includes(dept.id) && !inProgressDepts.includes(dept.id)
    );
    const incomplete_departments = parentDepts.filter(
      (dept: any) => inProgressDepts.includes(dept.id)
    );

    return {
      ...round.toJSON(),
      unsubmitted_departments,
      incomplete_departments
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
    const reports = await InventoryReport.findAll({
      where: { inventory_round_id: roundId },
    });

    // Count completed parent units: a parent unit is done when all its submitted
    // child dept reports are at approved_by_head or completed.
    const parentDepts = await Department.findAll({
      where: { parent_department_id: null },
      attributes: ['id'],
    });

    let completedDepts = 0;
    for (const parent of parentDepts) {
      const parentId = (parent as any).id;
      const children = await Department.findAll({
        where: { parent_department_id: parentId },
        attributes: ['id'],
      });
      const allDeptIds = [parentId, ...children.map((c: any) => c.id)];
      const unitReports = reports.filter((r: any) => allDeptIds.includes(r.department_id));
      if (
        unitReports.length > 0 &&
        unitReports.every((r: any) => ['approved_by_head', 'completed'].includes(r.status))
      ) {
        completedDepts++;
      }
    }

    const pending = reports.filter((r) => ['pending', 'draft'].includes(r.status)).length;
    const rejected = reports.filter((r) => ['rejected_by_head', 'rejected_by_admin'].includes(r.status)).length;

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

    await InventoryRound.update(
      { status: 'completed' },
      { where: { id: roundId } }
    );

    return round.reload();
  }

  async extendInventoryRound(roundId: number, endDate: string, adminId: number): Promise<any> {
    const round = await InventoryRound.findByPk(roundId);
    if (!round) {
      throw new NotFoundError('Inventory round not found');
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
    const round = await InventoryRound.findByPk(roundId);
    if (!round) {
      throw new NotFoundError('Inventory round not found');
    }
    if (round.status !== 'in_progress') {
      throw new ValidationError('Inventory round is not active');
    }

    const reportCode = `INV-${round.round_year}-${departmentId}-${userId}-${Date.now()}`;

    const report = await InventoryReport.create({
      report_code: reportCode,
      inventory_round_id: roundId,
      created_by: userId,
      department_id: departmentId,
      status: 'draft',
    });

    return this.getInventoryReportById(report.id);
  }

  async getInventoryReportById(id: number): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(id, {
      include: [
        { model: InventoryRound, as: 'inventory_round' },
        { model: Department, as: 'department' },
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'email'] },
        { model: User, as: 'headApprover', attributes: ['id', 'fullname', 'email'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'fullname', 'email'] },
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
          check_status:
            detail.quantity_discrepancy < 0
              ? 'missing'
              : detail.quantity_discrepancy > 0
                ? 'surplus'
                : detail.suggest_repair
                  ? 'needs_repair'
                  : detail.condition === 'poor' || detail.suggest_disposal
                    ? 'damaged'
                    : 'matched',
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
      // Department head sees own dept + all child departments under them
      const childDepts = await Department.findAll({
        where: { parent_department_id: departmentId },
        attributes: ['id'],
      });
      const childIds = childDepts.map((d: any) => d.id);
      where.department_id = childIds.length > 0
        ? { [Op.in]: [departmentId, ...childIds] }
        : departmentId;
    } else {
      where.created_by = userId;
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
        {
          model: InventoryReportDetail,
          as: 'details',
          include: [
            {
              model: Asset,
              as: 'asset',
              attributes: ['id', 'asset_code', 'name', 'purchase_price', 'current_value'],
            },
          ],
        },
      ],
    });

    const reportsWithStats = rows.map((report: any) => {
      const reportData = report.toJSON();
      const details = reportData.details || [];

      let matched_assets = 0;
      let missing_assets = 0;
      let damaged_assets = 0;
      let needs_repair_assets = 0;
      let total_original_value = 0;
      let total_current_value = 0;

      details.forEach((detail: any) => {
        if (detail.quantity_discrepancy < 0) {
          missing_assets++;
        } else if (detail.quantity_discrepancy > 0) {
          matched_assets++;
        } else if (detail.suggest_repair) {
          needs_repair_assets++;
        } else if (detail.condition === 'poor' || detail.suggest_disposal) {
          damaged_assets++;
        } else {
          matched_assets++;
        }

        if (detail.asset) {
          const actualQty = detail.actual_quantity || 0;
          total_original_value += (detail.asset.purchase_price || 0) * actualQty;
          total_current_value += (detail.asset.current_value || 0) * actualQty;
        }
      });

      return {
        ...reportData,
        total_assets: details.length,
        matched_assets,
        missing_assets,
        damaged_assets,
        needs_repair_assets,
        total_original_value,
        total_current_value,
        details: undefined,
      };
    });

    return buildPaginationResult(reportsWithStats, count, page, limit);
  }

  async addInventoryDetail(
    reportId: number,
    assetId: number,
    data: {
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
    }
  ): Promise<InventoryReportDetail> {
    const report = await InventoryReport.findByPk(reportId);
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only add details to draft reports or rejected reports that need resubmission');
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const nonScannableUnits = ['m2', 'm²', 'ha', 'km2', 'km²', 'cm2', 'cm²'];
    const isAreaAsset = asset.unit && nonScannableUnits.includes(asset.unit.toLowerCase().trim());

    let assignedQuantity = data.assigned_quantity;
    if (assignedQuantity === undefined || assignedQuantity === null) {
      assignedQuantity = isAreaAsset ? (asset.quantity || 1) : 1;
    }

    const discrepancy = data.actual_quantity - assignedQuantity;

    const conditionValue = data.condition || data.asset_condition || 'good';
    const condition = mapAssetConditionToCondition(conditionValue);
    const originalAssetCondition = data.asset_condition || conditionValue;

    const isPendingDisposal = (asset as any).status === 'pending_disposal';
    
    // NGUYÊN TẮC: Không thể vừa sửa chữa vừa thanh lý
    // - needs_repair: Tài sản CÒN SỬA ĐƯỢC → suggest_repair = true, suggest_disposal = false
    // - damaged: Tài sản HỎNG NẶNG, SỬA KHÔNG ĐƯỢC → suggest_disposal = true, suggest_repair = false
    let suggestDisposal = false;
    let suggestRepair = false;
    
    if (data.suggest_disposal === true || isPendingDisposal) {
      // Đã xác định thanh lý → KHÔNG thể sửa chữa
      suggestDisposal = true;
      suggestRepair = false;
    } else if (data.suggest_repair === true || originalAssetCondition === 'needs_repair') {
      // Đã xác định sửa chữa → KHÔNG thể thanh lý
      suggestRepair = true;
      suggestDisposal = false;
    } else if (originalAssetCondition === 'damaged') {
      // Hỏng nặng → thanh lý
      suggestDisposal = true;
      suggestRepair = false;
    }

    const detail = await InventoryReportDetail.create({
      inventory_report_id: reportId,
      asset_id: assetId,
      assigned_quantity: assignedQuantity,
      actual_quantity: data.actual_quantity,
      quantity_discrepancy: discrepancy,
      condition: isPendingDisposal && !data.condition ? 'poor' : condition,
      original_asset_condition: isPendingDisposal && !data.asset_condition ? 'damaged' : originalAssetCondition,
      suggest_disposal: suggestDisposal,
      suggest_repair: suggestRepair,
      disposal_reason: data.disposal_reason || (isPendingDisposal ? 'Chi phí sửa chữa vượt quá giá trị tài sản' : undefined),
      notes: data.notes,
    });

    await this.updateReportSummary(reportId);

    const detailData = detail.toJSON();
    return {
      ...detailData,
      asset_condition: detailData.original_asset_condition || mapConditionToAssetCondition(detailData.condition),
      check_status: 'matched',
      actual_value: null,
    } as any;
  }

  async updateInventoryDetail(
    detailId: number,
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
    }>
  ): Promise<InventoryReportDetail> {
    const detail = await InventoryReportDetail.findByPk(detailId, {
      include: [{ model: InventoryReport, as: 'inventory_report' }],
    });

    if (!detail) {
      throw new NotFoundError('Detail not found');
    }

    const report = await InventoryReport.findByPk(detail.inventory_report_id);
    if (report && report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only update details of draft reports or rejected reports that need resubmission');
    }

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

    if (data.actual_quantity !== undefined) {
      updateData.quantity_discrepancy = data.actual_quantity - detail.assigned_quantity;
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

    const detailData = detail.toJSON();
    return {
      ...detailData,
      asset_condition: detailData.original_asset_condition || mapConditionToAssetCondition(detailData.condition),
      check_status: 'matched',
      actual_value: null,
    } as any;
  }

  async updateReportSummary(reportId: number): Promise<void> {
    const details = await InventoryReportDetail.findAll({
      where: { inventory_report_id: reportId },
      include: [{ model: InventoryReport, as: 'inventory_report', attributes: ['id', 'department_id'] }],
    });

    const totalAssigned = details.reduce((sum, d) => sum + d.assigned_quantity, 0);
    const totalActual = details.reduce((sum, d) => sum + d.actual_quantity, 0);
    const totalDiscrepancy = details.reduce((sum, d) => sum + Math.abs(d.quantity_discrepancy), 0);
    const totalDisposal = details.filter((d) => d.suggest_disposal).length;

    await InventoryReport.update(
      {
        total_assigned_quantity: totalAssigned,
        total_actual_quantity: totalActual,
        total_discrepancy: totalDiscrepancy,
        total_disposal_suggestions: totalDisposal,
      },
      { where: { id: reportId } }
    );
  }

  async submitInventoryReport(reportId: number, userId: number): Promise<InventoryReport> {
    const report = await InventoryReport.findByPk(reportId);
    if (!report) {
      throw new NotFoundError('Inventory report not found');
    }
    if (report.created_by !== userId) {
      throw new ForbiddenError('You can only submit your own report');
    }

    if (report.status !== 'draft' && report.status !== 'rejected_by_head' && report.status !== 'rejected_by_admin') {
      throw new ValidationError('Can only submit draft reports or resubmit rejected reports');
    }

    await report.update({
      status: 'pending',
      submitted_at: new Date(),
      rejection_reason: null,
    });

    await this.updateRoundStatistics(report.inventory_round_id);

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
      if (approverDepartmentId) {
        const isOwnDept = report.department_id === approverDepartmentId;
        if (!isOwnDept) {
          const reportDept = await Department.findByPk(report.department_id, {
            attributes: ['id', 'parent_department_id'],
          });
          const isParentHead = reportDept && (reportDept as any).parent_department_id === approverDepartmentId;
          if (!isParentHead) {
            throw new ForbiddenError('Bạn không có quyền duyệt báo cáo của đơn vị này');
          }
        }
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
      if (report.status !== 'approved_by_head') {
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

    return this.getInventoryReportById(reportId);
  }

  async updateAssetsFromInventory(
    reportId: number,
    approvedBy?: number,
    transaction?: any,
    repairApprovedAssetIds: number[] = []
  ): Promise<void> {
    const details = await InventoryReportDetail.findAll({
      where: { inventory_report_id: reportId },
      transaction,
      include: [{ model: InventoryReport, as: 'inventory_report', attributes: ['id', 'department_id'] }],
    });

    let disposalCaseId: number | null = null;
    if (approvedBy) {
      const hasDisposal = details.some((d: any) => d.suggest_disposal);
      const hasRepairRejected = details.some(
        (d: any) => d.suggest_repair && !repairApprovedAssetIds.includes(d.asset_id)
      );
      if (hasDisposal || hasRepairRejected) {
        const disposalCase = await assetDisposalService.ensureDisposalCaseFromInventoryReport(reportId, approvedBy, transaction);
        disposalCaseId = (disposalCase as any).id;
      }
    }

    for (const detail of details) {
      const updateData: any = {
        last_inventory_date: new Date(),
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
        updateData.current_department_id = null;

        if (approvedBy && disposalCaseId) {
          await assetDisposalService.addItemFromInventoryDetail(
            disposalCaseId,
            detail,
            approvedBy,
            ((detail as any).inventory_report?.department_id as any) ?? null,
            transaction
          );
        }
      } else if (detail.suggest_repair) {
        const approvedForRepair = repairApprovedAssetIds.includes((detail as any).asset_id);
        if (approvedForRepair) {
          updateData.status = 'pending_repair';
          updateData.asset_condition = 'needs_repair';
        } else {
          updateData.status = 'pending_disposal';
          updateData.asset_condition = 'damaged';
          updateData.current_department_id = null;
          if (approvedBy && disposalCaseId) {
            await assetDisposalService.addItemFromInventoryDetail(
              disposalCaseId,
              detail,
              approvedBy,
              ((detail as any).inventory_report?.department_id as any) ?? null,
              transaction
            );
          }
        }
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

      const asset = await Asset.findByPk((detail as any).asset_id, { transaction });
      if (!asset) continue;

      const oldValue = {
        status: (asset as any).status,
        current_department_id: (asset as any).current_department_id,
      };

      try {
        await asset.update(updateData, { transaction });
      } catch (error: any) {
        if (error.message?.includes('enum_assets_status') && updateData.status === 'pending_repair') {
          updateData.status = 'inactive';
          await asset.update(updateData, { transaction });
        } else {
          throw error;
        }
      }

      if (approvedBy && detail.suggest_disposal) {
        await AuditLog.create(
          {
            user_id: approvedBy,
            action: 'approve',
            table_name: 'assets',
            record_id: (asset as any).id,
            old_value: oldValue,
            new_value: { status: (asset as any).status, current_department_id: (asset as any).current_department_id },
          } as any,
          { transaction }
        );
      }
    }
  }

  async getAssetsForInventory(departmentId: number, query: any) {
    const requestedLimit = query.limit ? parseInt(query.limit) : 10000;
    const { page, limit } = getPaginationParams({ ...query, limit: requestedLimit });
    const offset = getOffset(page, limit);

    const where: any = {
      current_department_id: departmentId,
      status: { [Op.in]: ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'] },
    };

    const { count, rows } = await Asset.findAndCountAll({
      where,
      limit,
      offset,
      order: [['asset_code', 'ASC']],
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
        'location',
        'description',
      ],
    });

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

    if (role === 'department_head') {
      // Show pending reports for own dept + all child depts
      const deptIds: number[] = departmentId ? [departmentId] : [];
      if (departmentId) {
        const childDepts = await Department.findAll({
          where: { parent_department_id: departmentId },
          attributes: ['id'],
        });
        childDepts.forEach((d: any) => deptIds.push(d.id));
      }
      where = {
        department_id: deptIds.length > 1 ? { [Op.in]: deptIds } : (deptIds[0] ?? departmentId),
        status: 'pending',
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

  async findAssetByCode(assetCodeOrQR: string, departmentId: number) {
    let asset;

    try {
      const qrData = JSON.parse(assetCodeOrQR);
      if (qrData.asset_code) {
        asset = await Asset.findOne({
          where: {
            asset_code: qrData.asset_code,
            current_department_id: departmentId,
            status: { [Op.in]: ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'] },
          },
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
            'location',
            'description',
            'qr_code',
            'qr_code_image',
          ],
        });
      }
    } catch {
      asset = await Asset.findOne({
        where: {
          asset_code: assetCodeOrQR,
          current_department_id: departmentId,
          status: { [Op.in]: ['active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair'] },
        },
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
          'location',
          'description',
          'qr_code',
          'qr_code_image',
        ],
      });
    }

    if (!asset) {
      throw new NotFoundError('Không tìm thấy tài sản với mã này trong phòng ban của bạn');
    }

    if (asset.quantity !== 1) {
      await asset.update({ quantity: 1 });
      asset.quantity = 1;
    }

    const assetData = asset.toJSON();
    return {
      ...assetData,
      original_value: (assetData as any).purchase_price || null,
    };
  }
}

export default new InventoryService();
