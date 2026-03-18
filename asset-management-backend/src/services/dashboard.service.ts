import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { Asset, AssetCategory, Department, Procurement, StockIssue, StockItem, StockReceipt, AuditLog, User, MaintenanceRequest, AssetTransfer, AssetDisposalCase, InventoryRound } from '../models';
import type { AssetStatus } from '../models/Asset';
import { getPaginationParams, buildPaginationResult, getOffset } from '../utils/pagination';

const parseIntSafe = (v: any): number | null => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : null;
};

const buildScopeWhere = (scope: any, dateField: string = 'created_at', deptField?: string): any => {
  const range = String(scope?.range ?? '').toLowerCase();
  const days = parseIntSafe(scope?.days);
  const year = parseIntSafe(scope?.year);
  const departmentId = parseIntSafe(scope?.departmentId);

  const where: any = {};

  if (range === 'currentyear') {
    const y = new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    where[dateField] = { [Op.between]: [start, end] };
  } else if (year && year >= 1990 && year <= 2100) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    where[dateField] = { [Op.between]: [start, end] };
  } else {
    const d = range === 'last30days' ? 30 : days && days > 0 ? days : 30;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - d);
    where[dateField] = { [Op.between]: [start, end] };
  }

  if (departmentId && deptField) {
    where[deptField] = departmentId;
  }

  return where;
};

class DashboardService {
  async getOverviewStats(query: any): Promise<any> {
    const departmentId = parseIntSafe(query?.departmentId);
    
    const whereProc = buildScopeWhere(query, 'created_at', 'receiving_department_id');
    const whereReceipt = buildScopeWhere(query, 'receipt_date'); // Kho trung tâm
    const whereIssue = buildScopeWhere(query, 'issue_date'); // Toàn bộ kho
    const whereAssetsActive: any = {
      status: { [Op.notIn]: ['disposed', 'lost'] },
    };
    if (departmentId) {
      whereAssetsActive.current_department_id = departmentId;
    }

    const whereAssetNew = buildScopeWhere(query, 'created_at', 'current_department_id');
    
    const whereMaint = { 
      status: { [Op.in]: ['pending', 'approved_by_head', 'approved_by_admin'] } 
    } as any;
    if (departmentId) {
      whereMaint.department_id = departmentId;
    }

    const [assetsTotal, assetsInScope, procurementsInScope, stockReceiptsInScope, stockIssuesInScope, maintenancePending, transfersInScope, disposalInScope, assetDisposalPending] = await Promise.all([
      Asset.count({ where: whereAssetsActive }),
      Asset.count({ where: whereAssetNew }),
      Procurement.count({ where: whereProc }),
      StockReceipt.count({ where: whereReceipt }),
      StockIssue.count({ where: whereIssue }),
      MaintenanceRequest.count({ where: whereMaint }),
      AssetTransfer.count({ 
        where: {
          ...buildScopeWhere(query, 'created_at'),
          ...(departmentId ? { [Op.or]: [{ from_department_id: departmentId }, { to_department_id: departmentId }] } : {})
        } 
      }),
      AssetDisposalCase.count({ where: buildScopeWhere(query, 'created_at', 'origin_department_id') }),
      Asset.count({ 
        where: { 
          status: 'pending_disposal',
          ...(departmentId ? { current_department_id: departmentId } : {})
        } 
      }),
    ]);

    return {
      assets_total: assetsTotal,
      assets_new: assetsInScope,
      procurements: procurementsInScope,
      stock_receipts: stockReceiptsInScope,
      stock_issues: stockIssuesInScope,
      maintenance_pending: maintenancePending,
      transfers_total: transfersInScope,
      disposal_total: disposalInScope,
      disposal_pending: assetDisposalPending,
    };
  }

  async getAssetStatusStats(query: any): Promise<any[]> {
    const whereAsset = buildScopeWhere(query, 'created_at', 'current_department_id');

    const rows = await Asset.findAll({
      attributes: [[col('status'), 'status'], [fn('COUNT', col('id')), 'count']],
      where: whereAsset,
      group: [col('status')],
      raw: true,
    });

    const byStatus: Record<string, number> = {};
    for (const r of rows as any[]) {
      byStatus[String(r.status)] = Number(r.count || 0);
    }

    const allStatuses: AssetStatus[] = [
      'active',
      'inactive',
      'damaged',
      'lost',
      'disposed',
      'pending_disposal',
      // Tạm ẩn trạng thái 'pending_repair' khỏi thống kê dashboard theo yêu cầu
      // 'pending_repair',
    ];

    return allStatuses.map((s) => ({
      status: s,
      count: byStatus[s] ?? 0,
      filter: { status: s },
    }));
  }

