import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/**
 * Tăng số này khi thay đổi cấu trúc cột để mở khóa bố cục cũ
 * và cho phép người dùng kéo chỉnh lại.
 */
export const TABLE_LAYOUT_VERSION = 1;

const STORAGE_PREFIX = `qlts:table-layout:v${TABLE_LAYOUT_VERSION}:`;
const MIN_COLUMN_WIDTH = 40;

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
  const storageKey = `${STORAGE_PREFIX}${tableKey}`;
  const isDesktop = ref(false);
  const isEditing = ref(false);
  const isLocked = ref(false);
  const originalWidths = new Map<string, number>();
  let resizeObserver: ResizeObserver | null = null;
  let lastContainerWidth = 0;
  let applyTimer: ReturnType<typeof setTimeout> | null = null;

  const getColumns = (): ColumnLike[] =>
    tableRef.value?.store?.states?.columns?.value || [];

  const getTableElement = (): HTMLElement | null =>
    (tableRef.value?.$el as HTMLElement | undefined) || null;

  const getTableWidth = (): number =>
    getTableElement()?.clientWidth || 0;

  const readSavedLayout = (): SavedLayout | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed as SavedLayout;
    } catch {
      return null;
    }
  };

  const setColumnsResizable = (resizable: boolean) => {
    getColumns().forEach((column) => {
      column.resizable = resizable;
    });
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

    const saved = readSavedLayout();
    if (!saved) {
      isLocked.value = false;
      setColumnsResizable(false);
      return;
    }

    const width = getTableWidth();
    const columns = getColumns();
    if (!width || !columns.length) return;

    columns.forEach((column, index) => {
      const ratio = clampRatio(saved[columnKey(column, index)]);
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

  const startEditing = async (): Promise<void> => {
    if (!isDesktop.value || isLocked.value) return;

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
    isLocked.value = Boolean(readSavedLayout());
    originalWidths.clear();
  };

  const saveAndLock = async (): Promise<void> => {
    if (!isDesktop.value || !isEditing.value) return;

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

    localStorage.setItem(storageKey, JSON.stringify(saved));
    isEditing.value = false;
    isLocked.value = true;
    originalWidths.clear();
    await applySavedLayout();
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
    if (!isEditing.value && readSavedLayout()) {
      scheduleApply();
    }
  };

  onMounted(async () => {
    await nextTick();
    updateDesktopState();
    setColumnsResizable(false);
    await applySavedLayout();
    window.addEventListener('resize', onWindowResize);

    const el = getTableElement();
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const width = Math.round(entries[0]?.contentRect?.width || 0);
        if (!width || width === lastContainerWidth) return;
        lastContainerWidth = width;
        if (!isEditing.value && readSavedLayout()) scheduleApply();
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
    startEditing,
    cancelEditing,
    saveAndLock,
    onHeaderDragend,
  };
}
