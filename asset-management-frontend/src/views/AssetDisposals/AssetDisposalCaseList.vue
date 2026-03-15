<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Giảm tài sản</h2>
        <div class="sub">Danh sách hồ sơ thanh lý / tiêu hủy tài sản</div>
      </div>
      <el-button type="danger" :icon="Delete" @click="destructionVisible = true" v-if="authStore.isAdmin">
        Tạo hồ sơ tiêu hủy / thanh lý
      </el-button>
    </div>

    <el-card>
      <div class="filters">
        <el-input v-model="filters.search" placeholder="Tìm theo mã hồ sơ" clearable style="max-width: 280px" />
        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width: 180px">
          <el-option label="Chờ xử lý" value="pending" />
          <el-option label="Đã hoàn tất" value="completed" />
          <el-option label="Đã hủy" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="load">Tải</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="Mã hồ sơ" width="170" />
        <el-table-column label="Trạng thái" width="140">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="160">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.created_at || scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetail(scope.row.id)">Xem</el-button>
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

    <AssetDisposalCaseDetailDialog
      v-model="detailVisible"
      :case-id="selectedCaseId"
      @completed="load"
    />

    <AssetDestructionFormDialog
      v-model="destructionVisible"
      @created="load"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import assetDisposalService from '@/services/assetDisposal.service';
import AssetDisposalCaseDetailDialog from '@/components/AssetDisposals/AssetDisposalCaseDetailDialog.vue';
import AssetDestructionFormDialog from '@/components/AssetDisposals/AssetDestructionFormDialog.vue';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);

const filters = reactive<{ search: string; status: any }>({
  search: '',
  status: 'pending',
});

const params = computed(() => ({
  page: page.value,
  limit: limit.value,
  search: filters.search || undefined,
  status: filters.status || undefined,
}));

const load = async () => {
  loading.value = true;
  try {
    const res: any = await assetDisposalService.listCases(params.value);
    rows.value = res?.data?.data || res?.data?.rows || res?.data?.items || res?.data || [];
    total.value = res?.data?.total || res?.data?.count || 0;
  } finally {
    loading.value = false;
  }
};

const destructionVisible = ref(false);
const route = useRoute();
const router = useRouter();

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
const detailVisible = ref(false);
const selectedCaseId = ref<number | null>(null);
const openDetail = (id: number) => {
  selectedCaseId.value = id;
  detailVisible.value = true;
};

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

onMounted(async () => {
  load();
  const openId = route.query.openId;
  if (openId) {
    await nextTick();
    openDetail(Number(String(openId)));
    router.replace({ query: { ...route.query, openId: undefined } });
  }
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.sub {
  color: #909399;
  font-size: 13px;
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
