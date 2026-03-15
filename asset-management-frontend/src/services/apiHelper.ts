import { ref } from 'vue';
import api from './api';
import { ElNotification } from 'element-plus';

// Trạng thái kết nối tổng thể
export const connectionStatus = ref<'online' | 'offline' | 'reconnecting'>('online');
export const lastErrorTime = ref<number>(0);
export const consecutiveErrors = ref<number>(0);

/**
 * Kiểm tra kết nối backend
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    connectionStatus.value = 'online';
    consecutiveErrors.value = 0;
    return true;
  } catch (error) {
    connectionStatus.value = 'offline';
    consecutiveErrors.value++;
    lastErrorTime.value = Date.now();
    return false;
  }
}

/**
 * Retry với exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      if (i > 0) {
        ElNotification.success({
          title: 'Kết nối thành công',
          message: 'Đã khôi phục kết nối với server',
        });
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrapper cho API calls với retry tự động
 */
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    retries?: number;
    showError?: boolean;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const { retries = 2, showError = true, errorMessage } = options;

  try {
    return await retryWithBackoff(apiCall, retries);
  } catch (error: any) {
    if (showError) {
      const message = errorMessage || error.response?.data?.message || 'Lỗi kết nối mạng';
      ElNotification.error({
        title: 'Lỗi',
        message,
        duration: 5000,
      });
    }
    throw error;
  }
}

/**
 * Batch API calls - gọi nhiều API cùng lúc
 */
export async function batchApiCalls<T>(
  calls: Array<() => Promise<T>>
): Promise<T[]> {
  try {
    return await Promise.all(calls.map(call => call()));
  } catch (error) {
    console.error('Batch API calls failed:', error);
    throw error;
  }
}

/**
 * Debounce cho search/filter
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle cho scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Kiểm tra kết nối định kỳ
 */
let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startConnectionMonitoring(interval = 30000) {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }

  connectionCheckInterval = setInterval(async () => {
    const isOnline = await checkBackendConnection();
    
    if (!isOnline && consecutiveErrors.value >= 3) {
      ElNotification.warning({
        title: 'Cảnh báo kết nối',
        message: 'Không thể kết nối với server. Vui lòng kiểm tra kết nối mạng.',
        duration: 0, // Không tự đóng
      });
    }
  }, interval);
}

export function stopConnectionMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
}

// Khởi động monitoring khi import
if (typeof window !== 'undefined') {
  checkBackendConnection();
  startConnectionMonitoring();
}
