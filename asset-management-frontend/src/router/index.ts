import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes: RouteRecordRaw[] = [
  // Route công khai - quét QR code, không cần đăng nhập
  {
    path: '/scan/:code',
    name: 'AssetPublicScan',
    component: () => import('@/views/Assets/AssetPublicView.vue'),
    meta: { requiresAuth: false, titleKey: 'assets.publicScan' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, titleKey: 'auth.login' },
  },
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { titleKey: 'menu.dashboard' },
      },
      {
        path: '/documentation',
        name: 'Documentation',
        component: () => import('@/views/Help/DocumentationView.vue'),
        meta: {
          titleKey: 'menu.documentation',
          breadcrumbParent: { path: '/', titleKey: 'menu.dashboard' },
        },
      },
      {
        path: '/support',
        name: 'Support',
        component: () => import('@/views/Help/SupportView.vue'),
        meta: {
          titleKey: 'menu.support',
          breadcrumbParent: { path: '/', titleKey: 'menu.dashboard' },
        },
      },
      {
        path: '/assets',
        name: 'Assets',
        component: () => import('@/views/Assets/AssetList.vue'),
        meta: { titleKey: 'menu.assets' },
      },
      {
        path: '/assets/:id',
        name: 'AssetDetail',
        component: () => import('@/views/Assets/AssetDetail.vue'),
        meta: { titleKey: 'assets.assetDetail', breadcrumbParent: { path: '/assets', titleKey: 'menu.assets' } },
      },
      {
        path: '/departments',
        name: 'Departments',
        component: () => import('@/views/Departments/DepartmentList.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.departments' },
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/Users/UserList.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.users' },
      },
      {
        path: '/transfers',
        name: 'Transfers',
        component: () => import('@/views/Transfers/TransferList.vue'),
        meta: { titleKey: 'menu.transfers' },
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/views/Reports/ReportList.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.reports' },
      },
      {
        path: '/procurements',
        name: 'Procurements',
        component: () => import('@/views/Procurements/ProcurementList.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.procurements' },
      },
      {
        path: '/purchase-requests',
        name: 'PurchaseRequests',
        component: () => import('@/views/Maintenance/PurchaseRequestView.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.purchaseRequests' },
      },
      {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance/RepairRequestView.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.repairTracking' },
      },
      {
        path: '/stock',
        name: 'Stock',
        component: () => import('@/views/Stock/StockDashboard.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.stock' },
      },
      {
        path: '/stock/history',
        name: 'StockHistory',
        component: () => import('@/views/Stock/StockHistory.vue'),
        meta: { requiresAdmin: true, titleKey: 'stock.history' },
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory/InventoryList.vue'),
        meta: { titleKey: 'inventory.title' },
      },
      {
        path: '/inventory/rounds/:id',
        name: 'InventoryRoundDetail',
        component: () => import('@/views/Inventory/InventoryRoundDetail.vue'),
        meta: { titleKey: 'inventory.roundDetail', breadcrumbParent: { path: '/inventory', titleKey: 'inventory.title' } },
      },
      {
        path: '/inventory/conduct',
        name: 'InventoryConduct',
        component: () => import('@/views/Inventory/InventoryConduct.vue'),
        meta: { titleKey: 'inventory.conduct' },
      },
      {
        path: '/inventory/reports/:id',
        name: 'InventoryReportDetail',
        component: () => import('@/views/Inventory/InventoryReportDetail.vue'),
        meta: { titleKey: 'inventory.reportDetail', breadcrumbParent: { path: '/inventory', titleKey: 'inventory.title' } },
      },
      {
        path: '/asset-disposals',
        name: 'AssetDisposals',
        component: () => import('@/views/AssetDisposals/AssetDisposalCaseList.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.assetDisposals' },
      },
      {
        path: '/system-admin',
        name: 'SystemAdmin',
        component: () => import('@/views/SystemAdmin/SystemAdminView.vue'),
        meta: { requiresSystemAdmin: true, titleKey: 'menu.systemAdmin' },
      },
      {
        path: '/audit-logs',
        name: 'AuditLogs',
        component: () => import('@/views/AuditLogs/AuditLogView.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.auditLogs' },
      },
      {
        path: '/notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications/NotificationsView.vue'),
        meta: { requiresAuth: true, titleKey: 'menu.notifications' },
      },
      {
        path: '/asset-categories',
        name: 'AssetCategories',
        component: () => import('@/views/AssetCategories/AssetCategoryView.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.assetCategories' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Xử lý lỗi khi module bị lazy-load thất bại (thường do server đã build lại
// hoặc restart trong khi tab trình duyệt vẫn đang mở, khiến chunk cũ không còn tồn tại).
// Trong trường hợp này, tự động reload lại trang (1 lần) để lấy bản build mới nhất
// thay vì hiển thị lỗi trắng màn hình cho người dùng.
const CHUNK_LOAD_ERROR_REGEX = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
router.onError((error, to) => {
  if (CHUNK_LOAD_ERROR_REGEX.test(error.message)) {
    const reloadKey = 'chunk-reload-retried';
    const alreadyRetried = sessionStorage.getItem(reloadKey);
    if (!alreadyRetried) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.href = to.fullPath;
    } else {
      sessionStorage.removeItem(reloadKey);
    }
  }
});

const getLandingPathByRole = () => {
  // Tất cả các role giờ đây đều có Dashboard là trang lending
  return '/';
};

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthed = authStore.isAuthenticated;
  const userRole = authStore.user?.role;

  const requiresAuth = to.meta.requiresAuth !== false;
  if (requiresAuth && !isAuthed) {
    return next('/login');
  }

  // Kiểm tra quyền admin cho các route có meta.requiresAdmin
  if (to.meta.requiresAdmin && userRole !== 'admin') {
    return next(getLandingPathByRole());
  }

  // Kiểm tra quyền admin hoặc director cho các route có meta.requiresAdminOrDirector
  if (to.meta.requiresAdminOrDirector && !['admin', 'director'].includes(userRole || '')) {
    return next(getLandingPathByRole());
  }

  // System-admin: chỉ admin mới vào được (không phải director)
  if (to.meta.requiresSystemAdmin && userRole !== 'admin') {
    return next(getLandingPathByRole());
  }

  if (to.path === '/' && isAuthed) {
    const landing = getLandingPathByRole();
    if (landing !== '/') {
      return next(landing);
    }
  }

  return next();
});

// Xóa cờ retry sau khi điều hướng thành công, để lần lazy-load lỗi tiếp theo
// (do một lần restart/deploy khác) vẫn có thể tự động reload lại 1 lần.
router.afterEach(() => {
  sessionStorage.removeItem('chunk-reload-retried');
});

export default router;
