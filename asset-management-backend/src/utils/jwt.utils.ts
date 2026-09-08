import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import jwtConfig from '../config/jwt';

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  department_id?: number;
  fullname?: string;
  sid: string;
  jti?: string;
  token_type: 'access' | 'refresh';
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const { iat: _iat, exp: _exp, jti: _jti, token_type: _type, ...claims } = payload as any;
  return jwt.sign({ ...claims, token_type: 'access' }, jwtConfig.secret, {
    expiresIn: jwtConfig.accessExpiration as any,
    issuer: jwtConfig.issuer,
    algorithm: jwtConfig.algorithm,
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const { iat: _iat, exp: _exp, jti: _jti, token_type: _type, ...claims } = payload as any;
  return jwt.sign({ ...claims, token_type: 'refresh' }, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiration as any,
    issuer: jwtConfig.issuer,
    algorithm: jwtConfig.algorithm,
    jwtid: crypto.randomUUID(),
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  const decoded = verifyToken(token);
  if (decoded.token_type !== 'access' || !decoded.sid) throw new Error('Invalid access token');
  return decoded;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  const decoded = verifyToken(token);
  if (decoded.token_type !== 'refresh' || !decoded.sid) throw new Error('Invalid refresh token');
  return decoded;
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
