#!/usr/bin/env node
/**
 * Tạo JWT_SECRET và mật khẩu ngẫu nhiên cho production.
 * Chạy: node scripts/generate-secrets.js
 */
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const defaultPassword = crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').slice(0, 12) + 'A1!';
console.log('# Thêm vào .env khi triển khai production:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`DEFAULT_PASSWORD=${defaultPassword}`);
console.log('\n# Lưu ý: Sao chép các giá trị trên vào file .env và giữ bí mật.');
