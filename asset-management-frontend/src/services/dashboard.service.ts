import api from './api';

export interface DashboardParams {
  range?: 'last30days' | 'currentYear';
  days?: number;
  year?: number;
  limit?: number;
}

export interface AuditLogQuery extends DashboardParams {
  page?: number;
  user_id?: number | string;
  action?: string;
  table_name?: string;
}

// 1. Overview Stats
export const getOverviewStats = (params?: DashboardParams) => {
  return api.get('/dashboard/overview', { params });
};

// 2. Asset Status Stats
export const getAssetStatusStats = (params?: DashboardParams) => {
  return api.get('/dashboard/asset-status', { params });
};

// 3. Department Stats (no time filter)
export const getDepartmentStats = (params?: DashboardParams) => {
  return api.get('/dashboard/departments', { params });
};

// 4. Procurement Stats
export const getProcurementStats = (params?: DashboardParams) => {
  return api.get('/dashboard/procurements', { params });
};

// 5. Stock Stats
export const getStockStats = (params?: DashboardParams) => {
  return api.get('/dashboard/stock', { params });
};

// 6. Category Breakdown
export const getCategoryBreakdown = (params?: DashboardParams) => {
  return api.get('/dashboard/categories', { params });
};

// 7. Audit logs for monitoring
export const getAuditLogs = (params?: AuditLogQuery) => {
  return api.get('/dashboard/audit-logs', { params });
};

// 8. Maintenance stats breakdown
export const getMaintenanceStats = (params?: DashboardParams) => {
  return api.get('/dashboard/maintenance', { params });
};

// 9. Hierarchy stats for network graph
export const getHierarchyStats = (params?: DashboardParams) => {
  return api.get('/dashboard/hierarchy', { params });
};
