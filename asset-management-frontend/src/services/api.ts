import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';
import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

console.log('🔌 API Base URL:', API_BASE_URL);

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Biến để theo dõi lỗi liên tiếp
let consecutiveNetworkErrors = 0;
let lastNetworkErrorTime = 0;

// Response interceptor với xử lý lỗi mạng thông minh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.config.url, response.status);
    consecutiveNetworkErrors = 0; // Reset khi thành công
    return response.data;
  },
  (error: AxiosError) => {
    const now = Date.now();
    
    // Xử lý lỗi mạng
    if (!error.response) {
      consecutiveNetworkErrors++;
      lastNetworkErrorTime = now;
      
      console.error('🔴 Network Error:', error.message);
      
      // Chỉ hiện thông báo nếu lỗi liên tiếp hoặc đã lâu không có lỗi
      if (consecutiveNetworkErrors === 1 || (now - lastNetworkErrorTime > 10000)) {
        ElNotification.error({
          title: 'Lỗi kết nối',
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend server có đang chạy không?\n2. URL backend có đúng không?\n3. Kết nối mạng của bạn',
          duration: 8000,
        });
      }
      
      return Promise.reject(error);
    }

    consecutiveNetworkErrors = 0;
    const responseData = error.response?.data as any;
    const message = responseData?.message || error.message || 'Đã xảy ra lỗi không xác định';

    // Handle unauthorized
    if (error.response?.status === 401) {
      // Clear BOTH Pinia reactive state and localStorage so the navigation guard
      // correctly sees isAuthenticated=false and allows the redirect to /login.
      try {
        const authStore = useAuthStore();
        authStore.clearAuth();
      } catch {
        // Pinia not ready yet (very early requests) — clear localStorage manually
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      router.replace('/login');
      ElMessage.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    } else if (error.response?.status === 403) {
      ElMessage.error('Bạn không có quyền thực hiện thao tác này');
    } else if (error.response?.status === 400) {
      // Validation errors - show detailed message
      ElMessage.error({
        message: message,
        duration: 5000,
        showClose: true,
      });
    } else if (error.response?.status >= 500) {
      ElMessage.error({
        message: `Lỗi server: ${message}`,
        duration: 5000,
        showClose: true,
      });
    } else if (error.response?.status === 404) {
      ElMessage.error('Không tìm thấy dữ liệu');
    } else if (error.response?.status === 429) {
      // Rate limit error - chỉ hiện 1 lần
      ElMessage.error({
        message: 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.',
        duration: 5000,
        showClose: true,
      });
    } else {
      // Chỉ hiện lỗi nếu không phải 401/403/404/429
      if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 404 && error.response?.status !== 429) {
        ElMessage.error({
          message: message,
          duration: 5000,
          showClose: true,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
