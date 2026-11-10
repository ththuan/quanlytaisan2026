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
      const cells = row.querySelectorAll<HTMLElement>('td.el-table__cell');
      cells.forEach((cell, index) => {
        cell.setAttribute('data-label', labels[index] || '');
      });
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
