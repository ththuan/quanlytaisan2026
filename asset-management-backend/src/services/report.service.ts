import {
  AnnualReport,
  Department,
  User,
  Asset,
  AssetTransfer,
  MaintenanceRequest,
  InventoryReport,
  AssetDisposalCase,
  Procurement,
} from '../models';
import { NotFoundError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import { Op, fn, col, ModelStatic, WhereOptions } from 'sequelize';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export interface CreateReportInput {
  department_id: number;
  year: number;
  notes?: string;
}

export interface UpdateReportInput {
  total_assets?: number;
  active_assets?: number;
  damaged_assets?: number;
  lost_assets?: number;
  total_value?: number;
  notes?: string;
}

type ReportViewer = { role: string; department_id?: number | null };

class ReportService {
  async getAllReports(query: any, viewer?: ReportViewer): Promise<PaginationResult<AnnualReport>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    const role = viewer?.role || '';
    if (role === 'department_head' || role === 'staff') {
      if (viewer?.department_id != null) {
        where.department_id = viewer.department_id;
      }
    } else if (role === 'admin' || role === 'director') {
      const qDept = parseInt(String(query.department_id ?? ''), 10);
      if (Number.isFinite(qDept) && qDept > 0) {
        where.department_id = qDept;
      }
    } else {
      const qDept = parseInt(String(query.department_id ?? ''), 10);
      if (Number.isFinite(qDept) && qDept > 0) {
        where.department_id = qDept;
      }
    }

    const st = String(query.status ?? '').trim();
    if (['draft', 'submitted', 'approved', 'rejected'].includes(st)) {
      where.status = st;
    }

    const yr = parseInt(String(query.year ?? ''), 10);
    if (Number.isFinite(yr) && yr >= 1990 && yr <= 2100) {
      where.year = yr;
    }

    const { count, rows } = await AnnualReport.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getReportById(id: number): Promise<AnnualReport> {
    const report = await AnnualReport.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
      ],
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return report;
  }

  /** Bản ghi báo cáo + tổng hợp đa module theo phòng ban & năm (cho màn chi tiết). */
  async getReportDetailPayload(id: number): Promise<Record<string, unknown>> {
    const report = await this.getReportById(id);
    const plain = report.get({ plain: true }) as unknown as Record<string, unknown>;
    const year_summary = await this.buildDepartmentYearSummary(report.department_id, report.year);
    return { ...plain, year_summary };
  }

  private calendarYearRange(year: number): { start: Date; end: Date } {
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  private assetBaseWhereEndOfYear(departmentId: number, year: number) {
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    return {
      current_department_id: departmentId,
      [Op.or]: [{ purchase_date: { [Op.lte]: endDate } }, { purchase_date: null }],
    };
  }

  private async countByGroup(
    Model: ModelStatic<any>,
    where: WhereOptions<any>,
    field: string
  ): Promise<Record<string, number>> {
    const rows = await Model.findAll({
      attributes: [[fn('COUNT', col('id')), 'cnt'], field],
      where,
      group: [field],
      subQuery: false,
      raw: true,
    });
    const out: Record<string, number> = {};
    for (const r of rows as { cnt: string; [k: string]: unknown }[]) {
      const key = r[field] == null ? '—' : String(r[field]);
      out[key] = parseInt(String(r.cnt), 10) || 0;
    }
    return out;
  }

  /**
   * Tổng hợp hoạt động liên quan đơn vị trong năm báo cáo:
   * - Ảnh chụp tài sản (theo cùng logic báo cáo, mọi trạng thái).
   * - Phát sinh trong năm dương lịch: điều chuyển, đề nghị mua/sửa, phiếu tăng tài sản, thanh lý, kiểm kê, tài sản mới/ghi nhận.
   */
  async buildDepartmentYearSummary(departmentId: number, year: number) {
    const { start, end } = this.calendarYearRange(year);
    const yearCreatedWhere = { [Op.between]: [start, end] };
    const baseAsset = this.assetBaseWhereEndOfYear(departmentId, year);

    const assetStatuses = [
      'active',
      'inactive',
      'damaged',
      'lost',
      'disposed',
      'pending_disposal',
      'pending_repair',
    ] as const;
    const by_status: Record<string, number> = {};
    for (const st of assetStatuses) {
      by_status[st] = await Asset.count({ where: { ...baseAsset, status: st } });
    }

    const total_in_scope = await Asset.count({ where: baseAsset });
    const assetsForValue = await Asset.findAll({
      where: baseAsset,
      attributes: ['current_value'],
    });
    const total_value_vnd = assetsForValue.reduce((sum, a) => {
      return sum + (parseFloat(a.current_value?.toString() || '0') || 0);
    }, 0);

    const transferWhere = {
      created_at: yearCreatedWhere,
      [Op.or]: [{ from_department_id: departmentId }, { to_department_id: departmentId }],
    };
    const transfers_total = await AssetTransfer.count({ where: transferWhere });
    const transfers_from = await AssetTransfer.count({
      where: { created_at: yearCreatedWhere, from_department_id: departmentId },
    });
    const transfers_to = await AssetTransfer.count({
      where: { created_at: yearCreatedWhere, to_department_id: departmentId },
    });
    const transfers_by_status = await this.countByGroup(AssetTransfer, transferWhere, 'status');

    const maintWhere = { department_id: departmentId, created_at: yearCreatedWhere };
    const maintenance_total = await MaintenanceRequest.count({ where: maintWhere });
    const maintenance_repair = await MaintenanceRequest.count({
      where: { ...maintWhere, request_type: 'repair' },
    });
    const maintenance_procurement = await MaintenanceRequest.count({
      where: { ...maintWhere, request_type: 'procurement' },
    });
    const maintenance_by_status = await this.countByGroup(MaintenanceRequest, maintWhere, 'status');

    const procWhere = { receiving_department_id: departmentId, created_at: yearCreatedWhere };
    const procurement_total = await Procurement.count({ where: procWhere });
    const procurement_by_status = await this.countByGroup(Procurement, procWhere, 'status');

    const dispWhere = { origin_department_id: departmentId, created_at: yearCreatedWhere };
    const disposal_total = await AssetDisposalCase.count({ where: dispWhere });
    const disposal_by_status = await this.countByGroup(AssetDisposalCase, dispWhere, 'status');
    const disposal_by_type = await this.countByGroup(AssetDisposalCase, dispWhere, 'disposal_type');

    const invWhere = { department_id: departmentId, created_at: yearCreatedWhere };
    const inventory_count = await InventoryReport.count({ where: invWhere });
    const inventory_sum_disc_raw = await InventoryReport.sum('total_discrepancy', { where: invWhere });
    const inventory_sum_disp_raw = await InventoryReport.sum('total_disposal_suggestions', { where: invWhere });
    const inventory_by_status = await this.countByGroup(InventoryReport, invWhere, 'status');

    const new_assets_in_year = await Asset.count({
      where: {
        current_department_id: departmentId,
        [Op.or]: [
          { created_at: yearCreatedWhere },
          { purchase_date: { [Op.between]: [start, end] } },
        ],
      },
    });

    return {
      year,
      department_id: departmentId,
      assets_at_year_end: {
        total_in_scope,
        total_value_vnd,
        by_status,
      },
      activity_in_calendar_year: {
        transfers: {
          total_involving_department: transfers_total,
          outgoing_from_department: transfers_from,
          incoming_to_department: transfers_to,
          by_status: transfers_by_status,
        },
        maintenance_requests: {
          total: maintenance_total,
          repair: maintenance_repair,
          procurement: maintenance_procurement,
          by_status: maintenance_by_status,
        },
        procurements: {
          total: procurement_total,
          by_status: procurement_by_status,
        },
        disposal_cases: {
          total: disposal_total,
          by_status: disposal_by_status,
          by_disposal_type: disposal_by_type,
        },
        inventory_reports: {
          count: inventory_count,
          sum_total_discrepancy: Number(inventory_sum_disc_raw) || 0,
          sum_disposal_suggestions: Number(inventory_sum_disp_raw) || 0,
          by_status: inventory_by_status,
        },
        new_or_purchased_assets_recorded: new_assets_in_year,
      },
    };
  }

  async createReport(data: CreateReportInput, _userId: number): Promise<AnnualReport> {
    const department = await Department.findByPk(data.department_id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check if report already exists for this department and year
    const existingReport = await AnnualReport.findOne({
      where: {
        department_id: data.department_id,
        year: data.year,
      },
    });

    if (existingReport) {
      throw new ConflictError('Report for this department and year already exists');
    }

    // Auto-calculate statistics
    const stats = await this.calculateDepartmentStats(data.department_id, data.year);

    const report = await AnnualReport.create({
      department_id: data.department_id,
      year: data.year,
      total_assets: stats.total_assets,
      active_assets: stats.active_assets,
      damaged_assets: stats.damaged_assets,
      lost_assets: stats.lost_assets,
      total_value: stats.total_value,
      notes: data.notes,
      status: 'draft',
      created_by: _userId,
    });

    return this.getReportById(report.id);
  }

  async updateReport(id: number, data: UpdateReportInput): Promise<AnnualReport> {
    const report = await AnnualReport.findByPk(id);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status === 'approved') {
      throw new ConflictError('Cannot update approved reports');
    }

    await report.update(data);
    return this.getReportById(id);
  }

  async submitReport(id: number, userId: number): Promise<AnnualReport> {
    const report = await AnnualReport.findByPk(id);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status !== 'draft') {
      throw new ConflictError('Only draft reports can be submitted');
    }

    await report.update({
      status: 'submitted',
      submitted_by: userId,
      submitted_date: new Date(),
    });

    return this.getReportById(id);
  }

  async approveReport(id: number, userId: number): Promise<AnnualReport> {
    const report = await AnnualReport.findByPk(id);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status === 'approved') {
      return this.getReportById(id);
    }

    if (report.status !== 'submitted') {
      if (report.status === 'draft') {
        throw new ConflictError(
          'Báo cáo đang ở trạng thái nháp. Cần gửi duyệt (nộp) trước khi phê duyệt.'
        );
      }
      throw new ConflictError('Chỉ có thể phê duyệt báo cáo đang ở trạng thái "Chờ duyệt" (đã nộp).');
    }

    await report.update({
      status: 'approved',
      approved_by: userId,
      approved_date: new Date(),
    });

    return this.getReportById(id);
  }

  async rejectReport(id: number, userId: number, notes?: string): Promise<AnnualReport> {
    const report = await AnnualReport.findByPk(id);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status === 'rejected') {
      return this.getReportById(id);
    }

    if (report.status !== 'submitted') {
      throw new ConflictError('Chỉ có thể từ chối báo cáo đang ở trạng thái "Chờ duyệt" (đã nộp).');
    }

    await report.update({
      status: 'rejected',
      approved_by: userId,
      notes: notes || report.notes,
    });

    return this.getReportById(id);
  }

  async bulkApproveReports(ids: number[], userId: number): Promise<{
    approved: number[];
    skipped: number[];
    failed: { id: number; reason: string }[];
  }> {
    const approved: number[] = [];
    const skipped: number[] = [];
    const failed: { id: number; reason: string }[] = [];

    const uniqueIds = [...new Set(ids.map((n) => parseInt(String(n), 10)).filter((n) => Number.isFinite(n) && n > 0))];

    for (const id of uniqueIds) {
      const report = await AnnualReport.findByPk(id);
      if (!report) {
        failed.push({ id, reason: 'not_found' });
        continue;
      }
      if (report.status === 'approved') {
        skipped.push(id);
        continue;
      }
      if (report.status !== 'submitted') {
        failed.push({
          id,
          reason: report.status === 'draft' ? 'draft_need_submit' : `invalid_status_${report.status}`,
        });
        continue;
      }
      await report.update({
        status: 'approved',
        approved_by: userId,
        approved_date: new Date(),
      });
      approved.push(id);
    }

    return { approved, skipped, failed };
  }

  async deleteReport(id: number): Promise<void> {
    const report = await AnnualReport.findByPk(id);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status === 'approved') {
      throw new ConflictError('Cannot delete approved reports');
    }

    await report.destroy();
  }

  private async calculateDepartmentStats(departmentId: number, year: number) {
    // Tính tất cả tài sản thuộc phòng ban này tính đến cuối năm được chọn
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Điều kiện: tài sản thuộc phòng ban và được mua trước hoặc trong năm đó
    const baseWhere = {
      current_department_id: departmentId,
      [Op.or]: [
        { purchase_date: { [Op.lte]: endDate } },
        { purchase_date: null }, // Bao gồm cả tài sản không có ngày mua
      ],
    };

    // Count assets by status
    const [totalAssets, activeAssets, damagedAssets, lostAssets] = await Promise.all([
      Asset.count({
        where: baseWhere,
      }),
      Asset.count({
        where: {
          ...baseWhere,
          status: 'active',
        },
      }),
      Asset.count({
        where: {
          ...baseWhere,
          status: 'damaged',
        },
      }),
      Asset.count({
        where: {
          ...baseWhere,
          status: 'lost',
        },
      }),
    ]);

    // Calculate total value
    const assets = await Asset.findAll({
      where: baseWhere,
      attributes: ['current_value'],
    });

    const totalValue = assets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.current_value?.toString() || '0') || 0);
    }, 0);

    return {
      total_assets: totalAssets,
      active_assets: activeAssets,
      damaged_assets: damagedAssets,
      lost_assets: lostAssets,
      total_value: totalValue,
    };
  }

  async getStatistics(query: any) {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    const departmentId = query.department_id ? parseInt(query.department_id) : null;

    const where: any = {};
    if (departmentId) {
      where.current_department_id = departmentId;
    }

    const [
      totalAssets,
      activeAssets,
      inactiveAssets,
      damagedAssets,
      lostAssets,
      disposedAssets,
    ] = await Promise.all([
      Asset.count({ where }),
      Asset.count({ where: { ...where, status: 'active' } }),
      Asset.count({ where: { ...where, status: 'inactive' } }),
      Asset.count({ where: { ...where, status: 'damaged' } }),
      Asset.count({ where: { ...where, status: 'lost' } }),
      Asset.count({ where: { ...where, status: 'disposed' } }),
    ]);

    const assets = await Asset.findAll({
      where,
      attributes: ['current_value'],
    });

    const totalValue = assets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.current_value?.toString() || '0') || 0);
    }, 0);

    return {
      year,
      department_id: departmentId,
      total_assets: totalAssets,
      active_assets: activeAssets,
      inactive_assets: inactiveAssets,
      damaged_assets: damagedAssets,
      lost_assets: lostAssets,
      disposed_assets: disposedAssets,
      total_value: totalValue,
    };
  }

  /**
   * Báo cáo mua sắm/cấp phát theo năm (từ các đề nghị procurement đã fulfill)
   * GET /reports/procurement?year=2026&department_id=...
   */
  async getProcurementSummary(query: any) {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    const departmentId = query.department_id ? parseInt(query.department_id) : null;

    const rows = await sequelize.query(
      `
      SELECT
        COALESCE(m.receiving_department_id, m.department_id) AS department_id,
        d.name AS department_name,
        COUNT(*)::int AS total_requests,
        SUM(COALESCE(m.total_price, 0))::numeric AS total_amount,
        SUM(COALESCE(jsonb_array_length(COALESCE(m.created_asset_ids, '[]'::jsonb)), 0))::int AS total_created_assets
      FROM maintenance_requests m
      LEFT JOIN departments d ON d.id = COALESCE(m.receiving_department_id, m.department_id)
      WHERE m.request_type = 'procurement'
        AND m.procurement_fulfilled = TRUE
        AND COALESCE(m.procurement_year, EXTRACT(YEAR FROM m.fulfilled_at)::int) = :year
        ${departmentId ? 'AND COALESCE(m.receiving_department_id, m.department_id) = :departmentId' : ''}
      GROUP BY COALESCE(m.receiving_department_id, m.department_id), d.name
      ORDER BY total_amount DESC NULLS LAST
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          year,
          ...(departmentId ? { departmentId } : {}),
        },
      }
    );

    return {
      year,
      department_id: departmentId,
      data: rows,
    };
  }
}

export default new ReportService();
