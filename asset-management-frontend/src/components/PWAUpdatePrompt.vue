<template>
  <div>
    <!-- Update available prompt -->
    <transition name="pwa-slide-up">
      <div
        v-if="showUpdatePrompt"
        class="pwa-update-prompt"
      >
        <div class="pwa-update-content">
          <el-icon class="pwa-update-icon" :size="24"><Download /></el-icon>
          <div class="pwa-update-text">
            <strong>Phiên bản mới có sẵn!</strong>
            <span>Nhấn "Cập nhật" để tải phiên bản mới nhất</span>
          </div>
          <div class="pwa-update-actions">
            <el-button size="small" @click="dismissUpdate">Để sau</el-button>
            <el-button size="small" type="primary" :loading="updating" @click="applyUpdate">
              {{ updating ? 'Đang cập nhật...' : 'Cập nhật' }}
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Installed (offline ready) toast -->
    <transition name="pwa-slide-up">
      <div
        v-if="showOfflineReady"
        class="pwa-offline-toast"
      >
        <el-icon :size="20"><CircleCheckFilled /></el-icon>
        <span>Ứng dụng đã sẵn sàng sử dụng ngoại tuyến!</span>
      </div>
    </transition>

    <!-- Install prompt (before PWA is installed) -->
    <transition name="pwa-slide-up">
      <div
        v-if="showInstallPrompt && deferredPrompt"
        class="pwa-install-prompt"
      >
        <div class="pwa-install-content">
          <el-icon class="pwa-install-icon" :size="24"><Iphone /></el-icon>
          <div class="pwa-install-text">
            <strong>Cài đặt ứng dụng</strong>
            <span>Thêm vào màn hình chính để truy cập nhanh</span>
          </div>
          <div class="pwa-install-actions">
            <el-button size="small" @click="dismissInstall">Để sau</el-button>
            <el-button size="small" type="primary" @click="installApp">Cài đặt</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Download, CircleCheckFilled, Iphone } from '@element-plus/icons-vue';
import { getPWAState } from '@/pwa';

const showUpdatePrompt = ref(false);
const showOfflineReady = ref(false);
const showInstallPrompt = ref(false);
const updating = ref(false);
const deferredPrompt = ref<any>(null);
let unwatchUpdate: ReturnType<typeof setInterval> | null = null;

const state = getPWAState();

onMounted(() => {
  if (state) {
    unwatchUpdate = setInterval(() => {
      if (state.needRefresh.value && !showUpdatePrompt.value) {
        showUpdatePrompt.value = true;
      }
      if (state.offlineReady.value && !showOfflineReady.value) {
        showOfflineReady.value = true;
        setTimeout(() => {
          showOfflineReady.value = false;
        }, 4000);
      }
    }, 1000);
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallPrompt.value = false;
  }
});

onUnmounted(() => {
  if (unwatchUpdate) clearInterval(unwatchUpdate);
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
});

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e;
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (!dismissed || Date.now() - parseInt(dismissed) > 1000 * 60 * 60 * 24 * 7) {
    showInstallPrompt.value = true;
  }
}

function dismissUpdate() {
  showUpdatePrompt.value = false;
}

async function applyUpdate() {
  updating.value = true;
  if (state?.updateServiceWorker) {
    await state.updateServiceWorker();
  }
  // After service worker updates, reload page
  window.location.reload();
}

function dismissInstall() {
  showInstallPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
}

async function installApp() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  console.log('[PWA] Install outcome:', outcome);
  deferredPrompt.value = null;
  showInstallPrompt.value = false;
}
</script>

<style scoped>
.pwa-update-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: calc(100% - 32px);
  max-width: 420px;
}

.pwa-offline-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: #67c23a;
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(103, 194, 58, 0.4);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.pwa-update-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

.pwa-update-icon {
  color: #409eff;
  flex-shrink: 0;
}

.pwa-update-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pwa-update-text strong {
  font-size: 15px;
  color: #303133;
}

.pwa-update-text span {
  font-size: 13px;
  color: #909399;
}

.pwa-update-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Install prompt styles */
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9997;
  width: calc(100% - 32px);
  max-width: 420px;
}

.pwa-install-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

.pwa-install-icon {
  color: #e6a23c;
  flex-shrink: 0;
}

.pwa-install-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pwa-install-text strong {
  font-size: 15px;
  color: #303133;
}

.pwa-install-text span {
  font-size: 13px;
  color: #909399;
}

.pwa-install-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Transitions */
.pwa-slide-up-enter-active,
.pwa-slide-up-leave-active {
  transition: all 0.3s ease;
}

.pwa-slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.pwa-slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Responsive */
@media (max-width: 480px) {
  .pwa-update-content,
  .pwa-install-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 14px 16px;
  }

  .pwa-update-actions,
  .pwa-install-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
