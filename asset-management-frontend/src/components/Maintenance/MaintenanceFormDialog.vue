<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? $t('maintenance.editRequest') : $t('maintenance.createRequest')"
    width="650px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="top"
    >
      <el-form-item
        v-if="!isEdit"
        :label="$t('maintenance.selectAsset')"
        prop="asset_id"
      >
        <el-select
          v-model="formData.asset_id"
          :placeholder="$t('maintenance.selectAsset')"
          filterable
          remote
          :remote-method="searchAssets"
          :loading="assetLoading"
          style="width: 100%"
        >
          <el-option
            v-for="asset in assets"
            :key="asset.id"
            :label="`${asset.asset_code} - ${asset.name}`"
            :value="asset.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="!isEdit"
        :label="$t('maintenance.department')"
      >
        <el-select
          v-model="formData.department_id"
          :placeholder="$t('maintenance.selectDepartment')"
          style="width: 100%"
        >
          <el-option
            v-for="d in departments"
            :key="d.id"
            :label="d.name"
            :value="d.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="$t('maintenance.description')"
        prop="description"
      >
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          :placeholder="$t('maintenance.enterDescription')"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('maintenance.urgency')"
            prop="urgency"
          >
            <el-select
              v-model="formData.urgency"
              style="width: 100%"
            >
              <el-option
                v-for="u in urgencies"
                :key="u.value"
                :label="u.label"
                :value="u.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('maintenance.estimatedCost')">
            <el-input-number
              v-model="formData.cost"
              :min="0"
              :step="100000"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row
        v-if="isEdit && authStore.isManager"
        :gutter="20"
      >
        <el-col :span="12">
          <el-form-item :label="$t('maintenance.status')">
            <el-select
              v-model="formData.status"
              style="width: 100%"
            >
              <el-option
                v-for="s in statuses"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('maintenance.assignTo')">
            <el-select
              v-model="formData.assigned_to"
              :placeholder="$t('maintenance.selectAssignee')"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="u in users"
                :key="u.id"
                :label="u.fullname || u.username"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row
        v-if="isEdit"
        :gutter="20"
      >
        <el-col :span="12">
          <el-form-item :label="$t('maintenance.startDate')">
            <el-date-picker
              v-model="formData.start_date"
              type="datetime"
              :placeholder="$t('maintenance.selectStartDate')"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('maintenance.completionDate')">
            <el-date-picker
              v-model="formData.completion_date"
              type="datetime"
              :placeholder="$t('maintenance.selectCompletionDate')"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('maintenance.notes')">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="2"
          :placeholder="$t('maintenance.enterNotes')"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">
        {{ $t('common.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMaintenanceStore } from '@/stores/maintenance.store';
import { useDepartmentStore } from '@/stores/department.store';
import { useUserStore } from '@/stores/user.store';
import { useAuthStore } from '@/stores/auth.store';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import api from '@/services/api';

const props = defineProps<{
  visible: boolean;
  maintenance?: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const { t } = useI18n();
const maintenanceStore = useMaintenanceStore();
const departmentStore = useDepartmentStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const assetLoading = ref(false);
const assets = ref<any[]>([]);

const isEdit = computed(() => !!props.maintenance);

const formData = reactive({
  asset_id: null as number | null,
  department_id: null as number | null,
  description: '',
  urgency: 'normal' as 'low' | 'normal' | 'high' | 'critical',
  status: 'new' as string,
  cost: null as number | null,
  assigned_to: null as number | null,
  start_date: null as Date | null,
  completion_date: null as Date | null,
  notes: '',
});

const departments = computed(() => departmentStore.departments);
const users = computed(() => userStore.users);

const urgencies = computed(() => [
  { value: 'low', label: t('maintenance.urgency_level.low') },
  { value: 'normal', label: t('maintenance.urgency_level.normal') },
  { value: 'high', label: t('maintenance.urgency_level.high') },
  { value: 'critical', label: t('maintenance.urgency_level.critical') },
]);

const statuses = computed(() => [
  { value: 'new', label: t('maintenance.status.new') },
  { value: 'approved', label: t('maintenance.status.approved') },
  { value: 'in_progress', label: t('maintenance.status.in_progress') },
  { value: 'done', label: t('maintenance.status.done') },
  { value: 'rejected', label: t('maintenance.status.rejected') },
]);

const rules = computed<FormRules>(() => ({
  asset_id: [{ required: !isEdit.value, message: t('validation.required'), trigger: 'change' }],
  description: [{ required: true, message: t('validation.required'), trigger: 'blur' }],
  urgency: [{ required: true, message: t('validation.required'), trigger: 'change' }],
}));

watch(() => props.visible, async (val) => {
  if (val) {
    await departmentStore.fetchDepartments();
    if (authStore.isManager) {
      await userStore.fetchUsers();
    }
    
    if (props.maintenance) {
      // Edit mode
      Object.assign(formData, {
        asset_id: props.maintenance.asset_id,
        department_id: props.maintenance.department_id,
        description: props.maintenance.description,
        urgency: props.maintenance.urgency,
        status: props.maintenance.status,
        cost: props.maintenance.cost,
        assigned_to: props.maintenance.assigned_to,
        start_date: props.maintenance.start_date ? new Date(props.maintenance.start_date) : null,
        completion_date: props.maintenance.completion_date ? new Date(props.maintenance.completion_date) : null,
        notes: props.maintenance.notes,
      });
    } else {
      resetForm();
    }
  }
});

const resetForm = () => {
  formData.asset_id = null;
  formData.department_id = null;
  formData.description = '';
  formData.urgency = 'normal';
  formData.status = 'new';
  formData.cost = null;
  formData.assigned_to = null;
  formData.start_date = null;
  formData.completion_date = null;
  formData.notes = '';
  assets.value = [];
};

const searchAssets = async (query: string) => {
  if (query.length < 2) {
    assets.value = [];
    return;
  }
  
  assetLoading.value = true;
  try {
    const response: any = await api.get('/assets', { params: { search: query, limit: 20 } });
    assets.value = response.data || [];
  } catch (error) {
    console.error('Error searching assets:', error);
    assets.value = [];
  } finally {
    assetLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await maintenanceStore.updateRequest(props.maintenance.id, {
        description: formData.description,
        urgency: formData.urgency,
        status: formData.status,
        cost: formData.cost || undefined,
        assigned_to: formData.assigned_to || undefined,
        start_date: formData.start_date || undefined,
        completion_date: formData.completion_date || undefined,
        notes: formData.notes,
      });
      ElMessage.success(t('maintenance.updateSuccess'));
    } else {
      await maintenanceStore.createRequest({
        asset_id: formData.asset_id!,
        department_id: formData.department_id || undefined,
        description: formData.description,
        urgency: formData.urgency,
        cost: formData.cost || undefined,
        notes: formData.notes,
      });
      ElMessage.success(t('maintenance.createSuccess'));
    }
    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'));
  } finally {
    loading.value = false;
  }
};
</script>
