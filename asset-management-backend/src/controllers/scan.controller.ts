/**
 * Scan Controller - Phục vụ trang HTML khi quét mã QR
 * Không cần auth, không cần Vue SPA, hoạt động trên mọi trình duyệt điện thoại
 */
import { Request, Response } from 'express';
import { Asset, Department, AssetCategory, AssetDisposalItem, AssetDisposalCase } from '../models';
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CONDITION_LABELS } from '../constants/assetLabels';
import { QR_REQUIRE_SIGNATURE, isQrTokenValid } from '../utils/qrSigning';
import envConfig from '../config/env';

const DISPOSAL_TYPE_LABELS: Record<string, string> = {
  liquidation: 'Thanh lý',
  destruction: 'Tiêu hủy',
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
.asset-code{font-size:13px;color:#64748b;font-family:monospace;letter-spacing:.5px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.info-list{display:flex;flex-direction:column;gap:0}
.info-row{display:flex;border-bottom:1px solid #f1f5f9;padding:10px 0}
.info-row:last-child{border-bottom:none}
.info-label{flex:0 0 120px;font-size:12px;color:#64748b;padding-right:8px;padding-top:1px}
.info-value{flex:1;font-size:13px;color:#1e293b;font-weight:500;word-break:break-word}
.asset-img{width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;display:block}
.disposal-banner{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:13px;line-height:1.5}
.disposal-banner b{display:block;font-size:14px;margin-bottom:2px}
.copy-btn{border:1px solid #cbd5e1;background:#f8fafc;color:#475569;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer}
.copy-btn:active{transform:scale(.97)}
.open-app{display:inline-block;margin-top:14px;color:#2563eb;font-size:13px;font-weight:600;text-decoration:none}
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
<script src="/scan/assets/scan.js" defer></script>
</body>
</html>`;
}

const ASSET_ATTRIBUTES = [
  'id', 'asset_code', 'name', 'category', 'category_code',
  'status', 'condition', 'location', 'unit', 'quantity', 'year_in_use',
  'image_url', 'inventory_status', 'qr_code',
];

async function findAssetByCode(code: string) {
  const include = [
    { model: Department, as: 'current_department', attributes: ['id', 'name'] },
    { model: AssetCategory, as: 'assetCategory', attributes: ['id', 'name', 'code'] },
  ];
  let asset = await Asset.findOne({
    where: { asset_code: code.trim().toUpperCase() },
    attributes: ASSET_ATTRIBUTES,
    include,
  });
  if (!asset) {
    asset = await Asset.findOne({
      where: { asset_code: code.trim() },
      attributes: ASSET_ATTRIBUTES,
      include,
    });
  }
  return asset;
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

  // Xác thực token HMAC (nếu bật) để chống dò mã tài sản.
  // Token được đối chiếu với token ĐÃ LƯU trong QR của tài sản → QR vĩnh viễn,
  // không phụ thuộc secret/domain. Tem cũ (không token) vẫn được chấp nhận.
  try {
    const asset = await findAssetByCode(code);

    if (!asset) {
      res.status(404).send(renderPage('Không tìm thấy tài sản', `
        <div class="card error-card">
          <div class="error-icon">🔍</div>
          <div class="error-title">Không tìm thấy tài sản</div>
          <div class="error-msg">Không có tài sản với mã: <strong>${escapeHtml(code)}</strong></div>
        </div>`));
      return;
    }

    if (QR_REQUIRE_SIGNATURE && !isQrTokenValid((asset as any).qr_code, req.query.t as string | undefined)) {
      res.status(403).send(renderPage('Mã QR không hợp lệ', `
        <div class="card error-card">
          <div class="error-icon">🔒</div>
          <div class="error-title">Mã QR không hợp lệ</div>
          <div class="error-msg">Mã QR này không hợp lệ với tài sản. Vui lòng quét đúng tem QR của tài sản.</div>
        </div>`));
      return;
    }

    const d = asset.toJSON() as any;
    const statusLabel = ASSET_STATUS_LABELS[d.status] || d.status || '';
    const statusColor = ASSET_STATUS_COLORS[d.status] || '#64748b';
    const conditionLabel = ASSET_CONDITION_LABELS[d.condition] || d.condition || '';
    const categoryName = d.assetCategory?.name || d.category || '';
    const deptName = d.current_department?.name || '';

    // Thông tin thanh lý gần nhất (nếu tài sản đã/đang thanh lý)
    let disposalHtml = '';
    try {
      const disposalItem = await AssetDisposalItem.findOne({
        where: { asset_id: d.id },
        include: [{ model: AssetDisposalCase, as: 'disposal_case' }],
        order: [['created_at', 'DESC']],
      });
      const dc = (disposalItem?.toJSON() as any)?.disposal_case;
      if (dc) {
        const dType = DISPOSAL_TYPE_LABELS[dc.disposal_type] || 'Thanh lý';
        const dDate = dc.completed_date || dc.decision_date || dc.created_at;
        const parts: string[] = [];
        if (dc.code) parts.push(`Hồ sơ: ${escapeHtml(dc.code)}`);
        if (dc.decision_no) parts.push(`QĐ: ${escapeHtml(dc.decision_no)}`);
        if (dDate) parts.push(`Ngày: ${escapeHtml(new Date(dDate).toLocaleDateString('vi-VN'))}`);
        disposalHtml = `
          <div class="disposal-banner">
            <b>⛔ ${escapeHtml(dType)}${dc.status === 'completed' ? ' - đã hoàn thành' : ''}</b>
            ${parts.join(' • ')}
          </div>`;
      }
    } catch {
      // bỏ qua lỗi truy vấn thanh lý, không chặn trang
    }

    const rows: Array<[string, string]> = [];
    if (categoryName) rows.push(['Loại tài sản', escapeHtml(categoryName)]);
    if (deptName) rows.push(['Phòng ban', escapeHtml(deptName)]);
    if (d.location) rows.push(['Vị trí', escapeHtml(d.location)]);
    if (d.year_in_use) rows.push(['Năm sử dụng', escapeHtml(d.year_in_use)]);
    if (d.quantity) rows.push(['Số lượng', `${escapeHtml(d.quantity)}${d.unit ? ' ' + escapeHtml(d.unit) : ''}`]);

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

    const openAppUrl = `${envConfig.frontendUrl.replace(/\/$/, '')}/assets/${d.id}`;

    const body = `
      <div class="card">
        ${disposalHtml}
        ${imageHtml}
        <div class="asset-name">${escapeHtml(d.name)}</div>
        <div class="asset-code">
          ${escapeHtml(d.asset_code)}
          <button class="copy-btn" type="button" data-copy="${escapeHtml(d.asset_code)}">Sao chép mã</button>
        </div>
        <div class="badges">
          <span class="badge" style="background:${statusColor}20;color:${statusColor}">${escapeHtml(statusLabel)}</span>
          ${conditionBadge}
        </div>
        <a class="open-app" href="${escapeHtml(openAppUrl)}">Mở trong hệ thống →</a>
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

/**
 * GET /scan/assets/scan.js
 * Script nhỏ cho nút "Sao chép mã" (CSP cho phép script same-origin)
 */
export const scanClientScript = (_req: Request, res: Response): void => {
  res.type('application/javascript').send(`
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!el) return;
    var text = el.getAttribute('data-copy') || '';
    var done = function () {
      var old = el.textContent;
      el.textContent = 'Đã chép ✓';
      setTimeout(function () { el.textContent = old; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {});
    }
  });
})();
`);
};
