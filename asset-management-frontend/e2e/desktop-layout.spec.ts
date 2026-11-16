import { test, expect, devices, type Page } from '@playwright/test';

test.use({ ...devices['Desktop Chrome'], browserName: 'chromium', viewport: { width: 1366, height: 900 } });

const ADMIN_USER = {
  id: 1,
  username: 'admin',
  fullname: 'Quản trị viên',
  role: 'admin',
  department_id: 1,
  is_active: true,
};

function token(): string {
  const enc = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ id: 1, role: 'admin', token_type: 'access', exp: Math.floor(Date.now() / 1000) + 3600 })}.e2e`;
}

const ASSET = {
  id: 1,
  asset_code: 'TS-001',
  category_code: '0504',
  name: 'Máy tính xách tay Dell Latitude 5440',
  category: 'Máy móc, thiết bị',
  status: 'active',
  purchase_price: 25000000,
  current_value: 12500000,
  residual_value: 12500000,
  quantity: 1,
  unit: 'Cái',
  year_in_use: 2023,
  campus: 'main',
  current_department: { id: 1, name: 'Phòng Kế toán' },
  assigned_user: { id: 2, fullname: 'Nguyễn Văn A', username: 'user-a', job_title: 'Kế toán' },
};

async function mock(page: Page): Promise<void> {
  await page.addInitScript(
    ({ accessToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    },
    { accessToken: token(), user: ADMIN_USER },
  );

  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: ADMIN_USER }) }),
  );
  await page.route('**/api/assets*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [ASSET, { ...ASSET, id: 2, asset_code: 'TS-002', name: 'Máy in HP LaserJet', purchase_price: 5000000, current_value: 3000000 }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/users*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { ...ADMIN_USER, department: { id: 1, name: 'Phòng Kế toán' } },
          { id: 2, username: 'user-a', fullname: 'Nguyễn Văn A', role: 'staff', department_id: 1, department: { id: 1, name: 'Phòng Kế toán' }, is_active: true, permissions_customized: false },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/transfers*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{
          id: 11,
          asset_id: 1,
          asset: ASSET,
          from_department: { id: 1, name: 'Phòng Kế toán' },
          to_department: { id: 2, name: 'Phòng Đào tạo' },
          requester: { id: 2, fullname: 'Nguyễn Văn A' },
          status: 'pending',
          transfer_date: '2026-11-10T08:00:00.000Z',
        }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/asset-disposals*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 21, code: 'HS-TL-001', status: 'pending', created_at: '2026-11-12T09:30:00.000Z' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/procurements*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 31, code: 'MS-001', title: 'Mua máy tính phục vụ giảng dạy', status: 'draft', purchase_date: '2026-11-08', receiving_department: { id: 1, name: 'Phòng Kế toán' } }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/procurements/summary/yearly*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ category_code: '0504', category: 'Máy móc, thiết bị', name: 'Máy tính xách tay', unit: 'Cái', total_quantity: 2, total_amount: 40000000 }] }),
    }),
  );
  await page.route('**/api/maintenance?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{
          id: 1,
          request_type: 'repair',
          status: 'in_progress',
          urgency: 'high',
          estimated_cost: 9000000,
          justification: 'Máy tính không lên nguồn',
          created_at: '2026-11-10T08:00:00.000Z',
          requested_by: 2,
          requester: { id: 2, fullname: 'Nguyễn Văn A' },
          department: { id: 1, name: 'Phòng Kế toán' },
          asset: ASSET,
          asset_id: ASSET.id,
        }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/stock/items*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ id: 41, code: 'VT-001', name: 'Bút bi xanh', unit: 'Cây', category: 'Văn phòng phẩm', min_stock: 10, on_hand: 25, is_low: false }] }),
    }),
  );
  await page.route('**/api/stock/history*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ id: 51, code: 'PN-001', type: 'in', date: '2026-11-15', quantity: 20, unit_price: 5000, amount: 100000, item: { code: 'VT-001', name: 'Bút bi xanh', unit: 'Cây' }, shopee_waybill: 'SP-123', supplier_name: 'Nhà sách ABC', invoice_no: 'HD-001' }] }),
    }),
  );
}

const pages: Array<[string, string]> = [
  ['/assets', 'assets'],
  ['/users', 'users'],
  ['/transfers', 'transfers'],
  ['/procurements', 'procurements'],
  ['/asset-disposals', 'disposals'],
  ['/stock', 'stock'],
  ['/stock/history', 'stock-history'],
  ['/departments', 'departments'],
  ['/reports', 'reports'],
  ['/loss-damage', 'loss-damage'],
  ['/maintenance', 'maintenance'],
  ['/inventory', 'inventory'],
  ['/asset-categories', 'asset-categories'],
  ['/norms', 'norms'],
  ['/audit-logs', 'audit-logs'],
  ['/system-admin', 'system-admin'],
];

for (const [path, name] of pages) {
  test(`desktop layout: ${name} không lệch cột/hàng`, async ({ page }) => {
    await mock(page);
    await page.goto(path);
    await page.waitForTimeout(500);

    const layout = await page.evaluate(() => ({
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      tables: Array.from(document.querySelectorAll('.responsive-table'))
        .map((el) => ({
          client: el.clientWidth,
          scroll: el.scrollWidth,
        }))
        .filter((table) => table.client > 0),
      misaligned: Array.from(document.querySelectorAll('.el-table')).flatMap((table) => {
        const heads = Array.from(table.querySelectorAll('.el-table__header th')).map((el) => el.getBoundingClientRect());
        const row = table.querySelector('.el-table__body tbody tr');
        const cells = row ? Array.from(row.querySelectorAll('td')).map((el) => el.getBoundingClientRect()) : [];
        return heads.map((head, index) => {
          const cell = cells[index];
          if (!cell) return null;
          const dx = Math.abs(head.left - cell.left);
          const dw = Math.abs(head.width - cell.width);
          return dx > 1.5 || dw > 1.5 ? { index, dx: Math.round(dx), dw: Math.round(dw) } : null;
        }).filter(Boolean);
      }),
      overlaps: Array.from(document.querySelectorAll('.el-table')).map((table) => {
        const heads = Array.from(table.querySelectorAll('.el-table__header th')).map((el) => {
          const rect = el.getBoundingClientRect();
          return { text: el.textContent?.trim(), left: Math.round(rect.left), right: Math.round(rect.right) };
        });
        return heads.map((head, index) => {
          const prev = heads[index - 1];
          if (!prev) return null;
          return head.left < prev.right - 1 ? { prev: prev.text, next: head.text, overlap: prev.right - head.left } : null;
        }).filter(Boolean);
      }).filter((list) => list.length > 0),
    }));

    expect(layout.pageOverflow, 'trang không được tràn ngang').toBeLessThanOrEqual(1);
    expect(layout.misaligned, 'header/body phải thẳng cột').toEqual([]);
    expect(layout.overlaps, 'các cột header không được đè nhau').toEqual([]);
    for (const table of layout.tables) {
      expect(table.scroll, 'bảng không được tràn ngang trong card').toBeLessThanOrEqual(table.client + 1);
    }
  });
}
