/**
 * Load test 500 người dùng đồng thời cho hệ thống Quản lý tài sản.
 *
 * Cài k6: https://k6.io/docs/get-started/installation/
 *
 * Chạy trên server (khuyến nghị chạy từ máy khác trỏ vào domain/IP server):
 *   BASE_URL=https://quanlytaisanctec.dpdns.org \
 *   USERNAME=admin PASSWORD='mat-khau-admin' \
 *   k6 run scripts/k6-load-test.js
 *
 * Tuỳ chọn:
 *   VUS=500          số user đồng thời tối đa
 *   HOLD=5m          thời gian giữ tải tối đa
 *   INSECURE=true    bỏ qua kiểm tra TLS self-signed
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const USERNAME = __ENV.USERNAME || 'admin';
const PASSWORD = __ENV.PASSWORD || 'Admin@123';
const MAX_VUS = parseInt(__ENV.VUS || '500', 10);
const HOLD = __ENV.HOLD || '5m';

export const options = {
  scenarios: {
    users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: MAX_VUS },
        { duration: HOLD, target: MAX_VUS },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
  insecureSkipTLSVerify: String(__ENV.INSECURE || '').toLowerCase() === 'true',
};

// Mỗi VU có module riêng nên biến này được giữ qua các vòng lặp của cùng VU.
let vuToken = null;

function jsonHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export default function () {
  // Mỗi VU đăng nhập một lần rồi tái sử dụng token.
  if (!vuToken) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: USERNAME, password: PASSWORD }),
      jsonHeaders()
    );
    check(loginRes, { 'login 200': (r) => r.status === 200 });

    try {
      vuToken = loginRes.json('data.accessToken');
    } catch (_e) {
      vuToken = null;
    }

    if (!vuToken) {
      sleep(2);
      return;
    }
  }

  const auth = jsonHeaders(vuToken);
  const requests = [
    http.get(`${BASE_URL}/api/assets?page=1&limit=10`, auth),
    http.get(`${BASE_URL}/api/dashboard/overview`, auth),
    http.get(`${BASE_URL}/api/dashboard/asset-status`, auth),
    http.get(`${BASE_URL}/api/dashboard/categories`, auth),
    http.get(`${BASE_URL}/api/notifications/unread-count`, auth),
  ];

  for (const res of requests) {
    check(res, {
      'status < 500': (r) => r.status < 500,
      'not rate limited': (r) => r.status !== 429,
    });
  }

  sleep(1 + Math.random() * 2);
}
