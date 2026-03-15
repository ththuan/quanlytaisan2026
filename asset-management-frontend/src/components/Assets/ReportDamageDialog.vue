<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`Báo hỏng tài sản: ${asset?.name}`"
    width="500px"
    destroy-on-close
  >
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules" 
      label-position="top"
    >
      <el-form-item label="Tài sản">
        <el-input :value="`${asset?.asset_code} - ${asset?.name}`" disabled />
      </el-form-item>

      <el-form-item label="Mô tả tình trạng hỏng hóc" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="Ví dụ: Màn hình bị sọc ngang, không lên nguồn..."
        />
      </el-form-item>

      <el-form-item label="Mức độ khẩn cấp" prop="urgency">
        <el-select v-model="form.urgency" style="width: 100%;">
          <el-option label="Thấp" value="low" />
          <el-option label="Bình thường" value="normal" />
          <el-option label="Cao" value="high" />
          <el-option label="Nghiêm trọng (Cần xử lý ngay)" value="critical" />
        </el-select>
      </el-form-item>

      <el-form-item label="Hình ảnh minh họa tình trạng hư hỏng (tùy chọn)">
        <el-upload
          v-model:file-list="damageImageList"
          list-type="picture-card"
          :auto-upload="false"
          :on-preview="handlePreview"
          accept="image/*"
          :limit="3"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div style="margin-top: 8px; font-size: 12px; color: #909399;">
          Tối đa 3 hình ảnh. Cho phép thợ kỹ thuật hình dung được hư hỏng.
        </div>
      </el-form-item>
    </el-form>

    <!-- Image preview dialog -->
    <el-dialog v-model="previewVisible" title="Xem trước hình ảnh" append-to-body>
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="danger" :loading="loading" @click="handleSubmit">
          Gửi yêu cầu Báo hỏng
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import maintenanceService from '@/services/maintenance.service';

const props = defineProps<{
  visible: boolean;
  asset: any;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const formRef = ref<any>();
const loading = ref(false);

const damageImageList = ref<any[]>([]);
const previewVisible = ref(false);
const previewImageUrl = ref('');

const form = reactive({
  description: '',
  urgency: 'normal' as 'low' | 'normal' | 'high' | 'critical',
});

const rules = reactive<any>({
  description: [
    { required: true, message: 'Vui lòng mô tả tình trạng hỏng hóc', trigger: 'blur' },
    { min: 5, message: 'Mô tả cần chi tiết hơn', trigger: 'blur' }
  ],
  urgency: [
    { required: true, message: 'Vui lòng chọn mức độ khẩn cấp', trigger: 'change' }
  ]
});

const handlePreview = (file: any) => {
  previewImageUrl.value = file.url || '';
  previewVisible.value = true;
};

// Đọc ảnh và trả về base64
const getBase64 = (fileRaw: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(fileRaw);
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (!props.asset?.id) {
        ElMessage.error('Không tìm thấy thông tin tài sản');
        return;
      }
      loading.value = true;
      try {
        let base64Images: string[] = [];
        
        // Convert tất cả những file raw vừa mới upload (chưa lưu) sang base64
        for (const file of damageImageList.value) {
          if (file.raw) {
            const b64 = await getBase64(file.raw);
            base64Images.push(b64);
          }
        }

        const payload: any = {
          asset_id: props.asset.id,
          request_type: 'repair',
          department_id: props.asset.current_department_id || props.asset.department_id,
          description: form.description,
          justification: form.description, // Ghi vào cả justification để đảm bảo hiển thị đồng bộ
          urgency: form.urgency
        };

        if (base64Images.length > 0) {
          payload.damage_images = base64Images;
        }

        console.log('📤 Sending maintenance request (Data):', {
          request_type: payload.request_type,
          asset_id: payload.asset_id,
          hasImages: payload.damage_images && payload.damage_images.length > 0,
          imageCount: base64Images.length,
          payloadKeys: Object.keys(payload)
        });

        await maintenanceService.create(payload);
        
        ElMessage.success('Đã gửi yêu cầu báo hỏng thành công. Quy trình phê duyệt đã được kích hoạt.');
        dialogVisible.value = false;
        
        // Reset state
        form.description = '';
        form.urgency = 'normal';
        damageImageList.value = [];
        
        emit('submitted');
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
