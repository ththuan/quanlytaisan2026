<template>
  <div class="department-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('departments.title') }}</h3>
          <div class="actions" v-if="authStore.isAdmin">
            <el-button :icon="Download" @click="handleDownloadTemplate">
              Tải mẫu Excel
            </el-button>
            <el-button type="success" :icon="Upload" :loading="importing" @click="triggerFileInput">
              Import Excel
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate">
              {{ $t('departments.addDepartment') }}
            </el-button>
          </div>
        </div>
      </template>

      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls"
        style="display: none"
        @change="handleFileChange"
      />

      <!-- Search & Filter -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              :placeholder="$t('departments.searchPlaceholder')"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filterType" :placeholder="$t('departments.filterByType')" clearable @change="handleFilter">
              <el-option v-for="type in departmentTypes" :key="type.value" :label="type.label" :value="type.value" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
            <el-button @click="handleReset">{{ $t('common.refresh') }}</el-button>
          </el-col>
        </el-row>
      </div>

      <div class="responsive-table">
        <el-table :data="paginatedDepartments" :loading="loading" style="width: 100%">
        <el-table-column prop="name" :label="$t('departments.departmentName')" min-width="200">
          <template #default="{ row }">
            <span :style="{ paddingLeft: row.parent_department_id ? '20px' : '0' }">
              <span v-if="row.parent_department_id">└ </span>
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="type" :label="$t('departments.departmentType')" width="150">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('departments.parentDepartment')" width="180">
          <template #default="{ row }">
            <span v-if="row.parent_department">{{ row.parent_department.name }}</span>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('common.description')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('common.actions')" width="180" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleView(row)">Xem</el-button>
            <el-button size="small" type="warning" @click="handleEdit(row)" v-if="authStore.isAdmin">Sửa</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)" v-if="authStore.isAdmin">Xóa</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-section">
        <div class="total-info">
          Tổng số: <strong>{{ filteredDepartments.length }}</strong> phòng ban
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredDepartments.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Department Form Dialog -->
    <DepartmentFormDialog
      v-model:visible="formDialogVisible"
      :department="currentDepartment"
      @success="handleFormSuccess"
    />

    <!-- View Dialog -->
    <el-dialog v-model="viewDialogVisible" :title="$t('departments.departmentDetails')" width="600px">
      <el-descriptions :column="1" border v-if="currentDepartment">
        <el-descriptions-item :label="$t('departments.departmentName')">{{ currentDepartment.name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('departments.departmentType')">
          <el-tag :type="getTypeColor(currentDepartment.type || '')">{{ getTypeText(currentDepartment.type || '') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('departments.parentDepartment')">
          {{ currentDepartment.parent_department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.description')">{{ currentDepartment.description || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.createdAt')">{{ formatDate(currentDepartment.created_at) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.updatedAt')">{{ formatDate(currentDepartment.updated_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Search, Upload, Download } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import api from '@/services/api';
import DepartmentFormDialog from '@/components/Departments/DepartmentFormDialog.vue';
import departmentService from '@/services/department.service';

interface Department {
  id: number;
  name: string;
  type?: string;
  description?: string;
  parent_department_id?: number;
  parent_department?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

const authStore = useAuthStore();
const { t } = useI18n();

const loading = ref(false);
const departments = ref<Department[]>([]);
const searchQuery = ref('');
const filterType = ref('');
const formDialogVisible = ref(false);
const viewDialogVisible = ref(false);
const currentDepartment = ref<Department | null>(null);
const importing = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

const departmentTypes = computed(() => [
  { value: 'department', label: t('departments.types.department') },
  { value: 'faculty', label: t('departments.types.faculty') },
  { value: 'center', label: t('departments.types.center') },
  { value: 'classroom', label: t('departments.types.classroom') },
  { value: 'lab', label: t('departments.types.lab') },
  { value: 'meeting_room', label: t('departments.types.meeting_room') },
  { value: 'hall', label: t('departments.types.hall') },
]);

const filteredDepartments = computed(() => {
  let result = departments.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(d => d.name.toLowerCase().includes(query));
  }
  
  if (filterType.value) {
    result = result.filter(d => d.type === filterType.value);
  }
  
  return result;
});

// Paginated departments
const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredDepartments.value.slice(start, end);
});

onMounted(() => {
  fetchDepartments();
});

const fetchDepartments = async () => {
  loading.value = true;
  try {
    // Lấy tất cả phòng ban (limit=1000 để lấy hết)
    const response: any = await api.get('/departments', {
      params: {
        limit: 1000,
        page: 1,
      }
    });
    if (response && response.data) {
      departments.value = response.data;
    } else if (Array.isArray(response)) {
      departments.value = response;
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // Filter is handled by computed property
};

const handleFilter = () => {
  // Filter is handled by computed property
};

const handleReset = () => {
  searchQuery.value = '';
  filterType.value = '';
  currentPage.value = 1;
  fetchDepartments();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

const handleCreate = () => {
  currentDepartment.value = null;
  formDialogVisible.value = true;
};

const handleEdit = (department: Department) => {
  currentDepartment.value = department;
  formDialogVisible.value = true;
};

const handleView = (department: Department) => {
  currentDepartment.value = department;
  viewDialogVisible.value = true;
};

const handleFormSuccess = () => {
  fetchDepartments();
};

const handleDelete = async (id: number, reassignAndDelete = false) => {
  try {
    if (!reassignAndDelete) {
      await ElMessageBox.confirm(t('departments.deleteConfirm'), t('common.warning'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      });
    }
    await departmentService.delete(id, reassignAndDelete);
    ElMessage.success(t('departments.deleteSuccess'));
    fetchDepartments();
  } catch (error: any) {
    if (error === 'cancel') return;
    const msg = error.response?.data?.message || error.message || '';
    const canReassign = /người dùng|tài sản|Gỡ phòng ban/i.test(msg);
    if (canReassign) {
      try {
        await ElMessageBox.confirm(
          'Phòng ban này đang có người dùng và/hoặc tài sản. Bạn có muốn gỡ phòng ban khỏi họ rồi xóa phòng ban?',
          'Gỡ phòng ban rồi xóa',
          {
            confirmButtonText: 'Gỡ và xóa',
            cancelButtonText: 'Hủy',
            type: 'warning',
          }
        );
        await handleDelete(id, true);
      } catch (inner: any) {
        if (inner !== 'cancel') {
          ElMessage.error(inner.response?.data?.message || 'Xóa thất bại');
        }
      }
    } else {
      ElMessage.error(msg || 'Không thể xóa phòng ban');
    }
  }
};

const handleDownloadTemplate = async () => {
  try {
    const blob = await departmentService.downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau_import_phong_ban.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading template:', error);
    ElMessage.error('Không thể tải file mẫu');
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importing.value = true;
  try {
    const result: any = await departmentService.importExcel(file);
    const summary = result?.data || result;

    if (result?.success) {
      ElMessage.success(
        result.message ||
          `Import thành công ${summary.imported || 0}/${summary.total || 0} phòng ban`
      );
    } else {
      ElMessage.warning(
        result?.message || 'Import hoàn tất nhưng có lỗi, vui lòng kiểm tra lại file'
      );
    }

    await fetchDepartments();
  } catch (error) {
    console.error('Error importing departments:', error);
    ElMessage.error('Không thể import phòng ban. Vui lòng thử lại.');
  } finally {
    importing.value = false;
    target.value = '';
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    department: 'primary',
    'phòng ban': 'primary',
    faculty: 'success',
    khoa: 'success',
    center: 'warning',
    'trung tâm': 'warning',
    classroom: 'info',
    'phòng học': 'info',
    'lớp học': 'info',
    lab: '',
    'phòng thực hành': '',
    meeting_room: 'danger',
    hall: 'warning',
  };
  return colors[type] || '';
};

const getTypeText = (type: string) => {
  if (!type) return '-';

  // Map cả key nội bộ lẫn giá trị tiếng Việt (legacy)
  const labels: Record<string, string> = {
    department: t('departments.types.department'),
    'phòng ban': t('departments.types.department'),
    faculty: t('departments.types.faculty'),
    khoa: t('departments.types.faculty'),
    center: t('departments.types.center'),
    'trung tâm': t('departments.types.center'),
    classroom: t('departments.types.classroom'),
    'phòng học': t('departments.types.classroom'),
    'lớp học': t('departments.types.classroom'),
    lab: t('departments.types.lab'),
    'phòng thực hành': t('departments.types.lab'),
    meeting_room: t('departments.types.meeting_room'),
    hall: t('departments.types.hall'),
  };

  const normalized = type.toLowerCase();
  return labels[normalized] || type; // fallback hiển thị nguyên gốc nếu chưa map
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
</script>

<style scoped>
.department-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card-header h3 {
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.total-info {
  color: #606266;
  font-size: 14px;
}
</style>
