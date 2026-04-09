<template>
  <div class="procurement-list">
    <!-- Header with create button -->
    <div class="list-header">
      <h4>{{ $t('maintenance.procurement.title') }}</h4>
      <el-button
        v-if="!authStore.isDirector"
        type="primary"
        :icon="Plus"
        @click="handleCreate"
      >
        {{ $t('maintenance.procurement.createRequest') }}
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select
            v-model="filterStatus"
            :placeholder="$t('maintenance.filterByStatus')"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="s in statuses"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <DepartmentTreeSelect
            v-model="filterDepartment"
            :placeholder="$t('maintenance.filterByDepartment')"
            @change="handleFilter"
          />
        </el-col>
        <el-col :span="6">
          <el-button
            type="primary"
            @click="handleFilter"
          >
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="handleReset">
            {{ $t('common.refresh') }}
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Table -->
    <div class="responsive-table">
      <el-table
        v-loading="loading"
        :data="requests"
        border
        stripe
      >
        <el-table-column
          type="index"
          width="50"
          label="TT"
        />
        <el-table-column
          prop="device_name"
          :label="$t('maintenance.procurement.deviceName')"
          min-width="200"
        />
        <el-table-column
          prop="quantity"
          :label="$t('maintenance.procurement.quantity')"
          width="100"
          align="center"
        />
        <el-table-column
          prop="unit"
          :label="$t('maintenance.procurement.unit')"
          width="100"
          align="center"
        />
        <el-table-column
          prop="unit_price"
          :label="$t('maintenance.procurement.unitPrice')"
          width="150"
          align="right"
        >
          <template #default="{ row }">
            {{ formatCurrency(row.unit_price) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total_price"
          :label="$t('maintenance.procurement.totalPrice')"
          width="150"
          align="right"
        >
          <template #default="{ row }">
            {{ formatCurrency(row.total_price || (row.quantity * row.unit_price)) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="department.name"
          :label="$t('maintenance.procurement.directUser')"
          min-width="150"
        />
        <el-table-column
          prop="status"
          :label="$t('common.status')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.actions')"
          width="250"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleView(row)"
            >
              {{ $t('common.view') }}
            </el-button>
            <el-button
              v-if="canEdit(row)"
              size="small"
              type="warning"
              @click="handleEdit(row)"
            >
              {{ $t('common.edit') }}
            </el-button>
            <!-- Nút Xóa - chỉ hiển thị cho người tạo khi status là draft hoặc new (chưa gửi phê duyệt) -->
            <el-button 
              v-if="canDelete(row)"
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
            >
              {{ $t('common.delete') }}
            </el-button>
            <!-- Nút Gửi phê duyệt - chỉ hiển thị cho người tạo khi status là draft hoặc rejected -->
            <el-button 
              v-if="(row.status === 'draft' || row.status === 'rejected' || row.status?.startsWith('rejected_by')) && row.requested_by === authStore.user?.id"
              size="small" 
              type="success" 
              @click="handleSubmitForApproval(row)"
            >
              Gửi phê duyệt
            </el-button>
            <!-- Nút Phê duyệt - hiển thị theo cấp phê duyệt -->
            <el-button 
              v-if="canApproveAtCurrentLevel(row)"
              size="small" 
              type="success" 
              @click="handleApprove(row.id)"
            >
              {{ getApproveButtonText(row) }}
            </el-button>
            <el-button
              v-if="canFulfill(row)"
              size="small"
              type="primary"
              :loading="fulfillLoading"
              @click="handleFulfill(row)"
            >
              Hoàn tất & tạo TS
            </el-button>
            <el-button
              v-if="authStore.isAdmin && row.linked_procurement_id"
              size="small"
              type="success"
              @click="router.push({ path: '/procurements', query: { openId: String(row.linked_procurement_id) } })"
            >
              Xem phiếu Tăng TS
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <el-pagination
        v-if="pagination"
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Form Dialog -->
    <ProcurementFormDialog
      v-model:visible="formDialogVisible"
      :item="currentItem"
      @success="handleFormSuccess"
    />

    <!-- Detail Dialog -->
    <MaintenanceDetailDialog
      v-model:visible="detailDialogVisible"
      :maintenance="currentItem"
      @update="() => fetchData({}, true)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useDepartmentStore } from '@/stores/department.store';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProcurementFormDialog from './ProcurementFormDialog.vue';
import MaintenanceDetailDialog from './MaintenanceDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import api from '@/services/api';
import procurementService from '@/services/procurement.service';

const { t } = useI18n();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const getNextApprovalStatus = (currentStatus: string, role: string): string | null => {
  if (role === 'department_head' && (currentStatus === 'pending' || currentStatus === 'new')) return 'approved_by_head';
  if (role === 'admin' && currentStatus === 'approved_by_head') return 'approved_by_admin';
  if (role === 'director' && currentStatus === 'approved_by_admin') return 'approved_by_director';
  return null;
};
const departmentStore = useDepartmentStore();
const router = useRouter();

const loading = ref(false);
const requests = ref<any[]>([]);
const pagination = ref<any>(null);
const filterStatus = ref<string | null>(null);
const filterDepartment = ref<number | null>(null);
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentItem = ref<any>(null);
const fulfillLoading = ref(false);

const statuses = computed(() => [
  { value: 'draft', label: 'Nháp' },
  { value: 'new', label: t('maintenance.status.new') },
  { value: 'pending', label: 'Chờ phê duyệt' },
  { value: 'approved_by_head', label: 'Trưởng Đơn vị đã duyệt' },
  { value: 'approved_by_admin', label: 'Quản trị viên đã duyệt' },
  { value: 'approved_by_director', label: 'Giám hiệu đã duyệt' },
  { value: 'in_progress', label: t('maintenance.status.in_progress') },
  { value: 'done', label: t('maintenance.status.done') },
  { value: 'rejected', label: t('maintenance.status.rejected') },
  { value: 'rejected_by_head', label: 'Trưởng Đơn vị từ chối' },
  { value: 'rejected_by_admin', label: 'Quản trị viên từ chối' },
  { value: 'rejected_by_director', label: 'Giám hiệu từ chối' },
]);

onMounted(async () => {
  await fetchData();
  await departmentStore.fetchDepartments();
});

let isFetching = false;
const fetchData = async (params: any = {}, silent = false) => {
  // Prevent multiple simultaneous requests
  if (isFetching) {
    return;
  }
  isFetching = true;
  if (!silent) loading.value = true;
  try {
    // Build params object, only include non-null values
    const requestParams: any = {
      ...params,
      request_type: 'procurement',
    };
    
    if (filterStatus.value) {
      requestParams.status = filterStatus.value;
    }
    
    if (filterDepartment.value) {
      requestParams.department_id = filterDepartment.value;
    }
    
    const response: any = await api.get('/maintenance', {
      params: requestParams
    });
    requests.value = response.data || [];
    pagination.value = response.pagination;
  } catch (error: any) {
    console.error('Error fetching procurement requests:', error);
    // Don't show error message for 429 as it's already handled in api interceptor
    if (error.response?.status !== 429) {
      // Error already handled by interceptor
    }
  } finally {
    loading.value = false;
    isFetching = false;
  }
};

const handleFilter = () => {
  fetchData({ page: 1 });
};

const handleReset = () => {
  filterStatus.value = null;
  filterDepartment.value = null;
  fetchData({ page: 1 });
};

const handlePageChange = (page: number) => {
  fetchData({ page });
};

const handleCreate = () => {
  currentItem.value = null;
  formDialogVisible.value = true;
};

const handleEdit = (item: any) => {
  currentItem.value = item;
  formDialogVisible.value = true;
};

const handleView = async (item: any) => {
  try {
    // Fetch full details including approval history
    const response: any = await api.get(`/maintenance/${item.id}`);
    currentItem.value = response.data;
    detailDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải chi tiết yêu cầu');
  }
};

const canFulfill = (row: any) => {
  const role = authStore.user?.role;
  if (role !== 'admin') return false;
  return row.request_type === 'procurement' && row.status === 'approved_by_director' && !row.procurement_fulfilled && !row.linked_procurement_id;
};

const handleFulfill = async (row: any) => {
  try {
    fulfillLoading.value = true;
    const res: any = await procurementService.createFromMaintenance(row.id);
    const procId = res?.data?.id;
    ElMessage.success('Đã tạo phiếu Tăng tài sản. Đang chuyển hướng...');
    fetchData({}, true);
    await router.push({ path: '/procurements', query: { openId: String(procId) } });
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || 'Không thể tạo phiếu Tăng tài sản');
  } finally {
    fulfillLoading.value = false;
  }
};

const canEdit = (item: any) => {
  // Cho phép chỉnh sửa nếu:
  // 1. Status là draft (nháp) - người tạo có thể sửa
  // 2. Status là rejected hoặc rejected_by_* - có thể sửa lại sau khi bị từ chối
  // 3. Status là new và là manager
  const editableStatuses = ['draft', 'new', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'];
  const isEditable = editableStatuses.includes(item.status);
  
  // Nếu là draft hoặc rejected, chỉ người tạo mới được sửa
  if (['draft', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'].includes(item.status)) {
    return isEditable && item.requested_by === authStore.user?.id;
  }
  
  // Các trường hợp khác
  return isEditable && (authStore.isManager || item.requested_by === authStore.user?.id);
};

const canDelete = (item: any) => {
  // Chỉ cho phép xóa khi:
  // 1. Status là draft hoặc new (chưa gửi phê duyệt)
  // 2. Người dùng hiện tại là người tạo
  const deletableStatuses = ['draft', 'new'];
  return deletableStatuses.includes(item.status) && item.requested_by === authStore.user?.id;
};

const handleSubmitForApproval = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn gửi yêu cầu này lên phê duyệt?',
      'Xác nhận gửi phê duyệt',
      {
        type: 'warning',
        confirmButtonText: 'Gửi phê duyệt',
        cancelButtonText: 'Hủy',
      }
    );
    await api.post(`/maintenance/${item.id}/submit`);
    ElMessage.success('Đã gửi phê duyệt thành công. Yêu cầu của bạn đang chờ trưởng phòng xem xét.');
    const sidx = requests.value.findIndex((r: any) => r.id === item.id);
    if (sidx !== -1) requests.value[sidx] = { ...requests.value[sidx], status: 'pending' };
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      ElMessage.error(errorMessage);
    }
  }
};

const canApproveAtCurrentLevel = (row: any) => {
  if (!authStore.user) return false;
  
  const status = row.status;
  const userRole = authStore.user.role;
  
  // Department head can approve at level 1
  if (userRole === 'department_head' && (status === 'pending' || status === 'new')) {
    return authStore.user.department_id === row.department_id;
  }
  
  // Admin can approve at level 2
  if (userRole === 'admin' && status === 'approved_by_head') {
    return true;
  }
  
  // Director can approve at level 3
  if (userRole === 'director' && status === 'approved_by_admin') {
    return true;
  }
  
  return false;
};

const getApproveButtonText = (row: any) => {
  if (!authStore.user) return 'Phê duyệt';
  
  const status = row.status;
  const userRole = authStore.user.role;
  
  if (userRole === 'department_head' && (status === 'pending' || status === 'new')) {
    return 'Phê duyệt (Trưởng Đơn vị)';
  }
  if (userRole === 'admin' && status === 'approved_by_head') {
    return 'Phê duyệt (Quản trị viên)';
  }
  if (userRole === 'director' && status === 'approved_by_admin') {
    return 'Phê duyệt (Giám hiệu)';
  }
  
  return 'Phê duyệt';
};

const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn phê duyệt yêu cầu này? Yêu cầu sẽ được chuyển lên cấp trên tiếp theo.',
      'Xác nhận phê duyệt',
      {
        type: 'warning',
        confirmButtonText: 'Phê duyệt',
        cancelButtonText: 'Hủy',
      }
    );
    await api.put(`/maintenance/${id}/approve`);
    const userRole = authStore.user?.role;
    const aidx = requests.value.findIndex((r: any) => r.id === id);
    if (aidx !== -1 && userRole) {
      const next = getNextApprovalStatus(requests.value[aidx].status, userRole);
      if (next) requests.value[aidx] = { ...requests.value[aidx], status: next };
    }
    ElMessage.success('Đã phê duyệt thành công. Yêu cầu đã được chuyển lên cấp trên.');
    notificationStore.fetchNotifications(true);
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      ElMessage.error(errorMessage);
    }
  }
};

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa yêu cầu này? Hành động này không thể hoàn tác.',
      'Xác nhận xóa',
      {
        type: 'warning',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        buttonStyle: {
          confirmButton: 'danger',
        },
      }
    );
    await api.delete(`/maintenance/${item.id}`);
    ElMessage.success('Đã xóa yêu cầu thành công');
    requests.value = requests.value.filter((r: any) => r.id !== item.id);
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      ElMessage.error(errorMessage);
    }
  }
};

const handleFormSuccess = () => {
  formDialogVisible.value = false;
  fetchData({}, true);
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    new: 'info',
    pending: 'warning',
    approved_by_head: 'primary',
    approved_by_admin: 'primary',
    approved_by_director: 'success',
    in_progress: 'warning',
    done: 'success',
    completed: 'success',
    rejected: 'danger',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
    rejected_by_director: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Nháp',
    new: t('maintenance.status.new'),
    pending: 'Chờ phê duyệt',
    approved: t('maintenance.status.approved'),
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    approved_by_director: 'Giám hiệu đã duyệt',
    in_progress: t('maintenance.status.in_progress'),
    done: t('maintenance.status.done'),
    completed: 'Hoàn tất',
    rejected: t('maintenance.status.rejected'),
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
    rejected_by_director: 'Giám hiệu từ chối',
  };
  return statusMap[status] || t(`maintenance.status.${status}`) || status;
};

const formatCurrency = (value: number) => {
  if (!value) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};
</script>

<style scoped>
.procurement-list {
  padding: 10px 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h4 {
  margin: 0;
  color: #303133;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section .el-select {
  width: 100%;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
