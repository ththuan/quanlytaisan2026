#!/usr/bin/env node
/**
 * Sinh dữ liệu giả để load-test / kiểm tra hiệu năng.
 *
 * Tạo:
 *   - Users (mặc định 200) với mật khẩu chung (mặc định Test@123), role staff/department_head.
 *   - Assets (mặc định 50.000) phân bổ vào danh mục + phòng ban hiện có.
 *
 * Cách chạy:
 *   node scripts/load-test-data.js                    # sinh dữ liệu
 *   LOAD_TEST_USERS=200 LOAD_TEST_ASSETS=50000 node scripts/load-test-data.js
 *   node scripts/load-test-data.js --clean           # xoá dữ liệu test đã sinh
 *
 * Biến môi trường:
 *   LOAD_TEST_USERS    - số user (mặc định 200)
 *   LOAD_TEST_ASSETS   - số tài sản (mặc định 50000)
 *   LOAD_TEST_PASSWORD - mật khẩu chung (mặc định Test@123)
 *   DB_*               - kết nối PostgreSQL (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
 */
'use strict';

const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load .env từ thư mục backend và root project
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const USERNAME_PREFIX = 'test_';
const ASSET_CODE_PREFIX = 'TEST-';

const TOTAL_USERS = parseInt(process.env.LOAD_TEST_USERS || '200', 10);
const TOTAL_ASSETS = parseInt(process.env.LOAD_TEST_ASSETS || '50000', 10);
const PASSWORD = process.env.LOAD_TEST_PASSWORD || 'Test@123';
const CLEAN = process.argv.includes('--clean');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'asset_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const BATCH = 2000;

function pad(n, len) {
  return String(n).padStart(len, '0');
}

async function clean() {
  console.log('🧹 Xoá dữ liệu test cũ...');
  const delAssets = await pool.query(
    `DELETE FROM assets WHERE asset_code LIKE $1`,
    [`${ASSET_CODE_PREFIX}%`]
  );
  const delUsers = await pool.query(
    `DELETE FROM users WHERE username LIKE $1`,
    [`${USERNAME_PREFIX}%`]
  );
  console.log(`   ✅ Đã xoá ${delAssets.rowCount} tài sản, ${delUsers.rowCount} user.`);
}

async function loadDepartments() {
  const { rows } = await pool.query(
    `SELECT id, name FROM departments ORDER BY id`
  );
  return rows;
}

async function loadCategories() {
  const { rows } = await pool.query(
    `SELECT id, code, name, unit, is_depreciable, depreciation_rate, useful_life_years
     FROM asset_categories
     WHERE parent_code IS NOT NULL
     ORDER BY id`
  );
  return rows;
}

