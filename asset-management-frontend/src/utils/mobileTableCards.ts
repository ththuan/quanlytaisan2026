/**
 * Chuyển bảng danh sách Element Plus sang dạng card trên mobile/tablet/PWA.
 * Gắn nhãn cột vào từng ô để CSS hiển thị "Nhãn: giá trị" giống ứng dụng.
 */

let observer: MutationObserver | null = null;
let resizeHandler: (() => void) | null = null;
let timer = 0;
let started = false;

const isOverlayViewport = () => window.matchMedia('(max-width: 1367px)').matches;

const clearMobileCards = () => {
  document.querySelectorAll('.responsive-table.mobile-card-table').forEach((wrapper) => {
    wrapper.classList.remove('mobile-card-table');
  });
};

const cellText = (cell: HTMLElement) => (cell.textContent || '').replace(/\s+/g, ' ').trim();
const cellHasVisual = (cell: HTMLElement) => Boolean(
  cell.querySelector('img, svg, .el-icon, .el-tag, .el-switch, .el-avatar, .el-rate, .el-progress, .el-button, button, a')
);
const isIndexLabel = (label: string) => /^(#|stt\.?|số tt|tt\.?|no\.?)$/i.test(label);
const isActionLabel = (label: string) => /(thao tác|chi tiết|hành động|action)/i.test(label);
const isStatusLabel = (label: string) => /(trạng thái|tiến độ|status)/i.test(label);
const isTitleLabel = (label: string) => {
  if (!label) return false;
  if (!/(tên|tiêu đề|nội dung|đợt kiểm kê|vật tư|máy móc|họ và tên|họ tên)/i.test(label)) return false;
  return !/(mã|loại|nhóm|đăng nhập|chức danh|người|trạng thái|tiến độ|ngày|thời gian)/i.test(label);
};
const isCodeLabel = (label: string) => /(mã|code)/i.test(label);
const isActionCell = (cell: HTMLElement, label: string) => {
  if (isStatusLabel(label)) return false;
  if (isActionLabel(label)) return true;
  return cellText(cell).length <= 24 && Boolean(cell.querySelector('.el-button, button, .el-dropdown, a.el-link'));
};

const applyMobileCards = () => {
  if (!isOverlayViewport()) {
    clearMobileCards();
    return;
  }

  document.querySelectorAll<HTMLElement>('.el-main .responsive-table').forEach((wrapper) => {
    const table = wrapper.querySelector<HTMLElement>('.el-table');
    if (!table) return;

    // Chỉ lấy header/body chính, bỏ qua bản sao của cột fixed (nếu có).
    const headerWrapper =
      table.querySelector<HTMLElement>(':scope > .el-table__inner-wrapper > .el-table__header-wrapper')
      || table.querySelector<HTMLElement>(':scope > .el-table__header-wrapper');
    const bodyWrapper =
      table.querySelector<HTMLElement>(':scope > .el-table__inner-wrapper > .el-table__body-wrapper')
      || table.querySelector<HTMLElement>(':scope > .el-table__body-wrapper');
    if (!headerWrapper || !bodyWrapper) return;

    const headerCells = Array.from(
      headerWrapper.querySelectorAll<HTMLElement>('thead th.el-table__cell')
    );
    const labels = headerCells.map((cell) => {
      const isSelection = cell.classList.contains('el-table-column--selection')
        || Boolean(cell.querySelector('.el-checkbox'));
      return isSelection ? '__selection' : (cell.textContent || '').trim();
    });

    const rows = bodyWrapper.querySelectorAll<HTMLElement>('tbody tr.el-table__row');
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll<HTMLElement>(':scope > td.el-table__cell'));
      row.removeAttribute('data-mobile-has-status');
      row.removeAttribute('data-mobile-has-selection');

      cells.forEach((cell, index) => {
        cell.setAttribute('data-label', labels[index] || '');
        cell.removeAttribute('data-mobile-index');
        cell.removeAttribute('data-mobile-empty');
        cell.removeAttribute('data-mobile-title');
        cell.removeAttribute('data-mobile-status');
        cell.removeAttribute('data-mobile-action');
        cell.removeAttribute('data-mobile-tag');
      });

      const selectionCell = cells.find(
        (cell) => (cell.getAttribute('data-label') || '') === '__selection'
      ) || null;

      const statusCell = cells.find((cell) => {
        const label = cell.getAttribute('data-label') || '';
        return label !== '__selection' && (isStatusLabel(label) || Boolean(cell.querySelector('.el-switch')));
      }) || null;

      const actionCell = cells.find((cell) => {
        const label = cell.getAttribute('data-label') || '';
        return label !== '__selection' && cell !== statusCell && isActionCell(cell, label);
      }) || null;

      const candidates: HTMLElement[] = [];

      cells.forEach((cell) => {
        const label = cell.getAttribute('data-label') || '';
        if (label === '__selection') return;
        if (isIndexLabel(label)) {
          cell.setAttribute('data-mobile-index', '');
          return;
        }
        if (cell === statusCell || cell === actionCell) return;
        const text = cellText(cell);
        const empty = !cellHasVisual(cell) && (!text || text === '-' || text === '--' || text === '—');
        if (empty) {
          cell.setAttribute('data-mobile-empty', '');
          return;
        }
        if (cell.querySelector('.el-tag')) cell.setAttribute('data-mobile-tag', '');
        candidates.push(cell);
      });

      let titleCell: HTMLElement | null = candidates.find(
        (cell) => isTitleLabel(cell.getAttribute('data-label') || '')
      ) || null;
      if (!titleCell) {
        titleCell = candidates.find(
          (cell) => isCodeLabel(cell.getAttribute('data-label') || '')
        ) || null;
      }
      if (!titleCell && candidates.length) {
        titleCell = candidates
          .slice(0, 4)
          .reduce((best, cell) => (cellText(cell).length > cellText(best).length ? cell : best));
      }

      if (titleCell) titleCell.setAttribute('data-mobile-title', '');
      if (statusCell) {
        statusCell.setAttribute('data-mobile-status', '');
        row.setAttribute('data-mobile-has-status', '');
      }
      if (selectionCell) {
        selectionCell.setAttribute('data-label', '__selection');
        row.setAttribute('data-mobile-has-selection', '');
      }
      if (actionCell) actionCell.setAttribute('data-mobile-action', '');
    });

    if (rows.length > 0) {
      wrapper.classList.add('mobile-card-table');
    } else {
      wrapper.classList.remove('mobile-card-table');
    }
  });
};

const scheduleApply = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(applyMobileCards, 120);
};

export const startMobileTableCards = (): void => {
  if (started) return;
  started = true;

  observer = new MutationObserver(scheduleApply);
  observer.observe(document.body, { childList: true, subtree: true });

  resizeHandler = scheduleApply;
  window.addEventListener('resize', resizeHandler);
  scheduleApply();
};

export const stopMobileTableCards = (): void => {
  if (!started) return;
  started = false;

  observer?.disconnect();
  observer = null;

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  window.clearTimeout(timer);
  clearMobileCards();
};
