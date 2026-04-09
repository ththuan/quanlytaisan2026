<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('users.title') }}</h3>
          <div
            v-if="authStore.isAdmin"
            style="display: flex; gap: 8px;"
          >
            <el-button
              :icon="Upload"
              @click="showImportDialog = true"
            >
              Import Excel
            </el-button>
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              {{ $t('users.addUser') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search & Filter -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              :placeholder="$t('users.searchPlaceholder')"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="5">
            <el-select
              v-model="filterRole"
              :placeholder="$t('users.filterByRole')"
              clearable
              @change="handleFilter"
            >
              <el-option
                v-for="role in userRoles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select
              v-model="filterStatus"
              :placeholder="$t('users.filterByStatus')"
              clearable
              @change="handleFilter"
            >
              <el-option
                :label="$t('users.active')"
                value="active"
              />
              <el-option
                :label="$t('users.inactive')"
                value="inactive"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button
              type="primary"
              @click="handleSearch"
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
          :data="filteredUsers"
          :loading="loading"
          border
          stripe
        >
          <el-table-column
            prop="username"
            :label="$t('users.username')"
            width="150"
          />
          <el-table-column
            prop="fullname"
            :label="$t('users.fullname')"
            min-width="180"
          />
          <el-table-column
            prop="email"
            :label="$t('users.email')"
            min-width="200"
          />
          <el-table-column
            prop="role"
            :label="$t('users.role')"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="getRoleColor(row.role) ?? 'info'">
                {{ getRoleText(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.status')"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="row.is_active === true ? 'success' : 'danger'">
                {{ row.is_active ? $t('users.active') : $t('users.inactive') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            width="320"
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
                v-if="authStore.isAdmin"
                size="small"
                type="warning"
                @click="handleEdit(row)"
              >
                {{ $t('common.edit') }}
              </el-button>
              <el-button
                v-if="authStore.isAdmin && row.id !== authStore.user?.id"
                size="small"
                type="info"
                @click="handleResetPassword(row)"
              >
                {{ $t('users.resetPassword') }}
              </el-button>
              <el-button
                v-if="authStore.isAdmin && row.id !== authStore.user?.id"
                size="small"
                type="danger"
                @click="handleDelete(row)"
              >
                {{ $t('common.delete') }}
              </el-button>
              <el-button
                v-if="authStore.isAdmin && row.id !== authStore.user?.id"
                size="small"
                type="danger"
                @click="handleToggleStatus(row)"
              >
                {{ row.is_active ? $t('users.deactivate') : $t('users.activate') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- User Form Dialog -->
    <UserFormDialog
      v-model:visible="formDialogVisible"
      :user="currentUser"
      @success="handleFormSuccess"
    />

    <!-- Import Dialog -->
    <el-dialog
      v-model="showImportDialog"
      title="Import người dùng hàng loạt từ Excel"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="import-dialog-content">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="import-guide"
        >
          <template #default>
            <ol
              class="guide-list"
              style="margin: 0; padding-left: 18px;"
            >
              <li>Tải file mẫu Excel, điền thông tin (Tên đăng nhập, Mật khẩu, Vai trò bắt buộc; Email không bắt buộc)</li>
              <li>Upload file → bấm <strong>Kiểm tra lỗi</strong></li>
              <li>Nếu có lỗi: sửa file rồi Kiểm tra lại. Nếu không lỗi: bấm <strong>Xác nhận import</strong></li>
            </ol>
          </template>
        </el-alert>
        <div class="import-section">
          <h4>Bước 1: Tải file mẫu</h4>
          <el-button
            type="primary"
            :icon="Download"
            :loading="downloadingTemplate"
            @click="handleDownloadImportTemplate"
          >
            Tải file mẫu Excel
          </el-button>
        </div>
        <div class="import-section">
          <h4>Bước 2: Upload file đã điền</h4>
          <el-upload
            ref="importUploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleImportFileChange"
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
        <div
          v-if="importResult"
          class="import-result"
        >
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
          <template v-else>
            <el-alert
              :title="importResult.imported > 0 ? 'Import thành công' : 'Import có lỗi'"
              :type="importResult.failed === 0 ? 'success' : 'warning'"
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
                prop="field"
                label="Trường"
                width="100"
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
          :disabled="!selectedImportFile"
          @click="handleValidateUsers"
        >
          {{ importResult?.validatedOnly && importResult?.failed > 0 ? 'Kiểm tra lại' : 'Kiểm tra lỗi' }}
        </el-button>
        <el-button
          v-if="importResult?.validatedOnly && importResult?.failed === 0"
          type="primary"
          :loading="importing"
          @click="handleConfirmImportUsers"
        >
          Xác nhận import
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="$t('users.userDetails')"
      width="600px"
    >
      <el-descriptions
        v-if="currentUser"
        :column="1"
        border
      >
        <el-descriptions-item :label="$t('users.username')">
          {{ currentUser.username }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('users.fullname')">
          {{ currentUser.fullname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('users.email')">
          {{ currentUser.email }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('users.role')">
          <el-tag :type="getRoleColor(currentUser.role) ?? 'info'">
            {{ getRoleText(currentUser.role) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">
          <el-tag :type="currentUser.is_active === true ? 'success' : 'danger'">
            {{ currentUser.is_active ? $t('users.active') : $t('users.inactive') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.createdAt')">
          {{ formatDate(currentUser.created_at) }}
        </el-descriptions-item>
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
import userService, { type UserImportResult } from '@/services/user.service';
import UserFormDialog from '@/components/Users/UserFormDialog.vue';

interface User {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const authStore = useAuthStore();
const { t } = useI18n();

const loading = ref(false);
const users = ref<User[]>([]);
const searchQuery = ref('');
const filterRole = ref('');
const filterStatus = ref('');
const formDialogVisible = ref(false);
const viewDialogVisible = ref(false);
const currentUser = ref<User | null>(null);

const showImportDialog = ref(false);
const selectedImportFile = ref<File | null>(null);
const importResult = ref<UserImportResult | null>(null);
const importing = ref(false);
const downloadingTemplate = ref(false);
const importUploadRef = ref<any>(null);

const userRoles = computed(() => [
  { value: 'admin', label: t('users.roles.admin') },
  { value: 'director', label: t('users.roles.director') },
  { value: 'department_head', label: t('users.roles.department_head') },
  { value: 'staff', label: t('users.roles.staff') },
]);

const filteredUsers = computed(() => {
  let result = users.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(query) ||
      u.fullname?.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }
  
  if (filterRole.value) {
    result = result.filter(u => u.role === filterRole.value);
  }
  
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    result = result.filter(u => u.is_active === isActive);
  }
  
  return result;
});

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response: any = await api.get('/users');
    if (response && response.data) {
      users.value = response.data;
    } else if (Array.isArray(response)) {
      users.value = response;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
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
  filterRole.value = '';
  filterStatus.value = '';
  fetchUsers();
};

const handleCreate = () => {
  currentUser.value = null;
  formDialogVisible.value = true;
};

const handleEdit = (user: User) => {
  currentUser.value = user;
  formDialogVisible.value = true;
};

const handleView = (user: User) => {
  currentUser.value = user;
  viewDialogVisible.value = true;
};

const handleFormSuccess = () => {
  fetchUsers();
};

const handleDownloadImportTemplate = async () => {
  downloadingTemplate.value = true;
  try {
    await userService.downloadImportTemplate();
    ElMessage.success('Đã tải file mẫu');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || 'Không thể tải file mẫu');
  } finally {
    downloadingTemplate.value = false;
  }
};

const handleImportFileChange = (uploadFile: any) => {
  if (uploadFile?.raw) {
    selectedImportFile.value = uploadFile.raw;
    importResult.value = null;
  }
};

const handleValidateUsers = async () => {
  if (!selectedImportFile.value) {
    ElMessage.warning('Vui lòng chọn file Excel');
    return;
  }
  importing.value = true;
  try {
    const result = await userService.validateUsersFile(selectedImportFile.value);
    importResult.value = { ...result.data, validatedOnly: true };
    if (result.success) ElMessage.success(result.message);
    else ElMessage.warning(result.message);
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || 'Có lỗi khi kiểm tra file');
  } finally {
    importing.value = false;
  }
};

const handleConfirmImportUsers = async () => {
  if (!selectedImportFile.value) return;
  importing.value = true;
  try {
    const result = await userService.importUsers(selectedImportFile.value);
    importResult.value = { ...result.data };
    if (result.success) {
      ElMessage.success(result.message);
      fetchUsers();
    } else {
      ElMessage.warning(result.message);
      if (result.data?.imported > 0) fetchUsers();
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || 'Có lỗi khi import');
  } finally {
    importing.value = false;
  }
};

const closeImportDialog = () => {
  showImportDialog.value = false;
  selectedImportFile.value = null;
  importResult.value = null;
  importUploadRef.value?.clearFiles();
};

const handleToggleStatus = async (user: User) => {
  try {
    const action = user.is_active ? t('users.deactivate') : t('users.activate');
    await ElMessageBox.confirm(
      t('users.toggleStatusConfirm', { action: action.toLowerCase() }),
      t('common.warning'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await api.put(`/users/${user.id}`, { is_active: !user.is_active });
    ElMessage.success(t('common.success'));
    fetchUsers();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error toggling user status:', error);
    }
  }
};

const handleResetPassword = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      t('users.resetPasswordConfirm'),
      t('common.warning'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await userService.resetPassword(user.id);
    ElMessage.success(t('users.resetPasswordSuccess'));
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error resetting password:', error);
      ElMessage.error(error.response?.data?.message || t('common.error'));
    }
  }
};

const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      t('users.deleteConfirm'),
      t('common.warning'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await userService.delete(user.id);
    ElMessage.success(t('users.deleteSuccess'));
    fetchUsers();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error deleting user:', error);
      ElMessage.error(error.response?.data?.message || t('common.error'));
    }
  }
};

const getRoleColor = (role: string | undefined | null): 'success' | 'warning' | 'danger' | 'info' => {
  const colors: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    admin: 'danger',
    director: 'warning',
    manager: 'warning',
    department_head: 'warning',
    staff: 'success',
    user: 'info',
  };
  return (role && colors[role]) || 'info';
};

const getRoleText = (role: string) => {
  const key = `users.roles.${role}` as const;
  return t(key);
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
.user-list {
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

.import-dialog-content .import-section {
  margin-bottom: 16px;
}
.import-dialog-content .import-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}
.import-dialog-content .import-result {
  margin-top: 16px;
}
.import-dialog-content .result-summary p {
  margin: 4px 0;
}
.import-dialog-content .error-list {
  margin-top: 12px;
}
.import-dialog-content .error-list h4 {
  margin: 0 0 8px 0;
  color: var(--el-color-danger);
  font-size: 13px;
}
.text-success { color: var(--el-color-success); }
.text-danger { color: var(--el-color-danger); }
</style>
