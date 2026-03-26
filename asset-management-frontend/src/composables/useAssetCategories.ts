import { ref, computed, onMounted } from 'vue';
import { useAssetCategoryStore } from '@/stores/assetCategory.store';
import { ElMessage } from 'element-plus';
import type { AssetCategory } from '@/services/assetCategory.service';

const cachedCategories = ref<any[]>([]);
const lastFetchTime = ref<number>(0);
const isLoading = ref(false);
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - categories change rarely

/**
 * Composable để quản lý asset categories với caching lâu dài
 */
export function useAssetCategories(options: {
  autoLoad?: boolean;
} = {}) {
  const { autoLoad = true } = options;
  const categoryStore = useAssetCategoryStore();
  const error = ref<string | null>(null);

  const isCacheValid = computed(() => {
    const now = Date.now();
    return (now - lastFetchTime.value) < CACHE_DURATION && cachedCategories.value.length > 0;
  });

  const categories = computed(() => {
    if (cachedCategories.value.length > 0) {
      return cachedCategories.value;
    }
    return categoryStore.categories;
  });

  const activeCategories = computed(() =>
    categories.value.filter((c: AssetCategory) => c.is_active !== false)
  );

  const categoryOptions = computed(() =>
    activeCategories.value.map((c: AssetCategory) => ({
      label: c.name,
      value: c.id,
      code: c.code
    }))
  );

  const loadCategories = async (force = false) => {
    if (!force && isCacheValid.value) {
      return cachedCategories.value;
    }

    if (isLoading.value) return cachedCategories.value;

    isLoading.value = true;
    error.value = null;

    try {
      await categoryStore.fetchCategories({ limit: 1000 });
      cachedCategories.value = [...categoryStore.categories];
      lastFetchTime.value = Date.now();
      return cachedCategories.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to load categories';
      ElMessage.error('Không thể tải danh mục tài sản');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getCategoryById = (id: number) => {
    return categories.value.find((c: AssetCategory) => c.id === id);
  };

  const getCategoryName = (id: number) => {
    return getCategoryById(id)?.name || 'Unknown';
  };

  const clearCache = () => {
    cachedCategories.value = [];
    lastFetchTime.value = 0;
  };

  onMounted(async () => {
    if (autoLoad) {
      await loadCategories();
    }
  });

  return {
    categories,
    activeCategories,
    categoryOptions,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    loadCategories,
    getCategoryById,
    getCategoryName,
    clearCache,
    createCategory: categoryStore.createCategory,
    updateCategory: categoryStore.updateCategory,
    deleteCategory: categoryStore.deleteCategory,
  };
}

/**
 * Simple hook for category options
 */
export function useCategoryOptions() {
  const { categoryOptions, isLoading, loadCategories } = useAssetCategories();
  
  return {
    options: categoryOptions,
    loading: isLoading,
    refresh: loadCategories
  };
}
