/**
 * k6 write-test — kiểm tra chức năng GHI + export (các module nghiệp vụ) dưới tải.
 * Dùng chung 1 tài khoản admin để thực hiện các thao tác yêu cầu quyền admin.
 *
 * Yêu cầu: đã nạp dữ liệu test (node scripts/load-test-data.js).
 *
 * Chạy:
 *   k6 run -e BASE_URL=http://localhost write-test.js
 *
 * Biến môi trường:
 *   BASE_URL        - API gốc (mặc định http://localhost:5000)
 *   ADMIN_USER      - tài khoản admin (mặc định admin)
 *   ADMIN_PASSWORD  - mật khẩu admin (mặc định Admin@123)
 *
 * Các module được test (mỗi module là 1 scenario riêng):
 *   - asset_crud        : tạo -> xem -> sửa -> tạo QR -> xóa tài sản
 *   - transfer_flow     : tạo đề nghị điều chuyển -> phê duyệt
 *   - procurement_create: tạo đề nghị mua sắm
 *   - stock_flow        : tạo vật tư -> nhập kho -> xuất kho
 *   - inventory_round   : tạo đợt kiểm kê
 *   - disposal_create   : tạo hồ sơ thanh lý
 *   - export            : xuất Excel (tài sản, mua sắm, TT120)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const ADMIN_USER = __ENV.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123';

const failRate = new Rate('write_fail_rate');

function headers(token) {
  return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
}

function ok(res, ctx) {
  const pass = res.status >= 200 && res.status < 300;
  if (!pass) {
    failRate.add(1);
    // in lỗi ra để dễ debug (k6 tự cắt bớt)
    console.log(`[FAIL ${ctx}] ${res.status} ${res.url} -> ${String(res.body).slice(0, 300)}`);
  }
  return pass;
}

function json(res) {
  try { return res.json(); } catch (e) { return null; }
}

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { 'admin login 200': (r) => r.status === 200 });
  const token = json(loginRes)?.data?.accessToken || null;

  // Lấy 2 phòng ban (dùng cho điều chuyển: from != to)
  let deptIds = [];
  let assetIds = [];
  if (token) {
    const d = http.get(`${BASE_URL}/api/departments?page=1&limit=10`, headers(token));
    const depts = json(d)?.data || json(d)?.departments || [];
    deptIds = (Array.isArray(depts) ? depts : []).map((x) => x.id).slice(0, 2);

    const a = http.get(`${BASE_URL}/api/assets?page=1&limit=50`, headers(token));
    const assets = json(a)?.data || [];
    assetIds = (Array.isArray(assets) ? assets : []).map((x) => x.id);
  }

  return { token, deptIds, assetIds };
}

// ───────────────────────── 1. Asset CRUD + QR ─────────────────────────
export function assetCrud(data) {
  const t = data.token;
  if (!t) return;
  const deptId = data.deptIds[0];
  const code = `K6-${__VU}-${__ITER}`;

  let res = http.post(
    `${BASE_URL}/api/assets`,
    JSON.stringify({
      asset_code: code,
      name: `Tài sản K6 ${code}`,
      quantity: 1,
      current_department_id: deptId,
      purchase_price: 5000000,
      unit: 'Cái',
    }),
    headers(t)
  );
  if (!ok(res, 'asset create')) return;
  const assetId = json(res)?.data?.id;

  if (assetId) {
    http.get(`${BASE_URL}/api/assets/${assetId}`, headers(t));

    res = http.put(
      `${BASE_URL}/api/assets/${assetId}`,
      JSON.stringify({ name: `Tài sản K6 ${code} (đã sửa)` }),
      headers(t)
    );
    ok(res, 'asset update');

    res = http.post(`${BASE_URL}/api/assets/${assetId}/qrcode/generate`, '{}', headers(t));
    ok(res, 'asset qr generate');

    res = http.del(`${BASE_URL}/api/assets/${assetId}`, null, headers(t));
    ok(res, 'asset delete');
  }
  sleep(1);
}

// ───────────────────── 2. Điều chuyển + phê duyệt ─────────────────────
export function transferFlow(data) {
  const t = data.token;
  if (!t || data.deptIds.length < 2 || data.assetIds.length === 0) return;
  const assetId = data.assetIds[__VU % data.assetIds.length];
  const toDept = data.deptIds[1];

  let res = http.post(
    `${BASE_URL}/api/transfers`,
    JSON.stringify({ asset_id: assetId, to_department_id: toDept, reason: 'Load test K6' }),
    headers(t)
  );
  if (!ok(res, 'transfer create')) return;
  const transferId = json(res)?.data?.id;

  if (transferId) {
    res = http.post(
      `${BASE_URL}/api/transfers/${transferId}/process-approval`,
      JSON.stringify({ decision: 'approved' }),
      headers(t)
    );
    ok(res, 'transfer approve');
  }
  sleep(1);
}

// ───────────────────── 3. Mua sắm (procurement) ─────────────────────
export function procurementCreate(data) {
  const t = data.token;
  if (!t) return;
  const deptId = data.deptIds[0];

  let res = http.post(
    `${BASE_URL}/api/procurements`,
    JSON.stringify({
      title: `Đề nghị mua sắm K6 ${__VU}-${__ITER}`,
      receiving_department_id: deptId,
      items: [{ name: `Thiết bị K6 ${__VU}-${__ITER}`, quantity: 2, unit: 'Cái' }],
    }),
    headers(t)
  );
  ok(res, 'procurement create');

  http.get(`${BASE_URL}/api/procurements?page=1&limit=10`, headers(t));
  sleep(1);
}

// ───────────────────── 4. Kho vật tư (stock) ─────────────────────
export function stockFlow(data) {
  const t = data.token;
  if (!t) return;
  const name = `Vật tư K6 ${__VU}-${__ITER}`;

  let res = http.post(
    `${BASE_URL}/api/stock/items`,
    JSON.stringify({ name, unit: 'Cái', category: 'Vật tư test', min_stock: 0 }),
    headers(t)
  );
  if (!ok(res, 'stock item create')) return;
  const itemId = json(res)?.data?.id;

  res = http.post(
    `${BASE_URL}/api/stock/receipts`,
    JSON.stringify({
      receipt_date: new Date().toISOString().slice(0, 10),
      lines: [{ item_name: name, quantity: 10, unit_price: 50000 }],
    }),
    headers(t)
  );
  ok(res, 'stock receipt');

  if (itemId) {
    res = http.post(
      `${BASE_URL}/api/stock/issues`,
      JSON.stringify({
        issue_date: new Date().toISOString().slice(0, 10),
        location: 'Phòng test',
        purpose: 'Cấp phát load test',
        lines: [{ item_id: itemId, quantity: 2 }],
      }),
      headers(t)
    );
    ok(res, 'stock issue');
  }
  sleep(1);
}

// ───────────────────── 5. Kiểm kê (inventory round) ─────────────────────
export function inventoryRound(data) {
  const t = data.token;
  if (!t) return;
  const year = new Date().getFullYear();

  const res = http.post(
    `${BASE_URL}/api/inventory/rounds`,
    JSON.stringify({
      round_name: `Đợt kiểm kê K6 ${__VU}-${__ITER}`,
      round_year: year,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    }),
    headers(t)
  );
  ok(res, 'inventory round create');

  http.get(`${BASE_URL}/api/inventory/rounds?page=1&limit=10`, headers(t));
  sleep(1);
}

// ───────────────────── 6. Thanh lý (disposal) ─────────────────────
export function disposalCreate(data) {
  const t = data.token;
  if (!t || data.assetIds.length === 0) return;
  const assetId = data.assetIds[(__VU + __ITER) % data.assetIds.length];

  const res = http.post(
    `${BASE_URL}/api/asset-disposals/manual`,
    JSON.stringify({ disposal_type: 'liquidation', asset_ids: [assetId] }),
    headers(t)
  );
  // 409 = tài sản đã có trong hồ sơ pending → coi như đã test chức năng, không tính lỗi
  if (res.status !== 409) ok(res, 'disposal create');
  sleep(1);
}

// ───────────────────── 7. Export Excel ─────────────────────
export function exportFiles(data) {
  const t = data.token;
  if (!t) return;

  http.get(`${BASE_URL}/api/assets/export`, headers(t));
  http.get(`${BASE_URL}/api/procurements/export/excel`, headers(t));
  http.get(`${BASE_URL}/api/export/tt120/04a`, headers(t));
  sleep(2);
}

export const options = {
  scenarios: {
    asset_crud: { executor: 'constant-vus', exec: 'assetCrud', vus: 15, duration: '3m' },
    transfer_flow: { executor: 'constant-vus', exec: 'transferFlow', vus: 10, duration: '2m' },
    procurement_create: { executor: 'constant-vus', exec: 'procurementCreate', vus: 10, duration: '2m' },
    stock_flow: { executor: 'constant-vus', exec: 'stockFlow', vus: 10, duration: '2m' },
    inventory_round: { executor: 'constant-vus', exec: 'inventoryRound', vus: 5, duration: '2m' },
    disposal_create: { executor: 'constant-vus', exec: 'disposalCreate', vus: 10, duration: '2m' },
    export_files: { executor: 'constant-vus', exec: 'exportFiles', vus: 5, duration: '2m' },
  },
  thresholds: {
    write_fail_rate: ['rate<0.10'], // <10% lỗi (điều chuyển/thanh lý có thể conflict khi chạy lại)
    http_req_duration: ['p(95)<3000'],
  },
};