  async getDepartmentStats(query: any): Promise<any[]> {
    const requestedLimit = query?.limit ? parseInt(String(query.limit), 10) : null;
    const useLimit = requestedLimit && requestedLimit > 0 && requestedLimit < 100;
    const rootId = parseIntSafe(query?.rootDepartmentId);

    const sqlQuery = `
      WITH RECURSIVE dept_tree AS (
        SELECT id, name, parent_department_id, id AS root_id
        FROM departments
        WHERE ${rootId ? 'id = :rootId' : 'parent_department_id IS NULL'}

        UNION ALL

        SELECT d.id, d.name, d.parent_department_id, dt.root_id
        FROM departments d
        JOIN dept_tree dt ON d.parent_department_id = dt.id
      ),
      asset_counts AS (
        SELECT dt.root_id AS department_id, COUNT(a.id) AS asset_count
        FROM dept_tree dt
        LEFT JOIN assets a ON a.current_department_id = dt.id
        GROUP BY dt.root_id
      )
      SELECT d.id AS department_id, d.name AS department_name, COALESCE(ac.asset_count, 0) AS asset_count
      FROM departments d
      LEFT JOIN asset_counts ac ON ac.department_id = d.id
      WHERE ${rootId ? 'd.id = :rootId' : 'd.parent_department_id IS NULL'}
      ORDER BY asset_count DESC
      ${useLimit ? 'LIMIT :limit' : ''}
    `;

    const rows = await sequelize.query(
      sqlQuery,
      {
        type: QueryTypes.SELECT,
        replacements: {
          ...(useLimit ? { limit: requestedLimit } : {}),
          ...(rootId ? { rootId } : {})
        },
      }
    );

    return (rows as any[]).map((r) => ({
      department_id: Number(r.department_id),
      department_name: r.department_name,
      asset_count: Number(r.asset_count || 0),
      // Khi click xem danh sách: lấy cả tài sản của phòng con
      filter: { current_department_id: Number(r.department_id), include_children: true },
    }));
  }

  async getProcurementStats(query: any): Promise<any> {
    const whereProc = buildScopeWhere(query, 'created_at', 'receiving_department_id');

    const rows = await Procurement.findAll({
      attributes: [[col('status'), 'status'], [fn('COUNT', col('id')), 'count']],
      where: whereProc,
      group: [col('status')],
      raw: true,
    });

    const byStatus: Record<string, number> = {};
    for (const r of rows as any[]) {
      byStatus[String(r.status)] = Number(r.count || 0);
    }

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return { total, by_status: byStatus };
  }

  async getStockStats(query: any): Promise<any> {
    const whereReceipt = buildScopeWhere(query, 'receipt_date'); // Kho trung tâm
    const whereIssue = buildScopeWhere(query, 'issue_date');

    const [itemsTotal, receipts, issues] = await Promise.all([
      StockItem.count(),
      StockReceipt.count({ where: whereReceipt }),
      StockIssue.count({ where: whereIssue }),
    ]);

    return {
      items_total: itemsTotal,
      receipts,
      issues,
    };
  }

  async getCategoryBreakdown(query: any): Promise<any[]> {
    const limit = query?.limit ? Math.max(1, Math.min(50, parseInt(String(query.limit), 10))) : 8;
    const whereAsset = buildScopeWhere(query, 'created_at', 'current_department_id');

    const rows = await Asset.findAll({
      attributes: [
        'category_code',
        [col('assetCategory.id'), 'category_id'],
        [col('assetCategory.name'), 'category_name'],
        [fn('COUNT', col('Asset.id')), 'count'],
      ],
      where: whereAsset,
      include: [
        {
          model: AssetCategory,
          as: 'assetCategory',
          attributes: [],
          required: false,
        },
      ],
      group: ['Asset.category_code', col('assetCategory.id'), col('assetCategory.name')],
      order: [[literal('count'), 'DESC']],
      limit,
      raw: true,
    });

    return (rows as any[]).map((r) => ({
      category_id: r.category_id ? Number(r.category_id) : null,
      code: r.category_code || '',
      category: r.category_name || r.category_code || 'Khác',
      count: Number(r.count || 0),
      filter: r.category_code ? { category_code: r.category_code } : {},
    }));
  }

