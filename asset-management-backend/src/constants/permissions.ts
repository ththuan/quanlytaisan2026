export type PermissionScope = 'own' | 'department' | 'all';

export interface PermissionDefinition {
  code: string;
  module: string;
  moduleLabel: string;
  action: string;
  label: string;
  description?: string;
  scopes: PermissionScope[];
  adminOnly?: boolean;
}

const ALL_SCOPES: PermissionScope[] = ['own', 'department', 'all'];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    code: 'dashboard.view',
    module: 'dashboard',
    moduleLabel: 'Bảng điều khiển',
    action: 'view',
    label: 'Xem bảng điều khiển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.view',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'view',
    label: 'Xem tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.create',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'create',
    label: 'Tạo tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.update',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'update',
    label: 'Cập nhật tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.delete',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'delete',
    label: 'Xóa tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.import',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'import',
    label: 'Import Excel tài sản',
    scopes: ['all'],
  },
  {
    code: 'assets.export',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'export',
    label: 'Export Excel tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'assets.qr',
    module: 'assets',
    moduleLabel: 'Tài sản',
    action: 'qr',
    label: 'Tạo/in QR tài sản',
    scopes: ['all'],
  },
  {
    code: 'asset_categories.view',
    module: 'asset_categories',
    moduleLabel: 'Danh mục tài sản',
    action: 'view',
    label: 'Xem danh mục',
    scopes: ALL_SCOPES,
  },
  {
    code: 'asset_categories.create',
    module: 'asset_categories',
    moduleLabel: 'Danh mục tài sản',
    action: 'create',
    label: 'Tạo danh mục',
    scopes: ALL_SCOPES,
  },
  {
    code: 'asset_categories.update',
    module: 'asset_categories',
    moduleLabel: 'Danh mục tài sản',
    action: 'update',
    label: 'Cập nhật danh mục',
    scopes: ALL_SCOPES,
  },
  {
    code: 'asset_categories.delete',
    module: 'asset_categories',
    moduleLabel: 'Danh mục tài sản',
    action: 'delete',
    label: 'Xóa danh mục',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.view',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'view',
    label: 'Xem điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.create',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'create',
    label: 'Tạo đề nghị điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.update',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'update',
    label: 'Cập nhật điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.delete',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'delete',
    label: 'Xóa điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.approve',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'approve',
    label: 'Duyệt điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'transfers.print',
    module: 'transfers',
    moduleLabel: 'Điều chuyển',
    action: 'print',
    label: 'In biên bản điều chuyển',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.view',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'view',
    label: 'Xem kiểm kê',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.round.manage',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'round.manage',
    label: 'Tạo/hoàn tất đợt kiểm kê',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.count',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'count',
    label: 'Kiểm kê tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.submit',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'submit',
    label: 'Gửi báo cáo kiểm kê',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.approve',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'approve',
    label: 'Duyệt báo cáo kiểm kê',
    scopes: ALL_SCOPES,
  },
  {
    code: 'inventory.export',
    module: 'inventory',
    moduleLabel: 'Kiểm kê',
    action: 'export',
    label: 'Xuất báo cáo kiểm kê',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.view',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'view',
    label: 'Xem yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.create',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'create',
    label: 'Tạo yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.update',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'update',
    label: 'Cập nhật yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.delete',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'delete',
    label: 'Xóa yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.submit',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'submit',
    label: 'Gửi duyệt yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.approve',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'approve',
    label: 'Duyệt yêu cầu sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.execute',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'execute',
    label: 'Thực hiện/hoàn thành sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'maintenance.export',
    module: 'maintenance',
    moduleLabel: 'Sửa chữa',
    action: 'export',
    label: 'Xuất báo cáo sửa chữa',
    scopes: ALL_SCOPES,
  },
  {
    code: 'construction.view',
    module: 'construction',
    moduleLabel: 'Xây dựng',
    action: 'view',
    label: 'Xem công trình xây dựng',
    scopes: ALL_SCOPES,
  },
  {
    code: 'construction.create',
    module: 'construction',
    moduleLabel: 'Xây dựng',
    action: 'create',
    label: 'Tạo công trình xây dựng',
    scopes: ALL_SCOPES,
  },
  {
    code: 'construction.update',
    module: 'construction',
    moduleLabel: 'Xây dựng',
    action: 'update',
    label: 'Cập nhật công trình xây dựng',
    scopes: ALL_SCOPES,
  },
  {
    code: 'construction.delete',
    module: 'construction',
    moduleLabel: 'Xây dựng',
    action: 'delete',
    label: 'Xóa công trình xây dựng',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.view',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'view',
    label: 'Xem mua sắm/tăng tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.create',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'create',
    label: 'Tạo đề nghị mua sắm',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.update',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'update',
    label: 'Cập nhật đề nghị mua sắm',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.delete',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'delete',
    label: 'Xóa đề nghị mua sắm',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.approve',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'approve',
    label: 'Duyệt đề nghị mua sắm',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.fulfill',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'fulfill',
    label: 'Hoàn tất mua sắm/tạo tài sản',
    scopes: ALL_SCOPES,
  },
  {
    code: 'procurement.export',
    module: 'procurement',
    moduleLabel: 'Tăng tài sản',
    action: 'export',
    label: 'Xuất báo cáo mua sắm',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.view',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'view',
    label: 'Xem thanh lý/tiêu hủy',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.create',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'create',
    label: 'Tạo hồ sơ thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.update',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'update',
    label: 'Cập nhật hồ sơ thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.delete',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'delete',
    label: 'Xóa hồ sơ thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.approve',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'approve',
    label: 'Duyệt thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.complete',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'complete',
    label: 'Hoàn tất thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'disposal.print',
    module: 'disposal',
    moduleLabel: 'Thanh lý',
    action: 'print',
    label: 'In biên bản thanh lý',
    scopes: ALL_SCOPES,
  },
  {
    code: 'stock.view',
    module: 'stock',
    moduleLabel: 'Kho vật tư',
    action: 'view',
    label: 'Xem kho vật tư',
    scopes: ALL_SCOPES,
  },
  {
    code: 'stock.import',
    module: 'stock',
    moduleLabel: 'Kho vật tư',
    action: 'import',
    label: 'Nhập kho',
    scopes: ALL_SCOPES,
  },
  {
    code: 'stock.export',
    module: 'stock',
    moduleLabel: 'Kho vật tư',
    action: 'export',
    label: 'Xuất kho',
    scopes: ALL_SCOPES,
  },
  {
    code: 'stock.adjust',
    module: 'stock',
    moduleLabel: 'Kho vật tư',
    action: 'adjust',
    label: 'Điều chỉnh tồn kho',
    scopes: ALL_SCOPES,
  },
  {
    code: 'norms.view',
    module: 'norms',
    moduleLabel: 'Định mức',
    action: 'view',
    label: 'Xem định mức',
    scopes: ALL_SCOPES,
  },
  {
    code: 'norms.create',
    module: 'norms',
    moduleLabel: 'Định mức',
    action: 'create',
    label: 'Tạo định mức',
    scopes: ALL_SCOPES,
  },
  {
    code: 'norms.update',
    module: 'norms',
    moduleLabel: 'Định mức',
    action: 'update',
    label: 'Cập nhật định mức',
    scopes: ALL_SCOPES,
  },
  {
    code: 'norms.delete',
    module: 'norms',
    moduleLabel: 'Định mức',
    action: 'delete',
    label: 'Xóa định mức',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.view',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'view',
    label: 'Xem báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.export',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'export',
    label: 'Xuất báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.create',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'create',
    label: 'Tạo báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.update',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'update',
    label: 'Cập nhật/gửi báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.approve',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'approve',
    label: 'Duyệt/từ chối báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'reports.delete',
    module: 'reports',
    moduleLabel: 'Báo cáo',
    action: 'delete',
    label: 'Xóa báo cáo',
    scopes: ALL_SCOPES,
  },
  {
    code: 'departments.view',
    module: 'departments',
    moduleLabel: 'Đơn vị',
    action: 'view',
    label: 'Xem đơn vị',
    scopes: ['all'],
  },
  {
    code: 'departments.create',
    module: 'departments',
    moduleLabel: 'Đơn vị',
    action: 'create',
    label: 'Tạo đơn vị',
    scopes: ['all'],
  },
  {
    code: 'departments.update',
    module: 'departments',
    moduleLabel: 'Đơn vị',
    action: 'update',
    label: 'Cập nhật đơn vị',
    scopes: ['all'],
  },
  {
    code: 'departments.delete',
    module: 'departments',
    moduleLabel: 'Đơn vị',
    action: 'delete',
    label: 'Xóa đơn vị',
    scopes: ['all'],
  },
  {
    code: 'users.view',
    module: 'users',
    moduleLabel: 'Người dùng',
    action: 'view',
    label: 'Xem người dùng',
    scopes: ['all'],
  },
  {
    code: 'users.create',
    module: 'users',
    moduleLabel: 'Người dùng',
    action: 'create',
    label: 'Tạo người dùng',
    scopes: ['all'],
  },
  {
    code: 'users.update',
    module: 'users',
    moduleLabel: 'Người dùng',
    action: 'update',
    label: 'Cập nhật người dùng',
    scopes: ['all'],
  },
  {
    code: 'users.delete',
    module: 'users',
    moduleLabel: 'Người dùng',
    action: 'delete',
    label: 'Xóa người dùng',
    scopes: ['all'],
  },
  {
    code: 'users.reset',
    module: 'users',
    moduleLabel: 'Người dùng',
    action: 'reset',
    label: 'Đặt lại mật khẩu',
    scopes: ['all'],
  },
  {
    code: 'audit.view_all',
    module: 'audit',
    moduleLabel: 'Nhật ký hoạt động',
    action: 'view_all',
    label: 'Xem toàn bộ nhật ký',
    scopes: ['all'],
    adminOnly: true,
  },
  {
    code: 'audit.view_department',
    module: 'audit',
    moduleLabel: 'Nhật ký hoạt động',
    action: 'view_department',
    label: 'Xem nhật ký theo đơn vị',
    scopes: ['department'],
    adminOnly: true,
  },
  {
    code: 'system.manage',
    module: 'system',
    moduleLabel: 'Quản trị hệ thống',
    action: 'manage',
    label: 'Quản trị hệ thống',
    scopes: ['all'],
    adminOnly: true,
  },
];

