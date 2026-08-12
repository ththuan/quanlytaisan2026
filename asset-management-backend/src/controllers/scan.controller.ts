/**
 * Scan Controller - Phục vụ trang HTML khi quét mã QR
 * Không cần auth, không cần Vue SPA, hoạt động trên mọi trình duyệt điện thoại
 */
import { Request, Response } from 'express';
import { Asset, Department, AssetCategory } from '../models';

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang sử dụng',
  inactive: 'Ngừng sử dụng',
  damaged: 'Hỏng',
  lost: 'Mất',
  disposed: 'Đã thanh lý',
  pending_disposal: 'Chờ thanh lý',
  pending_repair: 'Chờ sửa chữa',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#94a3b8',
  damaged: '#ef4444',
  lost: '#ef4444',
  disposed: '#6b7280',
  pending_disposal: '#f59e0b',
  pending_repair: '#f59e0b',
};

const CONDITION_LABELS: Record<string, string> = {
  good: 'Tốt',
  fair: 'Trung bình',
  poor: 'Kém',
  usable: 'Còn dùng được',
  needs_repair: 'Cần sửa chữa',
  damaged: 'Hỏng',
  disposed: 'Đã thanh lý',
};

/** Chống XSS: escape toàn bộ dữ liệu do người dùng / DB cung cấp trước khi đưa vào HTML */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}
.header{background:#1e3a5f;color:#fff;padding:14px 20px;display:flex;align-items:center;gap:10px}
.header-icon{font-size:22px}
.header-title{font-size:16px;font-weight:600}
.header-sub{font-size:11px;opacity:.75;margin-top:2px}
.content{max-width:480px;margin:0 auto;padding:16px}
.card{background:#fff;border-radius:14px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:12px}
.asset-name{font-size:20px;font-weight:700;color:#1e293b;line-height:1.3;margin-bottom:4px}
.asset-code{font-size:13px;color:#64748b;font-family:monospace;letter-spacing:.5px}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.info-list{display:flex;flex-direction:column;gap:0}
.info-row{display:flex;border-bottom:1px solid #f1f5f9;padding:10px 0}
.info-row:last-child{border-bottom:none}
.info-label{flex:0 0 120px;font-size:12px;color:#64748b;padding-right:8px;padding-top:1px}
.info-value{flex:1;font-size:13px;color:#1e293b;font-weight:500;word-break:break-word}
.asset-img{width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;display:block}
.error-card{text-align:center;padding:40px 20px}
.error-icon{font-size:48px;margin-bottom:12px}
.error-title{font-size:18px;font-weight:700;color:#ef4444;margin-bottom:6px}
.error-msg{font-size:13px;color:#64748b}
.footer{text-align:center;font-size:11px;color:#94a3b8;padding:16px}
</style>
</head>
<body>
<div class="header">
  <span class="header-icon">🏢</span>
  <div>
    <div class="header-title">Quản Lý Tài Sản</div>
    <div class="header-sub">Tra cứu thông tin qua mã QR</div>
  </div>
</div>
<div class="content">
${bodyContent}
</div>
<div class="footer">Thông tin tra cứu qua mã QR – chỉ hiển thị dữ liệu cơ bản</div>
</body>
</html>`;
}

/**
 * GET /scan/:code
 * Phục vụ trang HTML tra cứu tài sản - không cần đăng nhập
 */
export const scanAssetPage = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;

  if (!code || code.trim().length === 0) {
    res.status(400).send(renderPage('Lỗi', `
      <div class="card error-card">
        <div class="error-icon">❌</div>
        <div class="error-title">Mã QR không hợp lệ</div>
        <div class="error-msg">Vui lòng quét lại mã QR trên tài sản.</div>
      </div>`));
    return;
  }

  try {
    const searchCode = code.trim().toUpperCase();
    let asset = await Asset.findOne({
      where: { asset_code: searchCode },
      attributes: ['id', 'asset_code', 'name', 'description', 'category', 'category_code',
        'status', 'condition', 'location', 'unit', 'quantity', 'year_in_use',
        'serial_number', 'warranty_date', 'current_department_id', 'image_url'],
      include: [
        { model: Department, as: 'current_department', attributes: ['id', 'name'] },
        { model: AssetCategory, as: 'assetCategory', attributes: ['id', 'name', 'code'] },
      ],
    });

    // Thử không phân biệt hoa thường nếu không tìm thấy
    if (!asset) {
      asset = await Asset.findOne({
        where: { asset_code: code.trim() },
        attributes: ['id', 'asset_code', 'name', 'description', 'category', 'category_code',
          'status', 'condition', 'location', 'unit', 'quantity', 'year_in_use',
          'serial_number', 'warranty_date', 'current_department_id', 'image_url'],
        include: [
          { model: Department, as: 'current_department', attributes: ['id', 'name'] },
          { model: AssetCategory, as: 'assetCategory', attributes: ['id', 'name', 'code'] },
        ],
      });
    }

    if (!asset) {
      res.status(404).send(renderPage('Không tìm thấy tài sản', `
        <div class="card error-card">
          <div class="error-icon">🔍</div>
          <div class="error-title">Không tìm thấy tài sản</div>
          <div class="error-msg">Không có tài sản với mã: <strong>${escapeHtml(code)}</strong></div>
        </div>`));
      return;
    }

    const d = asset.toJSON() as any;
    const statusLabel = STATUS_LABELS[d.status] || d.status || '';
    const statusColor = STATUS_COLORS[d.status] || '#64748b';
    const conditionLabel = CONDITION_LABELS[d.condition] || d.condition || '';
    const categoryName = d.assetCategory?.name || d.category || '';
    const deptName = d.current_department?.name || '';

    const rows: Array<[string, string]> = [];
    if (categoryName) rows.push(['Loại tài sản', escapeHtml(categoryName)]);
    if (deptName) rows.push(['Phòng ban', escapeHtml(deptName)]);
    if (d.location) rows.push(['Vị trí', escapeHtml(d.location)]);
    if (d.year_in_use) rows.push(['Năm sử dụng', escapeHtml(d.year_in_use)]);
    if (d.quantity) rows.push(['Số lượng', `${escapeHtml(d.quantity)}${d.unit ? ' ' + escapeHtml(d.unit) : ''}`]);
    if (d.serial_number) rows.push(['Số sê-ri', escapeHtml(d.serial_number)]);
    if (d.warranty_date) rows.push(['Bảo hành đến', escapeHtml(new Date(d.warranty_date).toLocaleDateString('vi-VN'))]);
    if (d.description) rows.push(['Mô tả', escapeHtml(d.description)]);

    const infoRows = rows.map(([label, value]) => `
      <div class="info-row">
        <span class="info-label">${escapeHtml(label)}</span>
        <span class="info-value">${value}</span>
      </div>`).join('');

    const conditionBadge = conditionLabel
      ? `<span class="badge" style="background:#f0f9ff;color:#0369a1">${escapeHtml(conditionLabel)}</span>`
      : '';

    const imageHtml = d.image_url
      ? `<img class="asset-img" src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.name)}" loading="lazy" />`
      : '';

    const body = `
      <div class="card">
        ${imageHtml}
        <div class="asset-name">${escapeHtml(d.name)}</div>
        <div class="asset-code">${escapeHtml(d.asset_code)}</div>
        <div class="badges">
          <span class="badge" style="background:${statusColor}20;color:${statusColor}">${escapeHtml(statusLabel)}</span>
          ${conditionBadge}
        </div>
      </div>
      ${rows.length > 0 ? `<div class="card"><div class="info-list">${infoRows}</div></div>` : ''}`;

    res.status(200).send(renderPage(`${d.name} – ${d.asset_code}`, body));
  } catch (err: any) {
    console.error('Scan page error:', err);
    res.status(500).send(renderPage('Lỗi hệ thống', `
      <div class="card error-card">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Lỗi hệ thống</div>
        <div class="error-msg">Không thể tra cứu tài sản. Vui lòng thử lại sau.</div>
      </div>`));
  }
};
