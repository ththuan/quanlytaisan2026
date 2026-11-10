#!/usr/bin/env node
/**
 * Load test luồng kiểm kê: N user đăng nhập đồng thời, tải tài sản và quét.
 *
 * CẢNH BÁO: script ghi dữ liệu kiểm kê thật. Chỉ chạy trên staging hoặc
 * ngoài giờ làm việc. Bắt buộc đặt ALLOW_LOAD_TEST=YES.
 *
 * Cách chạy (trong container backend hoặc máy có kết nối DB + API):
 *   ALLOW_LOAD_TEST=YES BASE_URL=http://127.0.0.1:5000 \
 *   LOAD_TEST_USERS=50 SCAN_PER_USER=280 \
 *   node scripts/load-test-inventory.js
 *
 * Biến môi trường:
 *   BASE_URL           - API backend (mặc định http://127.0.0.1:5000)
 *   LOAD_TEST_USERS    - số user đồng thời (mặc định 50)
 *   LOAD_TEST_PASSWORD - mật khẩu user test (mặc định Test@123)
 *   SCAN_PER_USER      - số tài sản mỗi user quét (mặc định 100)
 *   ASSET_PAGE_SIZE    - số tài sản tải mỗi request (mặc định 2000)
 *   ROUND_ID           - dùng đợt kiểm kê có sẵn; bỏ trống để tạo đợt LOAD TEST
 *   BULK_MODE          - 1 = gửi theo lô /details/bulk, 0 = quét từng tài sản
 *   BULK_SIZE          - số dòng mỗi lô khi BULK_MODE=1 (mặc định 100)
 *   CLEANUP            - 1 = xóa đợt kiểm kê do script tạo sau khi test
 */

'use strict';

const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (process.env.ALLOW_LOAD_TEST !== 'YES') {
  console.error('Từ chối chạy: đặt ALLOW_LOAD_TEST=YES để xác nhận đây là môi trường test.');
  process.exit(1);
}

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const TOTAL_USERS = Math.max(1, parseInt(process.env.LOAD_TEST_USERS || '50', 10));
const PASSWORD = process.env.LOAD_TEST_PASSWORD || 'Test@123';
const SCAN_PER_USER = Math.max(0, parseInt(process.env.SCAN_PER_USER || '100', 10));
const ASSET_PAGE_SIZE = Math.max(100, parseInt(process.env.ASSET_PAGE_SIZE || '2000', 10));
const BULK_MODE = String(process.env.BULK_MODE || '0') === '1';
const BULK_SIZE = Math.max(1, parseInt(process.env.BULK_SIZE || '100', 10));
const CLEANUP = String(process.env.CLEANUP || '0') === '1';
const USER_PREFIX = process.env.LOAD_TEST_USER_PREFIX || 'test_';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'asset_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const latencies = new Map();

function recordLatency(label, ms) {
  if (!latencies.has(label)) latencies.set(label, []);
  latencies.get(label).push(ms);
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function printStats() {
  console.log('\n--- Độ trễ (ms) ---');
  for (const [label, values] of latencies.entries()) {
    console.log(
      `${label.padEnd(22)} count=${String(values.length).padStart(5)}  `
      + `p50=${percentile(values, 50).toFixed(0).padStart(5)}  `
      + `p95=${percentile(values, 95).toFixed(0).padStart(5)}  `
      + `p99=${percentile(values, 99).toFixed(0).padStart(5)}  `
      + `max=${Math.max(...values).toFixed(0).padStart(5)}`
    );
  }
}

async function timed(label, fn) {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    recordLatency(label, Date.now() - start);
  }
}

async function api(token, method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, json };
}

async function login(username, password) {
  return timed('login', async () => {
    const result = await api(null, 'POST', '/api/auth/login', { username, password });
    if (!result.ok || !result.json?.success) {
      throw new Error(`Login ${username} thất bại: ${result.status} ${result.json?.message || ''}`);
    }
    return {
      token: result.json.data.accessToken,
      user: result.json.data.user,
    };
  });
}

async function getActiveRoundId() {
  const { rows } = await pool.query(
    `SELECT id FROM inventory_rounds
     WHERE status IN ('in_progress', 'awaiting_approval')
     ORDER BY id DESC LIMIT 1`
  );
  return rows[0]?.id || null;
}

