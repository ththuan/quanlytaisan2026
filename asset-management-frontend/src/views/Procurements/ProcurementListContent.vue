<template>
  <div>
    <div class="header-actions">
      <el-button type="primary" @click="openCreate" v-if="!authStore.isDirector">Tạo mới</el-button>
    </div>

    <el-card class="summary-card">
      <div class="summary-header">
        <div class="summary-title">Tổng hợp mua sắm theo năm</div>
        <div class="summary-filters">
          <el-select v-model="selectedYear" placeholder="Chọn năm" style="width: 140px" @change="loadSummary">
            <el-option v-for="y in years" :key="y" :label="String(y)" :value="y" />
          </el-select>
          <el-button type="primary" plain @click="loadSummary">Tải</el-button>
          <el-button type="success" @click="exportSummaryExcel" :loading="exporting">Xuất Excel</el-button>
        </div>
      </div>


      <el-table :data="summaryRows" v-loading="summaryLoading" style="width: 100%">

        <el-table-column prop="category_code" label="Mã loại" width="120" />
        <el-table-column prop="category" label="Loại tài sản" min-width="260" />
        <el-table-column prop="name" label="Tên tài sản" min-width="220" />
        <el-table-column prop="unit" label="Đơn vị" width="120" />
        <el-table-column prop="total_quantity" label="Tổng SL" width="120" />
        <el-table-column prop="total_amount" label="Tổng tiền" width="160">
          <template #default="scope">
            {{ formatMoney(scope.row.total_amount) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card>
      <div class="filters">
        <el-input v-model="filters.search" placeholder="Tìm theo mã/tiêu đề" clearable style="max-width: 240px" />
        <el-select v-model="filters.year" placeholder="Năm" clearable style="width: 140px">
          <el-option v-for="y in years" :key="y" :label="String(y)" :value="y" />
        </el-select>
        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width: 160px">
          <el-option label="Nháp" value="draft" />
          <el-option label="Đã hoàn tất" value="fulfilled" />
          <el-option label="Đã hủy" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="load">Tải</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="Mã" width="140" />
        <el-table-column prop="title" label="Nội dung" min-width="240" />
        <el-table-column label="Cấp phát (phòng ban)" min-width="220">
          <template #default="scope">
            {{ scope.row.receiving_department?.name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Ngày mua" width="140">
          <template #default="scope">
            {{ formatDate(scope.row.purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="220" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetail(scope.row.id)">Xem</el-button>
            <template v-if="!authStore.isDirector">
              <el-button v-if="scope.row.status === 'draft'" size="small" @click="openEdit(scope.row.id)">Sửa</el-button>
              <el-button v-if="scope.row.status === 'draft'" size="small" type="danger" plain @click="confirmDelete(scope.row.id)">Xóa</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </el-card>

    <ProcurementFormDialog v-model="formVisible" :edit-id="editId" @saved="handleSaved" />
    <ProcurementDetailDialog
      :visible="detailVisible"
      :item="detailItem"
      @update:visible="detailVisible = $event"
      @edit="(id) => { detailVisible = false; openEdit(id); }"
      @fulfilled="load(); loadSummary();"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import procurementService from '@/services/procurement.service';
import ProcurementFormDialog from '@/components/Procurements/ProcurementFormDialog.vue';
import ProcurementDetailDialog from '@/components/Procurements/ProcurementDetailDialog.vue';

const authStore = useAuthStore();
const years = Array.from({ length: 15 }).map((_, i) => new Date().getFullYear() - i);

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);

const filters = reactive<{ search: string; status: string | null; year: number | null }>(
  {
    search: '',
    status: null,
    year: new Date().getFullYear(),
  }
);

const load = async () => {
  loading.value = true;
  try {
    const res: any = await procurementService.getAll({
      page: page.value,
      limit: limit.value,
      search: filters.search || undefined,
      status: filters.status || undefined,
      year: filters.year || undefined,
    });

    // api.ts interceptor returns response.data directly.
    // Backend returns: { success, data: [...], pagination: {...} }
    // Be defensive in case response shape changes.
    const payload: any = (res && typeof res === 'object' && 'data' in (res as any)) ? (res as any) : { data: [], pagination: { total: 0 } };

    rows.value = payload?.data || payload?.rows || payload?.data?.data || payload?.data?.rows || [];
    total.value = payload?.pagination?.total || payload?.data?.pagination?.total || payload?.total || 0;
  } finally {
    loading.value = false;
  }
};

const summaryLoading = ref(false);
const summaryRows = ref<any[]>([]);
const selectedYear = ref<number>(new Date().getFullYear());

const loadSummary = async () => {
  summaryLoading.value = true;
  summaryRows.value = [];

  try {
    // Try with year only first
    const params: any = { year: Number(selectedYear.value) };
    let res: any = await procurementService.getYearlySummary(params);

    // If no results, try with status=fulfilled
    if (!res?.data?.length && !res?.length) {
      params.status = 'fulfilled';
      res = await procurementService.getYearlySummary(params);
    }

    // Parse response shape
    const candidates: any[] = [
      res?.data,
      res?.rows,
      res?.data?.data,
      res?.data?.rows,
      res,
    ];

    const arr = candidates.find((c) => Array.isArray(c));
    const rawRows: any[] = Array.isArray(arr) ? arr : [];

    // Normalize keys for table columns
    summaryRows.value = rawRows.map((r: any) => ({
      category_code: r?.category_code ?? r?.categoryCode ?? r?.category,
      category: r?.category ?? r?.category_name ?? r?.categoryName,
      name: r?.name ?? r?.asset_name ?? r?.assetName,
      unit: r?.unit ?? r?.unit_name ?? r?.unitName,
      total_quantity: Number(r?.total_quantity ?? r?.totalQuantity ?? r?.quantity ?? 0),
      total_amount: Number(r?.total_amount ?? r?.totalAmount ?? r?.amount ?? 0),
    }));
  } finally {
    summaryLoading.value = false;
  }
};

const exporting = ref(false);
const exportSummaryExcel = async () => {
  exporting.value = true;
  try {
    const params: any = { year: Number(selectedYear.value) };
    const res: any = await procurementService.exportExcel(params);
    
    // axios interceptor might have returned the blob directly, or wrapped it in response.data
    // Handle both cases
    const blob = res instanceof Blob ? res : (res?.data instanceof Blob ? res.data : new Blob([res]));
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tong_Hop_Mua_Sam_${selectedYear.value || 'All'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    ElMessage.success('Xuất file thành công');
  } catch (error) {
    console.error('Lỗi khi xuất định dạng excel:', error);
    ElMessage.error('Có lỗi xảy ra khi xuất file Excel');
  } finally {
    exporting.value = false;
  }
};

const formVisible = ref(false);
const editId = ref<number | null>(null);
const openCreate = () => {
  editId.value = null;
  formVisible.value = true;
};

const detailVisible = ref(false);
const detailItem = ref<any | null>(null);

const openDetail = async (id: number) => {
  let found = rows.value.find((r: any) => r?.id === id) || null;
  if (!found) {
    try {
      const res: any = await procurementService.getById(id);
      found = res?.data || null;
    } catch {
      found = null;
    }
  }
  detailItem.value = found;
  detailVisible.value = true;
};

const handleSaved = () => {
  formVisible.value = false;
  load();
  loadSummary();
};

const openEdit = (id: number) => {
  editId.value = id;
  formVisible.value = true;
};

const confirmDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('Bạn chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác.', 'Xác nhận xóa', {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning',
    });

    await procurementService.delete(id);
    ElMessage.success('Đã xóa');

    // If we deleted the last item on the page, go back one page
    if (rows.value.length <= 1 && page.value > 1) page.value = page.value - 1;

    await load();
    await loadSummary();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể xóa');
    }
  }
};

const statusLabel = (s: string) => {
  if (s === 'draft') return 'Nháp';
  if (s === 'fulfilled') return 'Đã hoàn tất';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '—';
};

const statusTagType = (s: string) => {
  if (s === 'draft') return 'info';
  if (s === 'fulfilled') return 'success';
  if (s === 'cancelled') return 'danger';
  return 'info';
};

const formatDate = (v: string) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('vi-VN');
};

const formatMoney = (v: any) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN');
};

const route = useRoute();
const router = useRouter();

// React to programmatic navigation while already on this page (e.g. route changes
// from another tab). Does NOT fire on initial mount — onMounted handles that.
watch(
  () => route.query.openId,
  async (id) => {
    if (id) {
      openDetail(Number(id));
      await nextTick();
      router.replace({ query: { ...route.query, openId: undefined } });
    }
  }
);

onMounted(async () => {
  // Handle openId passed via query (e.g. Maintenance -> "Xem phiếu Tăng TS").
  // Use nextTick so router.replace() runs AFTER the navigation has completed,
  // preventing a concurrent replace from aborting the in-progress navigation.
  const openId = route.query.openId;
  if (openId) {
    await nextTick();
    openDetail(Number(String(openId)));
    router.replace({ query: { ...route.query, openId: undefined } });
  }
  load();
  loadSummary();
});
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.summary-card {
  margin-bottom: 12px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-title {
  font-weight: 600;
}

.summary-filters {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
