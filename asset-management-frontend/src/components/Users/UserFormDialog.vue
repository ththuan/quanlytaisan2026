<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? $t('users.editUser') : $t('users.addUser')"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    :append-to-body="true"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-position="top"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('users.username')"
            prop="username"
          >
            <el-input 
              v-model="formData.username" 
              :placeholder="$t('users.username')"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('users.fullname')"
            prop="fullname"
          >
            <el-input
              v-model="formData.fullname"
              :placeholder="$t('users.fullname')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="$t('users.role')"
            prop="role"
          >
            <el-select
              v-model="formData.role"
              :placeholder="$t('users.role')"
              style="width: 100%"
            >
              <el-option
                v-for="role in userRoles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row
        v-if="!isEdit"
        :gutter="20"
      >
        <el-col :span="12">
          <el-form-item
            :label="$t('users.password')"
            prop="password"
          >
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="Mật khẩu (để trống sẽ dùng mật khẩu mặc định)"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="$t('users.confirmPassword')"
            prop="confirmPassword"
          >
            <el-input
              v-model="formData.confirmPassword"
              type="password"
              :placeholder="$t('users.confirmPassword')"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('users.department')"
            prop="department_id"
          >
            <DepartmentTreeSelect
              v-model="formData.department_id"
              :placeholder="$t('users.department')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="Chức danh"
            prop="job_title"
          >
            <el-select
              v-model="formData.job_title"
              filterable
              allow-create
              default-first-option
              clearable
              placeholder="Chọn hoặc nhập chức danh..."
              style="width: 100%"
            >
              <el-option
                v-for="title in jobTitleSuggestions"
                :key="title"
                :label="title"
                :value="title"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col
          v-if="isEdit"
          :span="12"
        >
          <el-form-item
            :label="$t('common.status')"
            prop="is_active"
          >
            <el-switch
              v-model="formData.is_active"
              :active-text="$t('users.active')"
              :inactive-text="$t('users.inactive')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        Phân quyền chức năng
      </el-divider>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="Mặc định mỗi vai trò đã có bộ quyền phù hợp. Chỉ bật tùy chỉnh khi cần cấp thêm/bớt cho riêng người dùng này."
        class="permission-note"
      />

      <div
        v-if="formData.role === 'admin'"
        class="permission-hint"
      >
        Tài khoản admin mặc định có toàn bộ quyền, không cần phân quyền riêng.
      </div>

      <div
        v-else
        v-loading="permissionLoading"
        class="permission-block"
      >
        <div class="permission-toggle">
          <el-switch
            v-model="permissionCustomized"
            active-text="Tùy chỉnh quyền riêng"
            @change="handleCustomizationChange"
          />
          <span class="permission-hint">
            {{ permissionCustomized
              ? 'Đang dùng quyền riêng do admin chọn.'
              : `Đang dùng quyền mặc định của vai trò ${roleLabel} — không cần chọn thêm.` }}
          </span>
        </div>

        <template v-if="!permissionCustomized">
          <div
            v-if="currentRoleDefaults?.fullAccess"
            class="permission-hint"
          >
            Vai trò Quản trị viên có toàn bộ quyền hệ thống.
          </div>
          <div
            v-else
            class="role-default-summary"
          >
            <div
              v-for="module in defaultModules"
              :key="module.module"
              class="default-module"
            >
              <span class="default-module-label">{{ module.moduleLabel }}</span>
              <el-tag
                v-for="perm in module.permissions"
                :key="perm.code"
                size="small"
                type="info"
                effect="plain"
                class="default-permission-tag"
              >
                {{ perm.label }}
                <span class="default-permission-scope">· {{ scopeLabels[perm.scope] }}</span>
              </el-tag>
            </div>
            <div
              v-if="!defaultModules.length"
              class="permission-hint"
            >
              Vai trò này chưa có quyền mặc định.
            </div>
          </div>
        </template>

        <template v-else>
          <div class="preset-row">
            <el-button
              type="primary"
              plain
              size="small"
              @click="applyRoleDefaults"
            >
              Mặc định {{ roleLabel }}
            </el-button>
            <el-button
              v-for="preset in permissionPresets"
              :key="preset.code"
              size="small"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </el-button>
            <el-button
              size="small"
              @click="clearPermissionSelection"
            >
              Bỏ chọn
            </el-button>
          </div>

          <el-collapse class="permission-collapse">
            <el-collapse-item
              v-for="module in permissionModules"
              :key="module.module"
              :name="module.module"
            >
              <template #title>
                <span class="permission-module-title">{{ module.moduleLabel }}</span>
                <el-tag
                  size="small"
                  type="info"
                  class="permission-count"
                >
                  {{ countModuleSelected(module) }}/{{ selectablePermissions(module).length }}
                </el-tag>
              </template>

              <div
                v-for="perm in selectablePermissions(module)"
                :key="perm.code"
                class="permission-row"
              >
                <el-checkbox
                  :model-value="isPermissionSelected(perm.code)"
                  @update:model-value="togglePermission(perm.code, Boolean($event))"
                >
                  {{ perm.label }}
                </el-checkbox>
                <el-select
                  v-if="isPermissionSelected(perm.code)"
                  :model-value="permissionSelection[perm.code]"
                  size="small"
                  class="scope-select"
                  @update:model-value="setPermissionScope(perm.code, $event)"
                >
                  <el-option
                    v-for="scope in scopeOptions(perm)"
                    :key="scope.value"
                    :label="scope.label"
                    :value="scope.value"
                  />
                </el-select>
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from '@/types/element-plus';
import { ElMessage } from 'element-plus';
import api from '@/services/api';
import { useDepartmentStore } from '@/stores/department.store';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import {
  permissionService,
  type PermissionDefinition,
  type PermissionModule,
  type PermissionPreset,
  type PermissionScope,
  type RoleDefaultPermissions,
} from '@/services/permission.service';

