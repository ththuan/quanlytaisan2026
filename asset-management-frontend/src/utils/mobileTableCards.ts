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

    // Bỏ qua bảng có checkbox chọn dòng, expand hoặc cột fixed để tránh phá thao tác.
    if (table.querySelector('th .el-checkbox, .el-table__expand-icon, .el-table__fixed, .el-table__fixed-right')) {
      wrapper.classList.remove('mobile-card-table');
      return;
    }

    const headerCells = Array.from(
      table.querySelectorAll<HTMLElement>('.el-table__header-wrapper thead th.el-table__cell')
    );
    const labels = headerCells.map((cell) => (cell.textContent || '').trim());

    const rows = table.querySelectorAll<HTMLElement>('.el-table__body-wrapper tbody tr.el-table__row');
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
