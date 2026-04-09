<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div>
        <h2>{{ $t('dashboard.title') }}</h2>
        <p class="header-subtitle">
          Tổng quan hoạt động quản lý tài sản
        </p>
      </div>

    </div>

    <el-row
      :gutter="16"
      class="stats-row"
    >
      <!-- 1. Tổng tài sản -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/assets')"
        >
          <div class="stat-icon assets-icon">
            <el-icon size="24">
              <Box />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(stats.assetsTotal) }}
              </div>
              <div class="stat-label">
                Tổng tài sản
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <!-- 2. Mua sắm -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/purchase-requests')"
        >
          <div class="stat-icon procurements-icon">
            <el-icon size="24">
              <ShoppingCart />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(stats.purchaseRequestsTotal) }}
              </div>
              <div class="stat-label">
                Mua sắm
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <!-- 3. Sửa chữa -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/maintenance')"
        >
          <div class="stat-icon maintenance-icon">
            <el-icon size="24">
              <Setting />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(stats.repairTotal) }}
              </div>
              <div class="stat-label">
                Sửa chữa
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <!-- 4. Điều chuyển -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/transfers')"
        >
          <div class="stat-icon transfers-icon">
            <el-icon size="24">
              <Sort />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(stats.transfersTotal) }}
              </div>
              <div class="stat-label">
                Điều chuyển
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <!-- 5. Kiểm kê -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/inventory')"
        >
          <div class="stat-icon inventory-icon">
            <el-icon size="24">
              <List />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(inventoryPending) }}
              </div>
              <div class="stat-label">
                Kiểm kê
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <!-- 6. Đề nghị thanh lý -->
      <el-col
        :xs="12"
        :sm="8"
        :md="4"
      >
        <el-card
          class="stat-card stat-clickable"
          shadow="hover"
          @click="$router.push('/asset-disposals')"
        >
          <div class="stat-icon issues-icon">
            <el-icon size="24">
              <Delete />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton
              v-if="loading"
              :rows="1"
              animated
            />
            <template v-else>
              <div class="stat-value text-truncate">
                {{ formatNumber(disposalPending) }}
              </div>
              <div class="stat-label">
                Đề nghị thanh lý
              </div>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      :gutter="16"
      class="charts-row"
    >
      <el-col :span="24">
        <el-card
          class="chart-card"
          shadow="hover"
        >
          <template #header>
            <div
              class="card-header"
              style="justify-content: space-between;"
            >
              <div class="header-left">
                <span class="card-title">Mạng lưới tài sản thông minh</span>
              </div>
              <div class="header-right">
                <div class="status-capsules">
                  <div 
                    v-for="s in assetsByStatus" 
                    :key="s.status" 
                    class="status-capsule"
                    :style="{ '--status-color': getStatusColor(s.status) }"
                    @click="goToAssets({ status: s.status })"
                  >
                    <span class="capsule-label">{{ getStatusText(s.status) }}</span>
                    <span class="capsule-value">{{ s.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div
            class="dept-chart force-full-width"
            style="height: 600px;"
          >
            <VChart
              class="dept-echart"
              :option="graphOption"
              autoresize
              @click="onGraphClick"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>




    <el-row
      :gutter="16"
      class="charts-row"
    >
      <el-col
        :xs="24"
        :md="24"
      >
        <el-card
          class="chart-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <span class="card-title">Lịch sử thao tác gần đây</span>
            </div>
          </template>

          <el-table
            v-loading="loading"
            :data="auditLogs"
            size="small"
          >
            <el-table-column
              label="Thời gian"
              width="160"
            >
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Người dùng"
              min-width="140"
            >
              <template #default="{ row }">
                {{ getUserDisplayName(row) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Vai trò"
              width="130"
            >
              <template #default="{ row }">
                <el-tag
                  :type="getRoleTagType(row.user?.role)"
                  size="small"
                >
                  {{ getRoleText(row.user?.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="Hành động"
              width="120"
            >
              <template #default="{ row }">
                <el-tag
                  :type="getActionTagType(row.action)"
                  size="small"
                  effect="plain"
                >
                  {{ getActionText(row.action) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="Đối tượng"
              min-width="180"
            >
              <template #default="{ row }">
                {{ getTargetText(row) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Địa chỉ IP"
              width="130"
            >
              <template #default="{ row }">
                <span class="ip-text">{{ row.ip_address ? row.ip_address.replace(/^::ffff:/, '') : '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { Box, ShoppingCart, Setting, Sort, List, Delete } from '@element-plus/icons-vue';
import VChart from 'vue-echarts';
import * as dashboardService from '@/services/dashboard.service';
import { inventoryService } from '@/services/inventory.service';
import { useAuthStore } from '@/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const loading = ref(true);
const authStore = useAuthStore();
const isAdminOrDirector = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || role === 'director';
});


const stats = reactive({
  assetsTotal: 0,
  assetsNew: 0,
  totalDepartments: 0,
  procurements: 0,
  stockReceipts: 0,
  stockIssues: 0,
  itemsTotal: 0,
  maintenancePending: 0,
  purchaseRequestsPending: 0,
  repairPending: 0,
  purchaseRequestsTotal: 0,
  repairTotal: 0,
  transfersTotal: 0,
  disposalTotal: 0,
});

const inventoryPending = ref(0);
const disposalPending = ref(0);

const assetsByStatus = ref<{ status: string; count: number }[]>([]);
const assetsByCategory = ref<{ category: string; code: string; count: number; filter: Record<string, any> }[]>([]);
const assetsByDepartment = ref<{ department_name: string; asset_count: number; department_id: number }[]>([]);
const assetsHierarchy = ref<any[]>([]);
const maintenanceByStatus = ref<{ status: string; request_type: string; count: number; label: string }[]>([]);

const auditLogs = ref<any[]>([]);
const auditPagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
});

onMounted(async () => {
  await loadDashboardData();
});




const loadDashboardData = async () => {
  loading.value = true;
  try {
    const [overviewRes, statusRes, deptRes, stockRes, catRes, auditRes, maintRes, inventoryRes, hierarchyRes] = await Promise.all([
      dashboardService.getOverviewStats({}),
      dashboardService.getAssetStatusStats({}),
      dashboardService.getDepartmentStats(),
      dashboardService.getStockStats({}),
      dashboardService.getCategoryBreakdown({ limit: 8 }),
      dashboardService.getAuditLogs({ limit: 10, page: 1 }),
      dashboardService.getMaintenanceStats({}),
      inventoryService.getPendingReportsCount(),
      dashboardService.getHierarchyStats({}),
    ]);

    // axios interceptor in `src/services/api.ts` trả về `response.data`
    const overview = (overviewRes as any)?.data || {};
    const status = (statusRes as any)?.data || [];
    const departments = (deptRes as any)?.data || [];
    const stock = (stockRes as any)?.data || {};
    const categories = (catRes as any)?.data || [];
    const auditResult = (auditRes as any)?.data || {};
    const hierarchy = (hierarchyRes as any)?.data || [];

    const maintenance = (maintRes as any)?.data || [];
    const pendingInv = (inventoryRes as any) || 0;

    inventoryPending.value = pendingInv;
    assetsHierarchy.value = hierarchy;
    disposalPending.value = Number(overview.disposal_pending || 0);

    // Fix swapped or inaccurate stats from API
    stats.assetsTotal = Number(overview.assets_total || 0);
    stats.assetsNew = Number(overview.assets_new || 0);
    stats.procurements = Number(overview.procurements || 0);
    stats.stockReceipts = Number(overview.stock_receipts || 0);
    stats.stockIssues = Number(overview.stock_issues || 0);
    stats.maintenancePending = Number(overview.maintenance_pending || 0);
    stats.purchaseRequestsPending = Number(overview.purchase_requests_pending || 0);
    stats.repairPending = Number(overview.repair_pending || 0);
    stats.purchaseRequestsTotal = Number(overview.purchase_requests_total || 0);
    stats.repairTotal = Number(overview.repair_total || 0);
    stats.transfersTotal = Number(overview.transfers_total || 0);
    stats.disposalTotal = Number(overview.disposal_total || 0);

    stats.itemsTotal = Number(stock.items_total || 0);

    assetsByStatus.value = Array.isArray(status) ? status : [];
    assetsByDepartment.value = Array.isArray(departments)
      ? departments.map((d: any) => ({
          department_id: Number(d.department_id || 0),
          department_name: d.department_name,
          asset_count: Number(d.asset_count || 0),
        }))
      : [];

    stats.totalDepartments = assetsByDepartment.value.length;

    assetsByCategory.value = Array.isArray(categories) ? categories : [];

    if (Array.isArray(auditResult.data)) {
      auditLogs.value = auditResult.data;
      auditPagination.value = auditResult.pagination || auditPagination.value;
    } else {
      auditLogs.value = [];
    }

    maintenanceByStatus.value = Array.isArray(maintenance) ? maintenance : [];
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: '#67c23a',
    inactive: '#909399',
    damaged: '#e6a23c',
    lost: '#f56c6c',
    disposed: '#c0c4cc',
  };
  return colors[status] || '#409eff';
};

const getStatusText = (status: string) => {
  const key = `assets.status.${status}` as const;
  return t(key);
};

const formatDateTime = (value: string | Date | undefined | null) => {
  if (!value) return '';
  const d = typeof value === 'string' || value instanceof String ? new Date(value as string) : (value as Date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN');
};

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
    approve: 'Duyệt',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
  };
  return map[action] || action;
};

const getUserDisplayName = (row: any) => {
  return row?.user?.fullname || row?.user?.username || 'Hệ thống';
};

const getTargetText = (row: any) => {
  const tableMap: Record<string, string> = {
    assets: 'Tài sản',
    users: 'Người dùng',
    departments: 'Phòng ban',
    asset_transfers: 'Điều chuyển tài sản',
    maintenance_requests: 'Yêu cầu sửa chữa',
    procurements: 'Yêu cầu mua sắm',
    inventory_rounds: 'Đợt kiểm kê',
  };
  const typeName = tableMap[row?.table_name] || row?.table_name || 'Khác';
  // Ưu tiên hiển thị tên bản ghi (Ví dụ: tên tài sản, tên người dùng)
  if (row?.record_name) {
    return `${typeName}: ${row.record_name}`;
  }
  // Nếu không có tên, hiển thị ID (Ví dụ: Tài sản #342)
  if (row?.record_id) {
    return `${typeName} #${row.record_id}`;
  }
  return typeName;
};

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return num.toLocaleString('vi-VN');
  }
  return num.toString();
};

const goToAssets = (query: Record<string, any>) => {
  router.push({ path: '/assets', query });
};

const graphOption = computed(() => {
  const centerName = isAdminOrDirector.value
    ? 'Trường'
    : authStore.user?.department?.name || 'Đơn vị';
  const centerColor = '#409eff';

  const palette = [
    '#409eff',
    '#67c23a',
    '#e6a23c',
    '#f56c6c',
    '#909399',
    '#17c3b2',
    '#6c5ce7',
    '#fd79a8',
    '#00b894',
    '#fdcb6e',
  ];

  const nodes: any[] = [
    {
      id: 'center',
      name: centerName,
      value: stats.assetsTotal,
      symbolSize: 60,
      itemStyle: { color: centerColor, shadowBlur: 20, shadowColor: centerColor },
      label: { show: true, position: 'inside', color: '#fff', fontWeight: 'bold' },
    },
  ];

  const links: any[] = [];

  const deptsMap = new Map<number, any[]>();
  assetsHierarchy.value.forEach((item) => {
    const dId = item.department_id || 0;
    if (!deptsMap.has(dId)) deptsMap.set(dId, []);
    deptsMap.get(dId)?.push(item);
  });

  const userDeptId = isAdminOrDirector.value ? null : authStore.user?.department_id;

  let deptIdx = 0;
  deptsMap.forEach((items, deptId) => {
    const isCenterDept = deptId === userDeptId;
    const deptName = items[0]?.department_name || 'Khác';
    const deptTotal = items.reduce((sum, i) => sum + i.count, 0);
    const deptNodeId = `dept_${deptId}`;
    const deptColor = palette[deptIdx % palette.length];

    if (!isCenterDept) {
      nodes.push({
        id: deptNodeId,
        name: deptName,
        value: deptTotal,
        type: 'department',
        originalId: deptId,
        symbolSize: Math.max(25, Math.min(45, (deptTotal / (stats.assetsTotal || 1)) * 100)),
        itemStyle: { color: deptColor, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 'bold' },
      });

      links.push({
        source: 'center',
        target: deptNodeId,
        lineStyle: { width: 2, color: '#cbd5e1', curveness: 0.1 },
      });
    }

    const sourceNodeId = isCenterDept ? 'center' : deptNodeId;

    const groupedItems = new Map<string, any>();
    items.forEach((item) => {
      const name = item.category_name ?? 'Khác';
      const code = item.category_code ?? '';
      if (!groupedItems.has(name)) {
        groupedItems.set(name, { ...item, codes: [code], count: 0 });
      }
      const existing = groupedItems.get(name)!;
      existing.count += item.count;
      if (!existing.codes.includes(code)) {
        existing.codes.push(code);
      }
    });

    const sortedCats = Array.from(groupedItems.values()).sort((a, b) => b.count - a.count);
    const topCats = sortedCats.slice(0, 8);
    const otherCats = sortedCats.slice(8);

    topCats.forEach((cat) => {
      const catNodeId = `cat_${deptId}_${cat.category_name}`;
      const displayCodes = cat.codes.join(', ');

      nodes.push({
        id: catNodeId,
        name: cat.category_name,
        fullName: `${cat.category_name} (${displayCodes})`,
        value: cat.count,
        type: 'category',
        originalCodes: cat.codes,
        deptId: deptId,
        symbolSize: Math.max(12, Math.min(25, (cat.count / (deptTotal || 1)) * 40)),
        itemStyle: { color: deptColor, opacity: 0.75 },
        label: { show: false },
      });

      links.push({
        source: sourceNodeId,
        target: catNodeId,
        lineStyle: { width: 1, color: '#e2e8f0', curveness: 0.3, type: 'dashed' },
      });
    });

    if (otherCats.length > 0) {
      const otherTotal = otherCats.reduce((sum, i) => sum + i.count, 0);
      const otherNodeId = `cat_${deptId}_other`;
      nodes.push({
        id: otherNodeId,
        name: 'Khác...',
        value: otherTotal,
        type: 'category_other',
        deptId: deptId,
        symbolSize: 10,
        itemStyle: { color: '#94a3b8', opacity: 0.5 },
        label: { show: false },
      });
      links.push({ source: sourceNodeId, target: otherNodeId });
    }

    if (!isCenterDept) deptIdx++;
  });

  return {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        if (p.dataType !== 'node') return '';
        const name = p.data.fullName || p.data.name;
        return `<b>${name}</b><br/>Số lượng: ${formatNumber(p.data.value)}`;
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        draggable: true,
        force: {
          repulsion: 200,
          edgeLength: [50, 200],
          gravity: 0.1,
        },
        emphasis: {
          focus: 'descendant',
          label: { show: true, fontSize: 12, fontWeight: 'bold' },
        },
      },
    ],
  };
});

const onGraphClick = (params: any) => {
  const data = params?.data;
  if (!data || data.id === 'center') return;

  if (data.type === 'department') {
    goToAssets({ current_department_id: String(data.originalId), include_children: 'true' });
  } else if (data.type === 'category') {
    const code = Array.isArray(data.originalCodes) ? data.originalCodes[0] : data.originalId;
    goToAssets({ current_department_id: String(data.deptId), category_code: String(code) });
  }
};

const getRoleTagType = (role: string | undefined): 'success' | 'warning' | 'danger' | 'info' => {
  if (role === 'admin') return 'danger';
  if (role === 'director') return 'warning';
  if (role === 'manager') return 'info';
  return 'info';
};

const getRoleText = (role: string | undefined) => {
  const map: Record<string, string> = {
    admin: 'Quản trị viên',
    director: 'Giám hiệu',
    manager: 'Trưởng phòng',
    department_head: 'Trưởng đơn vị',
    staff: 'Nhân viên',
  };
  return map[role || ''] || role || '-';
};

const getActionTagType = (action: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (action === 'create') return 'success';
  if (action === 'delete') return 'danger';
  if (action === 'approve') return 'warning';
  if (action === 'login' || action === 'logout') return 'info';
  return 'info';
};
</script>

<style scoped>

.dashboard {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 56px);
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.dashboard-header {
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

/* Stats Cards Section */
.stats-row {
  margin-bottom: 24px;
  display: flex;
}

.stats-row .el-col {
  display: flex !important;
}

.stat-card {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.stat-clickable {
  cursor: pointer;
}

.stat-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stat-card :deep(.el-card__body) {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  flex: 1;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Professional Gradients */
.assets-icon       { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.active-icon       { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.departments-icon  { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.procurements-icon { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.maintenance-icon  { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.receipts-icon     { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.issues-icon       { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.transfers-icon    { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.inventory-icon    { background: linear-gradient(135deg, #64748b 0%, #475569 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin-bottom: 1px;
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.maintenance-section {
  padding: 4px 0;
}

.maint-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.maint-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.maint-icon-sm {
  font-size: 1rem;
  color: #64748b;
}

.maint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.maint-label {
  font-size: 0.88rem;
  color: #475569;
}

.maint-empty {
  font-size: 0.85rem;
  color: #94a3b8;
  text-align: center;
  padding: 8px 0;
}

:deep(.el-divider--horizontal) {
  margin: 12px 0;
}

.chart-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.status-list, .category-list, .dept-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item, .category-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-info, .category-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 2px;
}

.status-label, .category-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-count, .category-count {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  margin-left: 12px;
  text-align: right;
  flex-shrink: 0;
}

.status-percent, .category-percent {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 4px;
}

.category-code-prefix {
  font-family: inherit;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 700;
  margin-right: 8px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 6px;
}

.maintenance-flex {
  display: flex;
  gap: 24px;
  align-items: center;
}

.vertical-divider {
  width: 1px;
  height: 80px;
  background-color: #f1f5f9;
}

.dept-chart {
  height: 500px; /* Tăng chiều cao để không gian mạng lưới toả ra đẹp hơn */
  margin: -20px; /* Tràn viền card để tạo cảm giác không gian vô tận như hình mẫu */
  overflow: hidden;
  border-radius: 0 0 16px 16px;
}

.force-full-width {
  width: calc(100% + 40px);
}

.dept-echart {
  width: 100%;
  height: 100%;
}


.dept-rank {
  width: 32px;
  height: 32px;
  background-color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  color: #0f172a;
  margin-right: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.dept-list-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.dept-list-count {
  font-weight: 800;
  color: #0f172a;
  font-size: 1rem;
}

/* Status Capsules Styles */
.header-right {
  display: flex;
  align-items: center;
}

.status-capsules {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-capsule {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.status-capsule:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  border-color: var(--status-color);
  background: rgba(var(--el-color-primary-rgb), 0.02);
}

.capsule-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin-right: 8px;
}

.status-capsule:hover .capsule-label {
  color: var(--status-color);
}

.capsule-value {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e293b;
  background: #f1f5f9;
  padding: 0 6px;
  border-radius: 6px;
  min-width: 20px;
  text-align: center;
}

.status-capsule:hover .capsule-value {
  background: var(--status-color);
  color: #fff;
}

:deep(.el-table) {
  --el-table-border-color: #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

:deep(.el-table th) {
  background-color: #f8fafc !important;
  font-weight: 800;
  color: #64748b;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 20px 0;
}

:deep(.el-table td) {
  padding: 16px 0;
  color: #1e293b;
  font-weight: 500;
}

.ip-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #94a3b8;
}

.clickable {
  cursor: pointer;
}

/* Category Specifics */
.category-code-prefix {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
  margin-right: 6px;
}

/* Dashboard responsive */
@media (max-width: 1200px) {
  .dashboard {
    padding: 20px;
  }

  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .dashboard {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
  }

  .status-capsules {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .dashboard-header h2 {
    font-size: 1.5rem;
  }

  .stat-card :deep(.el-card__body) {
    padding: 20px;
    gap: 16px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .status-capsules {
    width: 100%;
  }

  .status-capsule {
    flex: 1 1 calc(50% - 4px);
  }
}

@media (max-width: 480px) {
  .dashboard-header h2 {
    font-size: 1.25rem;
  }

  .stat-card :deep(.el-card__body) {
    padding: 16px;
    gap: 12px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }
}
</style>

