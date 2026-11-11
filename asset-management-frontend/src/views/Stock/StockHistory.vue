<template>
  <div class="stock-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Clock />
            </el-icon>
            Lịch sử kho
          </h1>
          <p class="page-subtitle">
            Theo dõi các phiếu nhập xuất kho vật tư
          </p>
        </div>
      </div>
    </div>

    <el-card>
      <div class="list-filter">
        <div class="filter-row">
          <div class="filter-item">
            <el-select
              v-model="type"
              size="large"
              @change="fetchHistory"
            >
              <el-option
                label="Tất cả"
                value="all"
              />
              <el-option
                label="Nhập kho"
                value="in"
              />
              <el-option
                label="Xuất kho"
                value="out"
              />
            </el-select>
          </div>
          <div class="filter-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="Từ ngày"
              end-placeholder="Đến ngày"
              size="large"
              style="width: 100%"
              @change="fetchHistory"
            />
          </div>
          <div class="filter-item search-input">
            <el-input
              v-model="search"
              placeholder="Tìm theo mã/tên vật tư, vận đơn, vị trí..."
              clearable
              size="large"
              @keyup.enter="fetchHistory"
              @clear="fetchHistory"
            />
          </div>
          <div class="filter-actions">
            <el-button
              type="primary"
              :loading="loading"
              @click="fetchHistory"
            >
              Tải
            </el-button>
          </div>
        </div>
      </div>

      <div class="responsive-table">
        <el-table
          v-loading="loading"
          :data="rows"
          border
          stripe
          class="list-table"
        >
          <el-table-column
            prop="date"
            label="Ngày"
            width="120"
          />
          <el-table-column
            label="Phiếu"
            min-width="150"
          >
            <template #default="{ row }">
              <div class="stock-code-cell">
                <span class="code">{{ row.code }}</span>
                <el-tag
                  :type="row.type === 'in' ? 'success' : 'warning'"
                  size="small"
                  effect="light"
                >
                  {{ row.type === 'in' ? 'Nhập' : 'Xuất' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="Vật tư"
            min-width="220"
          >
            <template #default="{ row }">
              <div style="font-weight: 600;">
                {{ row.item?.code }} - {{ row.item?.name }}
              </div>
              <div style="color:#909399; font-size:12px;">
                ĐVT: {{ row.item?.unit || '-' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="SL"
            width="80"
            align="right"
          />
          <el-table-column
            label="Đơn giá"
            width="130"
            align="right"
          >
            <template #default="{ row }">
              {{ row.type === 'in' ? formatCurrency(row.unit_price) : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Thành tiền"
            width="140"
            align="right"
          >
            <template #default="{ row }">
              {{ row.type === 'in' ? formatCurrency(row.amount) : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Chi tiết"
            min-width="220"
          >
            <template #default="{ row }">
              <template v-if="row.type === 'in'">
                <div><strong>Vận đơn:</strong> {{ row.shopee_waybill || '-' }}</div>
                <div><strong>Nhà cung cấp:</strong> {{ row.supplier_name || '-' }}</div>
                <div><strong>Hóa đơn:</strong> {{ row.invoice_no || '-' }}</div>
              </template>
              <template v-else>
                <div v-if="row.department_name">
                  <strong>Đơn vị:</strong> {{ row.department_name }}
                </div>
                <div><strong>Ở đâu:</strong> {{ row.location }}</div>
                <div><strong>Vào việc:</strong> {{ row.purpose }}</div>
              </template>
              <div v-if="row.notes">
                <strong>Ghi chú:</strong> {{ row.notes }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div
        v-if="!rows.length && !loading"
        style="margin-top: 16px;"
      >
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
.stock-code-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.3;
}

.stock-code-cell .code {
  color: #0f172a;
  font-weight: 600;
}
</style>
