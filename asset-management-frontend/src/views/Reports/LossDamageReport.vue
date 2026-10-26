<template>
  <div class="loss-page">
    <div class="page-head">
      <h2>Tài sản mất / hư hỏng &amp; bồi thường</h2>
      <div>
        <el-button
          :icon="Printer"
          @click="printReport"
        >
          In biên bản
        </el-button>
        <el-button
          type="primary"
          :icon="Download"
          :loading="exporting"
          @click="exportExcel"
        >
          Xuất Excel
        </el-button>
      </div>
    </div>

    <el-card>
      <div class="toolbar">
        <DepartmentTreeSelect
          v-model="departmentId"
          placeholder="Chọn đơn vị"
          style="width: 280px"
          clearable
        />
        <el-select
          v-model="status"
          placeholder="Trạng thái"
          clearable
          style="width: 160px"
        >
          <el-option
            label="Mất"
            value="lost"
          />
          <el-option
            label="Hư hỏng"
            value="damaged"
          />
        </el-select>
        <el-button @click="load">
          Lọc
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="rows"
        stripe
      >
        <el-table-column
          type="index"
          label="STT"
          width="60"
          align="center"
        />
        <el-table-column
          prop="asset_code"
          label="Mã tài sản"
          width="140"
        />
        <el-table-column
          prop="name"
          label="Tên tài sản"
          min-width="220"
        />
        <el-table-column
          label="Đơn vị"
          min-width="180"
        >
          <template #default="{ row }">
            {{ row.department?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="Trạng thái"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'lost' ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.status === 'lost' ? 'Mất' : 'Hư hỏng' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Nguyên giá"
          width="140"
          align="right"
        >
          <template #default="{ row }">
            {{ formatMoney(row.purchase_price) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Giá trị còn lại"
          width="140"
          align="right"
        >
          <template #default="{ row }">
            {{ formatMoney(row.current_value) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="discrepancy_reason"
          label="Nguyên nhân"
          min-width="200"
        />
        <el-table-column
          prop="responsibility"
          label="Trách nhiệm"
          min-width="160"
        />
        <el-table-column
          label="Bồi thường"
          width="140"
          align="right"
        >
          <template #default="{ row }">
            <span :class="{ 'text-danger': Number(row.compensation_amount) > 0 }">
              {{ formatMoney(row.compensation_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="90"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click.stop="openEdit(row)"
            >
              Sửa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="totals">
        <span>Tổng số: <b>{{ rows.length }}</b> tài sản</span>
        <span>Tổng bồi thường: <b>{{ formatMoney(totalCompensation) }}</b></span>
      </div>
    </el-card>

    <el-dialog
      v-model="editVisible"
      title="Cập nhật nguyên nhân & trách nhiệm"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Tài sản">
          <el-input
            :model-value="editRow ? `${editRow.asset_code} - ${editRow.name}` : ''"
            disabled
          />
        </el-form-item>
        <el-form-item
          label="Nguyên nhân mất / hư hỏng"
          required
        >
          <el-input
            v-model="editForm.discrepancy_reason"
            type="textarea"
            :rows="3"
            placeholder="Nêu rõ nguyên nhân..."
          />
        </el-form-item>
        <el-form-item
          label="Trách nhiệm"
          required
        >
          <el-input
            v-model="editForm.responsibility"
            placeholder="Tập thể/cá nhân chịu trách nhiệm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="savingEdit"
          @click="saveEdit"
        >
          Lưu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Edit, Printer } from '@element-plus/icons-vue';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import { assetService } from '@/services/asset.service';
import { openPrintWindow, escapeHtml } from '@/utils/print';

const rows = ref<any[]>([]);
const loading = ref(false);
const exporting = ref(false);
const departmentId = ref<number | null>(null);
const status = ref<string>('');

const totalCompensation = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.compensation_amount || 0), 0)
);

const editVisible = ref(false);
const savingEdit = ref(false);
const editRow = ref<any>(null);
const editForm = reactive({
  discrepancy_reason: '',
  responsibility: '',
});

const openEdit = (row: any) => {
  editRow.value = row;
  editForm.discrepancy_reason = row.discrepancy_reason || '';
  editForm.responsibility = row.responsibility || '';
  editVisible.value = true;
};

const saveEdit = async () => {
  if (!editRow.value) return;
  if (!editForm.discrepancy_reason.trim() || !editForm.responsibility.trim()) {
    ElMessage.warning('Vui lòng nhập nguyên nhân và trách nhiệm');
    return;
  }
  savingEdit.value = true;
  try {
    await assetService.updateAsset(editRow.value.id, {
      discrepancy_reason: editForm.discrepancy_reason.trim(),
      responsibility: editForm.responsibility.trim(),
    });
    editRow.value.discrepancy_reason = editForm.discrepancy_reason.trim();
    editRow.value.responsibility = editForm.responsibility.trim();
    editVisible.value = false;
    ElMessage.success('Đã lưu nguyên nhân và trách nhiệm');
  } catch {
    ElMessage.error('Không lưu được thông tin xử lý');
  } finally {
    savingEdit.value = false;
  }
};

const formatMoney = (v: any) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' đ' : '-';

const load = async () => {
  loading.value = true;
  try {
    const res: any = await assetService.getLossDamage({
      department_id: departmentId.value ?? undefined,
      status: status.value || undefined,
    });
    rows.value = res?.data || [];
  } catch {
    ElMessage.error('Không tải được dữ liệu');
  } finally {
    loading.value = false;
  }
};

const exportExcel = async () => {
  exporting.value = true;
  try {
    const blob: any = await assetService.exportLossDamage({
      department_id: departmentId.value ?? undefined,
      status: status.value || undefined,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-mat-hu-hong-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('Không xuất được Excel');
  } finally {
    exporting.value = false;
  }
};

const printReport = () => {
  const body = `
    <div class="doc-header"><div class="org">Báo cáo tài sản mất / hư hỏng</div></div>
    <div class="doc-title">Biên bản tài sản mất / hư hỏng &amp; bồi thường</div>
    <table class="data">
      <thead><tr><th>STT</th><th>Mã TS</th><th>Tên tài sản</th><th>Đơn vị</th><th>Trạng thái</th><th>Nguyên nhân</th><th>Trách nhiệm</th><th>Bồi thường</th></tr></thead>
      <tbody>
        ${rows.value.map((r, i) => `<tr>
          <td class="num">${i + 1}</td>
          <td>${escapeHtml(r.asset_code || '')}</td>
          <td>${escapeHtml(r.name || '')}</td>
          <td>${escapeHtml(r.department?.name || '')}</td>
          <td>${r.status === 'lost' ? 'Mất' : 'Hư hỏng'}</td>
          <td>${escapeHtml(r.discrepancy_reason || '')}</td>
          <td>${escapeHtml(r.responsibility || '')}</td>
          <td class="num">${Number(r.compensation_amount || 0).toLocaleString('vi-VN')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="summary">Tổng số: <b>${rows.value.length}</b> — Tổng bồi thường: <b>${totalCompensation.value.toLocaleString('vi-VN')} đồng</b></div>
    <div class="signatures">
      <div class="sig-cell"><div class="sig-label">Người lập</div><div class="sig-space"></div><div class="sig-name">..............</div></div>
      <div class="sig-cell"><div class="sig-label">Thủ trưởng đơn vị</div><div class="sig-space"></div><div class="sig-name">..............</div></div>
    </div>`;
  if (!openPrintWindow('Tài sản mất/hư hỏng', body)) {
    ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in');
  }
};

onMounted(load);
</script>

<style scoped>
.loss-page { padding: 20px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.page-head h2 { margin: 0; font-size: 18px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.totals { display: flex; justify-content: flex-end; gap: 24px; margin-top: 12px; font-size: 14px; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
