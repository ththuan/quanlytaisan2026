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
        <el-col :span="12">
          <el-form-item
            :label="$t('users.email')"
            prop="email"
          >
            <el-input
              v-model="formData.email"
              :placeholder="$t('users.email')"
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

interface User {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  role: string;
  department_id?: number;
  is_active: boolean;
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

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.user?.id);

const formData = reactive({
  username: '',
  email: '',
  fullname: '',
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
  email: [
    { type: 'email', message: t('validation.invalidEmail'), trigger: 'blur' },
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
  formData.email = '';
  formData.fullname = '';
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
      if (isEdit.value && props.user) {
        const updateData: any = {
          email: formData.email,
          fullname: formData.fullname,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.department_id) {
          updateData.department_id = formData.department_id;
        }
        await api.put(`/users/${props.user.id}`, updateData);
        ElMessage.success(t('users.updateSuccess'));
      } else {
        const createData: any = {
          username: formData.username,
          email: formData.email,
          fullname: formData.fullname,
          role: formData.role,
        };
        // Only include password if provided, otherwise backend will use default
        if (formData.password && formData.password.trim()) {
          createData.password = formData.password;
        }
        if (formData.department_id) {
          createData.department_id = formData.department_id;
        }
        await api.post('/users', createData);
        ElMessage.success(t('users.createSuccess'));
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

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    if (!departmentStore.departments.length) {
      await departmentStore.fetchDepartments({ limit: 1000 });
    }
    if (props.user) {
      formData.username = props.user.username;
      formData.email = props.user.email;
      formData.fullname = props.user.fullname || '';
      formData.role = props.user.role;
      formData.department_id = props.user.department_id || null;
      formData.is_active = props.user.is_active;
      formData.password = '';
      formData.confirmPassword = '';
    } else {
      resetForm();
    }
  }
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>
