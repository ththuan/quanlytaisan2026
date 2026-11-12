<template>
  <div class="report-list">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Document />
            </el-icon>
            {{ $t('reports.title') }}
          </h1>
          <p class="page-subtitle">
            Báo cáo tình hình quản lý và sử dụng tài sản
          </p>
        </div>
        <div class="header-right">
          <el-button
            :icon="Download"
            :disabled="reportStore.reports.length === 0"
            @click="handleExport"
          >
            Xuất Excel
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            {{ $t('reports.createReport') }}
          </el-button>
        </div>
      </div>
    </div>

    <el-card>
      <!-- Filters -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col
            :xs="24"
            :sm="12"
            :md="5"
          >
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
          <el-col
            :xs="24"
            :sm="12"
            :md="5"
          >
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
            :xs="24"
            :sm="12"
            :md="6"
          >
            <DepartmentTreeSelect
              v-model="filterDepartment"
              :placeholder="$t('reports.filterByDepartment')"
              @change="handleFilter"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="canFilterByDepartment ? 6 : 12"
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

      <div
        class="responsive-table"
      >
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
            width="160"
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
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="report-mobile-list">
        <div
          v-for="report in reportStore.reports"
          :key="report.id"
          class="report-card"
          role="button"
          tabindex="0"
          @click="handleView(report)"
          @keydown.enter="handleView(report)"
        >
          <div class="report-card__head">
            <div class="report-card__title">
              <span class="name">{{ reportDepartmentName(report) }}</span>
              <span class="meta">Năm {{ report.year }}</span>
            </div>
            <el-tag
              :type="getStatusType(report.status)"
              size="small"
            >
              {{ getStatusText(report.status) }}
            </el-tag>
          </div>
          <div class="report-card__stats">
            <span><b>{{ report.total_assets || 0 }}</b> tổng</span>
            <span class="ok"><b>{{ report.active_assets || 0 }}</b> hoạt động</span>
            <span class="warn"><b>{{ report.damaged_assets || 0 }}</b> hỏng</span>
            <span class="danger"><b>{{ report.lost_assets || 0 }}</b> mất</span>
          </div>
          <div class="report-card__foot">
            <span class="value">{{ formatCurrency(report.total_value) }}</span>
            <div class="actions">
              <el-button
                size="small"
                text
                type="primary"
                @click.stop="handleView(report)"
              >
                Xem
              </el-button>
              <el-button
                v-if="canEdit(report)"
                size="small"
                text
                type="warning"
                @click.stop="handleEdit(report)"
              >
                Sửa
              </el-button>
            </div>
          </div>
        </div>
        <el-empty
          v-if="!reportStore.loading && reportStore.reports.length === 0"
          description="Chưa có báo cáo"
          :image-size="70"
        />
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
import { Download, Plus } from '@element-plus/icons-vue';
import { exportObjectsToExcel } from '@/utils/excelExport';
import { ElMessage } from 'element-plus';
import ReportFormDialog from '@/components/Reports/ReportFormDialog.vue';
import ReportDetailDialog from '@/components/Reports/ReportDetailDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';

const { t } = useI18n();
const reportStore = useReportStore();
const authStore = useAuthStore();

const canFilterByDepartment = computed(() => authStore.isAdmin || authStore.isDirector);

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

onMounted(() => {
  reportStore.fetchReports();
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

const reportDepartmentName = (report: any) => report?.department?.name || '—';

const canEdit = (_report: any) => authStore.isAdmin;

function listQueryParams(page?: number) {
  return {
    page: page ?? reportStore.pagination.page,
    year: filterYear.value,
    status: filterStatus.value,
    department_id: filterDepartment.value,
  };
}

/**
 * Sau tạo mới (có payload): về trang 1, bỏ lọc trạng thái, khớp năm & đơn vị để thấy bản nháp vừa tạo.
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
  return value != null ? Number(value).toLocaleString('vi-VN') : '-';
};

const handleExport = async () => {
  const rows = reportStore.reports.map((r: any, index: number) => ({
    STT: index + 1,
    'Đơn vị': r.department?.name || '',
    'Năm': r.year,
    'Tổng tài sản': r.total_assets || 0,
    'Đang hoạt động': r.active_assets || 0,
    'Hư hỏng': r.damaged_assets || 0,
    'Mất': r.lost_assets || 0,
    'Tổng giá trị (đồng)': Number(r.total_value || 0),
    'Ghi chú': r.notes || '',
  }));
  await exportObjectsToExcel(
    `bao-cao-thuong-nien-${Date.now()}.xlsx`,
    'Bao cao thuong nien',
    rows,
  );
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

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-section .el-row {
    gap: 10px 0;
  }
}

.report-mobile-list {
  display: none;
}

.report-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.report-card:active {
  background: #f8fafc;
}

.report-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.report-card__title {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.report-card__title .name {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
}

.report-card__title .meta {
  color: #64748b;
  font-size: 12px;
}

.report-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: #475569;
  font-size: 12px;
}

.report-card__stats b {
  color: #0f172a;
}

.report-card__stats .ok b {
  color: #16a34a;
}

.report-card__stats .warn b {
  color: #d97706;
}

.report-card__stats .danger b {
  color: #dc2626;
}

.report-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px dashed #eef2f7;
}

.report-card__foot .value {
  color: #0f172a;
  font-weight: 700;
  font-size: 13px;
}

.report-card__foot .actions {
  display: flex;
  gap: 2px;
}

</style>

<style>
@media (max-width: 1367px) {
  html.app-overlay .report-list .responsive-table {
    display: none;
  }

  html.app-overlay .report-list .report-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

@media (min-width: 768px) and (max-width: 1367px) {
  html.app-overlay .report-list .report-mobile-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
