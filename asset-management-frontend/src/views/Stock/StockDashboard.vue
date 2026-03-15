<template>
  <div class="stock-page">
    <el-card>
      <template #header>
        <div class="stock-header">
          <div class="title">Kho vật tư</div>
          <div class="actions">
            <el-input
              v-model="search"
              placeholder="Tìm theo mã hoặc tên vật tư"
              clearable
              style="width: 320px"
              @keyup.enter="fetchItems"
              @clear="fetchItems"
            />
            <el-button type="primary" @click="openReceipt" v-if="!authStore.isDirector">Nhập kho</el-button>
            <el-button type="warning" @click="openIssue" v-if="!authStore.isDirector">Xuất kho</el-button>
            <el-button type="info" plain @click="goHistory">Lịch sử</el-button>
            <el-button type="default" :loading="loading" @click="fetchItems">Làm mới</el-button>
          </div>
        </div>
      </template>

      <div class="responsive-table">
        <el-table :data="items" v-loading="loading" border stripe>
        <el-table-column prop="code" label="Mã" width="120" />
        <el-table-column prop="name" label="Tên vật tư" min-width="280" />
        <el-table-column prop="unit" label="Đơn vị" width="100" align="center" />
        <el-table-column prop="min_stock" label="Tồn tối thiểu" width="120" align="right" />
        <el-table-column prop="on_hand" label="Tồn kho" width="120" align="right">
          <template #default="{ row }">
            <el-tag v-if="Number(row.on_hand) === 0" type="danger" effect="light">0</el-tag>
            <el-tag v-else-if="row.is_low" type="warning" effect="light">{{ row.on_hand }}</el-tag>
            <span v-else>{{ row.on_hand }}</span>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <div v-if="!items.length && !loading" style="margin-top: 16px;">
        <el-empty description="Chưa có vật tư trong kho. Bạn hãy Nhập kho để bắt đầu." />
      </div>
    </el-card>

    <!-- Nhập kho dialog -->
    <el-dialog v-model="receiptVisible" title="Nhập kho" width="900px">
      <el-form :model="receiptForm" label-width="160px">
        <el-form-item label="Ngày nhập">
          <el-date-picker v-model="receiptForm.receipt_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Vận đơn Shopee">
          <el-input v-model="receiptForm.shopee_waybill" placeholder="Nhập mã vận đơn Shopee" />
        </el-form-item>
        <el-form-item label="Nhà cung cấp">
          <el-input v-model="receiptForm.supplier_name" placeholder="(Tuỳ chọn)" />
        </el-form-item>
        <el-form-item label="Số hóa đơn">
          <el-input v-model="receiptForm.invoice_no" placeholder="(Tuỳ chọn)" />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="receiptForm.notes" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">Dòng nhập</el-divider>
        <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
          <el-button type="primary" @click="addReceiptLine">Thêm dòng</el-button>
        </div>

        <el-table :data="receiptForm.lines" border stripe size="small">
          <el-table-column label="Vật tư" min-width="280">
            <template #default="{ row }">
              <el-select v-model="row.item_id" filterable clearable placeholder="Chọn vật tư" style="width:100%" @change="() => syncLineFromItem(row)">
                <el-option v-for="it in items" :key="it.id" :label="`${it.code} - ${it.name}`" :value="it.id" />
              </el-select>
              <div style="margin-top: 6px;">
                <el-input v-model="row.item_name" placeholder="Hoặc nhập tên vật tư mới" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="ĐVT" width="120">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="Cái" />
            </template>
          </el-table-column>
          <el-table-column label="SL" width="110" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="100000" />
            </template>
          </el-table-column>
          <el-table-column label="Đơn giá" width="160" align="right">
            <template #default="{ row }">
              <el-input-number v-model="row.unit_price" :min="0" :precision="0" :controls="false" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column width="70" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link @click="receiptForm.lines.splice($index, 1)">Xóa</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="receiptVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="submitReceipt">Lưu nhập kho</el-button>
      </template>
    </el-dialog>

    <!-- Xuất kho dialog -->
    <el-dialog v-model="issueVisible" title="Xuất kho" width="900px">
      <el-form :model="issueForm" label-width="160px">
        <el-form-item label="Ngày xuất">
          <el-date-picker v-model="issueForm.issue_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Ở đâu">
          <el-input v-model="issueForm.location" placeholder="VD: Tầng 3, Khu A" />
        </el-form-item>
        <el-form-item label="Vào việc gì">
          <el-input v-model="issueForm.purpose" placeholder="VD: Sửa điện phòng 301" />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="issueForm.notes" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">Dòng xuất</el-divider>
        <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
          <el-button type="primary" @click="addIssueLine">Thêm dòng</el-button>
        </div>

        <el-table :data="issueForm.lines" border stripe size="small">
          <el-table-column label="Vật tư" min-width="320">
            <template #default="{ row }">
              <el-select v-model="row.item_id" filterable placeholder="Chọn vật tư" style="width:100%">
                <el-option v-for="it in items" :key="it.id" :label="`${it.code} - ${it.name} (Tồn: ${it.on_hand})`" :value="it.id" :disabled="Number(it.on_hand) <= 0" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="SL" width="110" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="100000" />
            </template>
          </el-table-column>
          <el-table-column width="70" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link @click="issueForm.lines.splice($index, 1)">Xóa</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="issueVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="submitIssue">Lưu xuất kho</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import stockService, { type StockItem } from '@/services/stock.service';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const saving = ref(false);