  async getAuditLogs(query: any): Promise<any> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    // Thời gian theo range/days/year giống các thống kê khác
    Object.assign(where, buildScopeWhere(query, 'created_at'));

    if (query.action) {
      where.action = String(query.action);
    }

    if (query.user_id) {
      const uid = parseIntSafe(query.user_id);
      if (uid) {
        where.user_id = uid;
      }
    }

    if (query.table_name) {
      where.table_name = String(query.table_name);
    }

    const deptId = parseIntSafe(query.departmentId);
    const { rows, count } = await AuditLog.findAndCountAll({
      where: {
        ...where,
        ...(deptId ? { '$user.department_id$': deptId } : {})
      },
      limit,
      offset,
      order: [[sortBy || 'created_at', sortOrder || 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullname', 'role', 'department_id'],
          required: !!deptId,
        },
      ],
    });

    const data = rows.map((row: any) => {
      const r = row.toJSON();
      return {
        id: r.id,
        action: r.action,
        table_name: r.table_name,
        record_id: r.record_id,
        ip_address: r.ip_address ? r.ip_address.replace(/^::ffff:/, '') : null,
        user_agent: r.user_agent,
        created_at: r.created_at,
        user: r.user
          ? {
              id: r.user.id,
              username: r.user.username,
              fullname: r.user.fullname,
              role: r.user.role,
            }
          : null,
      };
    });

    // Resolve record names for known tables
    const assetIds = data.filter((d) => d.table_name === 'assets' && d.record_id).map((d) => Number(d.record_id));
    const deptIds = data.filter((d) => d.table_name === 'departments' && d.record_id).map((d) => Number(d.record_id));
    const userIds = data.filter((d) => d.table_name === 'users' && d.record_id).map((d) => Number(d.record_id));
    const procIds = data.filter((d) => d.table_name === 'procurements' && d.record_id).map((d) => Number(d.record_id));
    const maintIds = data.filter((d) => d.table_name === 'maintenance_requests' && d.record_id).map((d) => Number(d.record_id));
    const invIds = data.filter((d) => d.table_name === 'inventory_rounds' && d.record_id).map((d) => Number(d.record_id));

    const [assets, depts, users, procs, maints, invs] = await Promise.all([
      assetIds.length ? Asset.findAll({ where: { id: assetIds }, attributes: ['id', 'name'], raw: true }) : [],
      deptIds.length ? Department.findAll({ where: { id: deptIds }, attributes: ['id', 'name'], raw: true }) : [],
      userIds.length ? User.findAll({ where: { id: userIds }, attributes: ['id', 'fullname', 'username'], raw: true }) : [],
      procIds.length ? Procurement.findAll({ where: { id: procIds }, attributes: ['id', 'title'], raw: true }) : [],
      maintIds.length ? MaintenanceRequest.findAll({ where: { id: maintIds }, attributes: ['id', 'title'], raw: true }) : [],
      invIds.length ? InventoryRound.findAll({ where: { id: invIds }, attributes: ['id', 'round_name'], raw: true }) : [],
    ]);

    const nameMap: Record<string, Record<number, string>> = {
      assets: Object.fromEntries((assets as any[]).map((a) => [a.id, a.name])),
      departments: Object.fromEntries((depts as any[]).map((d) => [d.id, d.name])),
      users: Object.fromEntries((users as any[]).map((u) => [u.id, u.fullname || u.username])),
      procurements: Object.fromEntries((procs as any[]).map((p) => [p.id, p.title])),
      maintenance_requests: Object.fromEntries((maints as any[]).map((m) => [m.id, m.title])),
      inventory_rounds: Object.fromEntries((invs as any[]).map((i) => [i.id, i.round_name])),
    };

