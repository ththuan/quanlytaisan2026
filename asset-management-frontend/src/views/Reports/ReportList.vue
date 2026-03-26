<template>
  <div class="report-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('reports.title') }}</h3>
          <div class="card-header__actions">
            <el-button
              v-if="canBulkApprove"
              type="success"
              :disabled="selectedSubmittableCount === 0"
              :loading="reportStore.loading"
              @click="handleBulkApprove"
            >
              {{ $t('reports.bulkApprove') }}
              <template v-if="selectedSubmittableCount">
                ({{ selectedSubmittableCount }})
              </template>
            </el-button>
            <el-button
              v-if="authStore.isManager"
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              {{ $t('reports.createReport') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :span="5">
            <el-select
              v-model="filterYear"
              :placeholder="$t('reports.filterByYear')"
              clearable
              @change="handleFilter"
            >
              <el-option
                v-for="y in years"
                :key="y"
                :label="y.toString()"
                :value="y"
              />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select
              v-model="filterStatus"
              :placeholder="$t('reports.filterByStatus')"
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
          <el-col
            v-if="canFilterByDepartment"
            :span="6"
          >
            <DepartmentTreeSelect
              v-model="filterDepartment"
              :placeholder="$t('reports.filterByDepartment')"
              @change="handleFilter"
            />
          </el-col>
          <el-col :span="canFilterByDepartment ? 6 : 12">
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
          v-loading="reportStore.loading"
          :data="reportStore.reports"
          border
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column
            v-if="canBulkApprove"
            type="selection"
            width="48"
            :selectable="selectableRow"
          />
          <el-table-column
            type="index"
            width="50"
            label="#"
          />
          <el-table-column
            :label="$t('reports.department')"
            min-width="180"
          >
            <template #default="{ row }">
              {{ row.department?.name || '—' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="year"
            :label="$t('reports.year')"
            width="100"
          />
          <el-table-column
            prop="total_assets"
            :label="$t('reports.totalAssets')"
            width="120"
          />
          <el-table-column
            prop="active_assets"
            :label="$t('reports.activeAssets')"
            width="120"
          />
          <el-table-column
            prop="damaged_assets"
            :label="$t('reports.damagedAssets')"
            width="120"
          />
          <el-table-column
            prop="lost_assets"
            :label="$t('reports.lostAssets')"
            width="100"
          />
          <el-table-column
            prop="total_value"
            :label="$t('reports.totalValue')"
            width="150"
          >
            <template #default="{ row }">
              {{ formatCurrency(row.total_value) }}
            </template>
          </el-table-column>
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
            width="240"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                :loading="detailLoading"
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
              <template v-if="row.status === 'draft' && authStore.isManager">
                <el-button
                  size="small"
                  type="primary"
                  @click="handleSubmit(row.id)"
                >
                  {{ $t('reports.submit') }}
                </el-button>
              </template>
              <template v-if="row.status === 'submitted' && (authStore.isAdmin || authStore.isDirector)">
                <el-button
                  size="small"
                  type="success"
                  @click="handleApprove(row.id)"
                >
                  {{ $t('reports.approve') }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleReject(row.id)"
                >
                  {{ $t('reports.reject') }}
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
          v-if="reportStore.pagination"
          :current-page="reportStore.pagination.page"
          :page-size="reportStore.pagination.limit"
          :total="reportStore.pagination.total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Report Form Dialog -->
    <ReportFormDialog
      v-model:visible="formDialogVisible"
      :report="currentReport"
      @success="handleFormSuccess($event)"
    />

    <!-- Report Detail Dialog -->
    <ReportDetailDialog
      v-model:visible="detailDialogVisible"
      :report="currentReport"
      @report-updated="handleDetailReportUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReportStore } from '@/stores/report.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDepartments } from '@/composables/useDepartments';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ReportFormDialog from '@/components/Reports/ReportFormDialog.vue';
import ReportDetailDialog from '@/components/Reports/ReportDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';

const { t } = useI18n();
const reportStore = useReportStore();
const authStore = useAuthStore();

const canBulkApprove = computed(() => authStore.isAdmin || authStore.isDirector);
const canFilterByDepartment = computed(() => authStore.isAdmin || authStore.isDirector);

const selectedRows = ref<any[]>([]);
const onSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};
const selectableRow = (row: any) => row?.status === 'submitted';
const selectedSubmittableCount = computed(
  () => selectedRows.value.filter((r) => r?.status === 'submitted').length
);

const apiErr = (e: any) =>
  e?.response?.data?.message || e?.response?.data?.error || e?.message || t('common.error');

// Sử dụng composable với caching tự động
useDepartments();

const filterYear = ref<number | null>(null);
const filterStatus = ref('');
const filterDepartment = ref<number | null>(null);
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentReport = ref<any>(null);

const currentYear = new Date().getFullYear();
const years = computed(() => {
  const yrs = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    yrs.push(y);
  }
  return yrs;
});

const statuses = computed(() => [
  { value: 'draft', label: t('reports.status.draft') },
  { value: 'submitted', label: t('reports.status.submitted') },
  { value: 'approved', label: t('reports.status.approved') },
  { value: 'rejected', label: t('reports.status.rejected') },
]);

onMounted(async () => {
  await reportStore.fetchReports();
  // Departments tự động load qua composable
});

const handleFilter = () => {
  reportStore.fetchReports({
    page: 1,
    year: filterYear.value,
    status: filterStatus.value,
    department_id: filterDepartment.value,
  });
};

const handleReset = () => {
  filterYear.value = null;
  filterStatus.value = '';
  filterDepartment.value = null;
  reportStore.fetchReports({ page: 1 });
};

const handlePageChange = (page: number) => {
  reportStore.fetchReports({
    page,
    year: filterYear.value,
    status: filterStatus.value,
    department_id: filterDepartment.value,
  });
};

const handleCreate = () => {
  currentReport.value = null;
  formDialogVisible.value = true;
};

const handleEdit = (report: any) => {
  currentReport.value = report;
  formDialogVisible.value = true;
};

const detailLoading = ref(false);

const handleView = async (report: any) => {
  detailLoading.value = true;
  try {
    await reportStore.fetchReportById(report.id);
    currentReport.value = reportStore.currentReport;
    detailDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(apiErr(error));
  } finally {
    detailLoading.value = false;
  }
};

const canEdit = (report: any) => {
  return report.status === 'draft' && authStore.isManager;
};

const handleSubmit = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('reports.submitConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    await reportStore.submitReport(id);
    ElMessage.success(t('reports.submitSuccess'));
    await reportStore.fetchReports(listQueryParams());
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(apiErr(error));
    }
  }
};

const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('reports.approveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    await reportStore.approveReport(id);
    ElMessage.success(t('reports.approveSuccess'));
    selectedRows.value = [];
    await reportStore.fetchReports(listQueryParams());
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(apiErr(error));
    }
  }
};

