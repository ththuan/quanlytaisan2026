<template>
  <div class="stock-page">
    <el-card>
      <template #header>
        <div class="stock-header">
          <div class="title">
            Kho vật tư
          </div>
          <div class="actions">
            <el-input
              v-model="search"
              placeholder="Tìm theo mã hoặc tên vật tư"
              clearable
              style="width: 320px"
              @keyup.enter="fetchItems"
              @clear="fetchItems"
            />
            <el-button
              v-if="authStore.isAdmin"
              type="primary"
              @click="openReceipt"
            >
              Nhập kho
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              type="warning"
              @click="openIssue"
            >
              Xuất kho
            </el-button>
            <el-button
              type="info"
              plain
              @click="goHistory"
            >
              Lịch sử
            </el-button>
            <el-button
              type="default"
              :loading="loading"
              @click="fetchItems"
            >
              Làm mới
            </el-button>
          </div>
        </div>
      </template>

      <div class="responsive-table">
        <el-table
          v-loading="loading"
          :data="items"
          border
          stripe
        >
          <el-table-column
            prop="code"
            label="Mã"
            width="120"
          />
          <el-table-column
            prop="name"
            label="Tên vật tư"
            min-width="280"
          />
          <el-table-column
            prop="unit"
            label="Đơn vị"
            width="100"
            align="center"
          />
          <el-table-column
            prop="min_stock"
            label="Tồn tối thiểu"
            width="120"
            align="right"
          />
          <el-table-column
            prop="on_hand"
            label="Tồn kho"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              <el-tag
                v-if="Number(row.on_hand) === 0"
                type="danger"
                effect="light"
              >
                0
              </el-tag>
              <el-tag
                v-else-if="row.is_low"
                type="warning"
                effect="light"
              >
                {{ row.on_hand }}
              </el-tag>
              <span v-else>{{ row.on_hand }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div
        v-if="!items.length && !loading"
        style="margin-top: 16px;"
      >
        <el-empty description="Chưa có vật tư trong kho. Bạn hãy Nhập kho để bắt đầu." />
      </div>
    </el-card>

    <!-- Nhập kho dialog -->
    <el-dialog
      v-model="receiptVisible"
      title="Nhập kho"
      width="900px"
    >
      <el-form
        :model="receiptForm"
        label-width="160px"
      >
        <el-form-item label="Ngày nhập">
          <el-date-picker
            v-model="receiptForm.receipt_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Số vận đơn">
          <el-input
            v-model="receiptForm.shopee_waybill"
            placeholder="Mã vận đơn Shopee, GHN, Viettel Post… (tuỳ chọn)"
          />
        </el-form-item>
        <el-form-item label="Nhà cung cấp">
          <el-input
            v-model="receiptForm.supplier_name"
            placeholder="(Tuỳ chọn)"
          />
        </el-form-item>
        <el-form-item label="Số hóa đơn">
          <el-input
            v-model="receiptForm.invoice_no"
            placeholder="(Tuỳ chọn)"
          />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input
            v-model="receiptForm.notes"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-divider content-position="left">
          Dòng nhập
        </el-divider>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
          <el-button
            type="primary"
            @click="addReceiptLine"
          >
            Thêm dòng
          </el-button>
          <div
            v-if="receiptTotalAmount > 0"
            style="font-weight:600; color:#303133; font-size:14px"
          >
            Tổng giá trị: <span style="color:#e6a23c">{{ formatCurrency(receiptTotalAmount) }}</span>
          </div>
        </div>

        <el-table
          :data="receiptForm.lines"
          border
          stripe
          size="small"
        >
          <!-- Cột Vật tư: dùng autocomplete để tìm có sẵn HOẶC tạo mới -->
          <el-table-column
            label="Tên vật tư"
            min-width="280"
          >
            <template #default="{ row }">
              <el-autocomplete
                v-model="row.item_search_text"
                :fetch-suggestions="(q: string, cb: (s: any[]) => void) => suggestReceiptItems(q, cb)"
                placeholder="Gõ để tìm hoặc nhập tên vật tư mới"
                style="width:100%"
                clearable
                @select="(s: any) => onReceiptItemSelect(row, s)"
                @change="(v: string) => onReceiptItemTextChange(row, v)"
              >
                <template #default="{ item }">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
                    <span><b>{{ item.code }}</b> — {{ item.name }}</span>
                    <el-tag
                      size="small"
                      :type="Number(item.on_hand) > 0 ? 'success' : 'info'"
                    >
                      Tồn: {{ item.on_hand }}
                    </el-tag>
                  </div>
                </template>
              </el-autocomplete>
              <div style="margin-top:3px; font-size:11px; line-height:1.4">
                <span
                  v-if="row.item_id"
                  style="color:#409eff"
                >↩ Nhập thêm vào kho (đã có trong danh mục)</span>
                <span
                  v-else-if="row.item_search_text?.trim()"
                  style="color:#67c23a"
                >✚ Sẽ tạo mới vật tư "{{ row.item_search_text.trim() }}" vào danh mục</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="ĐVT"
            width="100"
          >
            <template #default="{ row }">
              <el-input
                v-model="row.unit"
                placeholder="Cái"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="SL"
            width="110"
            align="center"
          >
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="100000"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="Đơn giá (đ)"
            width="150"
            align="right"
          >
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="0"
                :controls="false"
                style="width:100%"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="Thành tiền"
            width="130"
            align="right"
          >
            <template #default="{ row }">
              <span style="color:#e6a23c; font-weight:500">
                {{ formatCurrency(row.quantity * row.unit_price) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            width="60"
            align="center"
          >
            <template #default="{ $index }">
              <el-button
                type="danger"
                link
                @click="receiptForm.lines.splice($index, 1)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="receiptVisible = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="submitReceipt"
        >
          Lưu nhập kho
        </el-button>
      </template>
    </el-dialog>

    <!-- Xuất kho dialog -->
    <el-dialog
      v-model="issueVisible"
      title="Xuất kho"
      width="900px"
    >
      <el-form
        :model="issueForm"
        label-width="160px"
      >
        <el-form-item label="Ngày xuất">
          <el-date-picker
            v-model="issueForm.issue_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Đơn vị nhận">
          <el-select
            v-model="issueForm.department_id"
            filterable
            clearable
            placeholder="Chọn đơn vị (nếu có)"
            style="width: 100%"
          >
            <el-option
              v-for="dept in departmentStore.departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Nơi sử dụng">
          <el-input
            v-model="issueForm.location"
            placeholder="VD: Phòng 301, Tầng 3 Khu A, Sân thể dục…"
          />
        </el-form-item>
        <el-form-item label="Mục đích / công việc">
          <el-input
            v-model="issueForm.purpose"
            placeholder="VD: Sửa điện, thay ổ cắm, bảo trì điều hòa…"
          />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input
            v-model="issueForm.notes"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-divider content-position="left">
          Dòng xuất
        </el-divider>
        <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
          <el-button
            type="primary"
            @click="addIssueLine"
          >
            Thêm dòng
          </el-button>
        </div>

        <el-table
          :data="issueForm.lines"
          border
          stripe
          size="small"
        >
          <el-table-column
            label="Vật tư"
            min-width="320"
          >
            <template #default="{ row }">
              <el-select
                v-model="row.item_id"
                filterable
                placeholder="Chọn vật tư cần xuất"
                style="width:100%"
                @change="() => onIssueItemChange(row)"
              >
                <el-option
                  v-for="it in items"
                  :key="it.id"
                  :label="`${it.code} - ${it.name}`"
                  :value="it.id"
                  :disabled="Number(it.on_hand) <= 0"
                >
                  <div style="display:flex; justify-content:space-between; align-items:center">
                    <span>{{ it.code }} — {{ it.name }}</span>
                    <el-tag
                      size="small"
                      :type="Number(it.on_hand) > 0 ? 'success' : 'danger'"
                    >
                      Tồn: {{ it.on_hand }} {{ it.unit }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
              <div
                v-if="row.item_id !== null"
                style="margin-top:3px; font-size:11px; color:#606266;"
              >
                <span v-if="row.max_qty > 0">
                  Hiện tồn kho: <b style="color:#67c23a">{{ row.max_qty }}</b>
                  {{ items.find(i => i.id === row.item_id)?.unit || '' }}
                  — có thể xuất tối đa {{ row.max_qty }}
                </span>
                <span
                  v-else
                  style="color:#f56c6c"
                >⚠ Vật tư này đã hết hàng trong kho</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="SL xuất"
            width="130"
            align="center"
          >
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="row.max_qty || 100000"
                :disabled="row.item_id !== null && row.max_qty === 0"
              />
              <div
                v-if="row.item_id !== null && row.max_qty > 0 && row.quantity > row.max_qty"
                style="color:#f56c6c; font-size:11px; margin-top:2px"
              >
                Vượt tồn kho!
              </div>
            </template>
          </el-table-column>
          <el-table-column
            width="60"
            align="center"
          >
            <template #default="{ $index }">
              <el-button
                type="danger"
                link
                @click="issueForm.lines.splice($index, 1)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="issueVisible = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="submitIssue"
        >
          Lưu xuất kho
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import { useDepartmentStore } from '@/stores/department.store';
import stockService, { type StockItem } from '@/services/stock.service';

const router = useRouter();
const authStore = useAuthStore();
const departmentStore = useDepartmentStore();

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
  department_id: null,
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
  departmentStore.fetchDepartments({ limit: 1000 });
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
  issueForm.department_id = null;
  issueForm.lines = [];
  addIssueLine();
  issueVisible.value = true;
};

const addReceiptLine = () => {
  receiptForm.lines.push({
    item_id: null,
    item_search_text: '',  // single unified field for autocomplete
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
    max_qty: 100000,  // dynamically updated when item is selected
  });
};

// Autocomplete: search catalog for receipt lines
const suggestReceiptItems = (query: string, callback: Function) => {
  const q = (query || '').toLowerCase().trim();
  const results = (q
    ? items.value.filter(it =>
        it.name.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q)
      )
    : items.value.slice(0, 20)
  ).map(it => ({ ...it, value: it.name }));
  callback(results);
};

// When user selects an existing catalog item in receipt
const onReceiptItemSelect = (row: any, selected: any) => {
  row.item_id = selected.id;
  row.item_search_text = selected.name;
  row.unit = selected.unit || 'Cái';
  row.category = selected.category || '';
  row.min_stock = selected.min_stock || 0;
};

// When autocomplete text changes manually (user clears or edits after selecting)
const onReceiptItemTextChange = (row: any, value: string) => {
  if (!value?.trim()) {
    row.item_id = null;
    row.unit = 'Cái';
    row.category = '';
    row.min_stock = 0;
    return;
  }
  // If the text no longer matches the selected item's name → deselect (user typed new name)
  if (row.item_id) {
    const selected = items.value.find(i => i.id === row.item_id);
    if (!selected || selected.name !== value) {
      row.item_id = null;
    }
  }
};

// When issue item is selected: update max_qty from on_hand
const onIssueItemChange = (row: any) => {
  const it = items.value.find(i => i.id === row.item_id);
  if (it) {
    row.max_qty = Math.max(0, Number(it.on_hand) || 0);
    if (row.quantity > row.max_qty && row.max_qty > 0) {
      row.quantity = row.max_qty;
    }
  } else {
    row.max_qty = 100000;
  }
};

// Total amount for receipt form
const receiptTotalAmount = computed(() =>
  receiptForm.lines.reduce((sum: number, l: any) => sum + (l.quantity || 0) * (l.unit_price || 0), 0)
);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const submitReceipt = async () => {
  if (!receiptForm.lines.length) return ElMessage.error('Phải có ít nhất 1 dòng nhập');

  // Validate: mỗi dòng phải có tên vật tư
  for (const l of receiptForm.lines) {
    if (!l.item_id && !(l.item_search_text || '').trim()) {
      ElMessage.error('Vui lòng nhập tên vật tư cho tất cả dòng (chọn có sẵn hoặc gõ tên mới)');
      return;
    }
    if (!l.quantity || l.quantity < 1) {
      ElMessage.error('Số lượng mỗi dòng phải ≥ 1');
      return;
    }
  }

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
        item_name: l.item_id ? null : (l.item_search_text || '').trim(),
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
      department_id: issueForm.department_id || null,
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

:deep(.el-autocomplete) {
  width: 100%;
}

:deep(.el-autocomplete-suggestion__wrap) {
  max-height: 280px;
}
</style>