    const enriched = data.map((d) => ({
      ...d,
      record_name: d.record_id && nameMap[d.table_name]
        ? (nameMap[d.table_name][Number(d.record_id)] || null)
        : null,
    }));

    return buildPaginationResult(enriched, count, page, limit);
  }

  async getMaintenanceStats(query: any): Promise<any[]> {
    const where = buildScopeWhere(query, 'created_at', 'department_id');

    const rows = await MaintenanceRequest.findAll({
      attributes: [
        'status',
        'request_type',
        [fn('COUNT', col('id')), 'count'],
      ],
      where,
      group: ['status', 'request_type'],
      order: [[literal('count'), 'DESC']],
      raw: true,
    });

    const statusLabels: Record<string, string> = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved_by_head: 'Trưởng Đơn vị đã duyệt',
      approved_by_admin: 'Quản trị viên đã duyệt',
      approved_by_director: 'Giám hiệu đã duyệt',
      in_progress: 'Đang thực hiện',
      repair_completed: 'Chờ xác nhận',
      repair_approved: 'Đã xác nhận',
      completed: 'Hoàn thành',
      rejected: 'Từ chối',
      rejected_by_head: 'Trưởng Đơn vị từ chối',
      rejected_by_admin: 'Quản trị viên từ chối',
      rejected_by_director: 'Giám hiệu từ chối',
    };

    return (rows as any[]).map((r) => ({
      status: String(r.status),
      request_type: String(r.request_type),
      count: Number(r.count || 0),
      label: statusLabels[String(r.status)] || String(r.status),
    }));
  }

  async getHierarchyStats(query: any): Promise<any[]> {
    try {
      const departmentId = parseIntSafe(query?.departmentId);
      const rootId = parseIntSafe(query?.rootDepartmentId);
      const range = String(query?.range ?? '').toLowerCase();
      const days = parseIntSafe(query?.days);
      const year = parseIntSafe(query?.year);

      let dateCondition = '';
      if (range === 'currentyear' || (year && year >= 1990 && year <= 2100)) {
        const y = year && year >= 1990 && year <= 2100 ? year! : new Date().getFullYear();
        const start = new Date(y, 0, 1).toISOString();
        const end = new Date(y, 11, 31, 23, 59, 59).toISOString();
        dateCondition = `AND a.created_at BETWEEN '${start}' AND '${end}'`;
      } else {
        const d = range === 'last30days' ? 30 : days && days > 0 ? days : 30;
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - d);
        dateCondition = `AND a.created_at BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
      }

      const replacements: Record<string, unknown> = {};
      let deptCondition = '';
      if (departmentId || rootId) {
        const targetDeptId = departmentId || rootId;
        const childDepts = await Department.findAll({
          where: { parent_department_id: targetDeptId },
          attributes: ['id'],
        });
        const deptIds = [targetDeptId, ...childDepts.map((d: any) => d.id)];
        deptIds.forEach((id, i) => { replacements[`deptId${i}`] = id; });
        deptCondition = `AND a.current_department_id IN (${deptIds.map((_, i) => `:deptId${i}`).join(', ')})`;
      }

      const sql = `
      SELECT
        a.current_department_id,
        a.category_code,
        TRIM(COALESCE(a.category, '')) AS asset_category_field,
        d.name AS department_name,
        ac.name AS category_table_name,
        COUNT(a.id)::int AS count
      FROM assets a
      LEFT JOIN departments d ON d.id = a.current_department_id
      LEFT JOIN asset_categories ac ON ac.id = a.category_id
      WHERE 1=1 ${dateCondition} ${deptCondition}
      GROUP BY a.current_department_id, a.category_code, a.category, d.name, ac.name
    `;

      const rows = (await sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements,
      })) as any[];

      return rows.map((r) => {
        const nameFromAsset = r.asset_category_field;
        const nameFromTable = r.category_table_name;
        const code = r.category_code;
        let finalName = nameFromAsset || nameFromTable || code || 'Khác';
        finalName = String(finalName).trim();
        return {
          department_id: r.current_department_id,
          department_name: r.department_name || 'Chưa phân phối',
          category_code: code,
          category_name: finalName,
          count: Number(r.count || 0),
        };
      });
    } catch (err) {
      console.error('[getHierarchyStats]', err);
      return [];
    }
  }
}

export default new DashboardService();