interface User {
  id: number;
  username: string;
  fullname?: string;
  job_title?: string;
  role: string;
  department_id?: number;
  is_active: boolean;
  permissions_customized?: boolean;
}

const props = defineProps<{
  visible: boolean;
  user?: User | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const departmentStore = useDepartmentStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const permissionLoading = ref(false);
const permissionCustomized = ref(false);
const permissionChanged = ref(false);
const permissionModules = ref<PermissionModule[]>([]);
const permissionPresets = ref<PermissionPreset[]>([]);
const roleDefaultPermissions = ref<RoleDefaultPermissions[]>([]);
const permissionScopeOptions = ref<Array<{ value: PermissionScope; label: string }>>([]);
const permissionSelection = reactive<Record<string, PermissionScope>>({});

const scopeLabels: Record<PermissionScope, string> = {
  own: 'Cá nhân',
  department: 'Đơn vị',
  all: 'Toàn trường',
};

const findPermission = (code: string): PermissionDefinition | undefined =>
  permissionModules.value.flatMap((module) => module.permissions).find((perm) => perm.code === code);

const selectablePermissions = (module: PermissionModule): PermissionDefinition[] =>
  module.permissions.filter((perm) => !perm.adminOnly);

const scopeOptions = (perm: PermissionDefinition) =>
  permissionScopeOptions.value.filter((scope) => perm.scopes.includes(scope.value));

const isPermissionSelected = (code: string): boolean =>
  Object.prototype.hasOwnProperty.call(permissionSelection, code);

const defaultScopeForPermission = (perm: PermissionDefinition): PermissionScope => {
  const options = scopeOptions(perm);
  return options.find((scope) => scope.value === 'department')?.value
    ?? options[0]?.value
    ?? 'all';
};

const togglePermission = (code: string, checked: boolean) => {
  if (checked) {
    const perm = findPermission(code);
    if (!perm) return;
    permissionSelection[code] = defaultScopeForPermission(perm);
  } else {
    delete permissionSelection[code];
  }
  permissionChanged.value = true;
};

const setPermissionScope = (code: string, scope: PermissionScope) => {
  permissionSelection[code] = scope;
  permissionChanged.value = true;
};

const countModuleSelected = (module: PermissionModule): number =>
  selectablePermissions(module).filter((perm) => isPermissionSelected(perm.code)).length;

const clearSelection = () => {
  Object.keys(permissionSelection).forEach((code) => delete permissionSelection[code]);
};

const setSelection = (grants: Array<{ code: string; scope: PermissionScope }>) => {
  clearSelection();
  grants.forEach((grant) => {
    permissionSelection[grant.code] = grant.scope;
  });
};

const clearPermissionSelection = () => {
  clearSelection();
  permissionChanged.value = true;
};

const applyPreset = (preset: PermissionPreset) => {
  setSelection(preset.permissions);
  permissionCustomized.value = true;
  permissionChanged.value = true;
};

const loadPermissionCatalog = async () => {
  if (permissionModules.value.length) return;
  const response = await permissionService.getCatalog();
  permissionModules.value = response.data.modules;
  permissionPresets.value = response.data.presets;
  roleDefaultPermissions.value = response.data.role_defaults || [];
  permissionScopeOptions.value = response.data.scopes;
};

const loadPermissionData = async () => {
  permissionLoading.value = true;
  try {
    await loadPermissionCatalog();
    clearSelection();
    permissionCustomized.value = false;
    permissionChanged.value = false;

    if (props.user && props.user.role !== 'admin') {
      const response = await permissionService.getUserPermissions(props.user.id);
      permissionCustomized.value = Boolean(response.data.permissions_customized);
      setSelection(response.data.permissions);
      return;
    }

    setSelection(currentRoleDefaults.value?.permissions || []);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Không tải được danh mục quyền');
  } finally {
    permissionLoading.value = false;
  }
};

const savePermissionsForUser = async (userId: number, role: string) => {
  if (role === 'admin') return;
  if (permissionCustomized.value) {
    const grants = Object.entries(permissionSelection).map(([code, scope]) => ({ code, scope }));
    await permissionService.updateUserPermissions(userId, grants);
    return;
  }
  if (permissionChanged.value || props.user?.permissions_customized) {
    await permissionService.resetUserPermissions(userId);
  }
};

const jobTitleSuggestions = ref<string[]>([]);

const DEFAULT_JOB_TITLES = [
  'Hiệu trưởng',
  'Phó Hiệu trưởng',
  'Trưởng phòng',
  'Phó Trưởng phòng',
  'Trưởng khoa',
  'Phó Trưởng khoa',
  'Trưởng bộ môn',
  'Giảng viên',
  'Giáo viên',
  'Chuyên viên',
  'Kế toán trưởng',
  'Kế toán',
  'Thủ quỹ',
  'Văn thư',
  'Nhân viên',
];

const fetchJobTitleSuggestions = () => {
  // Không lấy position_group từ định mức vì đó là tên nhóm định mức
  // (dài, có "tương đương", "ký hợp đồng"...), không phải chức danh người dùng.
  jobTitleSuggestions.value = [...DEFAULT_JOB_TITLES];
};

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.user?.id);

