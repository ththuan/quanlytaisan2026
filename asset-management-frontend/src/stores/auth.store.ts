import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import type { AuthResponse } from '@/services/auth.service';
import type { User } from '@/types/models';
import { ElMessage } from 'element-plus';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref(false);
  // Holds the temp token while waiting for the user to enter their TOTP code
  const totpPendingToken = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isDirector = computed(() => user.value?.role === 'director');
  const isDepartmentHead = computed(() => user.value?.role === 'department_head');
  const isStaff = computed(() => user.value?.role === 'staff');
  // For backward compatibility - department_head can manage their department
  const isManager = computed(() => isDepartmentHead.value || isAdmin.value);
  const userDepartmentId = computed(() => user.value?.department_id);

  async function login(username: string, password: string): Promise<true | '2fa_required' | false> {
    loading.value = true;
    try {
      const response = await authService.login({ username, password });

      if (response.success && response.data) {
        // 2FA pending — backend returned a temp token
        if ('requires_2fa' in response.data && response.data.requires_2fa) {
          totpPendingToken.value = response.data.temp_token;
          return '2fa_required';
        }

        const data = response.data as AuthResponse;
        _applyAuthResponse(data);
        ElMessage.success('Đăng nhập thành công');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);

      if (error?.response?.status === 429) {
        const errorMessage = error?.response?.data?.message || 'Quá nhiều lần thử đăng nhập. Vui lòng đợi một chút rồi thử lại.';
        ElMessage.error({ message: errorMessage, duration: 6000, showClose: true });
      } else if (error?.response?.status === 401) {
        ElMessage.error('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (error?.response?.status >= 500) {
        ElMessage.error('Lỗi server. Vui lòng thử lại sau.');
      } else if (error?.message) {
        ElMessage.error(error.message);
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Complete the 2FA login step. Returns true on success, false on failure. */
  async function verify2FA(totpCode: string): Promise<boolean> {
    if (!totpPendingToken.value) return false;
    loading.value = true;
    try {
      const response = await authService.validate2FA(totpPendingToken.value, totpCode);
      if (response.success && response.data) {
        totpPendingToken.value = null;
        _applyAuthResponse(response.data as AuthResponse);
        ElMessage.success('Đăng nhập thành công');
        return true;
      }
      return false;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        ElMessage.error('Mã xác thực không đúng hoặc đã hết hạn');
      } else {
        ElMessage.error(error?.response?.data?.message || 'Xác thực thất bại');
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');

      ElMessage.success('Logged out successfully');
    }
  }

  async function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      accessToken.value = token;
      refreshToken.value = localStorage.getItem('refreshToken');
      user.value = JSON.parse(storedUser);

      // Optionally verify token with backend
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          user.value = response.data;
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error: any) {
        // Only clear auth on explicit 401 (expired/invalid token).
        // Do NOT logout on network errors — the user's cached session is still valid.
        if (error?.response?.status === 401) {
          logout();
        }
      }
    }
  }

  // Clears auth state synchronously WITHOUT calling the backend logout API.
  // Called by the API interceptor on 401 to keep Pinia in sync with localStorage.
  function clearAuth() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  }

  function _applyAuthResponse(data: AuthResponse) {
    user.value = data.user;
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Reset idle timer khi đăng nhập
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    totpPendingToken,
    isAuthenticated,
    isAdmin,
    isDirector,
    isDepartmentHead,
    isManager,
    isStaff,
    userDepartmentId,
    login,
    verify2FA,
    logout,
    clearAuth,
    checkAuth,
  };
});
