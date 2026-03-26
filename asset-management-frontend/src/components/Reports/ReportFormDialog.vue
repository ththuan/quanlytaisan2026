<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? $t('reports.editReport') : $t('reports.createReport')"
    width="600px"
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
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('reports.department')"
            prop="department_id"
          >
            <DepartmentTreeSelect
              v-model="formData.department_id"
              :placeholder="$t('reports.selectDepartment')"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="$t('reports.year')"
            prop="year"
          >
            <el-select
              v-model="formData.year"
              :placeholder="$t('reports.selectYear')"
              style="width: 100%"
              :disabled="isEdit"
            >
              <el-option
                v-for="y in years"
                :key="y"
                :label="y.toString()"
                :value="y"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>{{ $t('reports.assetStatistics') }}</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="$t('reports.totalAssets')">
            <el-input-number
              v-model="formData.total_assets"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('reports.activeAssets')">
            <el-input-number
              v-model="formData.active_assets"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="$t('reports.damagedAssets')">
            <el-input-number
              v-model="formData.damaged_assets"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('reports.lostAssets')">
            <el-input-number
              v-model="formData.lost_assets"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('reports.totalValue')">
        <el-input-number
          v-model="formData.total_value"
          :min="0"
          :step="1000000"
          :precision="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="$t('reports.notes')">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          :placeholder="$t('reports.enterNotes')"
        />
      </el-form-item>

      <div
        v-if="!isEdit"
        class="auto-calculate-section"
      >
        <el-button
          type="info"
          :loading="calculating"
          @click="autoCalculate"
        >
          {{ $t('reports.autoCalculate') }}
        </el-button>
        <span class="hint">{{ $t('reports.autoCalculateHint') }}</span>
      </div>
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
import { useReportStore } from '@/stores/report.store';
import { useDepartmentStore } from '@/stores/department.store';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from '@/types/element-plus';
import api from '@/services/api';

const props = defineProps<{
  visible: boolean;
  report?: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [payload?: { year?: number; department_id?: number }];
}>();

const { t } = useI18n();
const reportStore = useReportStore();
const departmentStore = useDepartmentStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const calculating = ref(false);

const isEdit = computed(() => !!props.report);

const currentYear = new Date().getFullYear();
const years = computed(() => {
  const yrs = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    yrs.push(y);
  }
  return yrs;
});

const formData = reactive({
  department_id: null as number | null,
  year: currentYear,
  total_assets: 0,
  active_assets: 0,
  damaged_assets: 0,
  lost_assets: 0,
  total_value: 0,
  notes: '',
});

const rules = computed<FormRules>(() => ({
  department_id: [{ required: true, message: t('validation.required'), trigger: 'change' }],
  year: [{ required: true, message: t('validation.required'), trigger: 'change' }],
}));

watch(() => props.visible, async (val) => {
  if (val) {
    await departmentStore.fetchDepartments();
    
    if (props.report) {
      Object.assign(formData, {
        department_id: props.report.department_id,
        year: props.report.year,
        total_assets: props.report.total_assets || 0,
        active_assets: props.report.active_assets || 0,
        damaged_assets: props.report.damaged_assets || 0,
        lost_assets: props.report.lost_assets || 0,
        total_value: props.report.total_value || 0,
        notes: props.report.notes || '',
      });
    } else {
      resetForm();
    }
  }
});

const resetForm = () => {
  formData.department_id = null;
  formData.year = currentYear;
  formData.total_assets = 0;
  formData.active_assets = 0;
  formData.damaged_assets = 0;
  formData.lost_assets = 0;
  formData.total_value = 0;
  formData.notes = '';
};

const autoCalculate = async () => {
  if (!formData.department_id) {
    ElMessage.warning(t('reports.selectDepartmentFirst'));
    return;
  }

  calculating.value = true;
  try {
    // Gọi API statistics từ backend để tính toán chính xác
    const response: any = await api.get('/reports/statistics', {
      params: {
        department_id: formData.department_id,
        year: formData.year,
      },
    });

    const stats = response.data || response;
    
    formData.total_assets = stats.total_assets || 0;
    formData.active_assets = stats.active_assets || 0;
    formData.damaged_assets = stats.damaged_assets || 0;
    formData.lost_assets = stats.lost_assets || 0;
    formData.total_value = stats.total_value || 0;

    ElMessage.success(t('reports.calculateSuccess'));
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'));
  } finally {
    calculating.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await reportStore.updateReport(props.report.id, {
        total_assets: formData.total_assets,
        active_assets: formData.active_assets,
        damaged_assets: formData.damaged_assets,
        lost_assets: formData.lost_assets,
        total_value: formData.total_value,
        notes: formData.notes,
      });
      ElMessage.success(t('reports.updateSuccess'));
    } else {
      await reportStore.createReport({
        department_id: formData.department_id!,
        year: formData.year,
        notes: formData.notes || undefined,
      });
      ElMessage.success(t('reports.createSuccess'));
      emit('success', { year: formData.year, department_id: formData.department_id! });
      emit('update:visible', false);
      return;
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

<style scoped>
.auto-calculate-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.auto-calculate-section .hint {
  color: #909399;
  font-size: 12px;
}
</style>
