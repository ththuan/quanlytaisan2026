<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? $t('maintenance.procurement.editRequest') : $t('maintenance.procurement.createRequest')"
    width="95%"
    :close-on-click-modal="false"
    top="5vh"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="180px"
      label-position="top"
    >
      <!-- Thông tin chung -->
      <el-card
        shadow="never"
        style="margin-bottom: 20px; background: #f5f7fa;"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Đơn vị sử dụng trực tiếp">
              <el-input
                :value="userDepartmentName"
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              label="Mức độ ưu tiên"
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
          <el-col
            v-if="isEdit && authStore.isManager"
            :span="8"
          >
            <el-form-item :label="$t('common.status')">
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
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item
              label="Thuyết minh nhu cầu mua sắm"
              prop="justification"
            >
              <el-input
                v-model="formData.justification"
                type="textarea"
                :rows="2"
                placeholder="Nhập thuyết minh nhu cầu mua sắm"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- Bảng danh sách thiết bị -->
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px; color: #303133;">
          <i
            class="el-icon-box"
            style="margin-right: 8px;"
          />
          Danh sách thiết bị, công cụ dụng cụ cần mua
        </h3>
        <el-button
          type="primary"
          size="default"
          :icon="Plus"
          @click="addItem"
        >
          Thêm thiết bị
        </el-button>
      </div>

      <el-table 
        :data="formData.items" 
        border 
        style="width: 100%; margin-bottom: 20px;"
        :summary-method="getSummaries"
        show-summary
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column
          type="index"
          label="TT"
          width="55"
          align="center"
        />
        
        <el-table-column min-width="200">
          <template #header>
            <div style="line-height: 1.4;">
              Tên thiết bị, hàng hóa, dịch vụ 
              <span style="color: #f56c6c;">*</span>
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input 
              v-model="row.device_name" 
              placeholder="Nhập tên máy móc, thiết bị, model"
              size="default"
              @input="validateItem($index)"
            />
          </template>
        </el-table-column>

        <el-table-column min-width="180">
          <template #header>
            <div style="line-height: 1.4;">
              Tính năng kỹ thuật cơ bản 
              <span style="color: #f56c6c;">*</span>
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input 
              v-model="row.technical_specs" 
              type="textarea"
              :rows="2"
              placeholder="Nhập tính năng"
              size="default"
              @input="validateItem($index)"
            />
          </template>
        </el-table-column>

        <el-table-column width="100">
          <template #header>
            <div style="line-height: 1.4;">
              Đơn vị tính 
              <span style="color: #f56c6c;">*</span>
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input 
              v-model="row.unit" 
              placeholder="Cái"
              size="default"
              @input="validateItem($index)"
            />
          </template>
        </el-table-column>

        <el-table-column width="95">
          <template #header>
            <div style="line-height: 1.4;">
              Số lượng 
              <span style="color: #f56c6c;">*</span>
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input-number 
              v-model="row.quantity" 
              :min="1" 
              :controls="false"
              style="width: 100%"
              size="default"
              @change="calculateTotal"
              @input="validateItem($index)"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Đơn giá dự toán"
          width="135"
          align="right"
        >
          <template #default="{ row, $index }">
            <el-input-number 
              v-model="row.estimated_unit_price" 
              :min="0" 
              :step="100000"
              :controls="false"
              style="width: 100%"
              size="default"
              @change="calculateTotal"
              @input="validateItem($index)"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Thành tiền"
          width="135"
          align="right"
        >
          <template #default="{ row }">
            <span style="font-weight: 600; color: #409eff;">
              {{ formatCurrency(row.quantity * (row.estimated_unit_price || 0)) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="Link sản phẩm"
          width="200"
        >
          <template #default="{ row }">
            <el-input 
              v-model="row.product_link" 
              placeholder="https://..."
              size="default"
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </template>
        </el-table-column>

        <el-table-column
          label="Hình ảnh"
          width="120"
          align="center"
        >
          <template #default="{ row, $index }">
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: center; padding: 4px 0;">
              <el-image 
                v-if="row.product_image"
                :src="row.product_image" 
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer;"
                :preview-src-list="[row.product_image]"
              />
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="(file: any) => handleImageUpload(file, $index)"
              >
                <el-button
                  size="small"
                  :type="row.product_image ? 'default' : 'primary'"
                  link
                >
                  <el-icon><Picture /></el-icon>
                  {{ row.product_image ? 'Đổi' : 'Chọn' }}
                </el-button>
              </el-upload>
              <el-button 
                v-if="row.product_image"
                size="small" 
                type="danger"
                link
                @click="row.product_image = ''"
              >
                <el-icon><Delete /></el-icon>
                Xóa
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="Xóa"
          width="70"
          align="center"
        >
          <template #default="{ $index }">
            <el-button 
              type="danger" 
              size="small" 
              :icon="Delete"
              circle
              :disabled="formData.items.length === 1"
              @click="removeItem($index)"
            />
          </template>
        </el-table-column>
      </el-table>

      <el-card
        shadow="never"
        style="background: #fafafa;"
      >
        <el-form-item :label="$t('maintenance.notes')">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            :placeholder="$t('maintenance.enterNotes')"
          />
        </el-form-item>
      </el-card>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #909399; font-size: 14px;">
          <span v-if="!isEdit">Tổng: {{ formData.items.length }} thiết bị - Tổng tiền dự toán: <strong style="color: #409eff;">{{ formatCurrency(totalPrice) }}</strong></span>
          <span v-else-if="currentStatus === 'draft' || currentStatus === 'rejected' || currentStatus?.startsWith('rejected_by')">
            <el-tag
              type="info"
              size="small"
            >Trạng thái: {{ getStatusText(currentStatus) }}</el-tag>
          </span>
        </div>
        <div>
          <el-button
            size="large"
            @click="$emit('update:visible', false)"
          >
            {{ $t('common.cancel') }}
          </el-button>
          <!-- Nút Lưu nháp - chỉ hiển thị khi draft hoặc rejected -->
          <el-button 
            v-if="canSaveDraft"
            :loading="loading" 
            size="large" 
            @click="handleSaveDraft"
          >
            <el-icon style="margin-right: 4px;">
              <Document />
            </el-icon>
            Lưu nháp
          </el-button>
          <!-- Nút Gửi phê duyệt - chỉ hiển thị khi draft hoặc rejected -->
          <el-button 
            v-if="canSubmit"
            type="success" 
            :loading="submitting" 
            size="large" 
            @click="handleSubmitForApproval"
          >
            <el-icon style="margin-right: 4px;">
              <Promotion />
            </el-icon>
            Gửi phê duyệt
          </el-button>
          <!-- Nút Lưu - cho các trường hợp khác -->
          <el-button 
            v-else
            type="primary" 
            :loading="loading" 
            size="large" 
            @click="handleSubmit"
          >
            <el-icon style="margin-right: 4px;">
              <Check />
            </el-icon>
            {{ $t('common.save') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDepartmentStore } from '@/stores/department.store';
import { useAuthStore } from '@/stores/auth.store';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Link, Picture, Check, Document, Promotion } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import api from '@/services/api';

interface ProcurementItem {
  device_name: string;
  technical_specs: string;
  unit: string;
  quantity: number;
  estimated_unit_price: number;
  product_link: string;
  product_image: string;
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

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);

const isEdit = computed(() => !!props.item);
const currentStatus = computed(() => props.item?.status || 'draft');

// Có thể lưu nháp nếu status là draft hoặc rejected
const canSaveDraft = computed(() => {
  const status = currentStatus.value;
  return status === 'draft' || status === 'rejected' || status?.startsWith('rejected_by');
});

// Có thể gửi phê duyệt nếu status là draft hoặc rejected
const canSubmit = computed(() => {
  const status = currentStatus.value;
  return status === 'draft' || status === 'new' || status === 'rejected' || status?.startsWith('rejected_by');
});
const totalPrice = computed(() => {
  return formData.items.reduce((sum, item) => sum + (item.quantity * (item.estimated_unit_price || 0)), 0);
});

const formData = reactive({
  department_id: null as number | null,
  justification: '',
  urgency: 'normal' as string,
  status: 'new' as string,
  notes: '',
  items: [
    {
      device_name: '',
      technical_specs: '',
      unit: 'Cái',
      quantity: 1,
      estimated_unit_price: 0,
      product_link: '',
      product_image: '',
    }
  ] as ProcurementItem[],
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

const statuses = computed(() => [
  { value: 'new', label: t('maintenance.status.new') },
  { value: 'approved', label: t('maintenance.status.approved') },
  { value: 'in_progress', label: t('maintenance.status.in_progress') },
  { value: 'done', label: t('maintenance.status.done') },
  { value: 'rejected', label: t('maintenance.status.rejected') },
]);

const rules = computed<FormRules>(() => ({
  urgency: [{ required: true, message: t('validation.required'), trigger: 'change' }],
  justification: [{ required: true, message: t('validation.required'), trigger: 'blur' }],
}));

const addItem = () => {
  formData.items.push({
    device_name: '',
    technical_specs: '',
    unit: 'Cái',
    quantity: 1,
    estimated_unit_price: 0,
    product_link: '',
    product_image: '',
  });
};

const handleImageUpload = (file: any, index: number) => {
  const reader = new FileReader();
  reader.onload = (e: any) => {
    formData.items[index].product_image = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const removeItem = (index: number) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1);
    calculateTotal();
  }
};

const validateItem = (index: number) => {
  const item = formData.items[index];
  // Các trường bắt buộc: device_name, technical_specs, unit, quantity
  if (!item.device_name || !item.technical_specs || !item.unit || !item.quantity) {
    return false;
  }
  return true;
};

const calculateTotal = () => {
  // Force reactivity update
  formData.items = [...formData.items];
};

const getSummaries = (param: any) => {
  const { columns, data } = param;
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '';
      return;
    }
    if (index === 1) {
      sums[index] = 'Tổng cộng';
      return;
    }
    if (index === columns.length - 3) {
      // Cột "Thành tiền" (index = columns.length - 3: Thành tiền, Link sản phẩm, Hình ảnh, Thao tác)
      const total = data.reduce((sum: number, item: ProcurementItem) => {
        return sum + (item.quantity * (item.estimated_unit_price || 0));
      }, 0);
      sums[index] = formatCurrency(total);
      return;
    }
    sums[index] = '';
  });
  return sums;
};

