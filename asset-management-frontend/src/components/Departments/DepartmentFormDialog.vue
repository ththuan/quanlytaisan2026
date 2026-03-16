<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? $t('departments.editDepartment') : $t('departments.addDepartment')"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-position="top"
    >
      <el-form-item
        :label="$t('departments.departmentName')"
        prop="name"
      >
        <el-input
          v-model="formData.name"
          :placeholder="$t('departments.departmentName')"
        />
      </el-form-item>

      <el-form-item
        :label="$t('departments.departmentType')"
        prop="type"
      >
        <el-select
          v-model="formData.type"
          :placeholder="$t('departments.departmentType')"
          style="width: 100%"
        >
          <el-option
            v-for="type in departmentTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="$t('departments.parentDepartment')"
        prop="parent_department_id"
      >
        <el-select 
          v-model="formData.parent_department_id" 
          :placeholder="$t('departments.parentDepartment')" 
          style="width: 100%"
          clearable
          filterable
        >
          <el-option
            v-for="dept in availableParentDepartments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="$t('common.description')"
        prop="description"
      >
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('common.description')"
        />
      </el-form-item>
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
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

interface Department {
  id: number;
  name: string;
  type?: string;
  parent_department_id?: number;
  description?: string;
}

const props = defineProps<{
  visible: boolean;
  department?: Department | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const formRef = ref<FormInstance>();
const loading = ref(false);
const allDepartments = ref<Department[]>([]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.department?.id);

const formData = reactive({
  name: '',
  type: 'room' as string,
  parent_department_id: null as number | null,
  description: '',
});

const departmentTypes = computed(() => [
  { value: 'department', label: t('departments.types.department') },
  { value: 'faculty', label: t('departments.types.faculty') },
  { value: 'center', label: t('departments.types.center') },
  { value: 'classroom', label: t('departments.types.classroom') },
  { value: 'lab', label: t('departments.types.lab') },
  { value: 'meeting_room', label: t('departments.types.meeting_room') },
  { value: 'hall', label: t('departments.types.hall') },
]);

const availableParentDepartments = computed(() => {
  if (!isEdit.value) return allDepartments.value;
  // Exclude current department from parent options
  return allDepartments.value.filter(d => d.id !== props.department?.id);
});

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { min: 2, max: 100, message: t('validation.stringLength', { min: 2, max: 100 }), trigger: 'blur' },
  ],
  type: [
    { required: true, message: t('validation.required'), trigger: 'change' },
  ],
}));

const fetchDepartments = async () => {
  try {
    const response: any = await api.get('/departments');
    if (response && response.data) {
      allDepartments.value = response.data;
    } else if (Array.isArray(response)) {
      allDepartments.value = response;
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
  }
};

const resetForm = () => {
  formData.name = '';
  formData.type = 'department';
  formData.parent_department_id = null;
  formData.description = '';
};

const handleClose = () => {
  resetForm();
  formRef.value?.resetFields();
  emit('update:visible', false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const submitData = { ...formData };
      // Remove null values
      if (submitData.parent_department_id === null) {
        delete (submitData as any).parent_department_id;
      }
      if (!submitData.description) {
        delete (submitData as any).description;
      }

      if (isEdit.value && props.department) {
        await api.put(`/departments/${props.department.id}`, submitData);
        ElMessage.success(t('departments.updateSuccess'));
      } else {
        await api.post('/departments', submitData);
        ElMessage.success(t('departments.createSuccess'));
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

watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchDepartments();
    if (props.department) {
      formData.name = props.department.name || '';
      formData.type = props.department.type || 'room';
      formData.parent_department_id = props.department.parent_department_id || null;
      formData.description = props.department.description || '';
    } else {
      resetForm();
    }
  }
});

onMounted(() => {
  fetchDepartments();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
