<template>
  <div class="stock-page">
    <el-card>
      <template #header>
        <div class="stock-header">
          <div class="title">Lịch sử kho</div>
          <div class="actions">
            <el-select v-model="type" style="width: 140px" @change="fetchHistory">
              <el-option label="Tất cả" value="all" />
              <el-option label="Nhập kho" value="in" />
              <el-option label="Xuất kho" value="out" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="Từ ngày"
              end-placeholder="Đến ngày"
              style="width: 300px"
              @change="fetchHistory"
            />
            <el-input
              v-model="search"
              placeholder="Tìm theo mã/tên vật tư, vận đơn, vị trí..."
              clearable
              style="width: 320px"
              @keyup.enter="fetchHistory"
              @clear="fetchHistory"
            />
            <el-button :loading="loading" @click="fetchHistory">Tải</el-button>
          </div>
        </div>
      </template>

      <div class="responsive-table">
        <el-table :data="rows" v-loading="loading" border stripe>
        <el-table-column prop="date" label="Ngày" width="130" />
        <el-table-column label="Loại" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'warning'" effect="light">
              {{ row.type === 'in' ? 'Nhập' : 'Xuất' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã phiếu" width="150" />
        <el-table-column label="Vật tư" min-width="260">
          <template #default="{ row }">
            <div style="font-weight: 600;">{{ row.item?.code }} - {{ row.item?.name }}</div>
            <div style="color:#909399; font-size:12px;">ĐVT: {{ row.item?.unit || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="SL" width="90" align="right" />
        <el-table-column label="Đơn giá" width="150" align="right">
          <template #default="{ row }">{{ row.type === 'in' ? formatCurrency(row.unit_price) : '-' }}</template>
        </el-table-column>
        <el-table-column label="Thành tiền" width="160" align="right">
          <template #default="{ row }">{{ row.type === 'in' ? formatCurrency(row.amount) : '-' }}</template>
        </el-table-column>
        <el-table-column label="Chi tiết" min-width="320">
          <template #default="{ row }">
            <template v-if="row.type === 'in'">
              <div><strong>Vận đơn:</strong> {{ row.shopee_waybill || '-' }}</div>
              <div><strong>Nhà cung cấp:</strong> {{ row.supplier_name || '-' }}</div>
              <div><strong>Hóa đơn:</strong> {{ row.invoice_no || '-' }}</div>
            </template>
            <template v-else>
              <div><strong>Ở đâu:</strong> {{ row.location }}</div>
              <div><strong>Vào việc:</strong> {{ row.purpose }}</div>
            </template>
            <div v-if="row.notes"><strong>Ghi chú:</strong> {{ row.notes }}</div>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <div v-if="!rows.length && !loading" style="margin-top: 16px;">
        <el-empty description="Chưa có lịch sử nhập/xuất kho" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

const loading = ref(false);
const rows = ref<any[]>([]);
const type = ref<'all' | 'in' | 'out'>('all');
const search = ref('');
const dateRange = ref<[string, string] | null>(null);

const fetchHistory = async () => {
  loading.value = true;
  try {
    const params: any = {
      type: type.value,
      search: search.value || undefined,
      from_date: dateRange.value?.[0] || undefined,
      to_date: dateRange.value?.[1] || undefined,
    };
    const res: any = await api.get('/stock/history', { params });
    rows.value = res.data || [];
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'Không thể tải lịch sử kho');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchHistory);

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericValue);
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
