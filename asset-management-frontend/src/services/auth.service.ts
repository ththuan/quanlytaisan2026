import axios from 'axios';
import api from './api';
import type { User, ApiResponse } from '@/types/models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  fullname?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TotpPendingResponse {
  requires_2fa: true;
  temp_token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse | TotpPendingResponse>> {
    return api.post('/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/register', data);
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get('/auth/me');
  },

  /** Dùng refresh token trong cookie HttpOnly để lấy access token mới. */
  async refresh(): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 8000 },
    );
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    return api.post('/auth/logout');
  },

  // ── 2FA / Google Authenticator ────────────────────────────────────────────

  async validate2FA(temp_token: string, totp_code: string): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/2fa/validate-login', { temp_token, totp_code });
  },

  async setup2FA(): Promise<ApiResponse<{ qrCodeUrl: string; secret: string }>> {
    return api.post('/auth/2fa/setup');
  },

  async enable2FA(totp_code: string): Promise<ApiResponse<void>> {
    return api.post('/auth/2fa/enable', { totp_code });
  },

  async disable2FA(password: string): Promise<ApiResponse<void>> {
    return api.post('/auth/2fa/disable', { password });
  },
};
