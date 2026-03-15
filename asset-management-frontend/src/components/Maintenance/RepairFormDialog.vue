<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? 'Sửa đề nghị sửa chữa' : 'Tạo đề nghị sửa chữa'"
    width="90%"
    :close-on-click-modal="false"
    top="5vh"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="180px"
      label-position="top"
    >
      <!-- Thông tin chung -->
      <el-card shadow="never" style="margin-bottom: 20px; background: #f5f7fa;">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Đơn vị sử dụng trực tiếp">
              <el-input :value="userDepartmentName" disabled style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Mức độ ưu tiên" prop="urgency">
              <el-select v-model="formData.urgency" style="width: 100%">
                <el-option v-for="u in urgencies" :key="u.value" :label="u.label" :value="u.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- Chọn tài sản -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600;">Chọn tài sản cần sửa chữa</span>
            <el-button 
              v-if="formData.asset_id" 
              type="danger" 
              size="small" 
              @click="formData.asset_id = null; selectedAsset = null"
            >
              Xóa lựa chọn
            </el-button>
          </div>
        </template>
        
        <el-form-item label="Tài sản" prop="asset_id" required>
          <el-select
            v-model="formData.asset_id"
            filterable
            :loading="assetLoading"
            placeholder="Chọn tài sản cần sửa chữa"
            style="width: 100%"
            @change="handleAssetChange"
            :disabled="isEdit"
            @focus="loadInitialAssets"
          >
            <el-option
              v-for="asset in assetOptions"
              :key="asset.id"
              :label="`${asset.asset_code} - ${asset.name}`"
              :value="asset.id"
            >
              <div style="display: flex; justify-content: space-between;">
                <span>{{ asset.asset_code }} - {{ asset.name }}</span>
                <span style="color: #909399; font-size: 12px;">{{ asset.status }}</span>
              </div>
            </el-option>
            <el-option
              v-if="assetOptions.length === 0 && !assetLoading"
              disabled
              value=""
            >
              <span style="color: #909399;">Không tìm thấy tài sản nào</span>
            </el-option>
          </el-select>
          <div v-if="assetOptions.length === 0 && !assetLoading" style="margin-top: 8px; font-size: 12px; color: #909399;">
            <span v-if="!authStore.userDepartmentId">
              ⚠️ Bạn chưa được gán vào phòng ban nào. Vui lòng liên hệ quản trị viên.
            </span>
            <span v-else>
              ⚠️ Không có tài sản đang sử dụng trong phòng ban của bạn.
            </span>
          </div>
        </el-form-item>

        <!-- Hiển thị thông tin tài sản đã chọn -->
        <el-descriptions 
          v-if="selectedAsset" 
          :column="2" 
          border 
          style="margin-top: 20px;"
        >
          <el-descriptions-item label="Mã tài sản">
            <strong>{{ selectedAsset.asset_code }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="Tên tài sản">
            <strong>{{ selectedAsset.name }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="Nguyên giá">
            {{ selectedAsset.purchase_price ? formatCurrency(Number(selectedAsset.purchase_price)) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="Giá trị còn lại">
            {{ formatCurrency(selectedAsset.current_value) }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái hiện tại">
            <el-tag :type="getAssetStatusType(selectedAsset.status)">
              {{ getAssetStatusText(selectedAsset.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Thông tin sửa chữa -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <template #header>
          <span style="font-weight: 600;">Thông tin sửa chữa</span>
        </template>

        <el-form-item label="Thuyết minh nhu cầu sửa chữa" prop="justification">
          <el-input
            v-model="formData.justification"
            type="textarea"
            :rows="3"
            placeholder="Nhập thuyết minh nhu cầu sửa chữa"
          />
        </el-form-item>

        <!-- Chi phí dự kiến: chỉ admin nhập, chỉ admin và giám hiệu xem -->
        <el-form-item 
          v-if="canViewEstimatedCost"
          label="Chi phí dự kiến sửa chữa" 
          prop="estimated_cost"
        >
          <el-input-number
            v-model="formData.estimated_cost"
            :min="0"
            :step="100000"
            :controls="false"
            :disabled="!canEditEstimatedCost"
            style="width: 100%"
            placeholder="Nhập chi phí dự kiến"
          />
          <div v-if="selectedAsset && selectedAsset.purchase_price && formData.estimated_cost" style="margin-top: 8px; font-size: 12px; color: #909399;">
            Chi phí dự kiến: {{ formatCurrency(formData.estimated_cost) }}
            <br>
            Nguyên giá: {{ formatCurrency(Number(selectedAsset.purchase_price)) }}
            <br>
            Giá trị còn lại: {{ formatCurrency(selectedAsset.current_value) }}
            <br>
            Tỷ lệ so với nguyên giá: <strong :style="{ color: costPercentage > 30 ? '#f56c6c' : '#67c23a' }">
              {{ costPercentage.toFixed(2) }}%
            </strong>
            <span v-if="costPercentage > 30" style="color: #f56c6c; margin-left: 8px;">
              ⚠️ Vượt quá 30% nguyên giá, đề nghị sẽ bị từ chối
            </span>
            <div v-if="selectedAsset.current_value && formData.estimated_cost" style="margin-top: 4px;">
              Tỷ lệ so với giá trị còn lại: <strong :style="{ color: (formData.estimated_cost / Number(selectedAsset.current_value) * 100) > 50 ? '#f56c6c' : '#67c23a' }">
                {{ ((formData.estimated_cost / Number(selectedAsset.current_value)) * 100).toFixed(2) }}%
              </strong>
            </div>
          </div>
          <div v-if="!canEditEstimatedCost" style="margin-top: 8px; font-size: 12px; color: #909399;">
            💡 Chi phí dự kiến sẽ được admin phân tích và nhập dựa trên nguyên giá và giá trị còn lại của tài sản.
          </div>
        </el-form-item>

        <el-form-item label="Hình ảnh minh họa tình trạng hư hỏng">
          <el-upload
            v-model:file-list="damageImageList"
            list-type="picture-card"
            :auto-upload="false"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-change="handleImageChange"
            accept="image/*"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            Tối đa 5 hình ảnh. Hình ảnh này chỉ lưu với đề nghị sửa chữa, không lưu vào thông tin tài sản.
          </div>
        </el-form-item>

        <el-form-item label="Ghi chú">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="Nhập ghi chú (nếu có)"
          />
        </el-form-item>
      </el-card>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #909399; font-size: 14px;">
          <span v-if="currentStatus === 'draft' || currentStatus === 'rejected' || currentStatus?.startsWith('rejected_by')">
            <el-tag type="info" size="small">Trạng thái: {{ getStatusText(currentStatus) }}</el-tag>
          </span>
        </div>
        <div>
          <el-button @click="$emit('update:visible', false)" size="large">
            {{ $t('common.cancel') }}
          </el-button>
          <!-- Nút Lưu nháp -->
          <el-button 
            v-if="canSaveDraft"
            :loading="loading" 
            @click="handleSaveDraft" 
            size="large"
          >
            <el-icon style="margin-right: 4px;"><Document /></el-icon>
            Lưu nháp
          </el-button>
          <!-- Nút Gửi phê duyệt -->
          <el-button 
            v-if="canSubmit"
            type="success" 
            :loading="submitting" 
            @click="handleSubmitForApproval" 
            size="large"
          >
            <el-icon style="margin-right: 4px;"><Promotion /></el-icon>
            Gửi phê duyệt
          </el-button>
          <!-- Nút Lưu -->
          <el-button 
            v-else
            type="primary" 
            :loading="loading" 
            @click="handleSubmit" 
            size="large"
          >
            <el-icon style="margin-right: 4px;"><Check /></el-icon>
            {{ $t('common.save') }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- Image preview dialog -->
    <el-dialog v-model="previewVisible" title="Xem trước hình ảnh">
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDepartmentStore } from '@/stores/department.store';
import { useAuthStore } from '@/stores/auth.store';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Document, Promotion, Check } from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import api from '@/services/api';
import { useAssets } from '@/composables/useAssets';

interface Asset {
  id: number;
  asset_code: string;
  name: string;
  purchase_price?: number;
  status: string;
}

const props = defineProps<{
  visible: boolean;
  item?: any;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const departmentStore = useDepartmentStore();
const authStore = useAuthStore();
const { searchAssets: searchAssetsComposable } = useAssets();

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const assetLoading = ref(false);
const assetOptions = ref<Asset[]>([]);
const selectedAsset = ref<Asset | null>(null);
const damageImageList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewImageUrl = ref('');

const isEdit = computed(() => !!props.item);
const currentStatus = computed(() => props.item?.status || 'draft');

// Phân quyền cho chi phí dự kiến
const canEditEstimatedCost = computed(() => {
  return authStore.isAdmin; // Chỉ admin mới nhập được
});

const canViewEstimatedCost = computed(() => {
  return authStore.isAdmin || authStore.isDirector; // Admin và giám hiệu mới xem được
});

const canSaveDraft = computed(() => {
  const status = currentStatus.value;
  return status === 'draft' || status === 'rejected' || status?.startsWith('rejected_by');
});

const canSubmit = computed(() => {
  const status = currentStatus.value;
  return status === 'draft' || status === 'new' || status === 'rejected' || status?.startsWith('rejected_by');
});

const costPercentage = computed(() => {
  if (!selectedAsset.value?.purchase_price || !formData.estimated_cost) return 0;
  return (formData.estimated_cost / Number(selectedAsset.value.purchase_price)) * 100;
});

const formData = reactive({
  asset_id: null as number | null,
  department_id: null as number | null,
  justification: '',
  urgency: 'normal' as string,
  status: 'draft' as string,
  estimated_cost: null as number | null,
  notes: '',
  damage_images: null as string | null,
});

const departments = computed(() => departmentStore.departments);

const userDepartmentName = computed(() => {
  const dept = departments.value.find(d => d.id === authStore.userDepartmentId);
  return dept ? dept.name : 'Chưa xác định';
});

const urgencies = computed(() => [
  { value: 'low', label: t('maintenance.urgency_level.low') },
  { value: 'normal', label: t('maintenance.urgency_level.normal') },
  { value: 'high', label: t('maintenance.urgency_level.high') },
  { value: 'critical', label: t('maintenance.urgency_level.critical') },
]);

const rules = computed<FormRules>(() => {
  const baseRules: FormRules = {
    asset_id: [{ required: true, message: 'Vui lòng chọn tài sản', trigger: 'change' }],
    urgency: [{ required: true, message: t('validation.required'), trigger: 'change' }],
    justification: [{ required: true, message: 'Vui lòng nhập thuyết minh nhu cầu sửa chữa', trigger: 'blur' }],
  };
  
  // Chi phí dự kiến chỉ bắt buộc với admin
  if (canEditEstimatedCost.value) {
    baseRules.estimated_cost = [{ required: true, message: 'Vui lòng nhập chi phí dự kiến', trigger: 'change' }];
  }
  
  return baseRules;
});

// Load danh sách tài sản ban đầu khi mở dialog
const loadInitialAssets = async () => {
  // Nếu đã có data thì không load lại
  if (assetOptions.value.length > 0) {
    return;
  }
  
  assetLoading.value = true;
  try {
    // Load tất cả tài sản active trong phòng ban của user
    const response: any = await api.get('/assets', {
      params: {
        status: 'active',
        current_department_id: authStore.userDepartmentId,
        limit: 100, // Load nhiều hơn để có đủ danh sách
      },
    });
    
    // API interceptor returns response.data directly, so response is { success, data, pagination }
    // The data field contains the array of assets
    if (response) {
      // Handle different response structures
      if (Array.isArray(response)) {
        assetOptions.value = response;
      } else if (response.data && Array.isArray(response.data)) {
        assetOptions.value = response.data;
      } else if (Array.isArray(response.data?.data)) {
        assetOptions.value = response.data.data;
      } else {
        assetOptions.value = [];
      }
    } else {
      assetOptions.value = [];
    }
  } catch (error) {
    console.error('Error loading assets:', error);
    assetOptions.value = [];
  } finally {
    assetLoading.value = false;
  }
};

const handleAssetChange = async (assetId: number | number[] | null) => {
  // Normalize asset_id first
  const normalizedId = normalizeAssetId(assetId);
  formData.asset_id = normalizedId;
  
  if (!normalizedId) {
    selectedAsset.value = null;
    return;
  }
  
  try {
    const response: any = await api.get(`/assets/${normalizedId}`);
    if (response?.data) {
      selectedAsset.value = response.data;
      formData.department_id = selectedAsset.value.current_department_id || authStore.userDepartmentId;
    }
  } catch (error) {
    console.error('Error fetching asset:', error);
    ElMessage.error('Không thể tải thông tin tài sản');
  }
};

const handleImageChange = async (file: UploadFile) => {
  // Convert file ngay khi upload và lưu vào url
  if (file.raw && !file.url?.startsWith('data:image')) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Lưu base64 vào url của file
      if (file.uid) {
        const fileInList = damageImageList.value.find(f => f.uid === file.uid);
        if (fileInList) {
          fileInList.url = e.target.result;
        }
      }
      // Convert tất cả images và cập nhật formData
      convertAllImagesToBase64();
    };
    reader.onerror = (error) => {
      console.error('❌ Error reading file:', error);
    };
    reader.readAsDataURL(file.raw);
  } else {
    // Nếu đã có url, chỉ cần convert lại
    convertAllImagesToBase64();
  }
};

const handleRemove = async () => {
  // Rebuild damage_images array sau khi remove
  await new Promise(resolve => setTimeout(resolve, 100)); // Đợi một chút để list được cập nhật
  
  const images = damageImageList.value
    .filter(f => f.url && f.url.startsWith('data:image'))
    .map(f => f.url as string);
  
  formData.damage_images = images.length > 0 ? JSON.stringify(images) : null;
  console.log('🗑️ After remove, remaining images:', images.length);
};

const handlePreview = (file: UploadFile) => {
  previewImageUrl.value = file.url || '';
  previewVisible.value = true;
};

// Helper function to normalize asset_id (ensure it's always a number or null, never an array)
const normalizeAssetId = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    // If it's an array, take the first element
    return value.length > 0 ? Number(value[0]) : null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Watch asset_id to ensure it's always normalized (never an array)
watch(() => formData.asset_id, (newVal) => {
  const normalized = normalizeAssetId(newVal);
  if (normalized !== newVal) {
    formData.asset_id = normalized;
  }
}, { immediate: true });

watch(() => props.visible, async (val) => {
  if (val) {
    await departmentStore.fetchDepartments();
    
    if (props.item) {
      // Edit mode
      // Normalize asset_id to ensure it's always a number or null, never an array
      formData.asset_id = normalizeAssetId(props.item.asset_id);
      formData.department_id = props.item.department_id;
      formData.justification = props.item.justification || '';
      formData.urgency = props.item.urgency || 'normal';
      formData.status = props.item.status || 'draft';
      formData.estimated_cost = props.item.estimated_cost || null;
      formData.notes = props.item.notes || '';
      
      // Load asset info
      if (formData.asset_id) {
        await handleAssetChange(formData.asset_id);
      }
      
      // Load damage images from damageImages association
      if (props.item.damageImages && Array.isArray(props.item.damageImages) && props.item.damageImages.length > 0) {
        damageImageList.value = props.item.damageImages.map((img: any, index: number) => {
          let resolvedUrl = img.url || '';
          if (!resolvedUrl && img.image_path) {
            const p = img.image_path;
            resolvedUrl = p.startsWith('/storage/') ? p : `/storage/${p.replace(/^storage\//, '')}`;
          }
          return {
            uid: img.id || index,
            name: `damage_${index}.jpg`,
            url: resolvedUrl,
            status: 'success' as const,
          };
        });
        console.log('✅ Loaded damage images from damageImages association:', damageImageList.value.length);
      } else if (props.item.damage_images) {
        // Fallback: legacy support for old data with damage_images field
        try {
          const images = typeof props.item.damage_images === 'string' 
            ? JSON.parse(props.item.damage_images) 
            : props.item.damage_images;
          
          if (Array.isArray(images)) {
            damageImageList.value = images.map((img: string, index: number) => ({
              uid: index,
              name: `damage_${index}.jpg`,
              url: img,
              status: 'success',
            }));
            console.log('⚠️ Loaded damage images from legacy damage_images field:', damageImageList.value.length);
          }
        } catch (e) {
          console.error('Error parsing legacy damage images:', e);
        }
      }
    } else {
      resetForm();
      // Load danh sách tài sản khi mở dialog (chế độ tạo mới)
      await loadInitialAssets();
    }
  } else {
    // Reset khi đóng dialog
    assetOptions.value = [];
  }
});

const resetForm = () => {
  formData.asset_id = null;
  formData.department_id = authStore.userDepartmentId || null;
  formData.justification = '';
  formData.urgency = 'normal';
  formData.status = 'draft';
  formData.estimated_cost = null;
  formData.notes = '';
  formData.damage_images = null;
  selectedAsset.value = null;
  damageImageList.value = [];
  assetOptions.value = [];
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const response = await handleSaveRequest(formData.status || 'draft');
    
    // If editing, update props.item with response data to ensure damageImages is available
    if (isEdit.value && props.item && response?.data) {
      // Update item with fresh data including damageImages
      Object.assign(props.item, response.data);
      console.log('✅ [RepairFormDialog] Updated item with response data, damageImages count:', response.data.damageImages?.length || 0);
    }
    
    if (isEdit.value) {
      ElMessage.success('Đã cập nhật đề nghị sửa chữa thành công');
    } else {
      ElMessage.success('Đã tạo đề nghị sửa chữa thành công');
    }
    
    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    console.error('❌ Error in handleSubmit:', error);
    const errorMessage = error.response?.data?.message || error.message || t('common.error');
    ElMessage.error({
      message: `Lỗi: ${errorMessage}`,
      duration: 6000,
      showClose: true,
    });
  } finally {
    loading.value = false;
  }
};

const handleSaveDraft = async () => {
  if (!formRef.value) return;
  
  // Khi lưu nháp, chỉ validate asset_id (bắt buộc), các field khác có thể để trống
  const valid = await formRef.value.validateField('asset_id').catch(() => false);
  if (!valid) {
    ElMessage.warning('Vui lòng chọn tài sản cần sửa chữa');
    return;
  }

  loading.value = true;
  try {
    await handleSaveRequest('draft');
    ElMessage.success('Đã lưu nháp thành công');
    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    console.error('Error saving draft:', error);
    console.error('Error response:', error.response?.data);
    
    // Hiển thị lỗi chi tiết từ backend
    let errorMessage = 'Đã xảy ra lỗi khi lưu nháp';
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.details) {
        // Joi validation errors
        const details = Array.isArray(errorData.details) ? errorData.details : [errorData.details];
        errorMessage = details.map((d: any) => d.message || d).join(', ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    ElMessage.error({
      message: `Lỗi khi lưu nháp: ${errorMessage}`,
      duration: 6000,
      showClose: true,
    });
  } finally {
    loading.value = false;
  }
};

const handleSubmitForApproval = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn gửi đề nghị này lên phê duyệt? Sau khi gửi, bạn sẽ không thể chỉnh sửa trừ khi bị từ chối.',
      'Xác nhận gửi phê duyệt',
      {
        type: 'warning',
        confirmButtonText: 'Gửi phê duyệt',
        cancelButtonText: 'Hủy',
      }
    );

    submitting.value = true;
    loading.value = true;

    if (!isEdit.value) {
      await handleSaveRequest('draft');
    } else {
      await handleSaveRequest('draft');
    }

    if (isEdit.value && props.item?.id) {
      await api.post(`/maintenance/${props.item.id}/submit`);
      ElMessage.success('Đã gửi phê duyệt thành công. Yêu cầu của bạn đang chờ trưởng phòng xem xét.');
    }

    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error submitting for approval:', error);
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      ElMessage.error(`Lỗi khi gửi phê duyệt: ${errorMessage}`);
    }
  } finally {
    submitting.value = false;
    loading.value = false;
  }
};

