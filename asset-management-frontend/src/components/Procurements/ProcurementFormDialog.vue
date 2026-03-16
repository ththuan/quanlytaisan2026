<template>
  <el-dialog
    :model-value="modelValue"
    :title="editId ? 'Sửa phiếu' : 'Tạo phiếu'"
    width="980px"
    class="procurement-dialog"
    @close="emit('update:modelValue', false)"
  >
    <!-- Banner: phiếu được chuyển từ đề nghị mua sắm -->
    <el-alert
      v-if="sourceRequest"
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
    >
      <template #title>
        Phiếu này được tạo từ <strong>Đề nghị mua sắm #{{ sourceRequest.id }}</strong>
        <span v-if="sourceRequest.device_name"> – {{ sourceRequest.device_name }}</span>
        <span v-if="sourceRequest.quantity"> (SL: {{ sourceRequest.quantity }})</span>
      </template>
    </el-alert>

    <el-form
      :model="form"
      label-width="160px"
    >
      <el-form-item label="Nội dung">
        <el-input
          v-model="form.title"
          size="large"
        />
      </el-form-item>
      <el-form-item label="Mô tả">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          size="large"
        />
      </el-form-item>
      <el-form-item label="">
        <el-checkbox v-model="autoFulfill">
          Lưu và tạo tài sản ngay
        </el-checkbox>
      </el-form-item>

      <el-divider content-position="left">
        Pháp lý mua sắm
      </el-divider>
      <el-form-item label="Nhà cung cấp">
        <el-input
          v-model="form.supplier_name"
          placeholder="Nhập tên nhà cung cấp"
          size="large"
        />
      </el-form-item>
      <el-form-item label="Hình thức chứng từ">
        <el-radio-group
          v-model="form.purchase_doc_type"
          size="large"
        >
          <el-radio-button label="invoice">
            Hóa đơn
          </el-radio-button>
          <el-radio-button label="contract">
            Hợp đồng
          </el-radio-button>
          <el-radio-button label="online">
            Mua online
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.purchase_doc_type === 'contract'"
        label="Số hợp đồng"
      >
        <el-input
          v-model="form.contract_no"
          placeholder="Nhập số hợp đồng"
          size="large"
        />
      </el-form-item>
      <el-form-item
        v-else-if="form.purchase_doc_type === 'invoice'"
        label="Số hóa đơn"
      >
        <el-input
          v-model="form.invoice_no"
          placeholder="Nhập số hóa đơn"
          size="large"
        />
      </el-form-item>
      <el-form-item
        v-else
        label="Mã đơn hàng"
      >
        <el-input
          v-model="form.order_code"
          placeholder="Nhập mã đơn hàng"
          size="large"
        />
      </el-form-item>

      <el-divider content-position="left">
        Thêm tài sản
      </el-divider>
      <div class="procurement-items-header">
        <div class="procurement-items-title">
          Thêm tài sản
        </div>
        <el-button
          type="primary"
          size="large"
          @click="openAddAsset"
        >
          Thêm tài sản
        </el-button>
      </div>

      <div class="procurement-items-list">
        <div
          v-for="(row, idx) in form.items"
          :key="idx"
          class="procurement-item-row"
        >
          <div class="procurement-item-summary">
            <div class="summary-main">
              <div class="summary-title">
                {{ row.name || 'Chưa đặt tên tài sản' }}
              </div>
              <div class="summary-sub">
                <span v-if="row.category_code">{{ row.category_code }} - {{ row.category || '' }}</span>
                <span v-else>Chưa chọn loại tài sản</span>
                <span> | PB: {{ row.current_department_id ? getDepartmentName(Number(row.current_department_id)) : '-' }}</span>
                <span> | Ngày mua: {{ formatDateDisplay(row.purchase_date) }}</span>
                <span v-if="row.purchase_price != null"> | Nguyên giá: {{ Number(row.purchase_price).toLocaleString('vi-VN') }}</span>
                <span> | Vị trí: {{ row.location || '-' }}</span>
                <span> | Serial: {{ row.serial_number || '-' }}</span>
              </div>
            </div>

            <div class="procurement-item-actions">
              <el-button
                size="large"
                @click="openEditAsset(idx)"
              >
                Sửa
              </el-button>
              <el-button
                type="danger"
                plain
                size="large"
                @click="removeLine(idx)"
              >
                Xóa
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-card
        v-if="showInlineForm"
        shadow="never"
        class="inline-asset-card"
      >
        <AssetInlineForm
          v-model="editingAssetModel"
          :show-actions="true"
          @save="handleInlineAssetSave"
          @cancel="handleInlineAssetCancel"
        />
      </el-card>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="submit"
      >
        Lưu
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const formatDateDisplay = (val: any) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return String(val);
  }
};
import procurementService from '@/services/procurement.service';
import AssetInlineForm from '@/components/Assets/AssetInlineForm.vue';
import { useDepartments } from '@/composables/useDepartments';

