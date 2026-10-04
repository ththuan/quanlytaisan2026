/**
 * k6 load-test — giả lập người dùng thật sử dụng hệ thống Quản lý Tài sản.
 *
 * Yêu cầu: k6 đã cài (https://k6.io/docs/get-started/installation/).
 *
 * Chạy cơ bản:
 *   k6 run load-test.js
 *
 * Tuỳ chỉnh qua biến môi trường (k6 -e):
 *   BASE_URL        - API gốc (mặc định http://localhost:5000)
 *   TEST_PASSWORD   - mật khẩu user test (mặc định Test@123)
 *   USER_PREFIX     - tiền tố username (mặc định test_)
 *   USER_COUNT      - số user test đã sinh (mặc định 200)
 *   RATE_LIMIT_MAX_REQUESTS - (backend) tăng lên khi test từ 1 IP, xem chú thích dưới
 *
 * ⚠️ QUAN TRỌNG — rate limiting khi test từ 1 máy:
 *   Bộ giới hạn là PER-IP. Thực tế 200 user = 200 IP khác nhau nên không vướng.
 *   Nhưng k6 chạy trên 1 máy → tất cả chung 1 IP → sẽ bị chặn (429) khi vượt
 *   500 req/phút. Để đo đúng hiệu năng, hãy tạm nâng giới hạn phía backend:
 *
 *     RATE_LIMIT_MAX_REQUESTS=1000000 AUTH_RATE_LIMIT_MAX_REQUESTS=1000000
 *
 *   (thêm vào docker-compose.prod.yml backend environment khi chạy test)
 */
import http from 'k6/http';
import { sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const PASSWORD = __ENV.TEST_PASSWORD || 'Test@123';
const USER_PREFIX = __ENV.USER_PREFIX || 'test_';
const USER_COUNT = parseInt(__ENV.USER_COUNT || '200', 10);

const loginTrend = new Trend('login_duration', true);
const assetListTrend = new Trend('asset_list_duration', true);
const assetDetailTrend = new Trend('asset_detail_duration', true);
const dashboardTrend = new Trend('dashboard_duration', true);
const searchTrend = new Trend('search_duration', true);
const errorRate = new Rate('error_rate');

function pad(n, len) {
  return String(n).padStart(len, '0');
}

function getUsername(vu) {
  const n = ((vu - 1) % USER_COUNT) + 1;
  return `${USER_PREFIX}${pad(n, 4)}`;
}

function login(vu) {
  const username = getUsername(vu);
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginTrend.add(res.timings.duration);
  if (res.status !== 200) {
    errorRate.add(1);
    return null;
  }
  try {
    const body = res.json();
    if (body && body.data && body.data.accessToken) {
      return body.data.accessToken;
    }
  } catch (e) {
    /* ignore */
  }
  errorRate.add(1);
  return null;
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// Token cache — biến module scope trong k6 là riêng biệt cho từng VU,
// nên mỗi VU đăng nhập đúng 1 lần rồi tái sử dụng token cho các lần sau.
let cachedToken = null;

// Kịch bản chính: người dùng đã đăng nhập, duyệt tài sản / dashboard / tìm kiếm.
export function browse() {
  if (!cachedToken) {
    cachedToken = login(__VU);
  }
  if (!cachedToken) return;

  group('browse', function () {
    // Danh sách tài sản (phân trang) — đọc nặng nhất
    const page = (__ITER % 50) + 1;
    let res = http.get(`${BASE_URL}/api/assets?page=${page}&limit=20`, authHeaders(cachedToken));
    assetListTrend.add(res.timings.duration);
    if (res.status === 401) {
      cachedToken = null; // token hết hạn → đăng nhập lại lần sau
      return;
    }
    if (res.status !== 200) errorRate.add(1);

    // Lấy id hợp lệ từ danh sách rồi xem chi tiết (đúng phạm vi phòng ban của user)
    let assetId = null;
    try {
      const body = res.json();
      if (body && body.data && body.data.length > 0) {
        assetId = body.data[0].id;
      }
    } catch (e) {
      /* ignore */
    }
    if (assetId) {
      res = http.get(`${BASE_URL}/api/assets/${assetId}`, authHeaders(cachedToken));
      assetDetailTrend.add(res.timings.duration);
      if (res.status !== 200) errorRate.add(1);
    }

    // Dashboard tổng quan
    res = http.get(`${BASE_URL}/api/dashboard/overview`, authHeaders(cachedToken));
    dashboardTrend.add(res.timings.duration);
    if (res.status !== 200) errorRate.add(1);

    // Tìm kiếm toàn cục
    res = http.get(`${BASE_URL}/api/search?q=test`, authHeaders(cachedToken));
    searchTrend.add(res.timings.duration);
    if (res.status !== 200) errorRate.add(1);
  });

  // Nhịp thao tác của người thật: vài giây giữa các lần tải
  sleep(2 + Math.random() * 3);
}

// Kịch bản phụ: dồn dập login để đo thông lượng bcrypt (CPU-heavy).
export function loginBurst() {
  const token = login(__VU);
  if (!token) return;
  sleep(0.5 + Math.random());
}

export const options = {
  scenarios: {
    // 200 người dùng đồng thời, mỗi người định kỳ duyệt dữ liệu
    browse: {
      executor: 'ramping-vus',
      exec: 'browse',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // tăng dần lên 50
        { duration: '2m', target: 200 },  // tăng tiếp lên 200
        { duration: '5m', target: 200 },  // giữ 200 trong 5 phút
        { duration: '1m', target: 0 },    // hạ dần về 0
      ],
    },
    // Login dồn dập 10 req/s trong 2 phút — stress bcrypt
    login_burst: {
      executor: 'constant-arrival-rate',
      exec: 'loginBurst',
      rate: 10,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% request dưới 2s
    error_rate: ['rate<0.05'],         // tỉ lệ lỗi dưới 5%
  },
};
