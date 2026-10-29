import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

interface JWTConfig {
  secret: string;
  accessExpiration: string;
  refreshExpiration: string;
  algorithm: 'HS256' | 'HS384' | 'HS512';
  issuer: string;
}

// Weak/default secrets that must be rejected (common placeholders + the old .env value)
const WEAK_SECRETS = new Set([
  'your_super_secret_jwt_key_change_this_in_production',
  'your-secret-key-change-in-production',
  'secret',
  'changeme',
  'default',
]);

function isPlaceholderSecret(value: string): boolean {
  return /change[_-]?me|your[_-]?secret|replace[_-]?me|placeholder|example/i.test(value);
}

function resolveSecret(): string {
  const fromEnv =
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    '';

  if (
    fromEnv &&
    !WEAK_SECRETS.has(fromEnv.toLowerCase()) &&
    !isPlaceholderSecret(fromEnv) &&
    fromEnv.length >= 32
  ) {
    return fromEnv;
  }

  // Production: never fall back to a weak/empty secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '⚠️  JWT_SECRET phải được đặt (≥32 ký tự) trong môi trường production. ' +
      'Chạy: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Development: generate a random secret per-process (no predictable secret)
  const randomSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[JWT] DEV mode: using random ephemeral JWT secret (tokens invalidate on restart)');
  return randomSecret;
}

const jwtConfig: JWTConfig = {
  secret: resolveSecret(),
  // Access token ngắn; refresh token được xoay vòng tự động bởi frontend.
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  algorithm: 'HS256',
  issuer: 'asset-management-system',
};

export default jwtConfig;
