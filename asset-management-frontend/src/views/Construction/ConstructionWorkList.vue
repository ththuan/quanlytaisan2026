<template>
  <div class="construction-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <OfficeBuilding />
            </el-icon>
            Xây dựng
          </h1>
          <p class="page-subtitle">
            Quản lý các công trình, hạng mục sửa chữa nhỏ: lót gạch, làm nền, sửa phòng, chống thấm...
          </p>
        </div>
        <div class="header-right">
          <el-button
            v-if="canCreate"
            type="primary"
            :icon="Plus"
            @click="openCreate"
          >
            Tạo công trình
          </el-button>
        </div>
      </div>
    </div>

    <el-card
      class="list-card"
      shadow="never"
    >
      <div class="list-filter">
        <div class="filter-row">
          <div class="filter-item search-input">
            <el-input
              v-model="filters.search"
              placeholder="Tìm mã, tên hạng mục, vị trí..."
              clearable
              size="large"
              @keyup.enter="load"
              @clear="load"
            />
          </div>
          <div class="filter-item">
            <el-select
              v-model="filters.status"
              placeholder="Trạng thái"
              clearable
              size="large"
              style="width: 100%"
              @change="load"
            >
              <el-option
                v-for="status in statusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </div>
          <div class="filter-item filter-item--dept">
            <DepartmentTreeSelect
              v-model="filters.department_id"
              placeholder="Đơn vị"
              :disabled="!canFilterDepartments"
              @change="load"
            />
          </div>
          <div class="filter-actions">
            <el-button
              type="primary"
              @click="load"
            >
              Tìm kiếm
            </el-button>
            <el-button @click="resetFilters">
              Làm mới
            </el-button>
          </div>
        </div>
      </div>

      <div class="responsive-table app-desktop-table">
        <el-table
          v-loading="loading"
          :data="rows"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="code"
            label="Mã"
            width="110"
          />
          <el-table-column
            label="Hạng mục / công trình"
            min-width="260"
          >
            <template #default="{ row }">
              <div class="work-name-cell">
                <span class="name">{{ row.name }}</span>
                <small v-if="row.asset">
                  {{ row.asset.asset_code }} · {{ row.asset.name }}
                </small>
                <small v-if="row.location">{{ row.location }}</small>
                <small>{{ formatDate(row.start_date) }} - {{ formatDate(row.end_date) }}</small>
                <small v-if="row.contractor">Nhà thầu: {{ row.contractor }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="Đơn vị"
            width="110"
          >
            <template #default="{ row }">
              {{ row.department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Dự toán"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ formatMoney(row.estimated_cost) }}
            </template>
          </el-table-column>
          <el-table-column
            label="Thực tế"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ formatMoney(row.actual_cost) }}
            </template>
          </el-table-column>
          <el-table-column
            label="Trạng thái"
            width="130"
          >
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="Thao tác"
            width="120"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openEdit(row)"
              >
                Sửa
              </el-button>
              <el-button
                v-if="canDelete"
                link
                type="danger"
                @click="remove(row)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="app-mobile-list construction-mobile-list">
        <article
          v-for="row in rows"
          :key="row.id"
          class="app-mobile-card"
        >
          <div class="app-mobile-card__head">
            <div class="app-mobile-card__heading">
              <span class="app-mobile-card__title">{{ row.name }}</span>
              <span class="app-mobile-card__subtitle">{{ row.code }} · {{ row.asset?.name || '-' }}</span>
            </div>
            <el-tag
              :type="statusType(row.status)"
              size="small"
              class="app-mobile-card__status"
            >
              {{ statusLabel(row.status) }}
            </el-tag>
          </div>
          <div class="app-mobile-card__grid">
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">Vị trí</span>
              <span class="app-mobile-card__field-value">{{ row.location || '-' }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">Đơn vị</span>
              <span class="app-mobile-card__field-value">{{ row.department?.name || '-' }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">Thời gian</span>
              <span class="app-mobile-card__field-value">{{ formatDate(row.start_date) }} - {{ formatDate(row.end_date) }}</span>
            </div>
            <div class="app-mobile-card__field">
              <span class="app-mobile-card__field-label">Chi phí thực tế</span>
              <span class="app-mobile-card__field-value app-mobile-card__field-value--strong">{{ formatMoney(row.actual_cost) }}</span>
            </div>
          </div>
          <div class="app-mobile-card__actions">
            <el-button
              size="small"
              @click="openEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              v-if="canDelete"
              size="small"
              type="danger"
              plain
              @click="remove(row)"
            >
              Xóa
            </el-button>
          </div>
        </article>
        <el-empty
          v-if="!loading && rows.length === 0"
          description="Chưa có công trình nào"
          :image-size="80"
        />
      </div>

      <div class="list-pagination">
        <div class="pagination-info">
          Hiển thị <strong>{{ rows.length }}</strong> trong tổng số <strong>{{ total }}</strong> công trình
        </div>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <ConstructionWorkFormDialog
      v-model:visible="formVisible"
      :work="editingWork"
      @saved="load"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { OfficeBuilding, Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import constructionWorkService, {
  type ConstructionStatus,
  type ConstructionWork,
} from '@/services/constructionWork.service';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import ConstructionWorkFormDialog from '@/components/Construction/ConstructionWorkFormDialog.vue';

const authStore = useAuthStore();
const loading = ref(false);
const rows = ref<ConstructionWork[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const formVisible = ref(false);
const editingWork = ref<ConstructionWork | null>(null);

const filters = reactive<{
  search: string;
  status: ConstructionStatus | '';
  department_id: number | null;
}>({
  search: '',
  status: '',
  department_id: null,
});

const statusOptions: Array<{ value: ConstructionStatus; label: string }> = [
  { value: 'planned', label: 'Kế hoạch' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const canCreate = computed(() =>
  authStore.can('maintenance.create', ['admin', 'director', 'department_head', 'staff']),
);
const canDelete = computed(() =>
  authStore.can('maintenance.delete', ['admin', 'director', 'department_head', 'staff']),
);
const canFilterDepartments = computed(() => authStore.isAdmin || authStore.isDirector);

const load = async () => {
  loading.value = true;
  try {
    const response: any = await constructionWorkService.list({
      page: page.value,
      limit: limit.value,
      search: filters.search || undefined,
      status: filters.status || undefined,
      department_id: filters.department_id || undefined,
    });
    rows.value = response?.data || [];
    total.value = Number(response?.pagination?.total || 0);
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Không tải được danh sách công trình');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.search = '';
  filters.status = '';
  filters.department_id = null;
  page.value = 1;
  load();
};

const handleSizeChange = () => {
  page.value = 1;
  load();
};

const openCreate = () => {
  editingWork.value = null;
  formVisible.value = true;
};

const openEdit = (work: ConstructionWork) => {
  editingWork.value = work;
  formVisible.value = true;
};

const remove = async (work: ConstructionWork) => {
  try {
    await ElMessageBox.confirm(
      `Xóa công trình "${work.name}"?`,
      'Xác nhận xóa',
      { type: 'warning', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' },
    );
    await constructionWorkService.remove(work.id);
    ElMessage.success('Đã xóa công trình');
    load();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || 'Không xóa được công trình');
    }
  }
};

const statusLabel = (status: string) =>
  statusOptions.find((item) => item.value === status)?.label || status;

const statusType = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'warning';
  if (status === 'cancelled') return 'info';
  return 'primary';
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toLocaleString('vi-VN')} đ`;
};

onMounted(load);
</script>

<style scoped>
.construction-page {
  padding: 0;
}

.work-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.work-name-cell .name {
  color: #0f172a;
  font-weight: 600;
}

.work-name-cell small {
  color: #94a3b8;
  font-size: 11.5px;
}

.work-time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.work-time-cell small {
  color: #94a3b8;
}
</style>