watch(() => props.visible, async (val) => {
  if (val) {
    await departmentStore.fetchDepartments();
    
    if (props.item) {
      // Chế độ edit - load item hiện tại
      formData.department_id = props.item.department_id;
      formData.justification = props.item.justification || '';
      formData.urgency = props.item.urgency || 'normal';
      formData.status = props.item.status || 'new';
      formData.notes = props.item.notes || '';
      formData.items = [{
        device_name: props.item.device_name || '',
        technical_specs: props.item.technical_specs || '',
        unit: props.item.unit || 'Cái',
        quantity: props.item.quantity || 1,
        estimated_unit_price: props.item.estimated_unit_price || 0,
        product_link: props.item.product_link || '',
        product_image: props.item.product_image || '',
      }];
    } else {
      resetForm();
    }
  }
});

const resetForm = () => {
  formData.department_id = authStore.userDepartmentId || null;
  formData.justification = '';
  formData.urgency = 'normal';
  formData.status = 'new';
  formData.notes = '';
  formData.items = [{
    device_name: '',
    technical_specs: '',
    unit: 'Cái',
    quantity: 1,
    estimated_unit_price: 0,
    product_link: '',
    product_image: '',
  }];
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  // Validate items - các trường bắt buộc
  let hasError = false;
  formData.items.forEach((item, index) => {
    if (!item.device_name) {
      ElMessage.error(`Vui lòng nhập tên thiết bị cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.technical_specs) {
      ElMessage.error(`Vui lòng nhập tính năng kỹ thuật cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.unit) {
      ElMessage.error(`Vui lòng nhập đơn vị tính cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.quantity || item.quantity <= 0) {
      ElMessage.error(`Vui lòng nhập số lượng hợp lệ cho thiết bị thứ ${index + 1}`);
      hasError = true;
    }
  });
  
  if (hasError) return;

  loading.value = true;
  try {
    // Sử dụng helper function để lưu
    await handleSaveRequest(formData.status || 'draft');
    
    if (isEdit.value) {
      ElMessage.success(t('maintenance.updateSuccess'));
    } else {
      ElMessage.success(`Đã tạo ${formData.items.length} yêu cầu mua sắm thành công`);
    }
    
    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    console.error('❌ Error in handleSubmit:', error);
    console.error('Error response:', error.response?.data);
    const errorMessage = error.response?.data?.message || error.message || t('common.error');
    ElMessage.error({
      message: `Lỗi khi tạo yêu cầu: ${errorMessage}`,
      duration: 6000,
      showClose: true,
    });
  } finally {
    loading.value = false;
  }
};

// Lưu nháp - lưu với status draft
const handleSaveDraft = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  // Validate items
  let hasError = false;
  formData.items.forEach((item, index) => {
    if (!item.device_name) {
      ElMessage.error(`Vui lòng nhập tên thiết bị cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.technical_specs) {
      ElMessage.error(`Vui lòng nhập tính năng kỹ thuật cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.unit) {
      ElMessage.error(`Vui lòng nhập đơn vị tính cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.quantity || item.quantity <= 0) {
      ElMessage.error(`Vui lòng nhập số lượng hợp lệ cho thiết bị thứ ${index + 1}`);
      hasError = true;
    }
  });
  
  if (hasError) return;

  loading.value = true;
  try {
    // Tạo hoặc cập nhật với status = 'draft'
    await handleSaveRequest('draft');
    ElMessage.success('Đã lưu nháp thành công');
    // Emit success để refresh danh sách và đóng dialog
    emit('success');
    emit('update:visible', false);
  } catch (error: any) {
    console.error('Error saving draft:', error);
    const errorMessage = error.response?.data?.message || error.message || t('common.error');
    ElMessage.error(`Lỗi khi lưu nháp: ${errorMessage}`);
  } finally {
    loading.value = false;
  }
};

// Gửi phê duyệt - lưu và submit
const handleSubmitForApproval = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  // Validate items
  let hasError = false;
  formData.items.forEach((item, index) => {
    if (!item.device_name) {
      ElMessage.error(`Vui lòng nhập tên thiết bị cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.technical_specs) {
      ElMessage.error(`Vui lòng nhập tính năng kỹ thuật cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.unit) {
      ElMessage.error(`Vui lòng nhập đơn vị tính cho thiết bị thứ ${index + 1}`);
      hasError = true;
    } else if (!item.quantity || item.quantity <= 0) {
      ElMessage.error(`Vui lòng nhập số lượng hợp lệ cho thiết bị thứ ${index + 1}`);
      hasError = true;
    }
  });
  
  if (hasError) return;

  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn gửi yêu cầu này lên phê duyệt? Sau khi gửi, bạn sẽ không thể chỉnh sửa trừ khi bị từ chối.',
      'Xác nhận gửi phê duyệt',
      {
        type: 'warning',
        confirmButtonText: 'Gửi phê duyệt',
        cancelButtonText: 'Hủy',
      }
    );

    submitting.value = true;
    loading.value = true;

    // Nếu là tạo mới, tạo với status draft trước
    if (!isEdit.value) {
      await handleSaveRequest('draft');
    } else {
      // Nếu đã có, cập nhật trước
      await handleSaveRequest('draft');
    }

    // Sau đó submit for approval
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

// Helper function để lưu request
const handleSaveRequest = async (status: string) => {
  if (isEdit.value && props.item) {
    // Chế độ edit
    const item = formData.items[0];
    const totalPrice = item.quantity * (item.estimated_unit_price || 0);
    const payload = {
      request_type: 'procurement',
      category: 'other',
      device_name: item.device_name,
      technical_specs: item.technical_specs,
      unit: item.unit,
      quantity: item.quantity,
      estimated_unit_price: item.estimated_unit_price || null,
      unit_price: item.estimated_unit_price || null,
      total_price: totalPrice || null,
      product_link: item.product_link || null,
      product_image: item.product_image || null,
      department_id: formData.department_id,
      justification: formData.justification,
      description: formData.justification,
      urgency: formData.urgency,
      status: status,
      notes: formData.notes,
      cost: totalPrice || null,
    };
    
    await api.put(`/maintenance/${props.item.id}`, payload);
  } else {
    // Chế độ tạo mới
    const requests = formData.items.map(item => {
      const totalPrice = item.quantity * (item.estimated_unit_price || 0);
      const payload: any = {
        request_type: 'procurement',
        category: 'other',
        device_name: item.device_name,
        technical_specs: item.technical_specs,
        unit: item.unit,
        quantity: item.quantity,
        estimated_unit_price: item.estimated_unit_price || null,
        unit_price: item.estimated_unit_price || null,
        total_price: totalPrice || null,
        product_link: item.product_link || null,
        product_image: item.product_image || null,
        justification: formData.justification,
        description: formData.justification,
        urgency: formData.urgency,
        status: status,
        notes: formData.notes,
        cost: totalPrice || null,
        // Luôn gửi department_id, ưu tiên formData, nếu không có thì dùng userDepartmentId
        department_id: formData.department_id || authStore.userDepartmentId || null,
      };
      return payload;
    });

    await Promise.all(requests.map(payload => api.post('/maintenance', payload)));
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

const formatCurrency = (value: number) => {
  if (!value) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
};
</script>

<style scoped>
:deep(.el-dialog__body) {
  max-height: calc(90vh - 200px);
  overflow-y: auto;
  padding: 20px 24px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  padding: 12px 0;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  font-size: 14px;
}
</style>