export const PERMISSION_MAP = new Map(
  PERMISSION_DEFINITIONS.map((permission) => [permission.code, permission]),
);

export const PERMISSION_CODES = PERMISSION_DEFINITIONS.map((permission) => permission.code);

export const PERMISSION_MODULES = PERMISSION_DEFINITIONS.reduce<
  Array<{ module: string; moduleLabel: string; permissions: PermissionDefinition[] }>
>((modules, permission) => {
  let group = modules.find((entry) => entry.module === permission.module);
  if (!group) {
    group = {
      module: permission.module,
      moduleLabel: permission.moduleLabel,
      permissions: [],
    };
    modules.push(group);
  }
  group.permissions.push(permission);
  return modules;
}, []);

export interface PermissionGrantInput {
  code: string;
  scope: PermissionScope;
}

export type SystemRole = 'admin' | 'director' | 'department_head' | 'staff';

export interface RoleDefaultPermissions {
  role: SystemRole;
  label: string;
  fullAccess: boolean;
  permissions: PermissionGrantInput[];
}

/**
 * Quyền mặc định theo vai trò.
 *
 * Đây là bộ quyền được áp dụng tự động cho người dùng chưa được admin cấu hình
 * quyền riêng (permissions_customized = false). Admin chỉ cần mở "Tùy chỉnh"
 * khi muốn cấp thêm/bớt so với mặc định của vai trò.
 */
