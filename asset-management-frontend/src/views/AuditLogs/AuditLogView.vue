<template>
  <div class="audit-log-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ isAdminOrDirector ? 'Nhật ký hoạt động' : 'Lịch sử thao tác của đơn vị' }}</h3>
          <el-button :icon="Refresh" :loading="loading" @click="fetchLogs">Làm mới</el-button>
        </div>
      </template>

      <!-- Filters -->
      <el-row :gutter="12" class="filter-row">
        <el-col :xs="24" :sm="6">
          <el-select v-model="filters.action" placeholder="Loại hành động" clearable @change="onFilter">
            <el-option label="Tạo mới" value="create" />
            <el-option label="Cập nhật" value="update" />
            <el-option label="Xóa" value="delete" />
            <el-option label="Duyệt" value="approve" />
            <el-option label="Đăng nhập" value="login" />
            <el-option label="Đăng xuất" value="logout" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-select v-model="filters.table_name" placeholder="Đối tượng" clearable @change="onFilter">
            <el-option label="Tài sản" value="assets" />
            <el-option label="Người dùng" value="users" />
            <el-option label="Phòng ban" value="departments" />
            <el-option label="Điều chuyển" value="asset_transfers" />
            <el-option label="Bảo trì" value="maintenance_requests" />
            <el-option label="Thanh lý" value="asset_disposal_cases" />
            <el-option label="Kiểm kê" value="inventory_rounds" />
            <el-option label="Mua sắm" value="procurements" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-select v-model="filters.range" placeholder="Thời gian" clearable @change="onFilter">
            <el-option label="30 ngày gần đây" value="last30days" />
            <el-option label="Năm hiện tại" value="currentYear" />
          </el-select>
        </el-col>
        <el-col v-if="isAdminOrDirector" :xs="24" :sm="6">
          <el-input
            v-model="filters.user_id"
            placeholder="ID người dùng"
            clearable
            @clear="onFilter"
            @keyup.enter="onFilter"
          />
        </el-col>
      </el-row>

      <!-- Table -->
      <div class="responsive-table" style="margin-top: 16px">
        <el-table v-loading="loading" :data="logs" stripe border style="width: 100%">
          <el-table-column type="index" width="55" label="#" />
          <el-table-column label="Thời gian" width="170">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="Người thực hiện" min-width="160">
            <template #default="{ row }">
              <div>{{ row.user?.fullname || row.user?.username || `User #${row.user_id}` }}</div>
              <el-tag size="small" type="info">{{ roleText(row.user?.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Hành động" width="110">
            <template #default="{ row }">
              <el-tag :type="actionTagType(row.action)" size="small">{{ actionText(row.action) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="table_name" label="Đối tượng" width="160">
            <template #default="{ row }">
              {{ tableLabel(row.table_name) }}
            </template>
          </el-table-column>
          <el-table-column prop="record_id" label="ID bản ghi" width="100" />
          <el-table-column label="Mô tả" min-width="200">
            <template #default="{ row }">
              <span class="log-description">{{ row.description || row.new_value || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ip_address" label="IP" width="130" />
          <el-table-column label="Chi tiết" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text :icon="View" @click="showDetail(row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-row">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="Chi tiết nhật ký" width="600px">
      <el-descriptions v-if="selectedLog" :column="1" border>
        <el-descriptions-item label="Thời gian">{{ formatDate(selectedLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="Người dùng">{{ selectedLog.user?.fullname || selectedLog.user?.username || `#${selectedLog.user_id}` }}</el-descriptions-item>
        <el-descriptions-item label="Hành động"><el-tag :type="actionTagType(selectedLog.action)">{{ selectedLog.action }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="Đối tượng">{{ tableLabel(selectedLog.table_name) }} #{{ selectedLog.record_id }}</el-descriptions-item>
        <el-descriptions-item label="Mô tả">{{ selectedLog.description || '—' }}</el-descriptions-item>
        <el-descriptions-item label="Giá trị cũ">
          <pre class="json-box">{{ formatJson(selectedLog.old_value) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="Giá trị mới">
          <pre class="json-box">{{ formatJson(selectedLog.new_value) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP">{{ selectedLog.ip_address || '—' }}</el-descriptions-item>
        <el-descriptions-item label="User Agent">{{ selectedLog.user_agent || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">Đóng</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Refresh, View } from '@element-plus/icons-vue';
import { getAuditLogs } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth.store';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id?: number;
  description?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: { fullname?: string; username?: string; role?: string };
}

const authStore = useAuthStore();
const isAdminOrDirector = computed(() => ['admin', 'director'].includes(authStore.user?.role || ''));

const loading = ref(false);
const logs = ref<AuditLog[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const detailVisible = ref(false);
const selectedLog = ref<AuditLog | null>(null);

const filters = ref({
  action: '',
  table_name: '',
  range: '' as string,
  user_id: '',
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      limit: pageSize.value,
    };
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.table_name) params.table_name = filters.value.table_name;
    if (filters.value.range) params.range = filters.value.range;
    if (filters.value.user_id) params.user_id = filters.value.user_id;

    const res: any = await getAuditLogs(params);
    logs.value = res?.data || res?.logs || [];
    total.value = res?.total || logs.value.length;
  } catch (e) {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const onFilter = () => {
  page.value = 1;
  fetchLogs();
};

const showDetail = (row: AuditLog) => {
  selectedLog.value = row;
  detailVisible.value = true;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const formatJson = (val: any) => {
  if (!val) return '—';
  try {
    return typeof val === 'string' ? JSON.stringify(JSON.parse(val), null, 2) : JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};

const roleText = (role?: string) => {
  const map: Record<string, string> = {
    admin: 'Quản trị viên',
    director: 'Giám hiệu',
    department_head: 'Trưởng đơn vị',
    staff: 'Viên chức',
  };
  return map[role || ''] || role || '—';
};

const actionText = (action: string) => {
  const map: Record<string, string> = {
    create: 'Tạo mới', CREATE: 'Tạo mới',
    update: 'Cập nhật', UPDATE: 'Cập nhật',
    delete: 'Xóa', DELETE: 'Xóa',
    approve: 'Duyệt', APPROVE: 'Duyệt',
    login: 'Đăng nhập', LOGIN: 'Đăng nhập',
    logout: 'Đăng xuất', LOGOUT: 'Đăng xuất',
  };
  return map[action] || action;
};

const actionTagType = (action: string) => {
  const a = action?.toLowerCase();
  if (a === 'create') return 'success' as const;
  if (a === 'update') return 'warning' as const;
  if (a === 'delete') return 'danger' as const;
  if (a === 'approve') return 'warning' as const;
  return 'info' as const;
};

const tableLabel = (name: string) => {
  const map: Record<string, string> = {
    assets: 'Tài sản',
    users: 'Người dùng',
    departments: 'Phòng ban',
    asset_transfers: 'Điều chuyển',
    maintenance_requests: 'Bảo trì',
    asset_disposal_cases: 'Thanh lý',
    inventory_rounds: 'Kiểm kê',
    procurements: 'Mua sắm',
    stock_items: 'Kho vật tư',
    asset_categories: 'Danh mục',
  };
  return map[name] || name;
};

onMounted(fetchLogs);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 { margin: 0; }
.filter-row { margin-bottom: 8px; }
.filter-row .el-select,
.filter-row .el-input { width: 100%; }
.pagination-row { margin-top: 16px; display: flex; justify-content: flex-end; }
.log-description { font-size: 0.85rem; color: #374151; }
.json-box {
  font-size: 0.78rem;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  max-height: 160px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
