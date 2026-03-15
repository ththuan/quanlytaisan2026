import { ref, computed, onMounted } from 'vue';
import { useDepartmentStore } from '@/stores/department.store';
import { ElMessage } from 'element-plus';

// Shared state for all components - caching departments globally
const cachedDepartments = ref<any[]>([]);
const lastFetchTime = ref<number>(0);
const isLoading = ref(false);
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Composable thông minh để quản lý departments với caching tự động
 * - Tự động load departments khi component mount
 * - Cache departments trong 5 phút để tránh gọi API nhiều lần
 * - Chia sẻ state giữa các components
 * - Auto-refresh khi cache hết hạn
 */
export function useDepartments(options: {
  autoLoad?: boolean;
  forceRefresh?: boolean;
  includeTree?: boolean;
} = {}) {
  const {
    autoLoad = true,
    forceRefresh = false,
    includeTree = false
  } = options;

  const departmentStore = useDepartmentStore();
  const error = ref<string | null>(null);

  // Check if cache is still valid
  const isCacheValid = computed(() => {
    const now = Date.now();
    return (now - lastFetchTime.value) < CACHE_DURATION && cachedDepartments.value.length > 0;
  });

  // Get departments from cache or store
  const departments = computed(() => {
    if (cachedDepartments.value.length > 0) {
      return cachedDepartments.value;
    }
    return departmentStore.departments;
  });

  const departmentTree = computed(() => departmentStore.departmentTree);

  // Active departments - departments không có field status nên return tất cả
  const activeDepartments = computed(() => departments.value);

  // Format for select options
  const departmentOptions = computed(() => 
    departments.value.map(d => ({
      label: d.name,
      value: d.id
    }))
  );

  // Load departments with smart caching
  const loadDepartments = async (force = false) => {
    // Skip if cache is valid and not forcing refresh
    if (!force && isCacheValid.value && !forceRefresh) {
      return cachedDepartments.value;
    }

    if (isLoading.value) {
      return cachedDepartments.value; // Prevent concurrent requests
    }

    isLoading.value = true;
    error.value = null;

    try {
      await departmentStore.fetchDepartments({ limit: 1000 }); // Get all departments
      cachedDepartments.value = [...departmentStore.departments];
      lastFetchTime.value = Date.now();
      return cachedDepartments.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to load departments';
      ElMessage.error('Không thể tải danh sách phòng ban');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Load department tree
  const loadDepartmentTree = async () => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;

    try {
      await departmentStore.fetchDepartmentTree();
    } catch (err: any) {
      error.value = err.message || 'Failed to load department tree';
      ElMessage.error('Không thể tải cây phòng ban');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Refresh cache manually
  const refreshDepartments = async () => {
    return loadDepartments(true);
  };

  // Clear cache
  const clearCache = () => {
    cachedDepartments.value = [];
    lastFetchTime.value = 0;
  };

  // Get department by ID from cache
  const getDepartmentById = (id: number) => {
    return departments.value.find(d => d.id === id);
  };

  // Get department name by ID
  const getDepartmentName = (id: number) => {
    return getDepartmentById(id)?.name || 'Unknown';
  };

  // Auto-load on mount if enabled
  onMounted(async () => {
    if (autoLoad) {
      await loadDepartments();
      if (includeTree) {
        await loadDepartmentTree();
      }
    }
  });

  return {
    // State
    departments,
    departmentTree,
    activeDepartments,
    departmentOptions,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isCacheValid,

    // Actions
    loadDepartments,
    loadDepartmentTree,
    refreshDepartments,
    clearCache,
    getDepartmentById,
    getDepartmentName,

    // Store actions (for advanced usage)
    createDepartment: departmentStore.createDepartment,
    updateDepartment: departmentStore.updateDepartment,
    deleteDepartment: departmentStore.deleteDepartment,
  };
}

/**
 * Composable đơn giản chỉ để lấy danh sách departments
 * Tự động load và cache
 */
export function useSimpleDepartments() {
  const { departments, activeDepartments, isLoading, loadDepartments } = useDepartments({
    autoLoad: true,
    forceRefresh: false
  });

  return {
    departments,
    activeDepartments,
    isLoading,
    refresh: loadDepartments
  };
}

/**
 * Composable để lấy department options cho select dropdown
 */
export function useDepartmentOptions() {
  const { departmentOptions, isLoading, loadDepartments } = useDepartments({
    autoLoad: true,
    forceRefresh: false
  });

  return {
    options: departmentOptions,
    loading: isLoading,
    refresh: loadDepartments
  };
}
