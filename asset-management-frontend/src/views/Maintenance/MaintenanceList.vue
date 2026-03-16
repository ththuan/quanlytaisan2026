<template>
  <div class="maintenance-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('maintenance.title') }}</h3>
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            {{ $t('maintenance.createRequest') }}
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
            :sm="8"
            :md="6"
          >
            <el-select
              v-model="filterStatus"
              :placeholder="$t('maintenance.filterByStatus')"
              clearable
              style="width: 100%"
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
          <el-col
            :xs="24"
            :sm="8"
            :md="6"
          >
            <el-select
              v-model="filterUrgency"
              :placeholder="$t('maintenance.filterByUrgency')"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option
                v-for="u in urgencies"
                :key="u.value"
                :label="u.label"
                :value="u.value"
              />
            </el-select>
          </el-col>
          <el-col
            :xs="24"
            :sm="8"
            :md="6"
          >
            <el-select
              v-model="filterDepartment"
              :placeholder="$t('maintenance.filterByDepartment')"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option
                v-for="d in departments"
                :key="d.id"
                :label="d.name"
                :value="d.id"
              />
            </el-select>
          </el-col>
          <el-col
            :xs="24"
            :sm="24"
            :md="6"
            class="filter-actions"
          >
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

      <div class="responsive-table">
        <el-table
          v-loading="maintenanceStore.loading"
          :data="maintenanceStore.requests"
          border
          stripe
        >
          <el-table-column
            type="index"
            width="50"
            label="#"
          />
          <el-table-column
            prop="asset.asset_code"
            :label="$t('maintenance.assetCode')"
            width="120"
          />
          <el-table-column
            prop="asset.name"
            :label="$t('maintenance.assetName')"
            min-width="180"
          />
          <el-table-column
            prop="description"
            :label="$t('maintenance.description')"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column
            prop="urgency"
            :label="$t('maintenance.urgency')"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="getUrgencyType(row.urgency)">
                {{ getUrgencyText(row.urgency) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="$t('common.status')"
            width="130"
          >
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="cost"
            :label="$t('maintenance.cost')"
            width="120"
          >
            <template #default="{ row }">
              {{ row.cost ? formatCurrency(row.cost) : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="created_at"
            :label="$t('common.createdAt')"
            width="140"
          >
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            width="220"
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
              <template v-if="row.status === 'new' && authStore.isManager">
                <el-button
                  size="small"
                  type="success"
                  @click="handleApprove(row.id)"
                >
                  {{ $t('maintenance.approve') }}
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-section">
        <div class="pagination-info">
          {{ $t('table.items') }}: <strong>{{ maintenanceStore.requests.length }}</strong> / <strong>{{ maintenanceStore.pagination?.total ?? 0 }}</strong>
        </div>
        <el-pagination
          v-if="maintenanceStore.pagination"
          :current-page="maintenanceStore.pagination.page"
          :page-size="maintenanceStore.pagination.limit"
          :total="maintenanceStore.pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- Maintenance Form Dialog -->
    <MaintenanceFormDialog
      v-model:visible="formDialogVisible"
      :maintenance="currentMaintenance"
      @success="handleFormSuccess"
    />

    <!-- Maintenance Detail Dialog -->
    <MaintenanceDetailDialog
      v-model:visible="detailDialogVisible"
      :maintenance="currentMaintenance"
      @update="handleUpdateStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMaintenanceStore } from '@/stores/maintenance.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDepartments } from '@/composables/useDepartments';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import MaintenanceFormDialog from '@/components/Maintenance/MaintenanceFormDialog.vue';
import MaintenanceDetailDialog from '@/components/Maintenance/MaintenanceDetailDialog.vue';
import moment from 'moment';

const { t } = useI18n();
const maintenanceStore = useMaintenanceStore();
const authStore = useAuthStore();

// Sử dụng composable với caching tự động
const { activeDepartments: departments, isLoading: _departmentsLoading } = useDepartments();

const filterStatus = ref('');
const filterUrgency = ref('');
const filterDepartment = ref('');
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentMaintenance = ref<any>(null);

const statuses = computed(() => [
  { value: 'new', label: t('maintenance.status.new') },
  { value: 'approved', label: t('maintenance.status.approved') },
  { value: 'in_progress', label: t('maintenance.status.in_progress') },
  { value: 'done', label: t('maintenance.status.done') },
  { value: 'rejected', label: t('maintenance.status.rejected') },
]);

const urgencies = computed(() => [
  { value: 'low', label: t('maintenance.urgency_level.low') },
  { value: 'normal', label: t('maintenance.urgency_level.normal') },
  { value: 'high', label: t('maintenance.urgency_level.high') },
  { value: 'critical', label: t('maintenance.urgency_level.critical') },
]);

onMounted(async () => {
  await maintenanceStore.fetchRequests();
  // Departments tự động load qua composable
});

const handleFilter = () => {
  maintenanceStore.fetchRequests({
    status: filterStatus.value,
    urgency: filterUrgency.value,
    department_id: filterDepartment.value,
  });
};

const handleReset = () => {
  filterStatus.value = '';
  filterUrgency.value = '';
  filterDepartment.value = '';
  maintenanceStore.fetchRequests();
};

const handlePageChange = (page: number) => {
  maintenanceStore.fetchRequests({
    page,
    status: filterStatus.value,
    urgency: filterUrgency.value,
    department_id: filterDepartment.value,
  });
};

const handleSizeChange = (size: number) => {
  maintenanceStore.fetchRequests({
    limit: size,
    page: 1,
    status: filterStatus.value,
    urgency: filterUrgency.value,
    department_id: filterDepartment.value,
  });
};

const handleCreate = () => {
  currentMaintenance.value = null;
  formDialogVisible.value = true;
};

const handleEdit = (maintenance: any) => {
  currentMaintenance.value = maintenance;
  formDialogVisible.value = true;
};

const handleView = (maintenance: any) => {
  currentMaintenance.value = maintenance;
  detailDialogVisible.value = true;
};

const canEdit = (maintenance: any) => {
  return ['new', 'approved', 'in_progress'].includes(maintenance.status) && authStore.isManager;
};

const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('maintenance.approveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    await maintenanceStore.approveRequest(id);
    ElMessage.success(t('maintenance.approveSuccess'));
    maintenanceStore.fetchRequests();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
    }
  }
};

const handleUpdateStatus = async () => {
  maintenanceStore.fetchRequests();
};

const handleFormSuccess = () => {
  formDialogVisible.value = false;
  maintenanceStore.fetchRequests();
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    new: 'info',
    approved: 'primary',
    in_progress: 'warning',
    done: 'success',
    rejected: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  return t(`maintenance.status.${status}`);
};

const getUrgencyType = (urgency: string) => {
  const types: Record<string, string> = {
    low: 'info',
    normal: '',
    high: 'warning',
    critical: 'danger',
  };
  return types[urgency] || '';
};

const getUrgencyText = (urgency: string) => {
  return t(`maintenance.urgency_level.${urgency}`);
};

const formatDate = (date: string) => {
  return date ? moment(date).format('DD/MM/YYYY') : '-';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};
</script>

<style scoped>
.maintenance-list {
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
  flex-wrap: wrap;
}
.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.pagination-info {
  font-size: 14px;
  color: #606266;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
