<template>
  <div class="global-search">
    <el-popover
      v-model:visible="showDropdown"
      :width="420"
      placement="bottom-start"
      trigger="manual"
      popper-class="global-search-popover"
    >
      <template #reference>
        <div class="search-input-wrap">
          <el-input
            v-model="query"
            placeholder="Tìm mã tài sản, tên, người dùng, phiếu..."
            clearable
            class="search-input"
            :prefix-icon="Search"
            @input="onInput"
            @focus="onFocus"
            @clear="onClear"
          />
        </div>
      </template>
      <div class="search-results">
        <template v-if="!query.trim() || query.length < 2">
          <div class="search-hint">
            Nhập ít nhất 2 ký tự để tìm kiếm
          </div>
        </template>
        <template v-else-if="loading">
          <div class="search-hint">
            Đang tìm...
          </div>
        </template>
        <template v-else-if="hasResults">
          <div
            v-if="result.assets.length"
            class="result-group"
          >
            <div class="result-group-title">
              <el-icon><Box /></el-icon>
              Tài sản
            </div>
            <div
              v-for="item in result.assets"
              :key="`asset-${item.id}`"
              class="result-item"
              @click="goTo(item)"
            >
              <span class="result-title">{{ item.title }}</span>
              <span
                v-if="item.subtitle"
                class="result-subtitle"
              >{{ item.subtitle }}</span>
            </div>
          </div>
          <div
            v-if="result.users.length"
            class="result-group"
          >
            <div class="result-group-title">
              <el-icon><UserFilled /></el-icon>
              Người dùng
            </div>
            <div
              v-for="item in result.users"
              :key="`user-${item.id}`"
              class="result-item"
              @click="goTo(item)"
            >
              <span class="result-title">{{ item.title }}</span>
              <span
                v-if="item.subtitle"
                class="result-subtitle"
              >{{ item.subtitle }}</span>
            </div>
          </div>
          <div
            v-if="result.procurements.length"
            class="result-group"
          >
            <div class="result-group-title">
              <el-icon><Document /></el-icon>
              Phiếu mua sắm
            </div>
            <div
              v-for="item in result.procurements"
              :key="`proc-${item.id}`"
              class="result-item"
              @click="goTo(item)"
            >
              <span class="result-title">{{ item.title }}</span>
              <span
                v-if="item.subtitle"
                class="result-subtitle"
              >{{ item.subtitle }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="search-empty">
            Không tìm thấy kết quả
          </div>
        </template>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Box, UserFilled, Document } from '@element-plus/icons-vue';
import { globalSearch, type GlobalSearchResult, type GlobalSearchItem } from '@/services/search.service';

const router = useRouter();
const query = ref('');
const loading = ref(false);
const showDropdown = ref(false);
const result = ref<GlobalSearchResult>({ assets: [], users: [], procurements: [] });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const hasResults = computed(() => {
  const r = result.value;
  return r.assets.length > 0 || r.users.length > 0 || r.procurements.length > 0;
});

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  const q = query.value.trim();
  if (q.length < 2) {
    result.value = { assets: [], users: [], procurements: [] };
    showDropdown.value = true;
    return;
  }
  debounceTimer = setTimeout(async () => {
    loading.value = true;
    try {
      result.value = await globalSearch(q);
    } catch {
      result.value = { assets: [], users: [], procurements: [] };
    } finally {
      loading.value = false;
      showDropdown.value = true;
    }
  }, 300);
}

function onFocus() {
  const q = query.value.trim();
  const hasAny = result.value.assets.length + result.value.users.length + result.value.procurements.length > 0;
  if (q.length >= 1 || hasAny) showDropdown.value = true;
}

function onClear() {
  result.value = { assets: [], users: [], procurements: [] };
  showDropdown.value = false;
}

function goTo(item: GlobalSearchItem) {
  showDropdown.value = false;
  query.value = '';
  router.push(item.route);
}

watch(showDropdown, (v) => {
  if (!v) query.value = '';
});
</script>

<style scoped>
.global-search {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 280px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: #f1f5f9;
  box-shadow: none;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: 0 0 0 1px #e2e8f0;
}

.search-input-wrap {
  width: 100%;
}

.search-results {
  min-height: 80px;
  max-height: 400px;
  overflow-y: auto;
}

.search-hint,
.search-empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.result-group {
  margin-bottom: 12px;
}

.result-group:last-child {
  margin-bottom: 0;
}

.result-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-group-title .el-icon {
  font-size: 14px;
}

.result-item {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}

.result-item:hover {
  background: #f1f5f9;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.result-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
