import { ref, computed, onMounted } from 'vue';
import { useAssetStore } from '@/stores/asset.store';
import { ElMessage } from 'element-plus';

const cachedAssets = ref<any[]>([]);
const lastFetchTime = ref<number>(0);
const isLoading = ref(false);
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache for assets

/**
 * Composable để quản lý assets với caching
 */
export function useAssets(options: {
  autoLoad?: boolean;
  filters?: any;
} = {}) {
  const { autoLoad = false, filters = {} } = options;
  const assetStore = useAssetStore();
  const error = ref<string | null>(null);

  const isCacheValid = computed(() => {
    const now = Date.now();
    return (now - lastFetchTime.value) < CACHE_DURATION && cachedAssets.value.length > 0;
  });

  const assets = computed(() => {
    if (cachedAssets.value.length > 0) {
      return cachedAssets.value;
    }
    return assetStore.assets;
  });

  const loadAssets = async (params?: any, force = false) => {
    if (!force && isCacheValid.value && !params) {
      return cachedAssets.value;
    }

    if (isLoading.value) return cachedAssets.value;

    isLoading.value = true;
    error.value = null;

    try {
      await assetStore.fetchAssets({ ...filters, ...params });
      if (!params) {
        cachedAssets.value = [...assetStore.assets];
        lastFetchTime.value = Date.now();
      }
      return assetStore.assets;
    } catch (err: any) {
      error.value = err.message || 'Failed to load assets';
      ElMessage.error('Không thể tải danh sách tài sản');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearCache = () => {
    cachedAssets.value = [];
    lastFetchTime.value = 0;
  };

  onMounted(async () => {
    if (autoLoad) {
      await loadAssets();
    }
  });

  return {
    assets,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    pagination: computed(() => assetStore.pagination),
    loadAssets,
    clearCache,
    createAsset: assetStore.createAsset,
    updateAsset: assetStore.updateAsset,
    deleteAsset: assetStore.deleteAsset,
  };
}