async function generateUsers(departments) {
  console.log(`👥 Tạo ${TOTAL_USERS} user (mật khẩu "${PASSWORD}")...`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  const rows = [];
  const userCount = TOTAL_USERS;

  for (let i = 0; i < userCount; i++) {
    const n = i + 1;
    const role = n % 20 === 0 ? 'department_head' : 'staff';
    const dept = departments[i % departments.length];
    rows.push({
      username: `${USERNAME_PREFIX}${pad(n, 4)}`,
      password_hash: passwordHash,
      fullname: `Người dùng test ${pad(n, 4)}`,
      role,
      department_id: dept ? dept.id : null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  }

  await bulkInsertUsers(rows);
  console.log(`   ✅ Đã tạo ${rows.length} user.`);
  return rows;
}

async function bulkInsertUsers(rows) {
  const cols = [
    'username', 'password_hash', 'fullname', 'role',
    'department_id', 'is_active', 'created_at', 'updated_at',
  ];
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let idx = 1;
    for (const r of batch) {
      values.push(`(${cols.map(() => `$${idx++}`).join(', ')})`);
      params.push(
        r.username, r.password_hash, r.fullname, r.role,
        r.department_id, r.is_active, r.created_at, r.updated_at,
      );
    }
    await pool.query(
      `INSERT INTO users (${cols.join(', ')}) VALUES ${values.join(', ')}`,
      params
    );
    process.stdout.write(`   ... ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log('');
  await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
}

async function generateAssets(departments, categories) {
  console.log(`🏢 Tạo ${TOTAL_ASSETS} tài sản...`);
  const now = new Date();
  const startYear = 2015;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < TOTAL_ASSETS; i += BATCH) {
    const batchSize = Math.min(BATCH, TOTAL_ASSETS - i);
    const values = [];
    const params = [];
    let idx = 1;
    const cols = [
      'asset_code', 'name', 'category_id', 'category_code', 'unit', 'quantity',
      'purchase_date', 'purchase_price', 'useful_life', 'is_depreciable',
      'depreciation_rate', 'condition', 'current_department_id', 'status',
      'location', 'created_at', 'updated_at',
    ];

    for (let j = 0; j < batchSize; j++) {
      const n = i + j + 1;
      const cat = categories[n % categories.length];
      const dept = departments[n % departments.length];
      const yearInUse = startYear + (n % (currentYear - startYear + 1));
      const price = 1000000 + (n * 137) % 50000000;

      values.push(`(${cols.map(() => `$${idx++}`).join(', ')})`);
      params.push(
        `${ASSET_CODE_PREFIX}${pad(n, 6)}`,
        `Tài sản test ${pad(n, 6)}`,
        cat.id,
        cat.code,
        cat.unit,
        1,
        new Date(`${yearInUse}-01-15`),
        price,
        cat.useful_life_years || 5,
        cat.is_depreciable,
        cat.depreciation_rate || null,
        n % 12 === 0 ? 'needs_repair' : 'good',
        dept.id,
        n % 200 === 0 ? 'inactive' : 'active',
        `Phòng ${dept.name} - Khu ${(n % 5) + 1}`,
        now,
        now,
      );
    }

    await pool.query(
      `INSERT INTO assets (${cols.join(', ')}) VALUES ${values.join(', ')}`,
      params
    );
    process.stdout.write(`   ... ${Math.min(i + batchSize, TOTAL_ASSETS)}/${TOTAL_ASSETS}\r`);
  }
  console.log('');
  await pool.query(`SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));`);
  console.log(`   ✅ Đã tạo ${TOTAL_ASSETS} tài sản.`);
}

async function main() {
  try {
    if (CLEAN) {
      await clean();
      return;
    }

    const departments = await loadDepartments();
    if (departments.length === 0) {
      console.error('❌ Chưa có phòng ban. Hãy chạy migrate + seed departments trước.');
      process.exit(1);
    }
    const categories = await loadCategories();
    if (categories.length === 0) {
      console.error('❌ Chưa có danh mục tài sản (asset_categories). Hãy chạy migrate trước.');
      process.exit(1);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('  SINH DỮ LIỆU LOAD-TEST');
    console.log(`${'='.repeat(60)}`);
    console.log(`  Phòng ban   : ${departments.length}`);
    console.log(`  Danh mục    : ${categories.length}`);
    console.log(`  Users       : ${TOTAL_USERS}`);
    console.log(`  Assets      : ${TOTAL_ASSETS}`);
    console.log(`  Mật khẩu    : ${PASSWORD}`);
    console.log(`${'='.repeat(60)}\n`);

    await generateUsers(departments);
    await generateAssets(departments, categories);

    console.log(`\n✅ HOÀN TẤT.`);
    console.log(`\n🔑 Tài khoản test:`);
    console.log(`   - admin (đăng nhập admin thật)`);
    console.log(`   - ${USERNAME_PREFIX}0001 ... ${USERNAME_PREFIX}${pad(TOTAL_USERS, 4)} / ${PASSWORD}`);
    console.log(`\n💡 Xoá dữ liệu test: node scripts/load-test-data.js --clean`);
  } catch (err) {
    console.error('❌ Lỗi:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