const handleBulkApprove = async () => {
  const ids = selectedRows.value.filter((r) => r?.status === 'submitted').map((r) => r.id);
  if (!ids.length) {
    ElMessage.warning(t('reports.bulkApproveNoSelection'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('reports.bulkApproveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    const summary = await reportStore.bulkApproveReports(ids);
    const ok = summary.approved?.length ?? 0;
    const skip = summary.skipped?.length ?? 0;
    const fail = summary.failed?.length ?? 0;
    ElMessage.success(
      t('reports.bulkApproveDetail', { ok, skip, fail })
    );
    if (fail > 0) {
      ElMessage.warning(t('reports.bulkApproveFailedHint'));
    }
    selectedRows.value = [];
    await reportStore.fetchReports(listQueryParams());
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(apiErr(error));
    }
  }
};

const handleReject = async (id: number) => {
  try {
    const { value: notes } = await ElMessageBox.prompt(
      t('reports.rejectConfirm'),
      t('common.confirm'),
      {
        confirmButtonText: t('reports.reject'),
        cancelButtonText: t('common.cancel'),
        inputPlaceholder: t('reports.rejectReasonHint'),
        type: 'warning',
      }
    );
    await reportStore.rejectReport(id, notes || '');
    ElMessage.success(t('reports.rejectSuccess'));
    selectedRows.value = [];
    await reportStore.fetchReports(listQueryParams());
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(apiErr(error));
    }
  }
};

function listQueryParams(page?: number) {
  return {
    page: page ?? reportStore.pagination.page,
    year: filterYear.value,
    status: filterStatus.value,
    department_id: filterDepartment.value,
  };
}

/**
 * Sau tạo mới (có payload): về trang 1, bỏ lọc trạng thái, khớp năm & phòng ban để thấy bản nháp vừa tạo.
 * Sau chỉnh sửa: chỉ làm mới danh sách với bộ lọc hiện tại.
 */
const handleFormSuccess = async (payload?: { year?: number; department_id?: number }) => {
  formDialogVisible.value = false;
  const isCreate = payload != null && (payload.year != null || payload.department_id != null);
  if (isCreate) {
    if (payload!.year != null) filterYear.value = payload!.year;
    if (payload!.department_id != null && canFilterByDepartment.value) {
      filterDepartment.value = payload!.department_id;
    }
    filterStatus.value = '';
    await reportStore.fetchReports({
      page: 1,
      year: filterYear.value,
      status: '',
      department_id: filterDepartment.value,
    });
    return;
  }
  await reportStore.fetchReports(listQueryParams());
};

const handleDetailReportUpdated = async () => {
  const id = currentReport.value?.id;
  if (id) {
    try {
      await reportStore.fetchReportById(id);
      currentReport.value = reportStore.currentReport;
    } catch {
      /* giữ báo cáo cũ nếu refetch lỗi */
    }
  }
  await reportStore.fetchReports(listQueryParams());
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  return t(`reports.status.${status}`);
};

const formatCurrency = (value: number) => {
  return value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '-';
};
</script>

<style scoped>
.report-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header h3 {
  margin: 0;
}

.card-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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
