<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>{{ $t('menu.assetDisposals') }}</h2>
        <div class="sub">
          {{ $t('assetDisposals.subtitle') }}
        </div>
      </div>
      <el-button
        v-if="authStore.isAdmin"
        type="danger"
        :icon="Delete"
        @click="destructionVisible = true"
      >
        {{ $t('assetDisposals.createCase') }}
      </el-button>
    </div>

    <el-card>
      <div class="filters">
        <el-input
          v-model="filters.search"
          :placeholder="$t('assetDisposals.searchPlaceholder')"
          clearable
          style="max-width: 280px"
          @keyup.enter="load"
          @clear="load"
        />
        <el-select
          v-model="filters.status"
          :placeholder="$t('common.status')"
          clearable
          style="width: 180px"
        >
          <el-option
            :label="$t('assetDisposals.status.pending')"
            value="pending"
          />
          <el-option
            :label="$t('assetDisposals.status.completed')"
            value="completed"
          />
          <el-option
            :label="$t('assetDisposals.status.cancelled')"
            value="cancelled"
          />
        </el-select>
        <el-button
          type="primary"
          @click="load"
        >
          {{ $t('common.search') }}
        </el-button>
      </div>

      <div class="responsive-table">
        <el-table
          v-loading="loading"
          :data="rows"
          class="disposal-table"
          style="width: 100%"
        >
          <el-table-column
            prop="code"
            :label="$t('assetDisposals.caseCode')"
            min-width="240"
          />
          <el-table-column
            :label="$t('common.status')"
            min-width="220"
          >
            <template #default="scope">
              <el-tag :type="statusTagType(scope.row.status)">
                {{ statusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.createdAt')"
            min-width="260"
          >
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.created_at || scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            min-width="180"
            align="center"
            header-align="center"
          >
            <template #default="scope">
              <el-button
                size="small"
                @click="openDetail(scope.row.id)"
              >
                {{ $t('common.view') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

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
  // Mở trang hiển thị toàn bộ hồ sơ, chỉ lọc khi người dùng chủ động chọn.
  status: '',
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
    const data = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.rows)
          ? res.rows
          : [];
    rows.value = data;
    total.value = Number(
      res?.pagination?.total
      ?? res?.data?.pagination?.total
      ?? res?.total
      ?? res?.count
      ?? data.length
    );
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

onMounted(() => {
  load();
  const openId = route.query.openId;
  if (openId) {
    nextTick().then(() => {
      openDetail(Number(String(openId)));
      router.replace({ query: { ...route.query, openId: undefined } });
    });
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

.responsive-table {
  width: 100%;
}

.disposal-table {
  width: 100% !important;
}

.disposal-table :deep(.el-table__header),
.disposal-table :deep(.el-table__body) {
  width: 100% !important;
}

.disposal-table :deep(th.el-table__cell) {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
}

.disposal-table :deep(th.el-table__cell),
.disposal-table :deep(td.el-table__cell) {
  padding-left: 12px;
  padding-right: 12px;
}

@media (min-width: 1366px) {
  .filters {
    gap: 16px;
    margin-bottom: 20px;
  }

  .disposal-table :deep(th.el-table__cell),
  .disposal-table :deep(td.el-table__cell) {
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .pager {
    margin-top: 20px;
  }
}
</style>
