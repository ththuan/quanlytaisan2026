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
  return jwt.sign(payload, jwtConfig.secret);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, jwtConfig.secret);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;
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