const handleSaveRequest = async (status: string) => {
  // Validation yêu cầu ít nhất một trong: description, justification, hoặc device_name
  // Đảm bảo luôn có ít nhất một giá trị
  const justification = formData.justification?.trim() || '';
  const description = justification || 'Đề nghị sửa chữa'; // Fallback nếu justification rỗng
  
  // CRITICAL: Convert images trước khi save để đảm bảo damage_images được set
  console.log('🔄 Before convert - damageImageList:', {
    length: damageImageList.value.length,
    files: damageImageList.value.map(f => ({
      uid: f.uid,
      name: f.name,
      hasUrl: !!f.url,
      urlType: f.url ? (f.url.startsWith('data:image') ? 'base64' : 'blob') : 'none',
      hasRaw: !!f.raw,
    })),
    currentDamageImages: formData.damage_images ? 'has value' : 'null',
  });
  
  await convertAllImagesToBase64();
  
  console.log('✅ After convert - formData.damage_images:', {
    hasValue: !!formData.damage_images,
    isString: typeof formData.damage_images === 'string',
    length: formData.damage_images ? formData.damage_images.length : 0,
    preview: formData.damage_images ? formData.damage_images.substring(0, 100) + '...' : 'null',
  });
  
  const payload: any = {
    request_type: 'repair',
    asset_id: formData.asset_id,
    department_id: formData.department_id || authStore.userDepartmentId,
    urgency: formData.urgency || 'normal',
    status: status,
  };
  
  // Luôn có description để pass validation (.or('description', 'justification', 'device_name'))
  payload.description = description;
  
  // Chỉ gửi justification nếu có giá trị
  if (justification) {
    payload.justification = justification;
  }
  
  // Chỉ gửi notes nếu có giá trị
  if (formData.notes?.trim()) {
    payload.notes = formData.notes.trim();
  }
  
  // Xử lý damage_images:
  // - Nếu có base64 mới → gửi lên để backend lưu
  // - Nếu đang edit và chỉ có ảnh server cũ (/storage/...) → KHÔNG gửi damage_images (để backend giữ nguyên)
  // - Nếu user xóa hết ảnh (damageImageList rỗng) → gửi null để xóa
  if (formData.damage_images && typeof formData.damage_images === 'string' && formData.damage_images.trim().length > 0) {
    // Validate JSON format
    try {
      const parsed = JSON.parse(formData.damage_images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        payload.damage_images = formData.damage_images;
        console.log('✅ damage_images is valid JSON array with', parsed.length, 'images');
      } else {
        console.warn('⚠️ damage_images is not a valid array, setting to null');
        payload.damage_images = null;
      }
    } catch (e) {
      console.error('❌ damage_images is not valid JSON, setting to null:', e);
      payload.damage_images = null;
    }
  } else if (isEdit.value) {
    // Edit mode: nếu không có ảnh base64 mới, kiểm tra xem user có xóa hết ảnh không
    const hasExistingServerImages = damageImageList.value.some(
      f => f.url && !f.url.startsWith('data:image')
    );
    if (hasExistingServerImages || damageImageList.value.length > 0) {
      // Vẫn còn ảnh trong list (server images) → không gửi damage_images để giữ nguyên
      console.log('ℹ️ Edit mode: existing server images present, not sending damage_images to preserve them');
      // Không set payload.damage_images (undefined = giữ nguyên)
    } else {
      // List rỗng hoàn toàn → user đã xóa hết ảnh → gửi null
      payload.damage_images = null;
      console.log('ℹ️ Edit mode: no images in list (user removed all), sending null to clear');
    }
  } else {
    // Create mode: không có ảnh → gửi null
    payload.damage_images = null;
    console.log('ℹ️ No damage_images to send (null or empty)');
  }
  
  // Chỉ gửi estimated_cost nếu user có quyền nhập (admin) và có giá trị
  if (canEditEstimatedCost.value && formData.estimated_cost) {
    payload.estimated_cost = formData.estimated_cost;
  }
  
  // Final check before sending
  console.log('📤 Sending payload:', {
    request_type: payload.request_type,
    asset_id: payload.asset_id,
    department_id: payload.department_id,
    status: payload.status,
    hasDescription: !!payload.description,
    hasJustification: !!payload.justification,
    hasNotes: !!payload.notes,
    hasDamageImages: 'damage_images' in payload,
    damageImagesValue: payload.damage_images 
      ? (typeof payload.damage_images === 'string' 
          ? `JSON string (length: ${payload.damage_images.length})` 
          : String(payload.damage_images))
      : 'null',
    damageImagesType: typeof payload.damage_images,
    damageImagesIsNull: payload.damage_images === null,
    damageImagesIsUndefined: payload.damage_images === undefined,
  });
  
  let response: any;
  if (isEdit.value && props.item) {
    response = await api.put(`/maintenance/${props.item.id}`, payload);
  } else {
    response = await api.post('/maintenance', payload);
  }
  
  // Log response to verify damageImages
  console.log('📥 [RepairFormDialog] Save response:', {
    hasData: !!response?.data,
    hasDamageImages: !!response?.data?.damageImages,
    damageImagesCount: response?.data?.damageImages?.length || 0,
    maintenanceId: response?.data?.id,
  });
  
  return response;
};

