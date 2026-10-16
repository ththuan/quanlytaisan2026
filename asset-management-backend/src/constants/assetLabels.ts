/**
 * Nhãn trạng thái / tình trạng tài sản dùng chung cho backend.
 * Nguồn duy nhất — tránh lặp lại ở scan.controller, public.controller...
 * (Đồng bộ với asset-management-frontend/src/constants/statusConfig.ts)
 */

export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Đang sử dụng',
  inactive: 'Ngừng sử dụng',
  damaged: 'Hỏng',
  lost: 'Mất',
  disposed: 'Đã thanh lý',
  pending_disposal: 'Chờ thanh lý',
  pending_repair: 'Chờ sửa chữa',
};

export const ASSET_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#94a3b8',
  damaged: '#ef4444',
  lost: '#ef4444',
  disposed: '#6b7280',
  pending_disposal: '#f59e0b',
  pending_repair: '#f59e0b',
};

export const ASSET_CONDITION_LABELS: Record<string, string> = {
  good: 'Tốt',
  fair: 'Trung bình',
  poor: 'Kém',
  usable: 'Còn dùng được',
  needs_repair: 'Cần sửa chữa',
  damaged: 'Hỏng',
  disposed: 'Đã thanh lý',
};
