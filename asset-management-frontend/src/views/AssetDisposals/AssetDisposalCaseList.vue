<template>
  <div class="page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Delete />
            </el-icon>
            {{ $t('menu.assetDisposals') }}
          </h1>
          <p class="page-subtitle">
            {{ $t('assetDisposals.subtitle') }}
          </p>
        </div>
        <div class="header-right">
          <el-button
            v-if="authStore.can('disposal.create', ['admin'])"
            type="danger"
            :icon="Delete"
            @click="destructionVisible = true"
          >
            {{ $t('assetDisposals.createCase') }}
          </el-button>
        </div>
      </div>
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

      <div class="responsive-table app-desktop-table">
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

      <div class="app-mobile-list disposal-mobile-list">
        <article
          v-for="row in rows"
          :key="row.id"
          class="app-mobile-card app-mobile-card--interactive"
          @click="openDetail(row.id)"
        >
          <div class="app-mobile-card__head">
            <div class="app-mobile-card__heading">
              <span class="app-mobile-card__title">{{ row.code }}</span>
              <span class="app-mobile-card__subtitle">{{ $t('assetDisposals.caseCode') }}</span>
            </div>
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
              class="app-mobile-card__status"
            >
              {{ statusLabel(row.status) }}
            </el-tag>
          </div>

          <div class="app-mobile-card__grid">
            <div class="app-mobile-card__field app-mobile-card__field--wide">
              <span class="app-mobile-card__field-label">{{ $t('common.createdAt') }}</span>
              <span class="app-mobile-card__field-value">{{ formatDateTime(row.created_at || row.createdAt) }}</span>
            </div>
          </div>

          <div
            class="app-mobile-card__actions"
            @click.stop
          >
            <el-button
              size="small"
              @click="openDetail(row.id)"
            >
              {{ $t('common.view') }}
            </el-button>
          </div>
        </article>

        <el-empty
          v-if="!loading && rows.length === 0"
          description="Chưa có hồ sơ thanh lý"
          :image-size="80"
        />
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

watch(
  () => route.query.create,
  (create) => {
    if (String(create || '') === '1') {
      destructionVisible.value = true;
      nextTick().then(() => router.replace({ query: { ...route.query, create: undefined } }));
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
  if (String(route.query.create || '') === '1') {
    destructionVisible.value = true;
    nextTick().then(() => router.replace({ query: { ...route.query, create: undefined } }));
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

@media (max-width: 1367px) {
  html.app-overlay .filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    align-items: stretch;
  }

  html.app-overlay .filters > .el-input,
  html.app-overlay .filters > .el-select,
  html.app-overlay .filters > .el-button {
    width: 100% !important;
    max-width: none !important;
  }

  html.app-overlay .filters > .el-button {
    grid-column: 1 / -1;
  }
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