const props = defineProps<{ modelValue: boolean; editId: number | null }>();

const sourceRequest = ref<any>(null);
const emit = defineEmits<{ (e:'update:modelValue', v:boolean): void; (e:'saved'): void }>();

const loading = ref(false);
const autoFulfill = ref(true);

const { getDepartmentName } = useDepartments();

// Inline Asset Editor State
const showInlineForm = ref(false);
const editingAssetIndex = ref<number | null>(null);
const editingAssetModel = ref<any>({});


const form = reactive<any>({
  title: '',
  description: '',
  supplier_name: '',
  purchase_doc_type: 'invoice',
  invoice_no: '',
  contract_no: '',
  order_code: '',
  items: [] as any[],
});


const reset = async () => {
  autoFulfill.value = true;
  showInlineForm.value = false;
  editingAssetIndex.value = null;
  editingAssetModel.value = {};

  if (!props.editId) {
    form.title = '';
    form.description = '';
    form.supplier_name = '';
    form.purchase_doc_type = 'invoice';
    form.invoice_no = '';
    form.contract_no = '';
    form.order_code = '';
    form.items = [];
    sourceRequest.value = null;

    // Open the inline asset form immediately for a new procurement
    openAddAsset();
    return;
  }
  const res: any = await procurementService.getById(props.editId);
  const item = res?.data || null;
  if (!item) return;

  sourceRequest.value = item.sourceMaintenanceRequest || null;

  form.title = item.title;
  form.description = item.description || '';
  form.supplier_name = item.supplier_name || '';
  form.purchase_doc_type = item.purchase_doc_type || 'invoice';
  form.invoice_no = item.invoice_no || '';
  form.contract_no = item.contract_no || '';
  form.order_code = item.order_code || '';
  form.items = (item.items || []).map((it: any) => ({
    asset_code_prefix: it.asset_code_prefix || '',
    name: it.name,
    category_id: it.category_id ?? null,
    category_code: it.category_code || '',
    category: it.category || '',
    quantity: it.quantity || 1,
    purchase_price: it.purchase_price != null ? Number(it.purchase_price) : null,
    unit: it.unit || 'Cái',
    serial_number: it.serial_number || '',
    warranty_date: it.warranty_date || null,
    location: it.location || '',
    asset_condition: it.asset_condition || 'good',
    asset_type: it.asset_type || '',
    land_parcel_id: it.land_parcel_id ?? null,
    is_depreciable: it.is_depreciable,
    useful_life: it.useful_life != null ? Number(it.useful_life) : null,
    depreciation_rate: it.depreciation_rate != null ? Number(it.depreciation_rate) : null,
    purchase_date: it.purchase_date || null,
    year_in_use: it.year_in_use != null ? Number(it.year_in_use) : null,
    current_department_id: it.current_department_id != null ? Number(it.current_department_id) : null,
    residual_value: it.residual_value != null ? Number(it.residual_value) : null,
  }));
  if (!form.items.length) form.items = [newProcurementItem()];
};

watch(() => props.modelValue, (v) => { if (v) reset(); }, { immediate: true });
watch(() => props.editId, (v) => { if (props.modelValue && v) reset(); });

const newProcurementItem = () => ({
  // Fields used by procurement create/update payload
  asset_code_prefix: '',
  name: '',
  description: '',
  category: '',
  category_id: null,
  category_code: '',
  quantity: 1,
  purchase_price: null,
  unit: '',
  asset_type: '',
  serial_number: '',
  warranty_date: null,
  location: '',
  asset_condition: 'good',
  land_parcel_id: null,
  is_depreciable: true,
  depreciation_rate: null,
  useful_life: null,
  // Extra fields captured from Add Asset dialog (kept for later/back-end compatibility)
  asset_code: '',
  status: 'active',
  current_department_id: null,
  purchase_date: '',
  residual_value: null,
  year_in_use: null,
});

