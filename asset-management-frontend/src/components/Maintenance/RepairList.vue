<template>
  <div class="repair-list">
    <!-- Header with create button -->
    <div class="list-header">
      <h4>Đề nghị sửa chữa</h4>
      <el-button
        v-if="!authStore.isDirector"
        type="primary"
        :icon="Plus"
        @click="handleCreate"
      >
        Tạo đề nghị sửa chữa
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="filterStatus"
            placeholder="Lọc theo trạng thái"
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
        <el-col :xs="24" :sm="12" :md="6">
          <DepartmentTreeSelect
            v-model="filterDepartment"
            placeholder="Lọc theo đơn vị"
            @change="handleFilter"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
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
          label="Mã tài sản"
          width="120"
        >
          <template #default="{ row }">
            {{ row.asset?.asset_code || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="Tên tài sản"
          min-width="200"
        >
          <template #default="{ row }">
            {{ row.asset?.name || '-' }}
            <el-tag
              v-if="row.source_inventory_report_id"
              size="small"
              type="info"
              style="margin-left:6px; font-size:11px"
              title="Đề nghị sửa chữa được tạo tự động từ kiểm kê định kỳ"
            >
              Từ kiểm kê
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Nguyên giá"
          width="150"
          align="right"
        >
          <template #default="{ row }">
            {{ row.asset?.purchase_price ? formatCurrency(Number(row.asset.purchase_price)) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="Chi phí dự kiến"
          width="150"
          align="right"
        >
          <template #default="{ row }">
            {{ row.estimated_cost ? formatCurrency(Number(row.estimated_cost)) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="Tỷ lệ"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span
              v-if="row.asset?.purchase_price && row.estimated_cost" 
              :style="{ color: (Number(row.estimated_cost) / Number(row.asset.purchase_price) * 100) > 30 ? '#f56c6c' : '#67c23a' }"
            >
              {{ ((Number(row.estimated_cost) / Number(row.asset.purchase_price)) * 100).toFixed(1) }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="department.name"
          label="Đơn vị"
          min-width="150"
        />
        <el-table-column
          prop="status"
          label="Trạng thái"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          min-width="320"
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
            <el-button 
              v-if="canDelete(row)"
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
            >
              {{ $t('common.delete') }}
            </el-button>
            <el-button 
              v-if="(row.status === 'draft' || row.status === 'rejected' || row.status?.startsWith('rejected_by')) && row.requested_by === authStore.user?.id"
              size="small" 
              type="success" 
              @click="handleSubmitForApproval(row)"
            >
              Gửi phê duyệt
            </el-button>
            <el-button 
              v-if="canApproveAtCurrentLevel(row)"
              size="small" 
              type="success" 
              @click="handleApprove(row)"
            >
              {{ getApproveButtonText(row) }}
            </el-button>
            <el-button
              v-if="canCompleteRepair(row)"
              size="small"
              type="warning"
              @click="handleCompleteRepair(row.id)"
            >
              Hoàn thành sửa chữa
            </el-button>
            <el-button
              v-if="authStore.isAdmin && row.status === 'in_progress' && !row.linked_disposal_case_id"
              size="small"
              type="danger"
              :loading="toDisposalLoading"
              @click="handleToDisposal(row)"
            >
              Chuyển sang Thanh lý/Tiêu hủy
            </el-button>
            <el-button
              v-if="authStore.isAdmin && row.linked_disposal_case_id"
              size="small"
              type="warning"
              @click="router.push({ path: '/asset-disposals', query: { openId: String(row.linked_disposal_case_id) } })"
            >
              Xem hồ sơ Thanh lý/Tiêu hủy
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
    <RepairFormDialog
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

    <!-- Admin Level-2 Approval Dialog with cost info -->
    <el-dialog
      v-model="adminApprovalVisible"
      title="Phê duyệt (Quản trị viên)"
      width="480px"
      :close-on-click-modal="false"
    >
      <div v-if="adminApprovalRow">
        <el-descriptions
          :column="1"
          border
          size="small"
          class="cost-info-table"
        >
          <el-descriptions-item label="Tên tài sản">
            {{ adminApprovalRow.asset?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="Chi phí dự kiến">
            <el-input-number
              v-model="adminEstimatedCost"
              :min="0"
              :step="100000"
              :precision="0"
              :controls="true"
              placeholder="Nhập chi phí dự kiến"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="Nguyên giá tài sản">
            <span
              v-if="adminApprovalRow.asset?.purchase_price"
              style="font-weight:600"
            >
              {{ formatCurrency(Number(adminApprovalRow.asset.purchase_price)) }}
            </span>
            <el-tag
              v-else
              type="warning"
              size="small"
            >
              Chưa xác minh
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Tỷ lệ chi phí / nguyên giá">
            <template v-if="adminApprovalRow.asset?.purchase_price && adminEstimatedCost">
              <el-tag
                :type="(adminEstimatedCost / Number(adminApprovalRow.asset.purchase_price) * 100) > 30 ? 'danger' : 'success'"
                size="small"
              >
                {{ ((adminEstimatedCost / Number(adminApprovalRow.asset.purchase_price)) * 100).toFixed(1) }}%
              </el-tag>
              <span
                v-if="(adminEstimatedCost / Number(adminApprovalRow.asset.purchase_price) * 100) > 30"
                style="color:#f56c6c; margin-left:8px; font-size:12px;"
              >
                ⚠️ Vượt ngưỡng 30% — cần thông báo rõ lên Giám hiệu
              </span>
            </template>
            <el-tag
              v-else
              type="info"
              size="small"
            >
              Không tính được
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top:16px">
          <div style="margin-bottom:6px; font-weight:500">
            Ghi chú cho Giám hiệu (sẽ lưu vào lịch sử phê duyệt):
          </div>
          <el-input
            v-model="adminApprovalNotes"
            type="textarea"
            :rows="3"
            placeholder="Nhập nhận xét, xác minh nguyên giá, kiến nghị xử lý..."
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="adminApprovalVisible = false">
          Hủy
        </el-button>
        <el-button
          type="success"
          :loading="approvalLoading"
          @click="submitAdminApproval"
        >
          Phê duyệt và gửi Giám hiệu
        </el-button>
      </template>
    </el-dialog>
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
import RepairFormDialog from './RepairFormDialog.vue';
import MaintenanceDetailDialog from './MaintenanceDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import api from '@/services/api';
import assetDisposalService from '@/services/assetDisposal.service';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const getNextApprovalStatus = (currentStatus: string, role: string): string | null => {
  if (role === 'department_head' && (currentStatus === 'pending' || currentStatus === 'new')) return 'approved_by_head';
  if (role === 'admin' && currentStatus === 'approved_by_head') return 'approved_by_admin';
  if (role === 'admin' && currentStatus === 'repair_completed') return 'completed';
  if (role === 'director' && currentStatus === 'approved_by_admin') return 'approved_by_director';
  return null;
};
const departmentStore = useDepartmentStore();

const loading = ref(false);
const requests = ref<any[]>([]);
const pagination = ref<any>(null);
const filterStatus = ref<string | null>(null);
const filterDepartment = ref<number | null>(null);
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentItem = ref<any>(null);

// Admin level-2 approval dialog
const adminApprovalVisible = ref(false);
const adminApprovalNotes = ref('');
const adminApprovalRow = ref<any>(null);
const adminEstimatedCost = ref<number | null>(null);
const approvalLoading = ref(false);
const toDisposalLoading = ref(false);

const statuses = computed(() => [
  { value: 'draft', label: 'Nháp' },
  { value: 'new', label: t('maintenance.status.new') },
  { value: 'pending', label: 'Chờ phê duyệt' },
  { value: 'approved_by_head', label: 'Trưởng Đơn vị đã duyệt' },
  { value: 'approved_by_admin', label: 'Quản trị viên đã duyệt' },
  { value: 'approved_by_director', label: 'Giám hiệu đã duyệt - Chờ sửa chữa' },
  { value: 'in_progress', label: 'Đang thực hiện sửa chữa' },
  { value: 'repair_completed', label: 'Đã sửa xong - Chờ xác nhận' },
  { value: 'repair_approved', label: 'Đã xác nhận hoàn thành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'rejected', label: t('maintenance.status.rejected') },
  { value: 'rejected_by_head', label: 'Trưởng Đơn vị từ chối' },
  { value: 'rejected_by_admin', label: 'Quản trị viên từ chối' },
  { value: 'rejected_by_director', label: 'Giám hiệu từ chối' },
  { value: 'rejected_due_to_high_cost', label: 'Từ chối do chi phí cao' },
]);

onMounted(async () => {
  await fetchData();
  await departmentStore.fetchDepartments();
});

let isFetching = false;
const fetchData = async (params: any = {}, silent = false) => {
  if (isFetching) {
    return;
  }
  isFetching = true;
  if (!silent) loading.value = true;
  try {
    const requestParams: any = {
      ...params,
      request_type: 'repair',
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
    console.error('Error fetching repair requests:', error);
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
    const response: any = await api.get(`/maintenance/${item.id}`);
    console.log('📥 [RepairList] handleView response:', {
      hasData: !!response.data,
      hasDamageImages: !!response.data?.damageImages,
      damageImagesCount: response.data?.damageImages?.length || 0,
      responseKeys: response.data ? Object.keys(response.data) : [],
    });
    
    // Ensure damageImages is available
    if (response.data) {
      currentItem.value = response.data;
      detailDialogVisible.value = true;
    } else {
      ElMessage.error('Không thể tải chi tiết yêu cầu');
    }
  } catch (error: any) {
    console.error('❌ [RepairList] Error loading maintenance:', error);
    ElMessage.error(error.message || 'Không thể tải chi tiết yêu cầu');
  }
};

const canEdit = (item: any) => {
  const editableStatuses = ['draft', 'new', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'];
  const isEditable = editableStatuses.includes(item.status);
  
  if (['draft', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'].includes(item.status)) {
    return isEditable && item.requested_by === authStore.user?.id;
  }
  
  return isEditable && (authStore.isManager || item.requested_by === authStore.user?.id);
};

const canDelete = (item: any) => {
  const deletableStatuses = ['draft', 'new'];
  return deletableStatuses.includes(item.status) && item.requested_by === authStore.user?.id;
};

const handleSubmitForApproval = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn gửi đề nghị này lên phê duyệt?',
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

  if (userRole === 'department_head' && (status === 'pending' || status === 'new')) {
    return authStore.user.department_id === row.department_id;
  }
  if (userRole === 'admin' && status === 'approved_by_head') return true;
  if (userRole === 'director' && status === 'approved_by_admin') return true;
  // Admin xác nhận hoàn thành sửa chữa
  if (userRole === 'admin' && status === 'repair_completed') return true;

  return false;
};

const canCompleteRepair = (row: any) => {
  if (!authStore.user) return false;
  return (
    row.status === 'in_progress' &&
    authStore.user.role === 'admin'
  );
};

const getApproveButtonText = (row: any) => {
  if (!authStore.user) return 'Phê duyệt';
  const { status } = row;
  const userRole = authStore.user.role;

  if (userRole === 'department_head' && (status === 'pending' || status === 'new')) return 'Phê duyệt (Trưởng Đơn vị)';
  if (userRole === 'admin' && status === 'approved_by_head') return 'Phê duyệt (Quản trị viên)';
  if (userRole === 'director' && status === 'approved_by_admin') return 'Phê duyệt (Giám hiệu)';
  if (userRole === 'admin' && status === 'repair_completed') return 'Xác nhận hoàn thành sửa chữa';

  return 'Phê duyệt';
};

const handleApprove = async (row: any) => {
  const id = row.id;
  const userRole = authStore.user?.role;

  // Admin duyệt cấp 2 (approved_by_head): hiển thị dialog với thông tin chi phí
  if (userRole === 'admin' && row.status === 'approved_by_head') {
    adminApprovalRow.value = row;
    adminApprovalNotes.value = '';
    adminEstimatedCost.value = row.estimated_cost ? Number(row.estimated_cost) : null;
    adminApprovalVisible.value = true;
    return;
  }

  // Các cấp khác: confirm bình thường
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn phê duyệt đề nghị này?',
      'Xác nhận phê duyệt',
      { type: 'warning', confirmButtonText: 'Phê duyệt', cancelButtonText: 'Hủy' }
    );
    await api.put(`/maintenance/${id}/approve`);
    const userRole = authStore.user?.role;
    const aidx = requests.value.findIndex((r: any) => r.id === id);
    if (aidx !== -1 && userRole) {
      const next = getNextApprovalStatus(requests.value[aidx].status, userRole);
      if (next) requests.value[aidx] = { ...requests.value[aidx], status: next };
    }
    ElMessage.success('Đã phê duyệt thành công.');
    notificationStore.fetchNotifications(true);
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
    }
  }
};

const submitAdminApproval = async () => {
  if (!adminApprovalRow.value) return;
  approvalLoading.value = true;
  try {
    await api.put(`/maintenance/${adminApprovalRow.value.id}/approve`, {
      notes: adminApprovalNotes.value || undefined,
      estimated_cost: adminEstimatedCost.value ?? undefined,
    });
    ElMessage.success('Đã phê duyệt (Quản trị viên). Chuyển lên Giám hiệu.');
    adminApprovalVisible.value = false;
    const aaidx = requests.value.findIndex((r: any) => r.id === adminApprovalRow.value?.id);
    if (aaidx !== -1) requests.value[aaidx] = { ...requests.value[aaidx], status: 'approved_by_admin' };
    notificationStore.fetchNotifications(true);
    fetchData({}, true);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
  } finally {
    approvalLoading.value = false;
  }
};

const handleCompleteRepair = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      'Đánh dấu sửa chữa đã hoàn thành? Yêu cầu sẽ gửi Admin xác nhận.',
      'Hoàn thành sửa chữa',
      { type: 'success', confirmButtonText: 'Hoàn thành', cancelButtonText: 'Hủy' }
    );
    await api.post(`/maintenance/${id}/complete-repair`);
    ElMessage.success('Đã báo hoàn thành sửa chữa. Chờ Admin xác nhận.');
    const cridx = requests.value.findIndex((r: any) => r.id === id);
    if (cridx !== -1) requests.value[cridx] = { ...requests.value[cridx], status: 'repair_completed' };
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
    }
  }
};

const handleToDisposal = async (row: any) => {
  try {
    const result = await ElMessageBox.confirm(
      `Chuyển yêu cầu sửa chữa này sang xử lý Thanh lý hoặc Tiêu hủy tài sản?\n\nTài sản: ${row.asset?.name || '-'}\nChi phí dự kiến: ${row.estimated_cost ? formatCurrency(Number(row.estimated_cost)) : 'Chưa có'}`,
      'Chuyển sang Thanh lý / Tiêu hủy',
      {
        type: 'warning',
        showCancelButton: true,
        distinguishCancelAndClose: true,
        confirmButtonText: 'Thanh lý',
        cancelButtonText: 'Tiêu hủy',
        customClass: 'disposal-choice-dialog',
      }
    ).then(() => 'liquidation').catch((action: string) => {
      if (action === 'cancel') return 'destruction';
      throw action;
    });
    toDisposalLoading.value = true;
    const res: any = await assetDisposalService.createFromMaintenance(row.id, result as 'liquidation' | 'destruction');
    const caseId = res?.data?.id;
    ElMessage.success('Đã tạo hồ sơ Thanh lý/Tiêu hủy. Đang chuyển hướng...');
    fetchData({}, true);
    await router.push({ path: '/asset-disposals', query: { openId: String(caseId) } });
  } catch (error: any) {
    if (error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  } finally {
    toDisposalLoading.value = false;
  }
};

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa đề nghị này? Hành động này không thể hoàn tác.',
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
    ElMessage.success('Đã xóa đề nghị thành công');
    requests.value = requests.value.filter((r: any) => r.id !== item.id);
    fetchData({}, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      ElMessage.error(errorMessage);
    }
  }
};

const handleFormSuccess = async () => {
  formDialogVisible.value = false;
  
  // If detail dialog is open, reload the current item to get fresh data including damageImages
  if (detailDialogVisible.value && currentItem.value?.id) {
    try {
      const response: any = await api.get(`/maintenance/${currentItem.value.id}`);
      console.log('🔄 [RepairList] Reloading current item after save:', {
        hasDamageImages: !!response.data?.damageImages,
        damageImagesCount: response.data?.damageImages?.length || 0,
      });
      currentItem.value = response.data;
    } catch (error: any) {
      console.error('❌ [RepairList] Error reloading item:', error);
    }
  }
  
  // Reload list
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
    repair_completed: 'primary',
    repair_approved: 'success',
    completed: 'success',
    rejected: 'danger',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
    rejected_by_director: 'danger',
    rejected_due_to_high_cost: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Nháp',
    new: 'Chờ phê duyệt',
    pending: 'Chờ phê duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    approved_by_director: 'Giám hiệu đã duyệt',
    in_progress: 'Đang sửa chữa',
    repair_completed: 'Đã sửa - Chờ xác nhận',
    repair_approved: 'Xác nhận hoàn thành',
    completed: 'Hoàn thành',
    rejected: t('maintenance.status.rejected'),
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
    rejected_by_director: 'Giám hiệu từ chối',
    rejected_due_to_high_cost: 'Từ chối - chi phí cao',
  };
  return statusMap[status] || status;
};

const formatCurrency = (value: number) => {
  if (!value) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};
</script>

<style scoped>
.repair-list {
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

.cost-info-table {
  font-size: 13px;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .list-header .el-button {
    width: 100%;
  }

  .filter-section .el-row {
    gap: 10px 0;
  }
}
</style>
