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
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<meta name="robots" content="noindex, nofollow"/>
<meta name="color-scheme" content="light"/>
<meta name="theme-color" content="#0f2f57"/>
<meta name="description" content="Tra cứu thông tin tài sản qua mã QR - Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ"/>
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#eef4fb;color:#0f172a;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;-webkit-text-size-adjust:100%}
.header{background:linear-gradient(135deg,#0f2f57 0%,#1d5f9e 55%,#2f7fbf 100%);color:#fff;padding:20px 20px 24px;position:relative;overflow:hidden}
.header::after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-60px;top:-90px;background:rgba(255,255,255,.08)}
.header-inner{max-width:480px;margin:0 auto;display:flex;align-items:center;gap:12px;position:relative;z-index:1}
.header-logo{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.header-title{font-size:17px;font-weight:700;letter-spacing:.2px}
.header-sub{font-size:11.5px;opacity:.82;margin-top:3px;line-height:1.4}
.content{width:100%;max-width:480px;margin:0 auto;padding:16px;flex:1 0 auto}
.card{background:#fff;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(15,47,87,.08);border:1px solid rgba(15,23,42,.05);margin-bottom:14px}
.asset-name{font-size:21px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:5px}
.asset-code{font-size:13px;color:#64748b;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:700}
.badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
.asset-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin-bottom:14px;display:block;background:#f1f5f9}
.asset-img-placeholder{width:100%;aspect-ratio:16/9;border-radius:14px;margin-bottom:14px;background:linear-gradient(135deg,#e8f1fb,#dbeafe);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#7c9cbf;font-size:44px}
.asset-img-placeholder small{font-size:11.5px;font-weight:600;color:#94a3b8}
.info-list{display:flex;flex-direction:column;gap:8px}
.info-row{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;background:#f8fafc;border:1px solid #eef2f7;border-radius:12px}
.info-label{flex:0 0 116px;display:flex;align-items:center;gap:5px;font-size:12.5px;color:#64748b;font-weight:600}
.info-icon{font-size:14px;line-height:1}
.info-value{flex:1;font-size:13.5px;color:#0f172a;font-weight:600;word-break:break-word;line-height:1.45}
.disposal-banner{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13px;line-height:1.5}
.disposal-banner b{display:flex;align-items:center;gap:6px;font-size:14px;margin-bottom:3px}
.copy-btn{border:1px solid #cbd5e1;background:#f8fafc;color:#475569;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:transform .15s ease,background .15s ease}
.copy-btn:active{transform:scale(.96);background:#eef2f7}
.open-app{display:inline-flex;align-items:center;gap:6px;margin-top:16px;color:#1d5f9e;background:#eff6ff;border:1px solid #dbeafe;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;text-decoration:none}
.open-app:active{background:#dbeafe}
.error-card{text-align:center;padding:44px 22px}
.error-icon{font-size:50px;margin-bottom:14px}
.error-title{font-size:19px;font-weight:800;color:#ef4444;margin-bottom:7px}
.error-msg{font-size:13.5px;color:#64748b;line-height:1.6}
.footer{width:100%;flex-shrink:0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));display:flex;justify-content:center}
.footer-inner{width:100%;max-width:480px;text-align:center;font-size:11.5px;line-height:1.6;color:#94a3b8}
.footer-inner strong{color:#64748b;font-weight:700}
</style>
</head>
<body>
<div class="header">
  <div class="header-inner">
    <div class="header-logo">🏢</div>
    <div>
      <div class="header-title">Tra cứu tài sản</div>
      <div class="header-sub">Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ</div>
    </div>
  </div>
</div>
<div class="content">
${bodyContent}
</div>
<footer class="footer">
  <div class="footer-inner">Copyright &copy; 2026 <strong>Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ.</strong></div>
</footer>
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
    if (deptName) rows.push(['Đơn vị', escapeHtml(deptName)]);
    if (d.location) rows.push(['Vị trí', escapeHtml(d.location)]);
    if (d.year_in_use) rows.push(['Năm sử dụng', escapeHtml(d.year_in_use)]);
    if (d.quantity) rows.push(['Số lượng', `${escapeHtml(d.quantity)}${d.unit ? ' ' + escapeHtml(d.unit) : ''}`]);

    const rowIcons: Record<string, string> = {
      'Loại tài sản': '🗂️',
      'Đơn vị': '🏢',
      'Vị trí': '📍',
      'Năm sử dụng': '📅',
      'Số lượng': '🔢',
    };

    const infoRows = rows.map(([label, value]) => `
      <div class="info-row">
        <span class="info-label"><span class="info-icon">${rowIcons[label] || '•'}</span>${escapeHtml(label)}</span>
        <span class="info-value">${value}</span>
      </div>`).join('');

    const conditionBadge = conditionLabel
      ? `<span class="badge" style="background:#f0f9ff;color:#0369a1"><span class="badge-dot"></span>${escapeHtml(conditionLabel)}</span>`
      : '';

    const imageHtml = d.image_url
      ? `<img class="asset-img" src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.name)}" loading="lazy" />`
      : '<div class="asset-img-placeholder"><span>📦</span><small>Chưa có ảnh tài sản</small></div>';

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
          <span class="badge" style="background:${statusColor}20;color:${statusColor}"><span class="badge-dot"></span>${escapeHtml(statusLabel)}</span>
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