const removeLine = (idx:number) => form.items.splice(idx, 1);

const openAddAsset = () => {
  editingAssetIndex.value = null;
  editingAssetModel.value = {
    name: '',
    category: '',
    category_id: null,
    category_code: '',
    unit: '',
    status: 'active',
    current_department_id: null,
    location: '',
    purchase_date: '',
    purchase_price: null,
    residual_value: null,
    serial_number: '',
    warranty_date: null,
    year_in_use: null,
    quantity: 1,
    asset_condition: 'good',
    land_parcel_id: null,
    is_depreciable: true,
    depreciation_rate: null,
    useful_life: null,
    description: '',
    asset_type: '',
  };
  showInlineForm.value = true;
};

const openEditAsset = (idx: number) => {
  editingAssetIndex.value = idx;
  const row = form.items[idx] || {};
  editingAssetModel.value = {
    name: row.name || '',
    category: row.category || '',
    category_id: row.category_id ?? null,
    category_code: row.category_code || '',
    unit: row.unit || '',
    status: row.status || 'active',
    current_department_id: row.current_department_id ?? null,
    location: row.location || '',
    purchase_date: row.purchase_date || '',
    purchase_price: row.purchase_price ?? null,
    residual_value: row.residual_value ?? null,
    serial_number: row.serial_number || '',
    warranty_date: row.warranty_date || null,
    year_in_use: row.year_in_use ?? null,
    quantity: row.quantity ?? 1,
    asset_condition: row.asset_condition || 'good',
    land_parcel_id: row.land_parcel_id ?? null,
    is_depreciable: row.is_depreciable ?? true,
    depreciation_rate: row.depreciation_rate ?? null,
    useful_life: row.useful_life ?? null,
    description: row.description || '',
    asset_type: row.asset_type || '',
  };
  showInlineForm.value = true;
};

const mapInlineAssetToProcurementItem = (data: any) => ({
  // B: asset code auto => don't pass prefix unless later needed
  asset_code_prefix: null,
  name: data.name || '',
  description: data.description || '',
  category: data.category || '',
  category_id: data.category_id ?? null,
  category_code: data.category_code || '',
  unit: data.unit || '',
  quantity: data.quantity ?? 1,
  purchase_price: data.purchase_price ?? null,
  residual_value: data.residual_value ?? null,
  asset_type: data.asset_type || '',
  serial_number: data.serial_number || '',
  warranty_date: data.warranty_date || null,
  location: data.location || '',
  asset_condition: data.asset_condition || 'good',
  land_parcel_id: data.land_parcel_id ?? null,
  is_depreciable: data.is_depreciable ?? true,
  useful_life: data.useful_life ?? null,
  depreciation_rate: data.depreciation_rate ?? null,
  purchase_date: data.purchase_date || null,
  year_in_use: data.year_in_use ?? null,
  current_department_id: data.current_department_id ?? null,
});

const handleInlineAssetSave = (data: any) => {
  const mapped = mapInlineAssetToProcurementItem(data);

  if (editingAssetIndex.value == null) {
    form.items.push({
      ...newProcurementItem(),
      ...mapped,
    });
  } else {
    form.items[editingAssetIndex.value] = {
      ...form.items[editingAssetIndex.value],
      ...mapped,
    };
  }

  showInlineForm.value = false;
  editingAssetModel.value = {};
  editingAssetIndex.value = null;
};

const handleInlineAssetCancel = () => {
  showInlineForm.value = false;
  editingAssetModel.value = {};
  editingAssetIndex.value = null;
};

