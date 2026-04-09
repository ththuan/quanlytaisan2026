import { onMounted, onUnmounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import router from '@/router';

// Thời gian không hoạt động tối đa: 30 phút
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// Cảnh báo trước 2 phút
const WARN_BEFORE_MS = 2 * 60 * 1000;

const LAST_ACTIVITY_KEY = 'lastActivity';

function updateActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function getLastActivity(): number {
  const val = localStorage.getItem(LAST_ACTIVITY_KEY);
  return val ? parseInt(val, 10) : Date.now();
}

export function useIdleTimeout() {
  const authStore = useAuthStore();

  let checkTimer: ReturnType<typeof setInterval> | null = null;
  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let warnShown = false;

  const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  function onActivity() {
    updateActivity();
    // Nếu đang hiện cảnh báo → đóng và reset
    if (warnShown) {
      warnShown = false;
    }
  }

  function handleIdleLogout() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    if (checkTimer) clearInterval(checkTimer);
    if (warnTimer) clearTimeout(warnTimer);

    authStore.clearAuth();
    router.replace('/login');
  }

  function scheduleWarn() {
    if (warnTimer) clearTimeout(warnTimer);
    warnShown = true;
    ElMessageBox.confirm(
      'Phiên làm việc sắp hết hạn do không có hoạt động. Bạn có muốn tiếp tục không?',
      'Cảnh báo phiên',
      {
        confirmButtonText: 'Tiếp tục',
        cancelButtonText: 'Đăng xuất',
        type: 'warning',
        closeOnClickModal: false,
      }
    )
      .then(() => {
        // Người dùng bấm "Tiếp tục" → reset lastActivity
        updateActivity();
        warnShown = false;
      })
      .catch(() => {
        // Người dùng bấm "Đăng xuất" hoặc đóng dialog
        handleIdleLogout();
      });
  }

  function checkIdle() {
    if (!authStore.isAuthenticated) return;

    const idleMs = Date.now() - getLastActivity();

    if (idleMs >= IDLE_TIMEOUT_MS) {
      // Đã vượt quá 30 phút → logout
      handleIdleLogout();
    } else if (idleMs >= IDLE_TIMEOUT_MS - WARN_BEFORE_MS && !warnShown) {
      // Còn ≤2 phút nữa là hết → cảnh báo
      scheduleWarn();
    }
  }

  onMounted(() => {
    if (!authStore.isAuthenticated) return;

    // Khởi tạo lastActivity nếu chưa có
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateActivity();
    }

    // Lắng nghe mọi hoạt động của người dùng
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // Kiểm tra mỗi 30 giây
    checkTimer = setInterval(checkIdle, 30_000);
  });

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    if (checkTimer) clearInterval(checkTimer);
    if (warnTimer) clearTimeout(warnTimer);
  });
}
