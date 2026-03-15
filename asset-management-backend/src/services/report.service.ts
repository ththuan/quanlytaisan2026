import { AnnualReport, Department, User, Asset } from '../models';
import { NotFoundError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import { Op } from 'sequelize';
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

class ReportService {
  async getAllReports(query: any): Promise<PaginationResult<AnnualReport>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.year) {
      where.year = query.year;
    }

    if (query.department_id) {
      where.department_id = query.department_id;
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

    if (report.status !== 'submitted') {
      throw new ConflictError('Only submitted reports can be approved');
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

    if (report.status !== 'submitted') {
      throw new ConflictError('Only submitted reports can be rejected');
    }

    await report.update({
      status: 'rejected',
      approved_by: userId,
      notes: notes || report.notes,
    });

    return this.getReportById(id);
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
