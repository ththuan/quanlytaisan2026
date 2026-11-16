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
            v-if="authStore.can('transfers.create', ['admin', 'director', 'department_head', 'staff'])"
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

      <div class="transfer-table-wrapper responsive-table app-desktop-table">
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
            class-name="app-index-cell"
          />
          <el-table-column
            prop="asset.asset_code"
            :label="$t('transfers.assetCode')"
            width="90"
          />
          <el-table-column
            prop="asset.name"
            :label="$t('transfers.assetName')"
            min-width="190"
          />
          <el-table-column
            :label="$t('transfers.fromDepartment')"
            width="100"
          >
            <template #default="{ row }">
              {{ row.from_department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('transfers.toDepartment')"
            width="100"
          >
            <template #default="{ row }">
              {{ row.to_department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="requester.fullname"
            :label="$t('transfers.requestedBy')"
            width="100"
          />
          <el-table-column
            prop="status"
            :label="$t('common.status')"
            width="145"
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
            width="120"
          >
            <template #default="{ row }">
              {{ formatDate(row.transfer_date) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            width="130"
            fixed="right"
          >
            <template #default="{ row }">
              <div class="transfer-actions">
                <el-button
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </el-button>
                <el-dropdown
                  v-if="canApprove(row)"
                  trigger="click"
                  placement="bottom-end"
                  @command="(command: 'approve' | 'reject') => handleTransferCommand(command, row)"
                >
                  <el-button
                    size="small"
                    class="more-actions-button"
                    :icon="MoreFilled"
                  />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="approve">
                        {{ $t('transfers.approve') }}
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="reject"
                        divided
                      >
                        {{ $t('transfers.reject') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="app-mobile-list transfer-mobile-list">
        <article
          v-for="transfer in mobileTransfers"
          :key="transfer.id"
          class="app-mobile-card app-mobile-card--interactive"
          @click="handleView(transfer)"
        >
          <div class="app-mobile-card__head">
            <div class="app-mobile-card__heading">
              <span class="app-mobile-card__title">{{ transfer.asset?.name || '-' }}</span>
              <span class="app-mobile-card__subtitle">{{ transfer.asset?.asset_code || '-' }}</span>
            </div>
            <el-tag
              :type="getStatusType(transfer.status)"
              size="small"
              class="app-mobile-card__status"
            >
              {{ getStatusText(transfer.status) }}
            </el-tag>
          </div>

          <div class="app-mobile-card__grid">
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">{{ $t('transfers.fromDepartment') }}</span>
              <span class="app-mobile-card__field-value">{{ transfer.from_department?.name || '-' }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">{{ $t('transfers.toDepartment') }}</span>
              <span class="app-mobile-card__field-value">{{ transfer.to_department?.name || '-' }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">{{ $t('transfers.requestedBy') }}</span>
              <span class="app-mobile-card__field-value">{{ transfer.requester?.fullname || '-' }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">{{ $t('transfers.transferDate') }}</span>
              <span class="app-mobile-card__field-value">{{ formatDate(transfer.transfer_date) }}</span>
            </div>
          </div>

          <div
            class="app-mobile-card__actions"
            @click.stop
          >
            <el-button
              size="small"
              @click="handleView(transfer)"
            >
              {{ $t('common.view') }}
            </el-button>
            <template v-if="canApprove(transfer)">
              <el-button
                size="small"
                type="success"
                @click="handleApprove(transfer.id)"
              >
                {{ $t('transfers.approve') }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleReject(transfer.id)"
              >
                {{ $t('transfers.reject') }}
              </el-button>
            </template>
          </div>
        </article>

        <el-empty
          v-if="!transferStore.loading && transferStore.transfers.length === 0"
          description="Chưa có phiếu điều chuyển"
          :image-size="80"
        />
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
import { MoreFilled, Plus, Sort } from '@element-plus/icons-vue';
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

const mobileTransfers = computed<any[]>(() => transferStore.transfers as any[]);

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
  const scope = authStore.permissionScope('transfers.approve', ['admin', 'department_head', 'staff']);
  if (scope === 'all') return transfer.status === 'approved_by_destination';
  if (scope === 'department') {
    return ['pending', 'approved_by_head'].includes(transfer.status)
      && Number(transfer.to_department_id) === departmentId;
  }
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

const handleTransferCommand = (command: 'approve' | 'reject', row: any) => {
  if (command === 'approve') {
    handleApprove(row.id);
    return;
  }
  handleReject(row.id);
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

@media (max-width: 1367px) {
  html.app-overlay .transfer-list {
    min-height: 0;
    padding: 0;
    background: transparent;
  }
}

.transfer-table-wrapper {
  width: 100%;
  position: relative;
  z-index: 1;
}

.transfer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.transfer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.more-actions-button {
  width: 32px;
  padding: 0;
}
</style>
