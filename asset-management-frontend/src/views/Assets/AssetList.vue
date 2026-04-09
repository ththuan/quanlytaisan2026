<template>
  <div class="asset-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Box />
            </el-icon>
            {{ $t('assets.title') }}
          </h1>
          <p class="page-subtitle">
            Quản lý và theo dõi tất cả tài sản trong hệ thống
          </p>
        </div>
        <div class="header-right">
          <el-button
            type="warning"
            :icon="Download"
            size="default"
            class="export-btn"
            :loading="exporting"
            @click="handleExport"
          >
            Xuất Excel
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            type="success"
            :icon="Upload"
            size="default"
            class="import-btn"
            @click="showImportDialog = true"
          >
            Import Excel
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            type="info"
            :icon="Sunny"
            size="default"
            :loading="generatingQR"
            @click="handleGenerateAllQR"
          >
            Tạo QR hàng loạt
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            type="primary"
            :icon="Plus"
            size="default"
            class="add-btn"
            @click="handleCreate"
          >
            {{ $t('assets.addAsset') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-section">
      <el-row :gutter="12">
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card total"
            :class="{ 'is-active': filterStatus === '' }"
            @click="handleStatClick('')"
          >
            <div class="stat-icon">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.total }}
              </div>
              <div class="stat-label">
                Tổng tài sản
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card active"
            :class="{ 'is-active': filterStatus === 'active' }"
            @click="handleStatClick('active')"
          >
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.active }}
              </div>
              <div class="stat-label">
                Đang sử dụng
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card inactive"
            :class="{ 'is-active': filterStatus === 'inactive' }"
            @click="handleStatClick('inactive')"
          >
            <div class="stat-icon">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.inactive }}
              </div>
              <div class="stat-label">
                Không sử dụng
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card damaged"
            :class="{ 'is-active': filterStatus === 'damaged' }"
            @click="handleStatClick('damaged')"
          >
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.damaged }}
              </div>
              <div class="stat-label">
                Hỏng
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card maintenance"
            :class="{ 'is-active': filterStatus === 'pending_repair' }"
            @click="handleStatClick('pending_repair')"
          >
            <div class="stat-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.pending_repair || 0 }}
              </div>
              <div class="stat-label">
                Sửa chữa
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card pending-disposal"
            :class="{ 'is-active': filterStatus === 'pending_disposal' }"
            @click="handleStatClick('pending_disposal')"
          >
            <div class="stat-icon">
              <el-icon><Delete /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.pending_disposal || 0 }}
              </div>
              <div class="stat-label">
                Đề nghị thanh lý
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card lost"
            :class="{ 'is-active': filterStatus === 'lost' }"
            @click="handleStatClick('lost')"
          >
            <div class="stat-icon">
              <el-icon><QuestionFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.lost }}
              </div>
              <div class="stat-label">
                Mất
              </div>
            </div>
          </div>
        </el-col>
        <el-col
          :xs="8"
          :sm="8"
          :md="3"
        >
          <div
            class="stat-card disposed"
            :class="{ 'is-active': filterStatus === 'disposed' }"
            @click="handleStatClick('disposed')"
          >
            <div class="stat-icon">
              <el-icon><DeleteFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ statistics.disposed }}
              </div>
              <div class="stat-label">
                Đã thanh lý
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Main Content Card -->
    <el-card
      class="main-card"
      shadow="never"
    >
      <!-- Search & Filter -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-item search-input">
            <el-input
              v-model="searchQuery"
              placeholder="Tìm kiếm theo tên tài sản..."
              clearable
              size="large"
              @input="onSearchInput"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="filter-item">
            <el-select
              v-model="filterCategory"
              :placeholder="$t('assets.filterByCategory')"
              clearable
              size="large"
              @change="handleFilter"
              @clear="handleFilter"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.value"
                :label="cat.label"
                :value="cat.value"
              />
            </el-select>
          </div>
          <div class="filter-item filter-item--dept">
            <DepartmentTreeSelect
              v-if="authStore.isAdmin || authStore.isDirector"
              v-model="filterDepartment"
              :placeholder="$t('assets.filterByDepartment')"
              size="large"
              @change="handleFilter"
              @clear="handleFilter"
            />
            <el-input
              v-else
              :value="currentDepartmentName"
              disabled
              size="large"
            />
          </div>
          <div class="filter-actions">
            <el-button
              type="primary"
              :icon="Search"
              size="default"
              @click="handleSearch"
            >
              {{ $t('common.search') }}
            </el-button>
            <el-button
              :icon="Refresh"
              size="default"
              @click="handleReset"
            >
              {{ $t('common.refresh') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="responsive-table">
        <el-table
          :data="assetStore.assets"
          :loading="assetStore.loading"
          class="asset-table"
          :row-class-name="tableRowClassName"
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column
            prop="category_code"
            label="Mã loại TS"
            width="120"
            fixed="left"
          >
            <template #default="{ row }">
              <el-tooltip
                v-if="row.category_code"
                :content="row.assetCategory?.name ? `${row.category_code} - ${row.assetCategory.name}` : row.category_code"
                placement="top"
                :show-after="300"
              >
                <span class="category-code">
                  {{ row.category_code }}
                </span>
              </el-tooltip>
              <span
                v-else
                class="category-code"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('assets.assetName')"
            min-width="320"
            fixed="left"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span class="asset-name text-truncate">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="unit"
            label="ĐVT"
            width="90"
            align="center"
          >
            <template #default="{ row }">
              <span>{{ row.unit || 'Cái' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="SL"
            width="90"
            align="center"
          >
            <template #default="{ row }">
              <span>{{ row.quantity || 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="purchase_price"
            label="Nguyên giá"
            width="160"
            align="right"
          >
            <template #default="{ row }">
              <span class="price-value">{{ formatCurrencyDisplay(row.purchase_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="residual_value"
            label="Còn lại"
            width="160"
            align="right"
          >
            <template #default="{ row }">
              <span class="price-value">{{ formatCurrencyDisplay(row.residual_value) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="$t('common.status')"
            width="130"
          >
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                effect="dark"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="current_department.name"
            :label="$t('assets.department')"
            min-width="180"
          >
            <template #default="{ row }">
              <span v-if="row.current_department">{{ row.current_department.name }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-section">
        <div class="pagination-info">
          Hiển thị <strong>{{ assetStore.assets.length }}</strong> trong tổng số <strong>{{ assetStore.pagination?.total || 0 }}</strong> tài sản
        </div>
        <el-pagination
          v-if="assetStore.pagination"
          :current-page="assetStore.pagination.page"
          :page-size="assetStore.pagination.limit"
          :total="assetStore.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- Asset Form Dialog -->
    <AssetFormDialog
      v-model:visible="formDialogVisible"
      :asset="currentAsset"
      @success="handleFormSuccess"
    />

    <!-- Import Dialog -->
    <el-dialog
      v-model="showImportDialog"
      title="Import tài sản hàng loạt từ Excel"
      :width="windowWidth <= 640 ? '95vw' : windowWidth <= 900 ? '90vw' : '600px'"
      :close-on-click-modal="false"
    >
      <div class="import-dialog-content">
        <!-- Hướng dẫn -->
        <el-alert
          title="Hướng dẫn"
          type="info"
          :closable="false"
          show-icon
          class="import-guide"
        >
          <template #default>
            <ol class="guide-list">
              <li>Tải file mẫu Excel về máy</li>
              <li>Điền thông tin tài sản theo mẫu (các trường có dấu * là bắt buộc)</li>
              <li>Upload file → bấm <strong>Kiểm tra lỗi</strong> (chưa ghi database)</li>
              <li>Nếu có lỗi: sửa file rồi Kiểm tra lại. Nếu không lỗi: bấm <strong>Xác nhận import</strong></li>
            </ol>
          </template>
        </el-alert>

        <!-- Download template -->
        <div class="import-section">
          <h4>Bước 1: Tải file mẫu</h4>
          <el-button
            type="primary"
            :icon="Download"
            :loading="downloadingTemplate"
            @click="handleDownloadTemplate"
          >
            Tải file mẫu Excel
          </el-button>
        </div>

        <!-- Upload file -->
        <div class="import-section">
          <h4>Bước 2: Upload file đã điền</h4>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            drag
            class="import-upload"
          >
            <el-icon class="el-icon--upload">
              <Upload />
            </el-icon>
            <div class="el-upload__text">
              Kéo thả file vào đây hoặc <em>click để chọn file</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                Chỉ chấp nhận file Excel (.xlsx, .xls), tối đa 10MB
              </div>
            </template>
          </el-upload>
        </div>

        <!-- Kết quả kiểm tra / import -->
        <div
          v-if="importResult"
          class="import-result"
        >
          <!-- Đang ở bước kiểm tra (chưa ghi DB) -->
          <template v-if="importResult.validatedOnly">
            <el-alert
              :title="importResult.failed === 0 ? 'Kiểm tra xong – không có lỗi' : 'Import có lỗi'"
              :type="importResult.failed === 0 ? 'success' : 'warning'"
              show-icon
              :closable="false"
            >
              <template #default>
                <div class="result-summary">
                  <p>Tổng số dòng: <strong>{{ importResult.total }}</strong></p>
                  <p v-if="importResult.failed === 0">
                    Sẽ import: <strong class="text-success">{{ importResult.imported }}</strong> dòng. Bạn có chắc muốn thực hiện?
                  </p>
                  <template v-else>
                    <p>Hợp lệ: <strong class="text-success">{{ importResult.imported }}</strong></p>
                    <p>Lỗi: <strong class="text-danger">{{ importResult.failed }}</strong> – sửa file rồi bấm "Kiểm tra lại"</p>
                  </template>
                </div>
              </template>
            </el-alert>
          </template>
          <!-- Đã import thật -->
          <template v-else>
            <el-alert
              :title="importResult.success ? 'Import thành công' : 'Import có lỗi'"
              :type="importResult.success ? 'success' : 'warning'"
              show-icon
              :closable="false"
            >
              <template #default>
                <div class="result-summary">
                  <p>Tổng số dòng: <strong>{{ importResult.total }}</strong></p>
                  <p>Thành công: <strong class="text-success">{{ importResult.imported }}</strong></p>
                  <p>Thất bại: <strong class="text-danger">{{ importResult.failed }}</strong></p>
                </div>
              </template>
            </el-alert>
          </template>

          <!-- Chi tiết lỗi -->
          <div
            v-if="importResult.errors.length > 0"
            class="error-list"
          >
            <h4>Chi tiết lỗi:</h4>
            <el-table
              :data="importResult.errors"
              max-height="200"
              size="small"
            >
              <el-table-column
                prop="row"
                label="Dòng"
                width="60"
              />
              <el-table-column
                prop="assetCode"
                label="Mã TS"
                width="120"
              />
              <el-table-column
                prop="field"
                label="Trường"
                width="120"
              />
              <el-table-column
                prop="message"
                label="Lỗi"
              />
            </el-table>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeImportDialog">
          Đóng
        </el-button>
        <el-button
          v-if="!importResult || (importResult.validatedOnly && importResult.failed > 0)"
          type="primary"
          :loading="importing"
          :disabled="!selectedFile"
          @click="handleValidate"
        >
          {{ importResult?.validatedOnly && importResult?.failed > 0 ? 'Kiểm tra lại' : 'Kiểm tra lỗi' }}
        </el-button>
        <el-button
          v-if="importResult?.validatedOnly && importResult?.failed === 0"
          type="primary"
          :loading="importing"
          @click="handleConfirmImport"
        >
          Xác nhận import
        </el-button>
      </template>
    </el-dialog>

    <!-- QR Export Dialog -->
    <el-dialog
      v-model="showQRExportDialog"
      title="Xuất QR Code hàng loạt theo đơn vị"
      :width="windowWidth <= 640 ? '95vw' : '460px'"
      :close-on-click-modal="false"
    >
      <el-form
        label-width="80px"
        style="margin-top: 8px"
      >
        <el-form-item label="Đơn vị">
          <DepartmentTreeSelect
            v-model="qrExportDeptId"
            placeholder="Chọn đơn vị cần xuất QR"
          />
        </el-form-item>
      </el-form>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 4px"
      >
        <template #default>
          <div style="font-size: 13px; line-height: 1.6">
            Mỗi QR kích thước <strong>5cm × 5cm</strong>, xếp <strong>4 cột</strong> trên trang A4.<br>
            Toàn bộ QR của đơn vị sẽ mở trong tab mới. Dùng nút <strong>"In / Lưu PDF"</strong> để xuất ra PDF.
          </div>
        </template>
      </el-alert>
      <template #footer>
        <el-button @click="showQRExportDialog = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="exportingQR"
          :disabled="!qrExportDeptId"
          @click="handleExportQRPDF"
        >
          Xuất PDF
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { debounce } from 'lodash-es';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAssetStore } from '@/stores/asset.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDepartments } from '@/composables/useDepartments';
import { Plus, Search, Delete, Box, CircleCheck, Warning, Refresh, Upload, Download, CircleClose, QuestionFilled, Sunny, Setting, DeleteFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AssetFormDialog from '@/components/Assets/AssetFormDialog.vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import importService, { type ImportResult } from '@/services/import.service';
import exportService from '@/services/export.service';
import { assetService, type AssetQueryParams } from '@/services/asset.service';

const router = useRouter();
const route = useRoute();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const { t } = useI18n();

// Sử dụng composable để lấy tất cả departments với limit 1000
const { activeDepartments: departments } = useDepartments({
  autoLoad: true,
  forceRefresh: false
});

const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const filterDepartment = ref<number | null>(null);
const formDialogVisible = ref(false);
const currentAsset = ref<any>(null);

// Statistics
const statistics = ref<any>({
  total: 0,
  active: 0,
  inactive: 0,
  damaged: 0,
  lost: 0,
  disposed: 0,
  pending_repair: 0,
  pending_disposal: 0,
});

// Import dialog
const showImportDialog = ref(false);
const uploadRef = ref<any>();
const selectedFile = ref<File | null>(null);
const importing = ref(false);
const downloadingTemplate = ref(false);
const importResult = ref<ImportResult | null>(null);

// Export
const exporting = ref(false);
const generatingQR = ref(false);

// Responsive dialog widths
const windowWidth = ref(window.innerWidth);
const onResize = () => { windowWidth.value = window.innerWidth; };
window.addEventListener('resize', onResize);

// QR Export dialog
const showQRExportDialog = ref(false);
const qrExportDeptId = ref<number | null>(null);
const exportingQR = ref(false);

const currentDepartmentName = computed(() => {
  if (!authStore.userDepartmentId) return '';
  const dept = departments.value.find(d => d.id === authStore.userDepartmentId);
  return dept?.name || 'Phòng ban của bạn';
});

const categories = ref<any[]>([]);

const fetchCategories = async () => {
  try {
    const { assetCategoryService } = await import('@/services/assetCategory.service');
    const response = await assetCategoryService.getSelectable();
    categories.value = response.data.map((cat: any) => ({
      value: cat.code,
      label: `${cat.code} - ${cat.name}`,
      id: cat.id,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Fallback to default categories
    categories.value = [
      { value: 'building', label: t('categories.building') },
      { value: 'structure', label: t('categories.structure') },
      { value: 'car', label: t('categories.car') },
      { value: 'vehicle', label: t('categories.vehicle') },
      { value: 'equipment', label: t('categories.equipment') },
      { value: 'other_tangible', label: t('categories.other_tangible') },
      { value: 'tools', label: t('categories.tools') },
    ];
  }
};

const fetchStatistics = async () => {
  try {
    const departmentId = (authStore.isAdmin || authStore.isDirector) ? (filterDepartment.value || undefined) : authStore.userDepartmentId;
    const response = await assetService.getStatistics({
      category_code: filterCategory.value || undefined,
      status: filterStatus.value || undefined,
      current_department_id: departmentId,
    });
    if (response.success && response.data) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
};

const getListFetchParams = (overrides: Partial<AssetQueryParams> = {}): AssetQueryParams => {
  const departmentId = (authStore.isAdmin || authStore.isDirector)
    ? (filterDepartment.value ?? undefined)
    : authStore.userDepartmentId;
  return {
    search: searchQuery.value,
    category_code: filterCategory.value,
    status: filterStatus.value,
    current_department_id: departmentId,
    ...overrides,
  };
};

const runListRefresh = async (overrides: Partial<AssetQueryParams> = {}) => {
  await assetStore.fetchAssets(getListFetchParams(overrides));
  await fetchStatistics();
};

const debouncedSearch = debounce(() => {
  void runListRefresh({ page: 1 });
}, 380);

const onSearchInput = () => {
  debouncedSearch();
};

onUnmounted(() => {
  debouncedSearch.cancel();
  window.removeEventListener('resize', onResize);
});

onMounted(async () => {
  const q: any = route.query || {};

  if (typeof q.status === 'string' && q.status) {
    filterStatus.value = q.status;
  }

  if (typeof q.current_department_id === 'string' && q.current_department_id) {
    const deptId = Number(q.current_department_id);
    if (!Number.isNaN(deptId)) {
      filterDepartment.value = deptId;
    }
  }

  if (typeof q.category_code === 'string' && q.category_code) {
    filterCategory.value = q.category_code;
  }

  if (!authStore.isAdmin && !authStore.isDirector && authStore.userDepartmentId) {
    filterDepartment.value = authStore.userDepartmentId;
  }

  await Promise.all([
    assetStore.fetchAssets(getListFetchParams()),
    fetchCategories(),
    fetchStatistics(),
  ]);
});

const handleSearch = async () => {
  debouncedSearch.cancel();
  await runListRefresh({ page: 1 });
};

const handleFilter = () => {
  debouncedSearch.cancel();
  void handleSearch();
};

const handleStatClick = (status: string) => {
  filterStatus.value = status;
  void handleSearch();
};

const handleReset = async () => {
  debouncedSearch.cancel();
  searchQuery.value = '';
  filterCategory.value = '';
  filterStatus.value = '';
  if (authStore.isAdmin || authStore.isDirector) {
    filterDepartment.value = null;
  } else {
    filterDepartment.value = authStore.userDepartmentId ?? null;
  }
  await runListRefresh();
};

const handlePageChange = (page: number) => {
  debouncedSearch.cancel();
  assetStore.fetchAssets(getListFetchParams({ page }));
};

const handleSizeChange = (size: number) => {
  debouncedSearch.cancel();
  assetStore.fetchAssets(getListFetchParams({ limit: size }));
};

const handleRowClick = (row: any) => {
  router.push(`/assets/${row.id}`);
};

const handleCreate = () => {
  currentAsset.value = null;
  formDialogVisible.value = true;
};

const handleFormSuccess = async () => {
  debouncedSearch.cancel();
  await runListRefresh({ page: 1 });
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    damaged: 'warning',
    lost: 'danger',
    disposed: '',
    pending_repair: 'warning',
    pending_disposal: 'info',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  const key = `assets.status.${status}` as const;
  return t(key);
};

const formatCurrencyDisplay = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return numericValue.toLocaleString('vi-VN');
};

const tableRowClassName = ({ row }: { row: any }) => {
  if (row.status === 'damaged') return 'warning-row';
  if (row.status === 'disposed') return 'disposed-row';
  return '';
};

// Import functions
const handleDownloadTemplate = async () => {
  downloadingTemplate.value = true;
  try {
    await importService.downloadTemplate();
    ElMessage.success('Đã tải file mẫu');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Không thể tải file mẫu');
  } finally {
    downloadingTemplate.value = false;
  }
};

const handleFileChange = (uploadFile: any) => {
  if (uploadFile?.raw) {
    selectedFile.value = uploadFile.raw;
    importResult.value = null;
  }
};

const handleExceed = () => {
  ElMessage.warning('Chỉ được upload 1 file');
};

/** Bước 1: Chỉ kiểm tra file, không ghi database */
const handleValidate = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('Vui lòng chọn file Excel');
    return;
  }
  importing.value = true;
  try {
    const result = await importService.validateAssetsFile(selectedFile.value);
    importResult.value = { ...result.data, success: result.success, validatedOnly: true };
    if (result.success) {
      ElMessage.success(result.message);
    } else {
      ElMessage.warning(result.message);
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi khi kiểm tra file');
  } finally {
    importing.value = false;
  }
};

/** Bước 2: Xác nhận import – ghi database (chỉ hiện khi kiểm tra không lỗi) */
const handleConfirmImport = async () => {
  if (!selectedFile.value) return;
  importing.value = true;
  try {
    const result = await importService.importAssets(selectedFile.value);
    importResult.value = { ...result.data, success: result.success };
    if (result.success) {
      ElMessage.success(result.message);
      debouncedSearch.cancel();
      await runListRefresh({ page: 1 });
    } else {
      ElMessage.warning(result.message);
      if (result.data?.imported > 0) {
        debouncedSearch.cancel();
        await runListRefresh({ page: 1 });
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra khi import');
  } finally {
    importing.value = false;
  }
};

const closeImportDialog = () => {
  showImportDialog.value = false;
  selectedFile.value = null;
  importResult.value = null;
  uploadRef.value?.clearFiles();
};

// Export functions
const handleExport = async () => {
  exporting.value = true;
  try {
    // Build export query params based on current filters
    const exportParams: any = {};
    if (searchQuery.value) exportParams.search = searchQuery.value;
    if (filterCategory.value) exportParams.category_code = filterCategory.value;
    if (filterStatus.value) exportParams.status = filterStatus.value;
    
    // Apply department filter based on user role
    // Admin và Director: có thể export tất cả hoặc theo filter
    // Trưởng đơn vị và Cán bộ: chỉ export tài sản của phòng ban mình (tự động áp dụng ở backend)
    if (authStore.isAdmin || authStore.isDirector) {
      if (filterDepartment.value) {
        exportParams.current_department_id = filterDepartment.value;
      }
    } else if (authStore.userDepartmentId) {
      // Trưởng đơn vị và cán bộ: backend tự động filter theo department_id của user
      exportParams.current_department_id = authStore.userDepartmentId;
    }

    await exportService.exportAssets(exportParams);
    ElMessage.success('Đã xuất file Excel thành công');
  } catch (error: any) {
    console.error('Export error:', error);
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra khi xuất file Excel');
  } finally {
    exporting.value = false;
  }
};

const handleGenerateAllQR = () => {
  showQRExportDialog.value = true;
};

const buildPrintHTML = (items: Array<{ asset_code: string; name: string; category_name: string; quantity: number; unit: string; qr_image: string }>, deptName: string): string => {
  const cells = items.map(a => `
    <div class="qr-cell">
      ${a.qr_image
        ? `<img src="${a.qr_image}" alt="QR" />`
        : `<div class="qr-placeholder">No QR</div>`
      }
      <div class="qr-info">
        <div class="qr-code">${a.asset_code}</div>
        <div class="qr-name">${a.name}</div>
        ${a.category_name ? `<div class="qr-cat">${a.category_name}</div>` : ''}
        <div class="qr-qty">SL: ${a.quantity}${a.unit ? ' ' + a.unit : ''}</div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>QR Code – ${deptName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  h2 { text-align: center; font-size: 14pt; padding: 6mm 0 3mm; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; padding: 6mm 8mm; }
  .qr-cell {
    width: 47mm; border: 0.5pt solid #ccc; padding: 2mm;
    page-break-inside: avoid; text-align: center;
  }
  .qr-cell img { width: 43mm; height: 43mm; display: block; margin: 0 auto; }
  .qr-placeholder { width: 43mm; height: 43mm; display: flex; align-items: center; justify-content: center; background: #eee; font-size: 9pt; color: #888; margin: 0 auto; }
  .qr-info { margin-top: 1.5mm; line-height: 1.4; }
  .qr-code { font-weight: bold; font-size: 9pt; word-break: break-all; }
  .qr-name { font-size: 8pt; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .qr-cat { font-size: 7.5pt; color: #555; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .qr-qty { font-size: 7.5pt; }
  @media print {
    @page { size: A4 portrait; margin: 6mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
</style></head><body>
<div class="no-print" style="text-align:center;padding:10px;background:#f0f0f0">
  <strong>QR Code – ${deptName}</strong> &nbsp;
  <button onclick="window.print()" style="padding:6px 18px;background:#409eff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">▶ In / Lưu PDF</button>
  <button onclick="window.close()" style="margin-left:8px;padding:6px 14px;background:#ccc;border:none;border-radius:4px;cursor:pointer">✕ Đóng</button>
</div>
<h2>QR Code tài sản – ${deptName}</h2>
<div class="grid">${cells}</div>
</body></html>`;
};

const generateQRPDF = async (assets: any[], departmentName: string) => {
  const BATCH = 10;
  const items: Array<{ asset_code: string; name: string; category_name: string; quantity: number; unit: string; qr_image: string }> = [];

  for (let i = 0; i < assets.length; i += BATCH) {
    const batch = assets.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (asset: any) => {
        try {
          const res: any = await assetService.getQRCode(asset.id);
          return {
            asset_code: asset.asset_code || '',
            name: asset.name || '',
            category_name: asset.assetCategory?.name || asset.category || '',
            quantity: asset.quantity || 1,
            unit: asset.unit || '',
            qr_image: res.data?.qr_code_image || '',
          };
        } catch {
          return {
            asset_code: asset.asset_code || '',
            name: asset.name || '',
            category_name: asset.assetCategory?.name || asset.category || '',
            quantity: asset.quantity || 1,
            unit: asset.unit || '',
            qr_image: '',
          };
        }
      })
    );
    items.push(...results);
  }

  const html = buildPrintHTML(items, departmentName);
  const win = window.open('', '_blank');
  if (!win) {
    ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để xuất QR');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
};

const handleExportQRPDF = async () => {
  if (!qrExportDeptId.value) {
    ElMessage.warning('Vui lòng chọn đơn vị');
    return;
  }
  exportingQR.value = true;
  try {
    const res: any = await assetService.getAssets({
      current_department_id: qrExportDeptId.value,
      limit: 9999,
      page: 1,
    });
    const assets: any[] = res?.data || [];
    if (!assets.length) {
      ElMessage.warning('Đơn vị này chưa có tài sản nào');
      return;
    }
    const dept = departments.value.find((d: any) => d.id === qrExportDeptId.value);
    const deptName = dept?.name || `DV_${qrExportDeptId.value}`;
    ElMessage.info(`Đang tạo QR cho ${assets.length} tài sản, vui lòng chờ...`);
    await generateQRPDF(assets, deptName);
    showQRExportDialog.value = false;
    ElMessage.success(`Đã tạo QR cho ${assets.length} tài sản. Dùng nút "▶ In / Lưu PDF" trong tab mới để xuất PDF.`);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || 'Không thể xuất QR');
  } finally {
    exportingQR.value = false;
  }
};
</script>

<style scoped>
.asset-list-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  min-height: 100dvh;
}

/* Page Header */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.title-icon {
  color: #3b82f6;
  font-size: 32px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.add-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  padding: 0 24px;
}

/* Statistics Section - nhỏ, đều nhau như Bảng điều khiển */
.stats-section {
  margin-bottom: 24px;
}

.stats-section .el-row {
  display: flex;
  flex-wrap: wrap;
}

.stats-section .el-col {
  display: flex;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  height: 72px;
  min-height: 72px;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  margin-bottom: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.stat-card.is-active {
  border-color: #3b82f6;
  box-shadow: 0 2px 6px -1px rgba(59, 130, 246, 0.25);
}

@media (max-width: 768px) {
  .stat-card {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    height: 64px;
    min-height: 64px;
  }

  .stat-icon {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    font-size: 18px !important;
  }

  .stat-value {
    font-size: 1.1rem !important;
  }

  .stat-label {
    font-size: 10px !important;
  }
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.stat-card.active .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.stat-card.inactive .stat-icon {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
}

.stat-card.damaged .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.stat-card.lost .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.stat-card.maintenance .stat-icon {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
}

.stat-card.pending-disposal .stat-icon {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
}

.stat-card.disposed .stat-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
  margin-bottom: 0;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
  margin-top: 1px;
  white-space: normal;
  word-break: break-word;
}

/* Main Card */
.main-card {
  border-radius: 16px;
  border: none;
}

.main-card :deep(.el-card__body) {
  padding: 24px;
}

/* Filter Section */
.filter-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  flex: 1;
  min-width: 140px;
}

.filter-item.search-input {
  flex: 2;
  min-width: 200px;
}

.filter-item :deep(.el-input__wrapper),
.filter-item :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-actions .el-button {
  border-radius: 8px;
}

/* Table Styles */
.asset-table {
  width: 100%;
}

.asset-table :deep(.el-table__header th) {
  background: #f8fafc !important;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
  padding: 12px 8px;
}

.asset-table :deep(.el-table__row) {
  cursor: pointer;
}

.asset-table :deep(.el-table__row:hover > td) {
  background-color: #f0f9ff !important;
}

.asset-table :deep(.el-table__row td) {
  padding: 10px 8px;
}

.asset-table :deep(.cell) {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .asset-table :deep(.cell) {
    white-space: normal;
    word-break: break-word;
  }
}

.asset-code {
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: #3b82f6;
}

.asset-name-cell {
  display: block;
}

.asset-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.4;
}

.text-truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-value {
  font-weight: 800;
  color: #0f172a;
  font-family: inherit;
}

/* Pagination Section */
.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
}

.pagination-info strong {
  color: #1f2937;
}

.responsive-table {
  width: 100%;
  overflow-x: auto;
}

/* Import Dialog */
.import-dialog-content {
  padding: 10px 0;
}

.import-guide {
  margin-bottom: 20px;
}

.guide-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: #606266;
}

.guide-list li {
  margin-bottom: 4px;
}

.import-section {
  margin-bottom: 24px;
}

.import-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.import-upload {
  width: 100%;
}

.import-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 30px 20px;
}

.import-result {
  margin-top: 20px;
}

.result-summary {
  margin-top: 8px;
}

.result-summary p {
  margin: 4px 0;
}

.error-list {
  margin-top: 16px;
}

.error-list h4 {
  margin: 0 0 8px 0;
  color: #f56c6c;
  font-size: 14px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.export-btn {
  margin-right: 12px;
}

.import-btn {
  margin-right: 12px;
}

/* ── Mobile responsive ── */
@media (max-width: 767px) {
  /* Stat cards: 2 per row */
  .stats-section :deep(.el-col) {
    max-width: 50% !important;
    flex: 0 0 50% !important;
  }

  /* Header buttons: wrap to 2 per row */
  .header-right {
    flex-wrap: wrap;
    gap: 6px;
  }

  .header-right .el-button {
    flex: 1 1 calc(50% - 6px);
    min-width: 120px;
    font-size: 13px;
    padding: 8px 10px;
  }

  /* Filter: single column */
  .filter-row {
    flex-direction: column;
    gap: 8px;
  }

  .filter-item,
  .filter-item.search-input {
    flex: 1 1 100%;
    min-width: 0;
    width: 100%;
  }

  .filter-actions {
    width: 100%;
  }

  .filter-actions .el-button {
    flex: 1;
  }

  /* Stat card smaller on mobile */
  .stat-card {
    padding: 10px 8px;
  }

  .stat-value {
    font-size: 1rem !important;
  }

  .stat-icon {
    width: 36px !important;
    height: 36px !important;
    font-size: 16px !important;
  }

  /* Pagination */
  .pagination-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .header-right .el-button {
    flex: 1 1 100%;
  }
}
</style>
