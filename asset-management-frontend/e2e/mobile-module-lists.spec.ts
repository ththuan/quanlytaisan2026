import { test, expect, devices, type Page } from '@playwright/test';

test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

const ADMIN_USER = {
  id: 1,
  username: 'admin',
  fullname: 'Quản trị viên',
  role: 'admin',
  department_id: 1,
  is_active: true,
};

function fakeAccessToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.e2e`;
}

async function mockModuleData(page: Page): Promise<void> {
  const token = fakeAccessToken({
    id: ADMIN_USER.id,
    role: 'admin',
    token_type: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await page.addInitScript(
    ({ accessToken, storedUser }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(storedUser));
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    },
    { accessToken: token, storedUser: ADMIN_USER },
  );

  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ADMIN_USER }),
    }),
  );

  await page.route('**/api/transfers*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 11,
            asset_id: 101,
            asset: { id: 101, asset_code: 'TS-001', name: 'Máy tính xách tay Dell' },
            from_department: { id: 1, name: 'Phòng Kế toán' },
            to_department: { id: 2, name: 'Phòng Đào tạo' },
            requester: { id: 2, fullname: 'Nguyễn Văn A' },
            status: 'pending',
            transfer_date: '2026-11-10T08:00:00.000Z',
          },
        ],
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
        data: [
          {
            id: 21,
            code: 'HS-TL-001',
            status: 'pending',
            created_at: '2026-11-12T09:30:00.000Z',
          },
        ],
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
        data: [
          {
            id: 31,
            code: 'MS-001',
            title: 'Mua máy tính phục vụ giảng dạy',
            status: 'draft',
            purchase_date: '2026-11-08',
            receiving_department: { id: 1, name: 'Phòng Kế toán' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/procurements/summary/yearly*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            category_code: '0504',
            category: 'Máy móc, thiết bị',
            name: 'Máy tính xách tay',
            unit: 'Cái',
            total_quantity: 2,
            total_amount: 40000000,
          },
        ],
      }),
    }),
  );

  await page.route('**/api/stock/items*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 41,
            code: 'VT-001',
            name: 'Bút bi xanh',
            unit: 'Cây',
            category: 'Văn phòng phẩm',
            min_stock: 10,
            on_hand: 25,
            is_low: false,
          },
        ],
      }),
    }),
  );
  await page.route('**/api/stock/history*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 51,
            code: 'PN-001',
            type: 'in',
            date: '2026-11-15',
            quantity: 20,
            unit_price: 5000,
            amount: 100000,
            item: { code: 'VT-001', name: 'Bút bi xanh', unit: 'Cây' },
            shopee_waybill: 'SP-123',
            supplier_name: 'Nhà sách ABC',
            invoice_no: 'HD-001',
          },
        ],
      }),
    }),
  );
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test('mobile: thanh lý, tăng tài sản, kho vật tư, điều chuyển dùng card list', async ({ page }) => {
  await mockModuleData(page);

  await page.goto('/transfers');
  await expect(page.locator('.table-layout-toolbar')).toHaveCount(0);
  await expect(page.locator('.app-mobile-card').first()).toBeVisible();
  await expect(page.locator('.app-mobile-card').first()).toContainText('Máy tính xách tay Dell');
  await expect(page.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);

  await page.goto('/asset-disposals');
  await expect(page.locator('.app-mobile-card').first()).toBeVisible();
  await expect(page.locator('.app-mobile-card').first()).toContainText('HS-TL-001');
  await expect(page.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);

  await page.goto('/procurements');
  await expect(page.locator('.app-mobile-card').filter({ hasText: 'Máy tính xách tay' }).first()).toBeVisible();
  await expect(page.locator('.app-mobile-card').filter({ hasText: 'Mua máy tính' }).first()).toBeVisible();
  await expect(page.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);

  await page.goto('/stock');
  await expect(page.locator('.app-mobile-card').first()).toBeVisible();
  await expect(page.locator('.app-mobile-card').first()).toContainText('Bút bi xanh');
  await expect(page.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);

  await page.getByRole('button', { name: 'Nhập kho' }).click();
  const receiptDialog = page.locator('.el-dialog:visible').first();
  await expect(receiptDialog.locator('.stock-line-card').first()).toBeVisible();
  await expect(receiptDialog.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);
  await receiptDialog.getByRole('button', { name: 'Hủy' }).click();
  await expect(receiptDialog).toBeHidden();
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Xuất kho' }).click();
  const issueDialog = page.locator('.el-dialog:visible').first();
  await expect(issueDialog.locator('.stock-line-card').first()).toBeVisible();
  await expect(issueDialog.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);
  await issueDialog.getByRole('button', { name: 'Hủy' }).click();

  await page.goto('/stock/history');
  await expect(page.locator('.app-mobile-card').first()).toBeVisible();
  await expect(page.locator('.app-mobile-card').first()).toContainText('Bút bi xanh');
  await expect(page.locator('.app-desktop-table').first()).toBeHidden();
  await expectNoHorizontalScroll(page);
});

test.describe('tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });

  test('tablet: danh sách điều chuyển và kho dùng card, không cuộn ngang', async ({ page }) => {
    await mockModuleData(page);

    await page.goto('/transfers');
    await expect(page.locator('.app-mobile-card').first()).toBeVisible();
    await expect(page.locator('.app-desktop-table').first()).toBeHidden();
    await expectNoHorizontalScroll(page);

    await page.goto('/stock');
    await expect(page.locator('.app-mobile-card').first()).toBeVisible();
    await expect(page.locator('.app-desktop-table').first()).toBeHidden();
    await expectNoHorizontalScroll(page);
  });
});
