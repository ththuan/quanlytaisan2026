export type MaintenanceTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  new: 'Chờ phê duyệt',
  pending: 'Chờ phê duyệt',
  approved: 'Đã duyệt',
  approved_by_head: 'Trưởng đơn vị đã duyệt',
  approved_by_admin: 'Quản trị viên đã duyệt',
  approved_by_director: 'Giám hiệu đã duyệt',
  in_progress: 'Đang thực hiện sửa chữa',
  repair_completed: 'Đã sửa xong - Chờ xác nhận',
  repair_approved: 'Đã xác nhận hoàn thành',
  done: 'Hoàn thành',
  completed: 'Hoàn thành',
  rejected: 'Bị từ chối',
  rejected_by_head: 'Trưởng đơn vị từ chối',
  rejected_by_admin: 'Quản trị viên từ chối',
  rejected_by_director: 'Giám hiệu từ chối',
  rejected_due_to_high_cost: 'Từ chối do chi phí cao',
  cancelled: 'Đã hủy',
};

export const MAINTENANCE_STATUS_TYPES: Record<string, MaintenanceTagType> = {
  draft: 'info',
  new: 'info',
  pending: 'warning',
  approved: 'primary',
  approved_by_head: 'primary',
  approved_by_admin: 'primary',
  approved_by_director: 'success',
  in_progress: 'warning',
  repair_completed: 'primary',
  repair_approved: 'success',
  done: 'success',
  completed: 'success',
  rejected: 'danger',
  rejected_by_head: 'danger',
  rejected_by_admin: 'danger',
  rejected_by_director: 'danger',
  rejected_due_to_high_cost: 'danger',
  cancelled: 'info',
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Đang sử dụng',
  inactive: 'Không sử dụng',
  damaged: 'Hư hỏng',
  pending_repair: 'Chờ sửa chữa',
  pending_disposal: 'Chờ thanh lý',
  disposed: 'Đã thanh lý',
  lost: 'Mất',
};

export const ASSET_STATUS_TYPES: Record<string, MaintenanceTagType> = {
  active: 'success',
  inactive: 'info',
  damaged: 'danger',
  pending_repair: 'warning',
  pending_disposal: 'danger',
  disposed: 'info',
  lost: 'danger',
};

export const URGENCY_LABELS: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

export const URGENCY_TYPES: Record<string, MaintenanceTagType> = {
  low: 'info',
  normal: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
};

export const maintenanceStatusText = (status?: string | null): string =>
  status ? MAINTENANCE_STATUS_LABELS[status] ?? 'Không xác định' : '-';

export const maintenanceStatusType = (status?: string | null): MaintenanceTagType =>
  (status ? MAINTENANCE_STATUS_TYPES[status] : undefined) ?? 'info';

export const assetStatusText = (status?: string | null): string =>
  status ? ASSET_STATUS_LABELS[status] ?? 'Không xác định' : '-';

export const assetStatusType = (status?: string | null): MaintenanceTagType =>
  (status ? ASSET_STATUS_TYPES[status] : undefined) ?? 'info';

export const urgencyText = (urgency?: string | null): string =>
  urgency ? URGENCY_LABELS[urgency] ?? 'Bình thường' : '-';

export const urgencyType = (urgency?: string | null): MaintenanceTagType =>
  (urgency ? URGENCY_TYPES[urgency] : undefined) ?? 'info';