async function prepareUsers(departments) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const users = [];

  // Chia user vào các đơn vị CÓ tài sản theo tỷ lệ số tài sản.
  // Đơn vị càng nhiều tài sản càng nhận nhiều user, đảm bảo tạo đủ tải quét.
  const groups = departments.map(() => []);
  const assigned = departments.map(() => 0);
  for (let i = 0; i < TOTAL_USERS; i += 1) {
    let bestIndex = 0;
    let bestScore = -1;
    for (let d = 0; d < departments.length; d += 1) {
      const score = Number(departments[d].asset_count || 0) / (assigned[d] + 1);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = d;
      }
    }
    groups[bestIndex].push(i);
    assigned[bestIndex] += 1;
  }

  for (let deptIndex = 0; deptIndex < departments.length; deptIndex += 1) {
    const department = departments[deptIndex];
    const slots = groups[deptIndex];
    for (let slot = 0; slot < slots.length; slot += 1) {
      const i = slots[slot];
      const n = i + 1;
      const username = `${USER_PREFIX}${String(n).padStart(4, '0')}`;
      const role = n % 20 === 0 ? 'department_head' : 'staff';

      await pool.query(
        `INSERT INTO users
          (username, password_hash, fullname, role, department_id, is_active,
           failed_login_attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, 0, NOW(), NOW())
         ON CONFLICT (username) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           department_id = EXCLUDED.department_id,
           is_active = true,
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()`,
        [username, hash, `Load Test ${String(n).padStart(2, '0')}`, role, department.id]
      );

      users.push({
        username,
        departmentId: Number(department.id),
        deptSlot: slot,
        deptUserCount: slots.length,
        index: i,
      });
    }
  }

  return users;
}

async function createLoadTestRound() {
  const activeRoundId = await getActiveRoundId();
  if (activeRoundId) {
    throw new Error(
      `Đang có đợt kiểm kê hoạt động (id=${activeRoundId}). `
      + 'Truyền ROUND_ID để test trên đợt đó, hoặc chạy khi không có đợt nào đang mở.'
    );
  }

  const { rows: adminRows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND is_active = true ORDER BY id LIMIT 1`
  );
  if (!adminRows[0]) throw new Error('Không tìm thấy tài khoản admin để gán created_by.');

  const { rows: deptRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM departments WHERE parent_department_id IS NULL`
  );

  const { rows } = await pool.query(
    `INSERT INTO inventory_rounds
      (round_name, round_year, description, start_date, end_date,
       total_departments, completed_reports, pending_reports, rejected_reports,
       status, created_by, created_at, updated_at)
     VALUES ($1, $2, 'LOAD TEST - tự động xóa sau khi test', CURRENT_DATE, CURRENT_DATE + 1,
             $3, 0, 0, 0, 'in_progress', $4, NOW(), NOW())
     RETURNING id`,
    [`LOAD TEST ${new Date().toISOString()}`, new Date().getFullYear(), deptRows[0]?.count || 0, adminRows[0].id]
  );

  return Number(rows[0].id);
}

async function ensureReport(token, roundId, departmentId) {
  return timed('reports', async () => {
    const existing = await api(
      token,
      'GET',
      `/api/inventory/reports?round_id=${roundId}&department_id=${departmentId}&limit=1`
    );
    const list = Array.isArray(existing.json?.data) ? existing.json.data : [];
    if (list.length > 0) return list[0];

    const created = await api(token, 'POST', '/api/inventory/reports', {
      round_id: roundId,
      department_id: departmentId,
    });
    if (!created.ok || !created.json?.success) {
      throw new Error(`Tạo báo cáo thất bại: ${created.status} ${created.json?.message || ''}`);
    }
    return created.json.data;
  });
}