const formData = reactive({
  username: '',
  fullname: '',
  job_title: '',
  role: 'staff' as string,
  department_id: null as number | null,
  password: '',
  confirmPassword: '',
  is_active: true,
});

const userRoles = computed(() => [
  { value: 'admin', label: t('users.roles.admin') },
  { value: 'director', label: t('users.roles.director') },
  { value: 'department_head', label: t('users.roles.department_head') },
  { value: 'staff', label: t('users.roles.staff') },
]);

const roleLabel = computed(
  () => userRoles.value.find((role) => role.value === formData.role)?.label || formData.role,
);

const currentRoleDefaults = computed(
  () => roleDefaultPermissions.value.find((entry) => entry.role === formData.role),
);

const defaultModules = computed(() => {
  const defaults = currentRoleDefaults.value?.permissions || [];
  if (!defaults.length) return [];

  const scopeByCode = new Map(defaults.map((grant) => [grant.code, grant.scope]));
  return permissionModules.value
    .map((module) => ({
      module: module.module,
      moduleLabel: module.moduleLabel,
      permissions: module.permissions
        .filter((perm) => scopeByCode.has(perm.code))
        .map((perm) => ({
          code: perm.code,
          label: perm.label,
          scope: scopeByCode.get(perm.code)!,
        })),
    }))
    .filter((module) => module.permissions.length > 0);
});

const applyRoleDefaults = () => {
  setSelection(currentRoleDefaults.value?.permissions || []);
  permissionCustomized.value = true;
  permissionChanged.value = true;
};

const handleCustomizationChange = (value: string | number | boolean) => {
  permissionCustomized.value = Boolean(value);
  permissionChanged.value = true;
  if (permissionCustomized.value && !Object.keys(permissionSelection).length) {
    setSelection(currentRoleDefaults.value?.permissions || []);
  }
};

