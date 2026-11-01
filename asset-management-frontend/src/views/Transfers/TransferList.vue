<template>
  <div class="transfer-list">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Sort />
            </el-icon>
            {{ $t('transfers.title') }}
          </h1>
          <p class="page-subtitle">
            Quản lý điều chuyển tài sản giữa các đơn vị
          </p>
        </div>
        <div class="header-right">
          <el-button
            v-if="!authStore.isDirector"
            type="primary"
            :icon="Plus"
            size="default"
            @click="handleCreate"
          >
            {{ $t('transfers.createTransfer') }}
          </el-button>
        </div>
      </div>
    </div>

    <el-card
      class="list-card"
      shadow="never"
    >
      <!-- Filters -->
      <div class="list-filter">
        <div class="filter-row">
          <div class="filter-item search-input">
            <el-input
              v-model="searchQuery"
              :placeholder="$t('transfers.enterAssetCode')"
              clearable
              size="large"
              @clear="handleFilterImmediate"
              @keyup.enter="handleFilterImmediate"
            />
          </div>
          <div class="filter-item">
            <el-select
              v-model="filterStatus"
              :placeholder="$t('transfers.filterByStatus')"
              clearable
              size="large"
              @change="handleFilterImmediate"
            >
              <el-option
                v-for="s in statuses"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </div>
          <div class="filter-item">
            <DepartmentTreeSelect
              v-model="filterDepartment"
              :placeholder="$t('transfers.filterByDepartment')"
              size="large"
              @change="handleFilterImmediate"
            />
          </div>
          <div class="filter-actions">
            <el-button
              type="primary"
              @click="handleFilterImmediate"
            >
              {{ $t('common.search') }}
            </el-button>
            <el-button @click="handleReset">
              {{ $t('common.refresh') }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="transfer-table-wrapper responsive-table">
        <el-table
          v-loading="transferStore.loading"
          :data="transferStore.transfers"
          border
          stripe
          class="list-table"
          style="width: 100%"
        >
          <el-table-column
            type="index"
            width="50"
            label="#"
          />
          <el-table-column
            prop="asset.asset_code"
            :label="$t('transfers.assetCode')"
            width="120"
          />
          <el-table-column
            prop="asset.name"
            :label="$t('transfers.assetName')"
            min-width="180"
          />
          <el-table-column
            :label="$t('transfers.fromDepartment')"
            width="150"
          >
            <template #default="{ row }">
              {{ row.from_department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('transfers.toDepartment')"
            width="150"
          >
            <template #default="{ row }">
              {{ row.to_department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="requester.fullname"
            :label="$t('transfers.requestedBy')"
            width="140"
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
            prop="transfer_date"
            :label="$t('transfers.transferDate')"
            width="160"
          >
            <template #default="{ row }">
              {{ formatDate(row.transfer_date) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            width="200"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                @click="handleView(row)"
              >
                {{ $t('common.view') }}
              </el-button>
              <template v-if="canApprove(row)">
                <el-button
                  size="small"
                  type="success"
                  @click="handleApprove(row.id)"
                >
                  {{ $t('transfers.approve') }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleReject(row.id)"
                >
                  {{ $t('transfers.reject') }}
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="list-pagination">
        <div class="pagination-info">
          Hiển thị <strong>{{ transferStore.transfers.length }}</strong> trong tổng số
          <strong>{{ transferStore.pagination?.total || 0 }}</strong> phiếu điều chuyển
        </div>
        <el-pagination
          v-if="transferStore.pagination"
          :current-page="transferStore.pagination.page"
          :page-size="transferStore.pagination.limit"
          :total="transferStore.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- Transfer Form Dialog -->
    <TransferFormDialog
      v-model:visible="formDialogVisible"
      @success="handleFormSuccess"
    />

    <!-- Transfer Detail Dialog -->
    <TransferDetailDialog
      v-model:visible="detailDialogVisible"
      :transfer="currentTransfer"
      @approved="handleDetailApproval"
    />

    <SignaturePad
      v-model="showSignDialog"
      :title="signTitle"
      :signer-name="signerName"
      @confirm="onSignConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTransferStore } from '@/stores/transfer.store';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useDepartments } from '@/composables/useDepartments';
import { Plus, Sort } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import TransferFormDialog from '@/components/Transfers/TransferFormDialog.vue';
import TransferDetailDialog from '@/components/Transfers/TransferDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import SignaturePad from '@/components/Common/SignaturePad.vue';
import { useSignature } from '@/composables/useSignature';
import moment from 'moment';

const { t } = useI18n();
const transferStore = useTransferStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const {
  show: showSignDialog,
  title: signTitle,
  signerName,
  request: requestSignature,
  onConfirm: onSignConfirm,
} = useSignature();

// Sử dụng composable mới với caching tự động
useDepartments();

const searchQuery = ref('');
const filterStatus = ref('');
const filterDepartment = ref<number | null>(null);
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentTransfer = ref<any>(null);

const statuses = computed(() => [
  { value: 'pending', label: t('transfers.status.pending') },
  { value: 'approved', label: t('transfers.status.approved') },
  { value: 'rejected', label: t('transfers.status.rejected') },
  { value: 'completed', label: t('transfers.status.completed') },
  { value: 'approved_by_head', label: t('transfers.status.approved_by_head') },
  { value: 'approved_by_destination', label: t('transfers.status.approved_by_destination') },
  { value: 'rejected_by_head', label: t('transfers.status.rejected_by_head') },
]);

onMounted(() => {
  transferStore.fetchTransfers();
});

const applyFilters = () => {
  transferStore.fetchTransfers({
    search: searchQuery.value || undefined,
    status: filterStatus.value || undefined,
    to_department_id: filterDepartment.value ?? undefined,
  });
};

const handleFilterImmediate = () => {
  applyFilters();
};

const handleReset = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  filterDepartment.value = null;
  transferStore.fetchTransfers();
};

const handlePageChange = (page: number) => {
  transferStore.fetchTransfers({
    page,
    search: searchQuery.value || undefined,
    status: filterStatus.value || undefined,
    to_department_id: filterDepartment.value ?? undefined,
  });
};

const handleSizeChange = (limit: number) => {
  transferStore.fetchTransfers({
    page: 1,
    limit,
    search: searchQuery.value || undefined,
    status: filterStatus.value || undefined,
    to_department_id: filterDepartment.value ?? undefined,
  });
};

const handleCreate = () => {
  formDialogVisible.value = true;
};

const handleView = (transfer: any) => {
  currentTransfer.value = transfer;
  detailDialogVisible.value = true;
};

const canApprove = (transfer: any) => {
  const departmentId = Number(authStore.userDepartmentId);
  if (authStore.isAdmin) return transfer.status === 'approved_by_destination';
  if (transfer.status === 'pending' || transfer.status === 'approved_by_head') {
    return ['department_head', 'staff'].includes(authStore.user?.role || '')
      && Number(transfer.to_department_id) === departmentId;
  }
  return false;
};

const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('transfers.approveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    const signature = await requestSignature('Ký xác nhận duyệt điều chuyển tài sản');
    if (!signature) return;
    const updatedTransfer = await transferStore.processApproval(id, 'approved', undefined, undefined, signature);
    const aidx = transferStore.transfers.findIndex((t: any) => t.id === id);
    if (aidx !== -1) transferStore.transfers[aidx] = updatedTransfer;
    ElMessage.success(t('transfers.approveSuccess'));
    notificationStore.fetchNotifications(true);
    transferStore.fetchTransfers({
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      to_department_id: filterDepartment.value ?? undefined,
    }, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
    }
  }
};

const handleReject = async (id: number) => {
  try {
    const { value } = await ElMessageBox.prompt(t('transfers.rejectReason'), t('transfers.reject'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      inputPlaceholder: t('transfers.enterReason'),
      inputValidator: (value: string) => String(value || '').trim() ? true : t('transfers.rejectReasonRequired'),
    });
    const signature = await requestSignature('Ký xác nhận từ chối điều chuyển tài sản');
    if (!signature) return;
    const updatedTransfer = await transferStore.processApproval(id, 'rejected', String(value).trim(), undefined, signature);
    const ridx = transferStore.transfers.findIndex((t: any) => t.id === id);
    if (ridx !== -1) transferStore.transfers[ridx] = updatedTransfer;
    ElMessage.success(t('transfers.rejectSuccess'));
    notificationStore.fetchNotifications(true);
    transferStore.fetchTransfers({
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      to_department_id: filterDepartment.value ?? undefined,
    }, true);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
    }
  }
};

const handleFormSuccess = () => {
  formDialogVisible.value = false;
  transferStore.fetchTransfers(undefined, true);
};

const handleDetailApproval = async (updatedTransfer: any) => {
  const index = transferStore.transfers.findIndex((item: any) => item.id === updatedTransfer?.id);
  if (index !== -1) transferStore.transfers[index] = updatedTransfer;
  currentTransfer.value = updatedTransfer;
  await transferStore.fetchTransfers({
    search: searchQuery.value || undefined,
    status: filterStatus.value || undefined,
    to_department_id: filterDepartment.value ?? undefined,
  }, true);
  notificationStore.fetchNotifications(true);
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success',
    approved_by_head: 'primary',
    rejected_by_head: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  return t(`transfers.status.${status}`);
};

const formatDate = (date: string) => {
  return date ? moment(date).format('DD/MM/YYYY HH:mm') : '-';
};
</script>

<style scoped>
.transfer-list {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  min-height: 100dvh;
}

.filter-item .el-select,
.filter-item :deep(.el-select) {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex: 0 0 auto;
}

@media (max-width: 768px) {
  .filter-actions {
    justify-content: flex-start;
    width: 100%;
  }
}

.transfer-table-wrapper {
  width: 100%;
  position: relative;
  z-index: 1;
}
</style>
