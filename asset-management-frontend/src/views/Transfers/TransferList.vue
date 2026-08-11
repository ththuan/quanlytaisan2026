<template>
  <div class="transfer-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('transfers.title') }}</h3>
          <el-button
            v-if="!authStore.isDirector"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            {{ $t('transfers.createTransfer') }}
          </el-button>
        </div>
      </template>

      <!-- Filters -->
      <div class="filter-section">
        <el-row
          :gutter="16"
          class="filter-row"
        >
          <el-col
            :xs="24"
            :sm="10"
            :md="7"
          >
            <el-input
              v-model="searchQuery"
              :placeholder="$t('transfers.enterAssetCode')"
              clearable
              @clear="handleFilterImmediate"
              @keyup.enter="handleFilterImmediate"
            />
          </el-col>
          <el-col
            :xs="12"
            :sm="7"
            :md="5"
          >
            <el-select
              v-model="filterStatus"
              :placeholder="$t('transfers.filterByStatus')"
              clearable
              @change="handleFilterImmediate"
            >
              <el-option
                v-for="s in statuses"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-col>
          <el-col
            :xs="12"
            :sm="7"
            :md="6"
          >
            <DepartmentTreeSelect
              v-model="filterDepartment"
              :placeholder="$t('transfers.filterByDepartment')"
              @change="handleFilterImmediate"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="24"
            :md="6"
            class="filter-actions"
          >
            <el-button
              type="primary"
              @click="handleFilterImmediate"
            >
              {{ $t('common.search') }}
            </el-button>
            <el-button @click="handleReset">
              {{ $t('common.refresh') }}
            </el-button>
          </el-col>
        </el-row>
      </div>

      <div class="transfer-table-wrapper">
        <el-table
          v-loading="transferStore.loading"
          :data="transferStore.transfers"
          border
          stripe
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
              <template v-if="row.status === 'pending' && authStore.isManager">
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

      <div class="pagination">
        <el-pagination
          v-if="transferStore.pagination"
          :current-page="transferStore.pagination.page"
          :page-size="transferStore.pagination.limit"
          :total="transferStore.pagination.total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
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
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import TransferFormDialog from '@/components/Transfers/TransferFormDialog.vue';
import TransferDetailDialog from '@/components/Transfers/TransferDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import moment from 'moment';

const { t } = useI18n();
const transferStore = useTransferStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

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

const handleCreate = () => {
  formDialogVisible.value = true;
};

const handleView = (transfer: any) => {
  currentTransfer.value = transfer;
  detailDialogVisible.value = true;
};

const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('transfers.approveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    await transferStore.approveTransfer(id);
    const aidx = transferStore.transfers.findIndex((t: any) => t.id === id);
    if (aidx !== -1) transferStore.transfers[aidx] = { ...transferStore.transfers[aidx], status: 'approved' };
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
    });
    await transferStore.rejectTransfer(id, value);
    const ridx = transferStore.transfers.findIndex((t: any) => t.id === id);
    if (ridx !== -1) transferStore.transfers[ridx] = { ...transferStore.transfers[ridx], status: 'rejected' };
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

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success',
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
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.filter-section .el-select {
  width: 100%;
}

.filter-row {
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .filter-actions {
    justify-content: flex-start;
  }
}

.transfer-table-wrapper {
  width: 100%;
  position: relative;
  z-index: 1;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