const validatePassword = (_rule: any, value: string, callback: any) => {
  // Password is optional - if not provided, will use default password from backend config
  if (!isEdit.value && value && value.length < 6) {
    callback(new Error(t('validation.minLength', { min: 6 })));
  } else {
    callback();
  }
};

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  // Only validate if password is provided
  if (!isEdit.value && formData.password && value !== formData.password) {
    callback(new Error(t('validation.passwordMismatch')));
  } else {
    callback();
  }
};

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { min: 3, max: 50, message: t('validation.stringLength', { min: 3, max: 50 }), trigger: 'blur' },
  ],
  role: [
    { required: true, message: t('validation.required'), trigger: 'change' },
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}));

const resetForm = () => {
  formData.username = '';
  formData.fullname = '';
  formData.job_title = '';
      formData.role = 'staff';
  formData.department_id = null;
  formData.password = '';
  formData.confirmPassword = '';
  formData.is_active = true;
};

const handleClosed = () => {
  resetForm();
  formRef.value?.resetFields();
};

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      let savedUserId: number | null = null;

      if (isEdit.value && props.user) {
        const updateData: any = {
          fullname: formData.fullname,
          job_title: formData.job_title || null,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.department_id) {
          updateData.department_id = formData.department_id;
        }
        const response: any = await api.put(`/users/${props.user.id}`, updateData);
        savedUserId = Number(response?.data?.id || props.user.id);
        ElMessage.success(t('users.updateSuccess'));
      } else {
        const createData: any = {
          username: formData.username,
          fullname: formData.fullname,
          job_title: formData.job_title || null,
          role: formData.role,
        };
        // Only include password if provided, otherwise backend will use default
        if (formData.password && formData.password.trim()) {
          createData.password = formData.password;
        }
        if (formData.department_id) {
          createData.department_id = formData.department_id;
        }
        const response: any = await api.post('/users', createData);
        savedUserId = Number(response?.data?.id);
        ElMessage.success(t('users.createSuccess'));
      }

      if (savedUserId) {
        try {
          await savePermissionsForUser(savedUserId, formData.role);
        } catch (permissionError: any) {
          ElMessage.warning(
            permissionError.response?.data?.message
              || 'Đã lưu người dùng nhưng cập nhật quyền thất bại. Vui lòng thử lại.',
          );
        }
      }

      emit('success');
      handleClose();
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || t('common.error'));
    } finally {
      loading.value = false;
    }
  });
};

watch(() => formData.role, () => {
  if (!permissionCustomized.value) {
    setSelection(currentRoleDefaults.value?.permissions || []);
    permissionChanged.value = false;
  }
});

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    fetchJobTitleSuggestions();
    if (!departmentStore.departments.length) {
      await departmentStore.fetchDepartments({ limit: 1000 });
    }
    if (props.user) {
      formData.username = props.user.username;
      formData.fullname = props.user.fullname || '';
      formData.job_title = props.user.job_title || '';
      formData.role = props.user.role;
      formData.department_id = props.user.department_id || null;
      formData.is_active = props.user.is_active;
      formData.password = '';
      formData.confirmPassword = '';
    } else {
      resetForm();
    }
    await loadPermissionData();
  }
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

.permission-note {
  margin-bottom: 12px;
}

.permission-block {
  margin-top: 4px;
}

.permission-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.permission-hint {
  color: #909399;
  font-size: 12px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.role-default-summary {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafcff;
  max-height: 220px;
  overflow-y: auto;
}

.default-module {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
}

.default-module + .default-module {
  border-top: 1px dashed #f0f2f5;
}

.default-module-label {
  min-width: 132px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.default-permission-tag {
  margin: 0 6px 6px 0;
}

.default-permission-scope {
  color: #909399;
  font-size: 11px;
}

.permission-collapse {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.permission-module-title {
  font-weight: 600;
  margin-right: 8px;
}

.permission-count {
  margin-left: 4px;
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed #f0f2f5;
}

.permission-row:last-child {
  border-bottom: none;
}

.scope-select {
  width: 132px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .permission-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .scope-select {
    width: 100%;
  }
}
</style>
