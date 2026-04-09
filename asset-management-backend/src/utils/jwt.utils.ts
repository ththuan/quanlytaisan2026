import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt';

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  department_id?: number;
  fullname?: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const { iat: _iat, exp: _exp, ...claims } = payload as any;
  return jwt.sign(claims, jwtConfig.secret, {
    expiresIn: jwtConfig.accessExpiration as any,
    issuer: jwtConfig.issuer,
    algorithm: jwtConfig.algorithm,
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const { iat: _iat, exp: _exp, ...claims } = payload as any;
  return jwt.sign(claims, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiration as any,
    issuer: jwtConfig.issuer,
    algorithm: jwtConfig.algorithm,
  });
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