const search = ref('');
const items = ref<StockItem[]>([]);

const receiptVisible = ref(false);
const issueVisible = ref(false);

const receiptForm = reactive<any>({
  receipt_date: new Date().toISOString().split('T')[0],
  supplier_name: '',
  shopee_waybill: '',
  invoice_no: '',
  notes: '',
  lines: [] as any[],
});

const issueForm = reactive<any>({
  issue_date: new Date().toISOString().split('T')[0],
  location: '',
  purpose: '',
  notes: '',
  lines: [] as any[],
});

const fetchItems = async () => {
  loading.value = true;
  try {
    const res: any = await stockService.listItems({ search: search.value || undefined });
    items.value = res.data || [];
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể tải tồn kho');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchItems();
});

const goHistory = () => {
  router.push('/stock/history');
};

const openReceipt = () => {
  receiptForm.receipt_date = new Date().toISOString().split('T')[0];
  receiptForm.supplier_name = '';
  receiptForm.shopee_waybill = '';
  receiptForm.invoice_no = '';
  receiptForm.notes = '';
  receiptForm.lines = [];
  addReceiptLine();
  receiptVisible.value = true;
};

const openIssue = () => {
  issueForm.issue_date = new Date().toISOString().split('T')[0];
  issueForm.location = '';
  issueForm.purpose = '';
  issueForm.notes = '';
  issueForm.lines = [];
  addIssueLine();
  issueVisible.value = true;
};

const addReceiptLine = () => {
  receiptForm.lines.push({
    item_id: null,
    item_name: '',
    unit: 'Cái',
    category: '',
    min_stock: 0,
    quantity: 1,
    unit_price: 0,
  });
};

const addIssueLine = () => {
  issueForm.lines.push({
    item_id: null,
    quantity: 1,
  });
};

const syncLineFromItem = (row: any) => {
  const it = items.value.find((x) => x.id === row.item_id);
  if (!it) return;
  row.unit = it.unit || row.unit;
  row.category = it.category || row.category;
  row.min_stock = it.min_stock ?? row.min_stock;
  if (!row.item_name) row.item_name = it.name;
};

const submitReceipt = async () => {
  if (!receiptForm.lines.length) return ElMessage.error('Phải có ít nhất 1 dòng nhập');
  saving.value = true;
  try {
    const payload = {
      receipt_date: receiptForm.receipt_date,
      supplier_name: receiptForm.supplier_name || null,
      shopee_waybill: receiptForm.shopee_waybill || null,
      invoice_no: receiptForm.invoice_no || null,
      notes: receiptForm.notes || null,
      lines: receiptForm.lines.map((l: any) => ({
        item_id: l.item_id || null,
        item_name: l.item_id ? null : (l.item_name || '').trim(),
        unit: l.unit || 'Cái',
        category: l.category || null,
        min_stock: l.min_stock ?? 0,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
    };

    await stockService.createReceipt(payload as any);
    ElMessage.success('Nhập kho thành công');
    receiptVisible.value = false;
    fetchItems();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể nhập kho');
  } finally {
    saving.value = false;
  }
};

const submitIssue = async () => {
  if (!issueForm.lines.length) return ElMessage.error('Phải có ít nhất 1 dòng xuất');
  if (!issueForm.location.trim()) return ElMessage.error('Vui lòng nhập "Ở đâu"');
  if (!issueForm.purpose.trim()) return ElMessage.error('Vui lòng nhập "Vào việc gì"');

  saving.value = true;
  try {
    const payload = {
      issue_date: issueForm.issue_date,
      location: issueForm.location,
      purpose: issueForm.purpose,
      notes: issueForm.notes || null,
      lines: issueForm.lines.map((l: any) => ({
        item_id: l.item_id,
        quantity: l.quantity,
      })),
    };

    await stockService.createIssue(payload as any);
    ElMessage.success('Xuất kho thành công');
    issueVisible.value = false;
    fetchItems();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể xuất kho');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.stock-page {
  padding: 4px;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-header .title {
  font-weight: 600;
}

.stock-header .actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