export const ROLE_DEFAULT_PERMISSIONS: RoleDefaultPermissions[] = [
  {
    role: 'admin',
    label: 'Quản trị viên',
    fullAccess: true,
    permissions: [],
  },
  {
    role: 'director',
    label: 'Giám hiệu',
    fullAccess: false,
    permissions: [
      { code: 'dashboard.view', scope: 'all' },
      { code: 'assets.view', scope: 'all' },
      { code: 'assets.export', scope: 'all' },
      { code: 'transfers.view', scope: 'all' },
      { code: 'transfers.approve', scope: 'all' },
      { code: 'inventory.view', scope: 'all' },
      { code: 'maintenance.view', scope: 'all' },
      { code: 'maintenance.approve', scope: 'all' },
      { code: 'reports.view', scope: 'all' },
      { code: 'reports.approve', scope: 'all' },
      { code: 'norms.view', scope: 'all' },
      { code: 'norms.update', scope: 'all' },
    ],
  },
  {
    role: 'department_head',
    label: 'Trưởng đơn vị',
    fullAccess: false,
    permissions: [
      { code: 'dashboard.view', scope: 'department' },
      { code: 'assets.view', scope: 'department' },
      { code: 'assets.export', scope: 'department' },
      { code: 'transfers.view', scope: 'department' },
      { code: 'transfers.create', scope: 'department' },
      { code: 'transfers.approve', scope: 'department' },
      { code: 'inventory.view', scope: 'department' },
      { code: 'inventory.count', scope: 'department' },
      { code: 'inventory.submit', scope: 'department' },
      { code: 'inventory.approve', scope: 'department' },
      { code: 'reports.view', scope: 'department' },
      { code: 'users.view', scope: 'all' },
    ],
  },
  {
    role: 'staff',
    label: 'Viên chức',
    fullAccess: false,
    permissions: [
      { code: 'dashboard.view', scope: 'own' },
      { code: 'assets.view', scope: 'department' },
      { code: 'assets.export', scope: 'department' },
      { code: 'transfers.view', scope: 'department' },
      { code: 'transfers.create', scope: 'department' },
      { code: 'inventory.view', scope: 'department' },
      { code: 'inventory.count', scope: 'department' },
      { code: 'inventory.submit', scope: 'department' },
      { code: 'reports.view', scope: 'department' },
    ],
  },
];

