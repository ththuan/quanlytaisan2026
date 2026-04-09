import dotenv from 'dotenv';

dotenv.config();

interface JWTConfig {
  secret: string;
  accessExpiration: string;
  refreshExpiration: string;
  algorithm: 'HS256' | 'HS384' | 'HS512';
  issuer: string;
}

const jwtConfig: JWTConfig = {
  // Support multiple common env var names to avoid token mismatch across deployments
  secret:
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    'your_super_secret_jwt_key_change_this_in_production',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '31m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  algorithm: 'HS256',
  issuer: 'asset-management-system',
};

// Validate JWT secret in production
if (process.env.NODE_ENV === 'production' && jwtConfig.secret === 'your_super_secret_jwt_key_change_this_in_production') {
  throw new Error('⚠️  Please set a secure JWT_SECRET in production environment!');
}

export default jwtConfig;
