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

async function mockAuthenticated(page: Page): Promise<void> {
  const accessToken = fakeAccessToken({
    id: ADMIN_USER.id,
    role: 'admin',
    token_type: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await page.addInitScript(
    ({ token, storedUser }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(storedUser));
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    },
    { token: accessToken, storedUser: ADMIN_USER },
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
}

test('mobile: tabbar native, bottom sheet và drag-to-dismiss', async ({ page }) => {
  await mockAuthenticated(page);
  await page.goto('/assets');
  await expect(page.locator('.mobile-tabbar')).toBeVisible();

  const htmlClass = (await page.locator('html').getAttribute('class')) ?? '';
  expect(htmlClass).toContain('app-overlay');

  const assetsTab = page.locator('.mobile-tabbar__item', { hasText: 'Tài sản' });
  await expect(assetsTab).toHaveClass(/active/);
  await expect(assetsTab).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.mobile-back-btn')).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: /Thêm tài sản/ }).click();
  const dialog = page.locator('.el-dialog').first();
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(900);

  const viewport = page.viewportSize();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(Math.round(dialogBox?.width ?? 0)).toBe(viewport?.width);
  expect(Math.round((dialogBox?.y ?? 0) + (dialogBox?.height ?? 0))).toBe(viewport?.height);

  const sheetStyle = await dialog.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      radius: style.borderTopLeftRadius,
      handleWidth: getComputedStyle(el, '::before').width,
      headerPaddingTop: Number.parseFloat(
        getComputedStyle(el.querySelector('.el-dialog__header') as Element).paddingTop,
      ),
    };
  });
  expect(sheetStyle.radius).toBe('22px');
  expect(sheetStyle.handleWidth).toBe('36px');
  expect(sheetStyle.headerPaddingTop).toBeGreaterThanOrEqual(20);

  const buttonBoxes = await dialog.locator('.el-dialog__footer .el-button').evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  );
  expect(buttonBoxes.length).toBeGreaterThanOrEqual(2);
  for (const height of buttonBoxes) {
    expect(height).toBeGreaterThanOrEqual(44);
  }

  await page.evaluate(() => {
    const sheet = document.querySelector('.el-dialog') as HTMLElement | null;
    if (!sheet) return;
    const rect = sheet.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + 24;
    const fire = (type: string, y: number) => {
      const target: EventTarget =
        type === 'pointerdown' ? sheet.querySelector('.el-dialog__header') ?? sheet : document;
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX: startX,
          clientY: y,
        }),
      );
    };
    fire('pointerdown', startY);
    for (let offset = 20; offset <= 180; offset += 20) {
      fire('pointermove', startY + offset);
    }
    fire('pointerup', startY + 180);
  });
  await expect(dialog).toBeHidden({ timeout: 3000 });
});

test('tablet: tabbar nổi và form-sheet căn giữa', async ({ page }) => {
  await mockAuthenticated(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/assets');
  await expect(page.locator('.mobile-tabbar')).toBeVisible();
  await page.waitForTimeout(300);

  const tabbar = page.locator('.mobile-tabbar');
  const tabbarBox = await tabbar.boundingBox();
  expect(tabbarBox).not.toBeNull();
  expect(Math.round(tabbarBox?.width ?? 0)).toBeLessThanOrEqual(520);
  expect(await tabbar.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('999px');

  await page.getByRole('button', { name: /Thêm tài sản/ }).click();
  const dialog = page.locator('.el-dialog').first();
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(900);

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(Math.round(dialogBox?.width ?? 0)).toBeLessThanOrEqual(680);
  expect(Math.round(dialogBox?.x ?? 0)).toBe(
    Math.round((1024 - (dialogBox?.width ?? 0)) / 2),
  );
  expect(Math.round(dialogBox?.y ?? 0)).toBeGreaterThanOrEqual(72);
  expect(Math.round((dialogBox?.y ?? 0) + (dialogBox?.height ?? 0))).toBeLessThanOrEqual(768);
});
