import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes: RouteRecordRaw[] = [
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
        path: '/assets',
        name: 'Assets',
        component: () => import('@/views/Assets/AssetList.vue'),
        meta: { titleKey: 'menu.assets' },
      },
      {
        path: '/assets/:id',
        name: 'AssetDetail',
        component: () => import('@/views/Assets/AssetDetail.vue'),
        meta: { titleKey: 'assets.assetDetail' },
      },
      {
        path: '/departments',
        name: 'Departments',
        component: () => import('@/views/Departments/DepartmentList.vue'),
        meta: { titleKey: 'menu.departments' },
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
        meta: { titleKey: 'menu.reports' },
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
        meta: { titleKey: 'menu.purchaseRequests' },
      },
      {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance/RepairRequestView.vue'),
        meta: { titleKey: 'menu.repairTracking' },
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
        meta: { titleKey: 'inventory.roundDetail' },
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
        meta: { titleKey: 'inventory.reportDetail' },
      },
      {
        path: '/asset-disposals',
        name: 'AssetDisposals',
        component: () => import('@/views/AssetDisposals/AssetDisposalCaseList.vue'),
        meta: { titleKey: 'menu.assetDisposals' },
      },
      {
        path: '/system-admin',
        name: 'SystemAdmin',
        component: () => import('@/views/SystemAdmin/SystemAdminView.vue'),
        meta: { requiresAdmin: true, titleKey: 'menu.systemAdmin' },
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

  if (to.path === '/login' && isAuthed) {
    return next(getLandingPathByRole());
  }

  // Kiểm tra quyền admin cho các route có meta.requiresAdmin
  if (to.meta.requiresAdmin && !['admin', 'director'].includes(userRole || '')) {
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

export default router;
