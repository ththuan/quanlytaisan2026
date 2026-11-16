import { test, expect, devices, type Page } from '@playwright/test';

test.use({ ...devices['Desktop Chrome'] });

const ADMIN_USER = {
  id: 1,
  username: 'admin',
  fullname: 'Quản trị viên',
  role: 'admin',
  department_id: 1,
  is_active: true,
};

const STAFF_USER = {
  id: 2,
  username: 'user-a',
  fullname: 'Nguyễn Văn A',
  role: 'staff',
  department_id: 1,
  is_active: true,
  permissions_customized: true,
};

function fakeAccessToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.e2e`;
}

async function mockAdmin(page: Page): Promise<void> {
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
  await page.route('**/api/users*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [STAFF_USER],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route('**/api/permissions/catalog', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          modules: [
            {
              module: 'maintenance',
              moduleLabel: 'Sửa chữa',
              permissions: [
                {
                  code: 'maintenance.view',
                  module: 'maintenance',
                  moduleLabel: 'Sửa chữa',
                  action: 'view',
                  label: 'Xem yêu cầu sửa chữa',
                  scopes: ['own', 'department', 'all'],
                },
              ],
            },
          ],
          definitions: [],
          presets: [
            {
              code: 'repair_manager',
              label: 'Quản lý sửa chữa',
              description: 'Quản lý sửa chữa trong đơn vị',
              permissions: [{ code: 'maintenance.view', scope: 'department' }],
            },
          ],
          scopes: [
            { value: 'own', label: 'Cá nhân' },
            { value: 'department', label: 'Đơn vị' },
            { value: 'all', label: 'Toàn trường' },
          ],
        },
      }),
    }),
  );
  await page.route('**/api/permissions/users/2', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user_id: 2,
          permissions_customized: true,
          permissions: [
            {
              code: 'maintenance.view',
              scope: 'department',
              module: 'maintenance',
              module_label: 'Sửa chữa',
              label: 'Xem yêu cầu sửa chữa',
              action: 'view',
            },
          ],
        },
      }),
    }),
  );
}

test('admin thấy được nhật ký hoạt động', async ({ page }) => {
  await mockAdmin(page);
  await page.route(/\/api\/dashboard\/audit-logs/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: 1,
              action: 'update',
              table_name: 'assets',
              record_id: 10,
              created_at: '2026-11-15T10:00:00.000Z',
              user: { id: 1, username: 'admin', fullname: 'Quản trị viên', role: 'admin' },
              record_name: 'Máy tính xách tay Dell',
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      }),
    }),
  );

  await page.goto('/audit-logs');
  await expect(page.locator('.el-table__row')).toHaveCount(1);
  await expect(page.getByText('Quản trị viên').first()).toBeVisible();
});

test('admin mở được ma trận phân quyền của user', async ({ page }) => {
  await mockAdmin(page);
  await page.goto('/users');

  const editButton = page.getByRole('button', { name: 'Sửa', exact: true }).first();
  await expect(editButton).toBeVisible();
  await editButton.click();

  const dialog = page.locator('.el-dialog').first();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Phân quyền chức năng')).toBeVisible();
  await expect(dialog.getByText('Tùy chỉnh quyền riêng')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Quản lý sửa chữa' })).toBeVisible();
  await dialog.getByText('Sửa chữa', { exact: true }).first().click();
  await expect(dialog.getByText('Xem yêu cầu sửa chữa')).toBeVisible();
});
