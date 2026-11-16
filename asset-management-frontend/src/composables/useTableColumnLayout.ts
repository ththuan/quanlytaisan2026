import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
} from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import tableLayoutService, { type TableLayoutData } from '@/services/tableLayout.service';

/**
 * Tăng số này khi thay đổi cấu trúc cột để mở khóa bố cục cũ
 * và cho phép quản trị viên kéo chỉnh lại.
 */
export const TABLE_LAYOUT_VERSION = 1;

const MIN_COLUMN_WIDTH = 40;
const LEGACY_STORAGE_PREFIX = 'qlts:table-layout:v1:';
const DISPLAY_STORAGE_PREFIX = 'qlts:table-display:v1:';
type TableDensity = 'comfortable' | 'compact';

type ColumnLike = {
  property?: string;
  label?: string;
  type?: string;
  width?: number | string;
  realWidth?: number;
  resizable?: boolean;
};

type SavedLayout = Record<string, number>;

const columnKey = (column: ColumnLike, index: number): string =>
  column.property || column.label || column.type || `column-${index}`;

const clampRatio = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function useTableColumnLayout(
  tableKey: string,
  tableRef: Ref<any>,
) {
  const authStore = useAuthStore();
  const isDesktop = ref(false);
  const isEditing = ref(false);
  const isLocked = ref(false);
  const isLoading = ref(true);
  const isSaving = ref(false);
  const savedLayout = ref<TableLayoutData | null>(null);
  const density = ref<TableDensity>('comfortable');
  const originalWidths = new Map<string, number>();
  let resizeObserver: ResizeObserver | null = null;
  let lastContainerWidth = 0;
  let applyTimer: ReturnType<typeof setTimeout> | null = null;

  const canManage = computed(() => authStore.isAdmin);

  const getColumns = (): ColumnLike[] =>
    tableRef.value?.store?.states?.columns?.value || [];

  const getTableElement = (): HTMLElement | null =>
    (tableRef.value?.$el as HTMLElement | undefined) || null;

  const getTableWidth = (): number =>
    getTableElement()?.clientWidth || 0;

  const setColumnsResizable = (resizable: boolean) => {
    getColumns().forEach((column) => {
      column.resizable = resizable;
    });
  };

  const loadDisplayPreferences = () => {
    try {
      const raw = localStorage.getItem(`${DISPLAY_STORAGE_PREFIX}${tableKey}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.density === 'compact' || parsed?.density === 'comfortable') {
        density.value = parsed.density;
      }
    } catch {
      // Dùng mặc định.
    }
  };

  const saveDisplayPreferences = () => {
    try {
      localStorage.setItem(
        `${DISPLAY_STORAGE_PREFIX}${tableKey}`,
        JSON.stringify({ density: density.value }),
      );
    } catch {
      // Không chặn UI nếu trình duyệt không cho lưu.
    }
  };

  const applyDisplayClasses = () => {
    const el = getTableElement();
    if (!el) return;
    el.classList.toggle('table-density-compact', density.value === 'compact');
  };

  const setDensity = (value: TableDensity) => {
    density.value = value;
    applyDisplayClasses();
    saveDisplayPreferences();
    requestAnimationFrame(() => tableRef.value?.doLayout?.());
  };

  const updateDesktopState = () => {
    const root = document.documentElement;
    isDesktop.value =
      window.innerWidth >= 1024 &&
      window.matchMedia('(pointer: fine)').matches &&
      !root.classList.contains('app-overlay');
  };

  const applySavedLayout = async (): Promise<void> => {
    await nextTick();
    if (!isDesktop.value || isEditing.value) return;

    if (!savedLayout.value) {
      isLocked.value = false;
      setColumnsResizable(false);
      return;
    }

    const width = getTableWidth();
    const columns = getColumns();
    if (!width || !columns.length) return;

    columns.forEach((column, index) => {
      const ratio = clampRatio(savedLayout.value?.columns?.[columnKey(column, index)] || 0);
      if (!ratio) return;
      const nextWidth = Math.max(
        MIN_COLUMN_WIDTH,
        Math.round(ratio * width),
      );
      column.width = nextWidth;
      column.realWidth = nextWidth;
      column.resizable = false;
    });

    isLocked.value = true;
    lastContainerWidth = width;
    tableRef.value?.doLayout?.();
  };

  const scheduleApply = () => {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = null;
      void applySavedLayout();
    }, 60);
  };

  const readLegacyLayout = (): SavedLayout | null => {
    try {
      const raw = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${tableKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;

      const columns: SavedLayout = {};
      Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
        const ratio = Number(value);
        if (key && Number.isFinite(ratio) && ratio > 0 && ratio <= 1) {
          columns[key] = ratio;
        }
      });
      return Object.keys(columns).length ? columns : null;
    } catch {
      return null;
    }
  };

  const loadLayout = async (): Promise<void> => {
    isLoading.value = true;
    try {
      const response: any = await tableLayoutService.get(tableKey);
      const data = response?.data;
      if (
        data?.columns &&
        Number(data.layout_version) === TABLE_LAYOUT_VERSION
      ) {
        savedLayout.value = data as TableLayoutData;
      } else {
        savedLayout.value = null;
      }

      // Chuyển bố cục cũ đang lưu trên trình duyệt của admin lên hệ thống
      // để không phải kéo lại, sau đó bỏ bản localStorage cũ.
      if (!savedLayout.value && canManage.value) {
        const legacyColumns = readLegacyLayout();
        if (legacyColumns) {
          try {
            const migrated: any = await tableLayoutService.save(tableKey, {
              columns: legacyColumns,
              layout_version: TABLE_LAYOUT_VERSION,
            });
            savedLayout.value = migrated?.data || {
              table_key: tableKey,
              columns: legacyColumns,
              layout_version: TABLE_LAYOUT_VERSION,
            };
            localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${tableKey}`);
            ElMessage.success('Đã chuyển bố cục cột cũ lên hệ thống');
          } catch {
            // Giữ localStorage để lần sau thử lại.
          }
        }
      }
    } catch {
      savedLayout.value = null;
    } finally {
      isLoading.value = false;
      applyDisplayClasses();
      await applySavedLayout();
    }
  };

  const startEditing = async (): Promise<void> => {
    if (!isDesktop.value || isLocked.value || !canManage.value) return;

    originalWidths.clear();
    getColumns().forEach((column, index) => {
      const width = Number(column.realWidth || column.width || 0);
      if (width > 0) originalWidths.set(columnKey(column, index), width);
    });

    isEditing.value = true;
    setColumnsResizable(true);
    await nextTick();
    tableRef.value?.doLayout?.();
  };

  const restoreOriginalWidths = () => {
    getColumns().forEach((column, index) => {
      const width = originalWidths.get(columnKey(column, index));
      if (width) {
        column.width = width;
        column.realWidth = width;
      }
      column.resizable = false;
    });
    tableRef.value?.doLayout?.();
  };

  const cancelEditing = async (): Promise<void> => {
    isEditing.value = false;
    restoreOriginalWidths();
    isLocked.value = Boolean(savedLayout.value);
    originalWidths.clear();
  };

  const saveAndLock = async (): Promise<void> => {
    if (!isDesktop.value || !isEditing.value || !canManage.value) return;

    const width = getTableWidth();
    const columns = getColumns();
    if (!width || !columns.length) return;

    const widths = columns.map((column, index) => ({
      key: columnKey(column, index),
      width: Number(column.realWidth || column.width || 0),
    }));
    const total = widths.reduce((sum, item) => sum + Math.max(0, item.width), 0);
    if (total <= 0) return;

    const saved: SavedLayout = {};
    widths.forEach((item) => {
      if (item.width > 0) saved[item.key] = item.width / total;
    });

    isSaving.value = true;
    try {
      const response: any = await tableLayoutService.save(tableKey, {
        columns: saved,
        layout_version: TABLE_LAYOUT_VERSION,
      });
      savedLayout.value = response?.data || {
        table_key: tableKey,
        columns: saved,
        layout_version: TABLE_LAYOUT_VERSION,
      };
      isEditing.value = false;
      isLocked.value = true;
      originalWidths.clear();
      await applySavedLayout();
      ElMessage.success('Đã lưu và khóa bố cục cột cho tất cả tài khoản');
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || 'Không lưu được bố cục cột');
    } finally {
      isSaving.value = false;
    }
  };

  const onHeaderDragend = (): void => {
    // Element Plus đã cập nhật column.width/realWidth.
    // Bố cục chỉ được lưu khi người dùng bấm "Lưu & khóa".
  };

  const onWindowResize = () => {
    updateDesktopState();
    if (!isDesktop.value) {
      setColumnsResizable(false);
      return;
    }
    if (!isEditing.value && savedLayout.value) {
      scheduleApply();
    }
  };

  onMounted(async () => {
    await nextTick();
    updateDesktopState();
    loadDisplayPreferences();
    applyDisplayClasses();
    setColumnsResizable(false);
    await loadLayout();
    window.addEventListener('resize', onWindowResize);

    const el = getTableElement();
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const width = Math.round(entries[0]?.contentRect?.width || 0);
        if (!width || width === lastContainerWidth) return;
        lastContainerWidth = width;
        if (!isEditing.value && savedLayout.value) scheduleApply();
      });
      resizeObserver.observe(el);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onWindowResize);
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (applyTimer) clearTimeout(applyTimer);
  });

  return {
    isDesktop,
    isEditing,
    isLocked,
    isLoading,
    isSaving,
    canManage,
    density,
    setDensity,
    startEditing,
    cancelEditing,
    saveAndLock,
    onHeaderDragend,
  };
}