async function loadAssets(token, roundId, reportId, departmentId) {
  const all = [];
  let page = 1;

  while (page <= 100) {
    const result = await timed('load_assets', () => api(
      token,
      'GET',
      `/api/inventory/assets?department_id=${departmentId}&round_id=${roundId}`
      + `&report_id=${reportId}&limit=${ASSET_PAGE_SIZE}&page=${page}&include_total=false`
    ));

    if (!result.ok) {
      throw new Error(`Tải tài sản thất bại: ${result.status} ${result.json?.message || ''}`);
    }

    const payload = result.json?.data;
    const rows = payload?.data?.data || payload?.data || [];
    all.push(...rows);
    if (rows.length < ASSET_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

function scanItemsForUser(assets, user) {
  if (SCAN_PER_USER === 0) return [];
  const selected = [];
  const slots = Math.max(1, Number(user.deptUserCount) || 1);
  const slot = Number(user.deptSlot) || 0;
  // Chia tài sản trong cùng đơn vị cho các user của đơn vị đó,
  // tránh mỗi user chỉ quét được 1-2 tài sản khi đơn vị đông user.
  for (let i = 0; i < assets.length && selected.length < SCAN_PER_USER; i += 1) {
    if (i % slots === slot) selected.push(assets[i]);
  }
  return selected;
}

async function saveDetail(token, reportId, assetId) {
  const result = await timed('scan_single', () => api(
    token,
    'POST',
    `/api/inventory/reports/${reportId}/details`,
    {
      asset_id: assetId,
      actual_quantity: 1,
      asset_condition: 'good',
      check_status: 'matched',
      scan_method: 'qr_scan',
    }
  ));
  return result;
}

async function saveBulk(token, reportId, assetIds) {
  const items = assetIds.map((assetId) => ({
    asset_id: assetId,
    actual_quantity: 1,
    asset_condition: 'good',
    check_status: 'matched',
    scan_method: 'qr_scan',
  }));
  return timed('scan_bulk', () => api(
    token,
    'POST',
    `/api/inventory/reports/${reportId}/details/bulk`,
    { items }
  ));
}

async function runUser(user, roundId) {
  const auth = await login(user.username, PASSWORD);
  const departmentId = Number(auth.user?.department_id || user.departmentId);
  const report = await ensureReport(auth.token, roundId, departmentId);
  const assets = await loadAssets(auth.token, roundId, report.id, departmentId);
  const selected = scanItemsForUser(assets, user);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  if (BULK_MODE) {
    for (let i = 0; i < selected.length; i += BULK_SIZE) {
      const chunk = selected.slice(i, i + BULK_SIZE);
      const result = await saveBulk(auth.token, report.id, chunk.map((asset) => asset.id));
      if (result.ok) {
        const details = result.json?.data || [];
        success += details.length;
        skipped += Math.max(0, chunk.length - details.length);
      } else {
        failed += chunk.length;
      }
    }
  } else {
    for (const asset of selected) {
      const result = await saveDetail(auth.token, report.id, asset.id);
      if (result.ok) success += 1;
      else if (result.status === 400 || result.status === 409) skipped += 1;
      else failed += 1;
    }
  }

  return {
    username: user.username,
    departmentId,
    reportId: report.id,
    assets: assets.length,
    attempted: selected.length,
    success,
    skipped,
    failed,
  };
}

async function cleanupRound(roundId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM inventory_report_details
       WHERE inventory_report_id IN (SELECT id FROM inventory_reports WHERE inventory_round_id = $1)`,
      [roundId]
    );
    await client.query('DELETE FROM inventory_reports WHERE inventory_round_id = $1', [roundId]);
    await client.query('DELETE FROM inventory_rounds WHERE id = $1', [roundId]);
    await client.query('COMMIT');
    console.log(`Đã xóa đợt kiểm kê test id=${roundId}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const startedAt = Date.now();
  const { rows: departments } = await pool.query(
    `SELECT a.current_department_id AS id, COUNT(*)::int AS asset_count
     FROM assets a
     WHERE a.current_department_id IS NOT NULL
       AND a.status IN ('active', 'inactive', 'damaged', 'pending_disposal', 'pending_repair')
     GROUP BY a.current_department_id
     ORDER BY COUNT(*) DESC, a.current_department_id ASC`
  );
  if (departments.length === 0) {
    throw new Error('Chưa có đơn vị nào có tài sản. Hãy nhập tài sản trước khi load test.');
  }
  const totalAssetsInScope = departments.reduce((sum, dept) => sum + Number(dept.asset_count), 0);

  const configuredRoundId = process.env.ROUND_ID ? parseInt(process.env.ROUND_ID, 10) : null;
  const roundId = configuredRoundId || await createLoadTestRound();
  const createdRound = !configuredRoundId;

  console.log(`API: ${BASE_URL}`);
  console.log(`Đợt kiểm kê: ${roundId}${createdRound ? ' (do script tạo)' : ''}`);
  console.log(`Users: ${TOTAL_USERS} | Quét/user: ${SCAN_PER_USER} | Bulk: ${BULK_MODE ? 'có' : 'không'}`);
  console.log(`Đơn vị có tài sản: ${departments.length} | Tổng tài sản: ${totalAssetsInScope}`);

  const users = await prepareUsers(departments);
  console.log(`Đã chuẩn bị ${users.length} user test (mật khẩu: ${PASSWORD}). Đang chạy đồng thời...`);

  const results = await Promise.all(users.map((user) => runUser(user, roundId)));

  const summary = results.reduce((acc, item) => {
    acc.assets += item.assets;
    acc.attempted += item.attempted;
    acc.success += item.success;
    acc.skipped += item.skipped;
    acc.failed += item.failed;
    return acc;
  }, { assets: 0, attempted: 0, success: 0, skipped: 0, failed: 0 });

  console.log('\n--- Tổng hợp ---');
  console.log(`Thời gian: ${((Date.now() - startedAt) / 1000).toFixed(2)}s`);
  console.log(`Tài sản đã tải: ${summary.assets}`);
  console.log(`Lượt quét: ${summary.attempted}`);
  console.log(`Thành công: ${summary.success} | Bỏ qua (đã có): ${summary.skipped} | Lỗi: ${summary.failed}`);
  printStats();

  const slowest = [...results].sort((a, b) => b.attempted - a.attempted).slice(0, 5);
  console.log('\n--- 5 user tải nhiều nhất ---');
  for (const item of slowest) {
    console.log(`${item.username} dept=${item.departmentId} assets=${item.assets} attempted=${item.attempted} ok=${item.success} skip=${item.skipped} fail=${item.failed}`);
  }

  if (createdRound && CLEANUP) {
    await cleanupRound(roundId);
  } else if (createdRound) {
    console.log(`\nGiữ lại đợt test id=${roundId}. Chạy lại với CLEANUP=1 hoặc xóa thủ công nếu cần.`);
  }
}

main()
  .catch((error) => {
    console.error('Load test thất bại:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
