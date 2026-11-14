/* eslint-env node, browser */
import { test, expect, type Page } from '@playwright/test';

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

async function mockAnonymousSession(page: Page): Promise<void> {
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthorized' }),
    }),
  );
}

async function mockAuthenticatedAs(page: Page, role: 'admin' | 'staff'): Promise<void> {
  const id = role === 'admin' ? ADMIN_USER.id : 2;
  const user = {
    ...ADMIN_USER,
    id,
    username: `${role}-e2e`,
    fullname: role === 'admin' ? 'Quản trị viên' : 'Nhân viên',
    role,
  };
  const accessToken = fakeAccessToken({
    id,
    role,
    token_type: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await page.addInitScript(
    ({ token, storedUser }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(storedUser));
    },
    { token: accessToken, storedUser: user },
  );

  // Catch-all để không gọi backend thật; các route cụ thể đăng ký sau sẽ ưu tiên hơn.
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
      body: JSON.stringify({ success: true, data: user }),
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await mockAnonymousSession(page);
});

test.describe('Xác thực', () => {
  test('chưa đăng nhập thì bị chuyển về trang login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#f-username')).toBeVisible();
    await expect(page.locator('#f-password')).toBeVisible();
  });

  test('trang login có nền particle và orb', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('#particle-canvas')).toBeVisible();
    await expect(page.locator('.login-orb')).toHaveCount(2);
  });

  test('form login bắt buộc nhập tên đăng nhập và mật khẩu', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-form')).toBeVisible();

    await page.locator('#login-form button[type="submit"]').click();
    await expect(page.locator('.login-error')).toContainText('Vui lòng nhập tên đăng nhập');

    await page.locator('#f-username').fill('admin');
    await page.locator('#login-form button[type="submit"]').click();
    await expect(page.locator('.login-error')).toContainText('Vui lòng nhập mật khẩu');
  });

  test('sai thông tin đăng nhập hiển thị thông báo lỗi', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' }),
      }),
    );

    await page.goto('/login');
    await page.locator('#f-username').fill(ADMIN_USER.username);
    await page.locator('#f-password').fill('wrong-password');
    await page.locator('#login-form button[type="submit"]').click();

    await expect(page.locator('.el-message')).toContainText('Tên đăng nhập hoặc mật khẩu không đúng');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Phân quyền theo vai trò', () => {
  test('staff bị chặn khỏi trang quản lý người dùng', async ({ page }) => {
    await mockAuthenticatedAs(page, 'staff');
    await page.goto('/users');

    await expect(page).toHaveURL(/\/$/);
  });

  test('admin vào được trang quản lý người dùng', async ({ page }) => {
    await mockAuthenticatedAs(page, 'admin');
    await page.goto('/users');

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('button', { name: 'Thêm người dùng' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tên đăng nhập' })).toBeVisible();
  });
});

test.describe('Trang tra cứu QR công khai', () => {
  test('hiển thị thông tin tài sản khi mã hợp lệ', async ({ page }) => {
    await page.route('**/api/public/asset/TS001*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            asset_code: 'TS001',
            name: 'Máy tính xách tay Dell Latitude',
            status: 'active',
            status_label: 'Đang sử dụng',
            condition: 'good',
            condition_label: 'Tốt',
            location: 'Phòng 101',
            current_department: { id: 1, name: 'Phòng Hành chính' },
          },
        }),
      }),
    );

    await page.goto('/scan/TS001');

    await expect(page.locator('.asset-name')).toContainText('Máy tính xách tay Dell Latitude');
    await expect(page.getByText('Phòng Hành chính')).toBeVisible();
    await expect(page.locator('.status-badge')).toContainText('Đang sử dụng');
  });

  test('hiển thị lỗi khi mã QR không tồn tại', async ({ page }) => {
    await page.route('**/api/public/asset/**', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Not found' }),
      }),
    );

    await page.goto('/scan/KHONG-TON-TAI');

    await expect(page.getByText('Không tìm thấy tài sản với mã QR này')).toBeVisible();
  });
});

test.describe('HTML shell & PWA', () => {
  test('index.html có meta noindex và viewport cho phép zoom', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();

    const html = await res.text();
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('name="color-scheme" content="light"');
    expect(html).not.toContain('user-scalable=no');
  });

  test('robots.txt chặn lập chỉ mục', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain('Disallow: /');
  });

  test('manifest.webmanifest có thông tin PWA hợp lệ', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBeTruthy();

    const manifest = await res.json();
    expect(manifest.name).toContain('Quản lý tài sản');
    expect(manifest.start_url).toBe('/');
    expect(manifest.lang).toBe('vi');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('404.html có nội dung tiếng Việt', async ({ request }) => {
    const res = await request.get('/404.html');
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain('Không tìm thấy trang');
  });
});
