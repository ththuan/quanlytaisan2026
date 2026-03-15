<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ $t('users.title') }}</h3>
          <el-button type="primary" :icon="Plus" @click="handleCreate" v-if="authStore.isAdmin">
            {{ $t('users.addUser') }}
          </el-button>
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
            <el-select v-model="filterRole" :placeholder="$t('users.filterByRole')" clearable @change="handleFilter">
              <el-option v-for="role in userRoles" :key="role.value" :label="role.label" :value="role.value" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="filterStatus" :placeholder="$t('users.filterByStatus')" clearable @change="handleFilter">
              <el-option :label="$t('users.active')" value="active" />
              <el-option :label="$t('users.inactive')" value="inactive" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
            <el-button @click="handleReset">{{ $t('common.refresh') }}</el-button>
          </el-col>
        </el-row>
      </div>

      <div class="responsive-table">
        <el-table :data="filteredUsers" :loading="loading" border stripe>
        <el-table-column prop="username" :label="$t('users.username')" width="150" />
        <el-table-column prop="fullname" :label="$t('users.fullname')" min-width="180" />
        <el-table-column prop="email" :label="$t('users.email')" min-width="200" />
        <el-table-column prop="role" :label="$t('users.role')" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleColor(row.role) ?? 'info'">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="120">
          <template #default="{ row }">
<el-tag :type="row.is_active === true ? 'success' : 'danger'">
            {{ row.is_active ? $t('users.active') : $t('users.inactive') }}
          </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ $t('common.view') }}</el-button>
            <el-button size="small" type="warning" @click="handleEdit(row)" v-if="authStore.isAdmin">
              {{ $t('common.edit') }}
            </el-button>
            <el-button
              size="small"
              type="info"
              @click="handleResetPassword(row)"
              v-if="authStore.isAdmin && row.id !== authStore.user?.id"
            >
              {{ $t('users.resetPassword') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
              v-if="authStore.isAdmin && row.id !== authStore.user?.id"
            >
              {{ $t('common.delete') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleToggleStatus(row)"
              v-if="authStore.isAdmin && row.id !== authStore.user?.id"
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

    <!-- View Dialog -->
    <el-dialog v-model="viewDialogVisible" :title="$t('users.userDetails')" width="600px">
      <el-descriptions :column="1" border v-if="currentUser">
        <el-descriptions-item :label="$t('users.username')">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item :label="$t('users.fullname')">{{ currentUser.fullname || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('users.email')">{{ currentUser.email }}</el-descriptions-item>
        <el-descriptions-item :label="$t('users.role')">
          <el-tag :type="getRoleColor(currentUser.role) ?? 'info'">{{ getRoleText(currentUser.role) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">
          <el-tag :type="currentUser.is_active === true ? 'success' : 'danger'">
            {{ currentUser.is_active ? $t('users.active') : $t('users.inactive') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.createdAt')">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Search } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import api from '@/services/api';
import userService from '@/services/user.service';
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
</style>
