<template>
  <div class="report-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('reports.title') }}</h3>
          <el-button
            v-if="authStore.isManager"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            {{ $t('reports.createReport') }}
          </el-button>
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
          <el-col :span="6">
            <el-select
              v-model="filterDepartment"
              :placeholder="$t('reports.filterByDepartment')"
              clearable
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

      <div class="responsive-table">
        <el-table
          v-loading="reportStore.loading"
          :data="reportStore.reports"
          border
          stripe
        >
          <el-table-column
            type="index"
            width="50"
            label="#"
          />
          <el-table-column
            prop="department.name"
            :label="$t('reports.department')"
            min-width="180"
          />
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
      @success="handleFormSuccess"
    />

    <!-- Report Detail Dialog -->
    <ReportDetailDialog
      v-model:visible="detailDialogVisible"
      :report="currentReport"
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

const { t } = useI18n();
const reportStore = useReportStore();
const authStore = useAuthStore();

// Sử dụng composable với caching tự động
const { activeDepartments: departments, isLoading: _departmentsLoading } = useDepartments();

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
    year: filterYear.value,
    status: filterStatus.value,
    department_id: filterDepartment.value,
  });
};

const handleReset = () => {
  filterYear.value = null;
  filterStatus.value = '';
  filterDepartment.value = null;
  reportStore.fetchReports();
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

const handleView = (report: any) => {
  currentReport.value = report;
  detailDialogVisible.value = true;
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
    reportStore.fetchReports();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
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
    reportStore.fetchReports();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
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
        inputPlaceholder: 'Nhập lý do từ chối...',
        type: 'warning',
      }
    );
    await reportStore.rejectReport(id, notes || '');
    ElMessage.success(t('reports.rejectSuccess'));
    reportStore.fetchReports();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'));
    }
  }
};

const handleFormSuccess = () => {
  formDialogVisible.value = false;
  reportStore.fetchReports();
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

</style>
