/**
 * Chuẩn hóa màu và nhãn trạng thái cho toàn hệ thống.
 * Quy ước: draft/nháp = info, pending/chờ duyệt = warning,
 * approved/đã duyệt = success, rejected/từ chối = danger, completed/hoàn thành = success.
 */

export type StatusTagType = 'success' | 'warning' | 'danger' | 'info' | 'primary' | '';

export type StatusNamespace =
  | 'asset'
  | 'transfer'
  | 'maintenance'
  | 'inventory'
  | 'inventoryReport'
  | 'report'
  | 'disposal'
  | 'procurement';

const STATUS_TYPE_MAP: Record<StatusNamespace, Record<string, StatusTagType>> = {
  asset: {
    active: 'success',
    inactive: 'info',
    damaged: 'warning',
    lost: 'danger',
    disposed: 'info',
    pending_repair: 'warning',
    pending_disposal: 'warning',
  },
  transfer: {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success',
    cancelled: 'info',
  },
  maintenance: {
    new: 'info',
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    approved_by_head: 'primary',
    approved_by_admin: 'success',
    approved_by_director: 'success',
    in_progress: 'warning',
    done: 'success',
    completed: 'success',
    rejected: 'danger',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
    repair_completed: 'primary',
    repair_approved: 'success',
  },
  inventory: {
    not_started: 'info',
    in_progress: 'warning',
    completed: 'success',
    awaiting_approval: 'warning',
  },
  inventoryReport: {
    draft: 'info',
    pending: 'warning',
    approved_by_head: 'primary',
    approved_by_admin: 'success',
    completed: 'success',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
  },
  report: {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
  },
  disposal: {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info',
  },
  procurement: {
    draft: 'info',
    fulfilled: 'success',
    cancelled: 'info',
  },
};

export function getStatusTagType(namespace: StatusNamespace, status: string): StatusTagType {
  const map = STATUS_TYPE_MAP[namespace];
  if (!map) return '';
  return map[status] ?? 'info';
}

/** i18n key prefix per namespace for status label, e.g. transfers.status.pending */
export function getStatusLabelKey(namespace: StatusNamespace, status: string): string {
  const prefixes: Record<StatusNamespace, string> = {
    asset: 'assets.status',
    transfer: 'transfers.status',
    maintenance: 'maintenance.status',
    inventory: 'inventory.roundStatus',
    inventoryReport: 'inventory.reportStatus',
    report: 'reports.status',
    disposal: 'assetDisposals.status',
    procurement: 'procurement.status',
  };
  const prefix = prefixes[namespace];
  return prefix ? `${prefix}.${status}` : '';
}