// Helper function để convert tất cả images thành base64
const convertAllImagesToBase64 = async (): Promise<void> => {
  if (damageImageList.value.length === 0) {
    formData.damage_images = null;
    console.log('📸 No images to convert');
    return;
  }
  
  try {
    // Lấy tất cả images từ url (đã được convert) hoặc convert raw files
    const imagePromises = damageImageList.value.map(async (f) => {
      // Nếu đã có url là base64, dùng luôn
      if (f.url && f.url.startsWith('data:image')) {
        return f.url;
      }
      // Nếu url là đường dẫn server (/storage/...) → trả về chính nó để backend giữ lại
      if (f.url && (f.url.startsWith('/storage/') || f.url.startsWith('http'))) {
        return f.url; 
      }
      // Nếu có raw file, convert sang base64
      if (f.raw) {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            // Lưu vào url của file để dùng lại
            if (f.uid) {
              const fileInList = damageImageList.value.find(file => file.uid === f.uid);
              if (fileInList) {
                fileInList.url = e.target.result;
              }
            }
            resolve(e.target.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(f.raw);
        });
      }
      return null;
    });
    
    const images = await Promise.all(imagePromises);
    
    // Filter out null values và lưu vào formData
    // CẢI TIẾN: Giữ lại cả base64 và các đường dẫn /storage/... để backend biết ảnh nào cần giữ lại
    const validImages = images.filter((img): img is string => 
      img !== null && 
      img !== undefined && 
      typeof img === 'string' && 
      img.trim().length > 0 &&
      (img.startsWith('data:image') || img.startsWith('/storage/') || img.startsWith('http'))
    );
    
    formData.damage_images = validImages.length > 0 ? JSON.stringify(validImages) : null;
    
    console.log('📸 Converted images:', {
      totalFiles: damageImageList.value.length,
      validImages: validImages.length,
      hasDamageImages: !!formData.damage_images,
      damageImagesLength: formData.damage_images ? formData.damage_images.length : 0,
      preview: validImages.length > 0 ? validImages[0].substring(0, 50) + '...' : 'none',
    });
  } catch (error) {
    console.error('❌ Error converting images:', error);
    formData.damage_images = null;
  }
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Nháp',
    new: 'Mới',
    pending: 'Chờ phê duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    approved_by_director: 'Giám hiệu đã duyệt',
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
    rejected_by_director: 'Giám hiệu từ chối',
  };
  return statusMap[status] || status;
};

const getAssetStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    damaged: 'danger',
    pending_repair: 'warning',
  };
  return types[status] || 'info';
};

const getAssetStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'Đang sử dụng',
    inactive: 'Không sử dụng',
    damaged: 'Hư hỏng',
    pending_repair: 'Chờ sửa chữa',
  };
  return statusMap[status] || status;
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericValue);
};
</script>

<style scoped>
:deep(.el-dialog__body) {
  max-height: calc(90vh - 200px);
  overflow-y: auto;
  padding: 20px 24px;
}
</style>
