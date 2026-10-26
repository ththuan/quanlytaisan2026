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
  return `
    <div class="sig-cell">
      <div class="sig-label">${escapeHtml(label)}</div>
      ${img}
      <div class="sig-name">${name}</div>
      ${roleLine}
      ${meta}
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
  .sig-img { height: 60px; object-fit: contain; }
  .sig-space { height: 60px; }
  .sig-name { font-weight: bold; font-size: 13px; }
  .sig-role { font-size: 12px; color: #333; }
  .sig-meta { font-size: 11px; color: #555; }
  .toolbar { text-align: center; margin-bottom: 12px; }
  .toolbar button { padding: 6px 18px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .btn-print { background: #409eff; color: #fff; }
  .btn-close { background: #ccc; margin-left: 8px; }
  @media print { .toolbar { display: none !important; } @page { size: A4 portrait; margin: 12mm; } }
`;

/**
 * Mở cửa sổ in với tiêu đề + nội dung HTML. Trả về false nếu bị chặn popup.
 */
export function openPrintWindow(title: string, bodyHtml: string, extraStyles = ''): boolean {
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${BASE_STYLES}${extraStyles}</style></head><body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">In / Lưu PDF</button>
  <button class="btn-close" onclick="window.close()">Đóng</button>
</div>
<div class="doc">${bodyHtml}</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
