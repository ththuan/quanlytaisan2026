<template>
  <el-dialog :model-value="visible" title="Chi tiết phiếu" width="980px" @close="emit('update:visible', false)">
    <div v-if="!item">
      <el-empty description="Không có dữ liệu" />
    </div>
    <div v-else>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Mã phiếu">{{ item.code }}</el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="statusType" effect="light">{{ statusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Nội dung" :span="2">{{ item.title }}</el-descriptions-item>
        <el-descriptions-item label="Cấp phát (phòng ban)">{{ item.receiving_department?.name }}</el-descriptions-item>
        <el-descriptions-item label="Ngày mua">{{ item.purchase_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Mô tả" :span="2">{{ item.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">Pháp lý mua sắm</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Nhà cung cấp">{{ item.supplier_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Chứng từ">{{ legalDocText }}</el-descriptions-item>
        <el-descriptions-item label="Số hợp đồng">{{ item.contract_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Số hóa đơn">{{ item.invoice_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Mã đơn hàng">{{ item.order_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label=""> </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">File chứng từ (PDF)</el-divider>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="application/pdf"
          :on-change="handleFileChange"
        >
          <el-button type="primary" :loading="uploading">Chọn file PDF</el-button>
        </el-upload>
        <div style="color:#909399; font-size: 12px;">
          Tối đa 20MB, chỉ PDF. Upload xong sẽ hiển thị bên dưới.
        </div>
      </div>

      <el-table
        :data="documents"
        border
        stripe
        size="small"
        v-loading="documentsLoading"
        empty-text="Chưa có chứng từ"
      >
        <el-table-column prop="file_name" label="Tên file" min-width="280" />
        <el-table-column prop="size_bytes" label="Dung lượng" width="120" align="right">
          <template #default="{ row }">{{ formatFileSize(row.size_bytes) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="Ngày upload" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="Thao tác" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="openPdf(row)">Xem</el-button>
            <el-button size="small" type="danger" plain :loading="deletingId === row.id" @click="confirmDelete(row)">Xóa</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">Danh sách dòng</el-divider>
      <div class="responsive-table">
        <el-table :data="item.items || []" border stripe size="small">
          <el-table-column prop="asset_code_prefix" label="Mã prefix" min-width="160" />
          <el-table-column prop="name" label="Tên" min-width="240" />
          <el-table-column label="Loại tài sản" min-width="240">
            <template #default="{ row }">
              <span>{{ row.category_code || '-' }}</span>
              <span v-if="row.category"> - {{ row.category }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="SL" width="80" align="center" />
          <el-table-column prop="purchase_price" label="Đơn giá" width="140" align="right">
            <template #default="{ row }">{{ formatCurrency(row.purchase_price) }}</template>
          </el-table-column>
          <el-table-column label="Thành tiền" width="160" align="right">
            <template #default="{ row }">{{ formatCurrency((Number(row.quantity || 0) * Number(row.purchase_price || 0))) }}</template>
          </el-table-column>
          <el-table-column prop="unit" label="Đơn vị" width="100" align="center" />
          <el-table-column prop="serial_number" label="Serial" width="160" />
          <el-table-column prop="location" label="Vị trí" min-width="180" />
        </el-table>
      </div>

      <el-divider content-position="left">Tài sản đã tạo</el-divider>
      <div v-if="Array.isArray(item.created_asset_ids) && item.created_asset_ids.length">
        <el-button
          v-for="id in item.created_asset_ids"
          :key="id"
          size="small"
          type="primary"
          plain
          style="margin-right:6px; margin-bottom:6px;"
          @click="openAsset(id)"
        >
          #{{ id }}
        </el-button>
      </div>
      <div v-else style="color:#909399">Chưa tạo tài sản</div>
    </div>

    <template #footer>
      <div v-if="item && item.status === 'draft' && authStore.isAdmin" class="dialog-footer-actions">
        <el-button type="primary" @click="emit('edit', item.id)">Sửa nội dung &amp; Giá thực tế</el-button>
        <el-button type="success" :loading="fulfilling" @click="handleFulfill">Xác nhận tăng tài sản</el-button>
      </div>
      <el-button @click="emit('update:visible', false)">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import procurementService from '@/services/procurement.service';
import procurementDocumentsService from '@/services/procurementDocuments.service';

const props = defineProps<{ visible: boolean; item: any | null }>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'edit', id: number): void;
  (e: 'fulfilled'): void;
}>();
const router = useRouter();
const authStore = useAuthStore();

const fulfilling = ref(false);

const documents = ref<any[]>([]);
const documentsLoading = ref(false);
const uploading = ref(false);
const deletingId = ref<number | null>(null);

const statusText = computed(() => {
  const s = props.item?.status;
  if (s === 'fulfilled') return 'Đã hoàn tất';
  if (s === 'draft') return 'Nháp';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '-';
});

const statusType = computed(() => {
  const s = props.item?.status;
  if (s === 'fulfilled') return 'success';
  if (s === 'cancelled') return 'danger';
  return 'info';
});

const legalDocText = computed(() => {
  const contractNo = props.item?.contract_no;
  const invoiceNo = props.item?.invoice_no;
  const orderCode = props.item?.order_code;
  if (contractNo) return `Hợp đồng: ${contractNo}`;
  if (invoiceNo) return `Hóa đơn: ${invoiceNo}`;
  if (orderCode) return `Đơn hàng: ${orderCode}`;
  return '-';
});

const loadDocuments = async () => {
  const procurementId = props.item?.id;
  if (!procurementId) {
    documents.value = [];
    return;
  }
  documentsLoading.value = true;
  try {
    const res: any = await procurementDocumentsService.list(procurementId);
    documents.value = res?.data || [];
  } catch (e: any) {
    documents.value = [];
  } finally {
    documentsLoading.value = false;
  }
};

watch(
  () => props.visible,
  (v) => {
    if (v) loadDocuments();
  }
);

watch(
  () => props.item?.id,
  () => {
    if (props.visible) loadDocuments();
  }
);

const handleFileChange = async (uploadFile: any) => {
  const procurementId = props.item?.id;
  const file: File | undefined = uploadFile?.raw;

  if (!procurementId) return ElMessage.error('Không tìm thấy phiếu');
  if (!file) return;

  if (file.type !== 'application/pdf') {
    return ElMessage.error('Chỉ cho phép file PDF');
  }

  uploading.value = true;
  try {
    await procurementDocumentsService.upload(procurementId, file);
    ElMessage.success('Upload chứng từ thành công');
    await loadDocuments();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể upload');
  } finally {
    uploading.value = false;
  }
};

const openPdf = (doc: any) => {
  const procurementId = props.item?.id;
  if (!procurementId || !doc?.id) return;

  const url = procurementDocumentsService.getDownloadUrl(procurementId, doc.id);
  window.open(url, '_blank');
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericValue);
};

const formatFileSize = (bytes?: number) => {
  const b = Number(bytes || 0);
  if (!b) return '0 KB';
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const confirmDelete = async (doc: any) => {
  const procurementId = props.item?.id;
  if (!procurementId || !doc?.id) return;

  try {
    await ElMessageBox.confirm(
      `Bạn chắc chắn muốn xóa chứng từ "${doc.file_name}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    );

    deletingId.value = doc.id;
    await procurementDocumentsService.delete(procurementId, doc.id);
    ElMessage.success('Đã xóa chứng từ');
    await loadDocuments(); // Refresh the list
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể xóa');
    }
  } finally {
    deletingId.value = null;
  }
};

const openAsset = (id: number) => {
  emit('update:visible', false);
  router.push(`/assets/${id}`);
};

const handleFulfill = async () => {
  if (!props.item?.id) return;

  try {
    await ElMessageBox.confirm(
      'Bạn chắc chắn muốn hoàn tất phiếu này và tự động tăng tài sản vào hệ thống? Thông tin tài sản sẽ được khởi tạo dựa trên nội dung phiếu.',
      'Xác nhận hoàn tất',
      {
        confirmButtonText: 'Hoàn tất & Tăng tài sản',
        cancelButtonText: 'Hủy',
        type: 'success',
      }
    );

    fulfilling.value = true;
    await procurementService.fulfill(props.item.id, {});
    ElMessage.success('Đã hoàn tất phiếu và tạo tài sản thành công');
    emit('fulfilled');
    emit('update:visible', false);
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể hoàn tất');
    }
  } finally {
    fulfilling.value = false;
  }
};
</script>

<style scoped>
.dialog-footer-actions {
  display: inline-block;
  margin-right: 12px;
}
.responsive-table {
  width: 100%;
  overflow-x: auto;
}
</style>
