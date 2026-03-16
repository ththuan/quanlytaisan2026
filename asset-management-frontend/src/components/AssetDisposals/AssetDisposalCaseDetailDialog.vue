<template>
  <el-dialog
    v-model="visible"
    width="900px"
    :title="title"
    destroy-on-close
  >
    <div v-loading="loading">
      <template v-if="data">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="Mã hồ sơ">
            {{ data.code }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="statusTagType(data.status)">
              {{ statusLabel(data.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">
            {{ formatDateTime(data.created_at || data.createdAt) }}
          </el-descriptions-item>
          <el-form-item
            v-if="data.decision_file_url"
            label="Tập tin đính kèm"
          >
            <el-link
              :href="data.decision_file_url"
              target="_blank"
              type="primary"
            >
              <el-icon><Document /></el-icon> Xem quyết định
            </el-link>
          </el-form-item>
        </el-descriptions>

        <div style="margin-top: 14px">
          <el-table
            :data="data.items || []"
            style="width: 100%"
            height="320"
          >
            <el-table-column
              label="Mã tài sản"
              width="160"
            >
              <template #default="scope">
                {{ scope.row.asset?.asset_code || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Tên tài sản"
              min-width="240"
            >
              <template #default="scope">
                {{ scope.row.asset?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Lý do"
              min-width="220"
            >
              <template #default="scope">
                {{ scope.row.reason || scope.row.inventory_detail?.disposal_reason || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Từ đơn vị"
              width="180"
            >
              <template #default="scope">
                {{ scope.row.moved_from_department?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Chuyển lúc"
              width="170"
            >
              <template #default="scope">
                {{ formatDateTime(scope.row.moved_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider />

        <el-form
          v-if="data.status === 'pending' && isAdminOrDirector"
          :model="form"
          label-width="160px"
        >
          <el-form-item
            label="Số quyết định"
            required
          >
            <el-input
              v-model="form.decision_no"
              placeholder="Nhập số quyết định"
            />
          </el-form-item>
          <el-form-item label="Ngày quyết định">
            <el-date-picker
              v-model="form.decision_date"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="!form.decision_file_url"
            label="Tải lên quyết định"
          >
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              :accept="'.pdf,.doc,.docx,.jpg,.jpeg,.png'"
            >
              <el-button type="primary">
                Chọn tệp
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  Định dạng: PDF, Word, JPG, PNG (tối đa 20MB)
                </div>
              </template>
            </el-upload>
            <div
              v-if="selectedFile"
              class="file-info"
            >
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
              <el-button
                type="text"
                class="remove-file"
                @click="removeFile"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </el-form-item>
          <el-form-item v-else>
            <el-link
              :href="form.decision_file_url"
              target="_blank"
              type="primary"
            >
              <el-icon><Document /></el-icon> Xem quyết định đã tải lên
            </el-link>
            <el-button
              type="text"
              class="remove-file"
              @click="form.decision_file_url = null"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </el-form-item>
          <el-form-item label="Ghi chú">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-form>

        <el-alert
          v-else-if="data.status === 'pending' && !isAdminOrDirector"
          type="info"
          :closable="false"
          title="Hồ sơ đang chờ Quản lý / Giám hiệu phê duyệt."
          show-icon
          style="margin-top: 12px"
        />

        <el-alert
          v-else
          type="success"
          :closable="false"
          title="Hồ sơ đã hoàn tất. Tài sản trong hồ sơ đã chuyển sang trạng thái đã thanh lý."
          style="margin-top: 12px"
        />
      </template>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        Đóng
      </el-button>
      <el-button
        v-if="data?.status === 'pending' && isAdminOrDirector"
        type="primary"
        :loading="submitting"
        :disabled="!form.decision_no || (!form.decision_file_url && !selectedFile)"
        @click="complete"
      >
        {{ submitting ? 'Đang xử lý...' : 'Hoàn tất thủ tục' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Close } from '@element-plus/icons-vue';
import assetDisposalService from '@/services/assetDisposal.service';
import { useAuthStore } from '@/stores/auth.store';

const props = defineProps<{ modelValue: boolean; caseId: number | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'completed'): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const authStore = useAuthStore();
const isAdminOrDirector = computed(() => ['admin', 'director'].includes(authStore.user?.role || ''));

const loading = ref(false);
const submitting = ref(false);
const data = ref<any | null>(null);
const uploadRef = ref<any>();
const selectedFile = ref<File | null>(null);

const form = ref({
  decision_no: '',
  decision_date: null as string | null,
  decision_file_url: null as string | null,
  notes: null as string | null,
});

const title = computed(() => (data.value ? `Hồ sơ giảm tài sản: ${data.value.code}` : 'Hồ sơ giảm tài sản'));

const statusLabel = (s: string) => {
  if (s === 'pending') return 'Chờ xử lý';
  if (s === 'completed') return 'Đã hoàn tất';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '—';
};

const statusTagType = (s: string) => {
  if (s === 'pending') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'info';
  return 'info';
};

const formatDateTime = (v: string) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileChange = (file: any) => {
  const isLt20M = (file.raw?.size || 0) < 20 * 1024 * 1024;
  if (!isLt20M) {
    ElMessage.error('Kích thước tệp không được vượt quá 20MB');
    return false;
  }
  selectedFile.value = file.raw as File;
  return false; // Prevent auto upload
};

const removeFile = () => {
  selectedFile.value = null;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const uploadFile = async (): Promise<string | null> => {
  if (!selectedFile.value || !props.caseId) return null;

  try {
    const response: any = await assetDisposalService.uploadDecisionFile(props.caseId, selectedFile.value);
    return response.decision_file_url || response.data?.decision_file_url || null;
  } catch (error) {
    console.error('Upload failed:', error);
    ElMessage.error('Tải lên tệp thất bại. Vui lòng thử lại.');
    return null;
  }
};

const load = async () => {
  if (!props.caseId) return;
  loading.value = true;
  try {
    const res: any = await assetDisposalService.getCaseById(props.caseId);
    data.value = res?.data || res || null;
    
    // Initialize form with existing data if any
    if (data.value) {
      form.value = {
        decision_no: data.value.decision_no || '',
        decision_date: data.value.decision_date || null,
        decision_file_url: data.value.decision_file_url || null,
        notes: data.value.notes || null,
      };
    }
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.caseId, props.modelValue],
  ([id, open]) => {
    if (open && id) {
      form.value = {
        decision_no: '',
        decision_date: null,
        decision_file_url: null,
        notes: null,
      };
      selectedFile.value = null;
      if (uploadRef.value) {
        uploadRef.value.clearFiles();
      }
      load();
    }
  }
);

const complete = async () => {
  if (!props.caseId) return;
  if (!form.value.decision_no?.trim()) {
    ElMessage.error('Vui lòng nhập số quyết định');
    return;
  }

  if (selectedFile.value && !form.value.decision_file_url) {
    submitting.value = true;
    try {
      const fileUrl = await uploadFile();
      if (!fileUrl) {
        submitting.value = false;
        return;
      }
      form.value.decision_file_url = fileUrl;
    } catch (error) {
      submitting.value = false;
      return;
    }
  }

  submitting.value = true;
  try {
    await assetDisposalService.completeCase(props.caseId, {
      decision_no: form.value.decision_no,
      decision_date: form.value.decision_date,
      decision_file_url: form.value.decision_file_url,
      notes: form.value.notes,
    });

    ElMessage.success('Đã hoàn tất hồ sơ giảm tài sản');
    emit('completed');
    await load();
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi hoàn tất thủ tục';
    ElMessage.error(msg);
    console.error('Complete disposal error:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.file-info {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.remove-file {
  color: #f56c6c;
  padding: 0;
  margin-left: 8px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 7px;
}
</style>