const ROLE_DEFAULT_MAP = new Map<SystemRole, RoleDefaultPermissions>(
  ROLE_DEFAULT_PERMISSIONS.map((entry) => [entry.role, entry]),
);

export const isSystemRole = (role: string): role is SystemRole =>
  ROLE_DEFAULT_MAP.has(role as SystemRole);

export const getRoleDefaultPermissions = (role: string): Map<string, PermissionScope> => {
  const defaults = new Map<string, PermissionScope>();
  if (role === 'admin') {
    PERMISSION_DEFINITIONS.forEach((definition) => {
      if (!definition.adminOnly) defaults.set(definition.code, 'all');
    });
    return defaults;
  }

  if (!isSystemRole(role)) return defaults;

  ROLE_DEFAULT_MAP.get(role)!.permissions.forEach((grant) => {
    const definition = PERMISSION_MAP.get(grant.code);
    if (!definition || definition.adminOnly) return;
    defaults.set(grant.code, normalizePermissionScope(grant.code, grant.scope));
  });
  return defaults;
};

export const PERMISSION_PRESETS: Array<{
  code: string;
  label: string;
  description: string;
  permissions: PermissionGrantInput[];
}> = [
  {
    code: 'repair_manager',
    label: 'Quản lý sửa chữa',
    description: 'Xem, tạo, duyệt và thực hiện sửa chữa trong phạm vi được giao.',
    permissions: [
      { code: 'assets.view', scope: 'department' },
      { code: 'asset_categories.view', scope: 'all' },
      { code: 'maintenance.view', scope: 'department' },
      { code: 'maintenance.create', scope: 'department' },
      { code: 'maintenance.update', scope: 'department' },
      { code: 'maintenance.submit', scope: 'department' },
      { code: 'maintenance.approve', scope: 'department' },
      { code: 'maintenance.execute', scope: 'department' },
      { code: 'maintenance.export', scope: 'department' },
    ],
  },
  {
    code: 'procurement_manager',
    label: 'Quản lý tăng tài sản',
    description: 'Xem, tạo, duyệt và hoàn tất mua sắm/tăng tài sản.',
    permissions: [
      { code: 'assets.view', scope: 'department' },
      { code: 'asset_categories.view', scope: 'all' },
      { code: 'procurement.view', scope: 'department' },
      { code: 'procurement.create', scope: 'department' },
      { code: 'procurement.update', scope: 'department' },
      { code: 'procurement.approve', scope: 'department' },
      { code: 'procurement.fulfill', scope: 'department' },
      { code: 'procurement.export', scope: 'department' },
    ],
  },
  {
    code: 'inventory_manager',
    label: 'Quản lý kiểm kê',
    description: 'Xem, tạo đợt, kiểm kê, gửi duyệt và duyệt báo cáo kiểm kê.',
    permissions: [
      { code: 'assets.view', scope: 'department' },
      { code: 'asset_categories.view', scope: 'all' },
      { code: 'inventory.view', scope: 'department' },
      { code: 'inventory.round.manage', scope: 'department' },
      { code: 'inventory.count', scope: 'department' },
      { code: 'inventory.submit', scope: 'department' },
      { code: 'inventory.approve', scope: 'department' },
      { code: 'inventory.export', scope: 'department' },
    ],
  },
  {
    code: 'viewer',
    label: 'Chỉ xem',
    description: 'Chỉ xem dữ liệu, không tạo/sửa/duyệt.',
    permissions: [
      { code: 'dashboard.view', scope: 'department' },
      { code: 'assets.view', scope: 'department' },
      { code: 'asset_categories.view', scope: 'all' },
      { code: 'transfers.view', scope: 'department' },
      { code: 'inventory.view', scope: 'department' },
      { code: 'maintenance.view', scope: 'department' },
      { code: 'procurement.view', scope: 'department' },
      { code: 'disposal.view', scope: 'department' },
      { code: 'stock.view', scope: 'department' },
      { code: 'norms.view', scope: 'all' },
      { code: 'reports.view', scope: 'department' },
    ],
  },
];

export const isPermissionCode = (code: string): boolean => PERMISSION_MAP.has(code);

export const isPermissionScope = (scope: string): scope is PermissionScope =>
  scope === 'own' || scope === 'department' || scope === 'all';

export const normalizePermissionScope = (
  code: string,
  scope: string | undefined,
): PermissionScope => {
  const definition = PERMISSION_MAP.get(code);
  if (!definition) return 'department';
  if (scope && isPermissionScope(scope) && definition.scopes.includes(scope)) {
    return scope;
  }
  return definition.scopes.includes('department')
    ? 'department'
    : definition.scopes[0] || 'all';
};
