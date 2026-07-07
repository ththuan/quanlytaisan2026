<template>
  <el-dialog
    :model-value="visible"
    :title="$t('transfers.createTransfer')"
    width="650px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="top"
    >
      <!-- Step 1: Chọn phòng ban nguồn -->
      <el-form-item
        :label="$t('transfers.fromDepartment')"
        prop="from_department_id"
      >
        <DepartmentTreeSelect
          v-model="formData.from_department_id"
          :placeholder="$t('transfers.selectSourceDepartment')"
          :disabled="!!userDepartmentId"
          :restrict-to-ids="sourceRestrictIds"
          @change="handleSourceDepartmentChange"
        />
      </el-form-item>

      <!-- Step 2: Chọn tài sản từ phòng ban đã chọn -->
      <el-form-item
        :label="$t('transfers.selectAsset')"
        prop="asset_id"
      >
        <el-select
          v-model="formData.asset_id"
          :placeholder="formData.from_department_id ? $t('transfers.selectAsset') : $t('transfers.selectSourceDepartmentFirst')"
          style="width: 100%"
          :disabled="!formData.from_department_id"
          :loading="assetLoading"
          filterable
          @change="handleAssetChange"
        >
          <el-option
            v-for="asset in departmentAssets"
            :key="asset.id"
            :label="`${asset.asset_code} - ${asset.name}`"
            :value="asset.id"
          >
            <div class="asset-option">
              <span class="asset-code">{{ asset.asset_code }}</span>
              <span class="asset-name">{{ asset.name }}</span>
              <el-tag
                size="small"
                :type="getStatusType(asset.status)"
              >
                {{ assetStatusLabel(asset.status) }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
        <div
          v-if="formData.from_department_id"
          class="asset-count"
        >
          {{ $t('transfers.assetCount', { count: departmentAssets.length }) }}
        </div>
      </el-form-item>

      <!-- Thông tin tài sản đã chọn -->
      <el-card
        v-if="selectedAsset"
        class="selected-asset-info"
        shadow="never"
      >
        <div class="asset-info-header">
          {{ $t('transfers.selectedAssetInfo') }}
        </div>
        <el-descriptions
          :column="2"
          size="small"
          border
        >
          <el-descriptions-item :label="$t('assets.assetCode')">
            {{ selectedAsset.asset_code }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('assets.assetName')">
            {{ selectedAsset.name }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('assets.category')">
            {{ selectedCategoryDisplay }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('common.status')">
            <el-tag :type="getStatusType(selectedAsset.status)">
              {{ assetStatusLabel(selectedAsset.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('assets.currentValue')"
            :span="2"
          >
            {{ formatCurrency(selectedAsset.current_value) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Step 3: Chọn phòng ban đích -->
      <el-form-item
        :label="$t('transfers.toDepartment')"
        prop="to_department_id"
      >
        <DepartmentTreeSelect
          v-model="formData.to_department_id"
          :placeholder="$t('transfers.selectTargetDepartment')"
          :exclude-ids="toExcludeDepartmentIds"
        />
      </el-form-item>

      <!-- Lý do điều chuyển -->
      <el-form-item
        :label="$t('transfers.reason')"
        prop="reason"
      >
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="3"
          :placeholder="$t('transfers.enterReason')"
        />
      </el-form-item>

      <!-- Ghi chú -->
      <el-form-item :label="$t('transfers.notes')">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="2"
          :placeholder="$t('transfers.enterNotes')"
        />
      </el-form-item>

      <!-- Thông báo -->
      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          {{ $t('transfers.transferNote') }}
        </template>
      </el-alert>
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
import { useTransferStore } from '@/stores/transfer.store';
import { useDepartmentStore } from '@/stores/department.store';
import { useAuthStore } from '@/stores/auth.store';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from '@/types/element-plus';
import api from '@/services/api';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import { formatAssetCategoryLabel, formatI18nOrRaw } from '@/utils/assetDisplay';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const { t, te } = useI18n();

const selectedCategoryDisplay = computed(() =>
  formatAssetCategoryLabel(selectedAsset.value as Record<string, unknown> | null, t, te),
);

const assetStatusLabel = (status: string | null | undefined) =>
  formatI18nOrRaw('assets.status', status, t, te);
const transferStore = useTransferStore();
const departmentStore = useDepartmentStore();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const assetLoading = ref(false);
const departmentAssets = ref<any[]>([]);
const selectedAsset = ref<any>(null);

const formData = reactive({
  asset_id: null as number | null,
  from_department_id: null as number | null,
  to_department_id: null as number | null,
  reason: '',
  notes: '',
});

const departments = computed(() => departmentStore.departments);
const userDepartmentId = computed(() => authStore.userDepartmentId);
const sourceDepartments = computed(() => {
  if (!userDepartmentId.value) return departments.value;
  return departments.value.filter((d: any) => d.id === userDepartmentId.value);
});

/** Trưởng đơn vị: chỉ được chọn đơn vị mình làm nguồn; admin: toàn bộ cây. */
const sourceRestrictIds = computed((): number[] | undefined => {
  if (!userDepartmentId.value) return undefined;
  return sourceDepartments.value.map((d: any) => d.id);
});

const toExcludeDepartmentIds = computed((): number[] =>
  formData.from_department_id ? [formData.from_department_id] : []
);

const rules = computed<FormRules>(() => ({
  from_department_id: [{ required: true, message: t('validation.required'), trigger: 'change' }],
  asset_id: [{ required: true, message: t('validation.required'), trigger: 'change' }],
  to_department_id: [
    { required: true, message: t('validation.required'), trigger: 'change' },
    {
      validator: (_rule: any, value: number, callback: (e?: Error) => void) => {
        if (value === formData.from_department_id) {
          callback(new Error(t('transfers.sameDepartmentError')));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  reason: [{ required: true, message: t('validation.required'), trigger: 'blur' }],
}));

watch(() => props.visible, (val) => {
  if (val) {
    departmentStore.fetchDepartments({ limit: 1000 });
    resetForm();

    // Nếu user có phòng ban, tự động set phòng ban nguồn = phòng ban của user và khóa lại
    if (userDepartmentId.value) {
      formData.from_department_id = userDepartmentId.value as any;
      // Load tài sản theo phòng ban nguồn
      handleSourceDepartmentChange(userDepartmentId.value as any);
    }
  }
});

const resetForm = () => {
  formData.asset_id = null;
  formData.from_department_id = null;
  formData.to_department_id = null;
  formData.reason = '';
  formData.notes = '';
  departmentAssets.value = [];
  selectedAsset.value = null;
};

// Khi chọn phòng ban nguồn, load danh sách tài sản của phòng ban đó
const handleSourceDepartmentChange = async (departmentId: number | null | undefined) => {
  formData.asset_id = null;
  formData.to_department_id = null;
  selectedAsset.value = null;
  departmentAssets.value = [];

  if (departmentId == null || !Number.isFinite(Number(departmentId))) return;
  
  assetLoading.value = true;
  try {
    const response: any = await api.get('/assets', {
      params: {
        current_department_id: departmentId,
        status: 'active', // Chỉ lấy tài sản đang hoạt động
        limit: 500,
      },
    });
    // API interceptor đã unwrap response.data, nên response chính là data từ backend
    // Backend trả về { success: true, data: [...], pagination: {...} }
    departmentAssets.value = response?.data || [];
  } catch (error) {
    console.error('Error loading department assets:', error);
    departmentAssets.value = [];
  } finally {
    assetLoading.value = false;
  }
};

const handleAssetChange = (assetId: number) => {
  const asset = departmentAssets.value.find(a => a.id === assetId);
  if (asset) {
    selectedAsset.value = asset;
  } else {
    selectedAsset.value = null;
  }
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    damaged: 'warning',
    lost: 'danger',
    disposed: 'info',
  };
  return types[status] || 'info';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await transferStore.createTransfer({
      asset_id: formData.asset_id!,
      from_department_id: formData.from_department_id!,
      to_department_id: formData.to_department_id!,
      reason: formData.reason,
      notes: formData.notes,
    });
    ElMessage.success(t('transfers.createSuccess'));
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
.asset-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-option .asset-code {
  font-weight: 600;
  color: #409eff;
  min-width: 100px;
}

.asset-option .asset-name {
  flex: 1;
}

.asset-count {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.selected-asset-info {
  margin-bottom: 20px;
  background: #f5f7fa;
}

.asset-info-header {
  font-weight: 600;
  margin-bottom: 10px;
  color: #606266;
}
</style>
