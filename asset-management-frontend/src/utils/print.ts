/**
 * Tiện ích in biên bản (mở tab mới với HTML A4 và gọi window.print()).
 */

export interface SignatureLike {
  signer_name?: string;
  signer_role?: string | null;
  action?: string;
  signed_at?: string;
  signature_image?: string;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  director: 'Giám hiệu',
  department_head: 'Trưởng đơn vị',
  manager: 'Quản lý',
  staff: 'Viên chức',
  user: 'Viên chức',
};

/** Khối ô ký: hiển thị ảnh chữ ký số (nếu có) + họ tên + vai trò + thời điểm ký. */
export function signatureCell(label: string, sign: SignatureLike | undefined): string {
  const img = sign?.signature_image
    ? `<img class="sig-img" src="${sign.signature_image}" alt="chữ ký" />`
    : '<div class="sig-space"></div>';
  const name = sign?.signer_name ? escapeHtml(sign.signer_name) : '';
  const role = sign?.signer_role
    ? escapeHtml(ROLE_LABELS[sign.signer_role] || sign.signer_role)
    : '';
  const time = sign?.signed_at ? new Date(sign.signed_at).toLocaleString('vi-VN') : '';
  const roleLine = role ? `<div class="sig-role">${role}</div>` : '';
  const meta = sign
    ? `<div class="sig-meta">Ký số: ${escapeHtml(time)}</div>`
    : '';
  // Chữ ký số đã chứa sẵn họ tên/vai trò/thời gian theo chuẩn (Digitally signed by...),
  // nên chỉ hiển thị ảnh để tránh lặp thông tin trên bản in.
  const hasImage = !!sign?.signature_image;
  return `
    <div class="sig-cell">
      <div class="sig-label">${escapeHtml(label)}</div>
      ${img}
      ${hasImage ? '' : `<div class="sig-name">${name}</div>`}
      ${hasImage ? '' : roleLine}
      ${hasImage ? '' : meta}
    </div>`;
}

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; color: #111; margin: 0; padding: 20px; }
  .doc { max-width: 800px; margin: 0 auto; }
  .doc-header { text-align: center; margin-bottom: 8px; }
  .doc-header .org { font-size: 13px; text-transform: uppercase; }
  .doc-title { text-align: center; font-size: 20px; font-weight: bold; margin: 14px 0 4px; text-transform: uppercase; }
  .doc-sub { text-align: center; font-size: 13px; font-style: italic; margin-bottom: 16px; }
  .doc-meta { font-size: 14px; margin: 4px 0; }
  table.data { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  table.data th, table.data td { border: 1px solid #333; padding: 4px 6px; text-align: left; vertical-align: top; }
  table.data th { background: #f0f0f0; text-align: center; }
  table.data td.num { text-align: center; }
  .summary { margin-top: 12px; font-size: 13px; }
  .signatures { display: flex; justify-content: space-between; gap: 16px; margin-top: 36px; text-align: center; }
  .sig-cell { flex: 1; }
  .sig-label { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
  .sig-img { height: auto; max-height: 110px; max-width: 100%; object-fit: contain; }
  .sig-space { height: 70px; }
  .sig-name { font-weight: bold; font-size: 13px; }
  .sig-role { font-size: 12px; color: #333; }
  .sig-meta { font-size: 11px; color: #555; }
  .toolbar { text-align: center; margin-bottom: 12px; }
  .toolbar button { padding: 6px 18px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .btn-print { background: #409eff; color: #fff; }
  .btn-close { background: #ccc; margin-left: 8px; }
  @media print { .toolbar { display: none !important; } @page { size: A4 portrait; margin: 12mm; } }
`;

const isIOSDevice = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * In biên bản ngay trong trang hiện tại (không mở tab mới) để tránh bị trình
 * duyệt — đặc biệt là Safari trên iPad — chặn popup. Toàn bộ nội dung in được
 * đặt trong một lớp phủ riêng và chỉ lớp này hiển thị khi in.
 */
export function openPrintWindow(title: string, bodyHtml: string, extraStyles = ''): boolean {
  document.getElementById('app-print-root')?.remove();

  const root = document.createElement('div');
  root.id = 'app-print-root';
  root.setAttribute('data-print-title', title);
  root.innerHTML = `
    <style>
      ${BASE_STYLES}
      ${extraStyles}
      #app-print-root {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        overflow: auto;
        background: #fff;
      }
      #app-print-root .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #fff;
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
      }
      @media print {
        body > *:not(#app-print-root) { display: none !important; }
        #app-print-root { position: static !important; overflow: visible !important; }
        #app-print-root .toolbar { display: none !important; }
        @page { size: A4 portrait; margin: 12mm; }
      }
    </style>
    <div class="toolbar">
      <button class="btn-print" type="button">In / Lưu PDF</button>
      <button class="btn-close" type="button">Đóng</button>
    </div>
    <div class="doc">${bodyHtml}</div>`;

  document.body.appendChild(root);

  const close = () => {
    window.removeEventListener('afterprint', close);
    root.remove();
  };
  const doPrint = () => {
    try { window.print(); } catch { /* ignore */ }
  };

  root.querySelector('.btn-print')?.addEventListener('click', doPrint);
  root.querySelector('.btn-close')?.addEventListener('click', close);
  window.addEventListener('afterprint', close);

  // iOS yêu cầu window.print() phải nằm trong thao tác chạm của người dùng,
  // nên chỉ tự động in trên các trình duyệt khác; trên iPad người dùng bấm
  // nút "In / Lưu PDF" trong lớp phủ.
  if (!isIOSDevice()) {
    setTimeout(doPrint, 150);
  }

  return true;
}