const submit = async () => {
  if (!form.title.trim()) return ElMessage.error('Nội dung là bắt buộc');
  if (!form.items.length) return ElMessage.error('Phải có ít nhất 1 tài sản');
  if (form.items.some((i:any)=>!i.name || !String(i.name).trim())) return ElMessage.error('Tên tài sản là bắt buộc');

  // Validate required per-item fields for "cách 1"
  for (let idx = 0; idx < form.items.length; idx++) {
    const it = form.items[idx];
    if (!it.category_id && !it.category_code) return ElMessage.error(`Tài sản #${idx + 1}: Vui lòng chọn loại tài sản`);
    if (!it.current_department_id) return ElMessage.error(`Tài sản #${idx + 1}: Vui lòng chọn phòng ban`);
    if (!it.purchase_date) return ElMessage.error(`Tài sản #${idx + 1}: Vui lòng chọn ngày mua`);
  }

  const firstItemDeptId = form.items[0]?.current_department_id;
  const receivingDepartmentId = firstItemDeptId ? Number(firstItemDeptId) : 0;
  if (!receivingDepartmentId || isNaN(receivingDepartmentId)) return ElMessage.error('Thiếu phòng ban (không hợp lệ)');

  loading.value = true;
  try {
    const payload: any = {
      title: form.title,
      description: form.description,
      supplier_name: form.supplier_name,
      contract_no: form.contract_no,
      invoice_no: form.invoice_no,
      order_code: form.order_code,
      purchase_doc_type: form.purchase_doc_type,
      // Backend vẫn yêu cầu receiving_department_id (dùng item đầu tiên làm giá trị mặc định)
      receiving_department_id: receivingDepartmentId,
      // Set purchase_date cấp phiếu để lọc lịch sử theo năm (lấy ngày mua nhỏ nhất trong các tài sản)
      purchase_date: form.items.reduce((min:any, it:any) => {
        const v = it?.purchase_date;
        if (!v) return min;
        if (!min) return v;
        return String(v) < String(min) ? v : min;
      }, null),
      items: form.items.map((i:any)=>({
        // B: mã tự động => để null/undefined để backend tự sinh
        asset_code_prefix: null,
        name: i.name,
        description: i.description,
        category: i.category,
        category_id: i.category_id,
        category_code: i.category_code,
        unit: i.unit,
        quantity: i.quantity,
        purchase_price: i.purchase_price,
        residual_value: i.residual_value,
        asset_type: i.asset_type,
        serial_number: i.serial_number,
        warranty_date: i.warranty_date,
        location: i.location,
        asset_condition: i.asset_condition,
        land_parcel_id: i.land_parcel_id,
        is_depreciable: i.is_depreciable,
        useful_life: i.useful_life,
        depreciation_rate: i.depreciation_rate,
        purchase_date: i.purchase_date,
        year_in_use: i.year_in_use,
        current_department_id: i.current_department_id,
      })),
    };

    let saved: any = null;
    if (props.editId) {
      const res: any = await procurementService.update(props.editId, payload as any);
      saved = res?.data || null;
    } else {
      const res: any = await procurementService.create(payload as any);
      saved = res?.data || null;
    }

    if (autoFulfill.value) {
      const id = saved?.id ?? props.editId;
      const status = saved?.status;
      if (id && status !== 'fulfilled') {
        await procurementService.fulfill(id, {} as any);
      }
    }

    ElMessage.success('Đã lưu');
    emit('saved');
    emit('update:modelValue', false);
  } catch (e:any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể lưu');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Larger select dropdowns in table */
:deep(.procurement-table-select .el-input__wrapper) {
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 4px;
}

:deep(.procurement-table-select .el-input__inner) {
  height: 100%;
  line-height: 1.5;
}

/* Larger dropdown options */
:deep(.procurement-select-popper .el-select-dropdown__item) {
  height: 40px;
  line-height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

:deep(.procurement-select-popper .el-select-dropdown__item.hover),
:deep(.procurement-select-popper .el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}

/* Adjust table cell padding for better spacing */
:deep(.el-table td) {
  padding: 6px 0;
}

:deep(.el-table .cell) {
  padding: 0 8px;
}

/* Make quantity input larger */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding: 0 4px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
}

/* Make all table inputs visually consistent */
:deep(.procurement-table-input .el-input__wrapper) {
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 4px;
}

:deep(.procurement-table-input .el-input__inner) {
  height: 100%;
}

:deep(.procurement-table-number .el-input__wrapper) {
  height: 38px;
  border-radius: 4px;
}

:deep(.procurement-dialog .el-dialog__body) {
  padding: 18px 22px;
}

:deep(.procurement-dialog .el-dialog__footer) {
  padding: 14px 22px 18px;
}

.procurement-table-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0 12px;
}

:deep(.procurement-items-table .el-table__header th) {
  background: #fafbfd;
  color: #303133;
  font-weight: 600;
}

:deep(.procurement-items-table .el-table__row:hover td) {
  background: #f6faff;
}

/* Form select height for consistency */
:deep(.procurement-form-select .el-input__wrapper) {
  height: 40px;
  border-radius: 6px;
}
</style>

