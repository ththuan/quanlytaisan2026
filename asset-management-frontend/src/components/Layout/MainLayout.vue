<template>
  <!-- Một root duy nhất để <Transition name="app-view"> trong App.vue hoạt động (Vue không animate fragment) -->
  <div
    class="main-layout-root"
    :class="{ 'has-mobile-tabbar': isOverlay }"
  >
    <el-container class="main-layout">
      <transition name="backdrop-fade">
        <div
          v-if="isOverlay && !isHidden"
          class="sidebar-backdrop"
          @click="closeSidebar"
        />
      </transition>

      <el-aside
        v-show="!isHidden || isOverlay"
        width="230px"
        class="sidebar"
        :class="{ 'sidebar--mobile': isOverlay, 'sidebar--open': isOverlay && !isHidden }"
      >
        <div
          ref="menuWrapperRef"
          class="menu-wrapper"
        >
          <div
            class="menu-highlight"
            :style="menuHighlightStyle"
            aria-hidden="true"
          />
          <el-menu
            :default-active="$route.path"
            router
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
            :collapse-transition="false"
            :unique-opened="true"
            @select="handleMenuSelect"
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span>{{ $t('menu.dashboard') }}</span>
            </el-menu-item>

            <el-menu-item index="/assets">
              <el-icon><Box /></el-icon>
              <span>Tài sản{{ isStaffOrHead ? ' đơn vị' : '' }}</span>
            </el-menu-item>

            <el-menu-item index="/transfers">
              <el-icon><Switch /></el-icon>
              <span>{{ isStaffOrHead ? 'Đề nghị điều chuyển' : $t('menu.transfers') }}</span>
            </el-menu-item>

            <el-menu-item index="/inventory">
              <el-icon><Notebook /></el-icon>
              <span>{{ $t('inventory.title') }}</span>
            </el-menu-item>

            <!-- Thanh lý / Tiêu hủy -->
            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/asset-disposals"
            >
              <el-icon><DeleteFilled /></el-icon>
              <span>Thanh lý tài sản</span>
            </el-menu-item>

            <!-- Báo cáo: admin + director -->
            <el-menu-item
              v-if="authStore.user?.role === 'admin' || authStore.user?.role === 'director'"
              index="/reports"
            >
              <el-icon><DataAnalysis /></el-icon>
              <span>{{ $t('menu.reports') }}</span>
            </el-menu-item>

            <el-menu-item index="/loss-damage">
              <el-icon><Warning /></el-icon>
              <span>Tài sản mất / hư hỏng</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/procurements"
            >
              <el-icon><Document /></el-icon>
              <span>Tăng tài sản</span>
            </el-menu-item>

            <el-menu-item
              v-if="FEATURES.stockModule && authStore.user?.role === 'admin'"
              index="/stock"
            >
              <el-icon><Box /></el-icon>
              <span>Kho vật tư</span>
            </el-menu-item>

            <el-divider
              v-if="authStore.user?.role === 'admin'"
              class="sidebar-divider"
            />

            <!-- Các module phụ trợ (Sửa chữa, Mua sắm): tạm ẩn theo phạm vi hiện tại.
               Bật lại bằng FEATURES.auxiliaryModules = true trong src/constants/features.ts -->
            <el-menu-item
              v-if="FEATURES.auxiliaryModules && authStore.user?.role === 'admin'"
              index="/purchase-requests"
            >
              <el-icon><ShoppingCart /></el-icon>
              <span>{{ $t('menu.purchaseRequests') }}</span>
            </el-menu-item>

            <el-menu-item
              v-if="FEATURES.auxiliaryModules && authStore.user?.role === 'admin'"
              index="/maintenance"
            >
              <el-icon><Tools /></el-icon>
              <span>{{ $t('menu.repairTracking') }}</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/departments"
            >
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ $t('menu.departments') }}</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/users"
            >
              <el-icon><UserFilled /></el-icon>
              <span>{{ $t('menu.users') }}</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin' || authStore.user?.role === 'director'"
              index="/norms"
            >
              <el-icon><DataAnalysis /></el-icon>
              <span>Định mức tài sản</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/asset-categories"
            >
              <el-icon><Grid /></el-icon>
              <span>{{ $t('menu.assetCategories') }}</span>
            </el-menu-item>

            <el-menu-item
              v-if="authStore.user?.role === 'admin'"
              index="/system-admin"
            >
              <el-icon><Setting /></el-icon>
              <span>Quản trị hệ thống</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-content">
            <div class="header-left">
              <el-button
                v-if="!isOverlay"
                :icon="isHidden ? Expand : Fold"
                circle
                size="small"
                class="sidebar-toggle"
                @click="toggleSidebar"
              />
              <nav
                class="breadcrumb"
                aria-label="Breadcrumb"
              >
                <span
                  v-if="!isOverlay"
                  class="breadcrumb-home-chip"
                  :title="$t('common.home')"
                  aria-label="Trang chủ"
                  role="link"
                  tabindex="0"
                  @click="router.push('/')"
                  @keydown.enter="router.push('/')"
                >
                  <el-icon>
                    <HomeFilled />
                  </el-icon>
                </span>
                <button
                  v-if="isOverlay && $route.path !== '/'"
                  type="button"
                  class="mobile-back-btn"
                  aria-label="Quay lại"
                  @click="router.back()"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <span class="mobile-app-title">
                  {{ $route.meta.titleKey ? $t(String($route.meta.titleKey)) : 'Quản lý tài sản' }}
                </span>
              </nav>
            </div>
            <div class="header-right">
              <NotificationBell />

              <el-dropdown class="user-dropdown">
                <span class="user-info">
                  <el-icon><User /></el-icon>
                  <span class="user-name">{{ authStore.user?.fullname || authStore.user?.username }}</span>
                  <el-tag
                    v-if="!isMobile"
                    size="small"
                    type="info"
                    style="margin-left: 8px"
                  >{{ getRoleName }}</el-tag>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item disabled>
                      <span style="color: #909399">{{ authStore.user?.department?.name || 'Chưa phân đơn vị' }}</span>
                    </el-dropdown-item>
                    <el-dropdown-item @click="showChangePasswordDialog = true">
                      🔑 Đổi mật khẩu
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="FEATURES.twoFactor"
                      @click="showTotpDialog = true"
                    >
                      🔐 Xác thực 2 bước
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="canUsePush"
                      :disabled="pushBusy"
                      divided
                      @click="togglePushNotifications"
                    >
                      {{ pushEnabled ? '🔕 Tắt thông báo đẩy' : '🔔 Bật thông báo đẩy' }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      divided
                      @click="handleLogout"
                    >
                      {{ $t('auth.logout') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <div
          v-if="isOffline"
          class="offline-banner"
          role="status"
        >
          Không có kết nối mạng — một số dữ liệu có thể chưa cập nhật.
        </div>

        <el-main>
          <!-- Không dùng transition out-in: mỗi lần chuyển menu phải chờ
               trang cũ leave rồi trang mới enter, gây cảm giác chậm. -->
          <router-view />
        </el-main>
        <footer
          v-if="!isOverlay"
          class="app-footer"
        >
          <div class="footer-copyright">
            Copyright &copy; 2026 Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ.
          </div>
        </footer>
      </el-container>
    </el-container>

    <!-- Bottom navigation kiểu ứng dụng cho mobile/tablet/PWA -->
    <nav
      v-if="isOverlay"
      class="mobile-tabbar"
      aria-label="Điều hướng ứng dụng"
    >
      <button
        type="button"
        class="mobile-tabbar__item"
        :class="{ active: $route.path === '/' }"
        @click="router.push('/')"
      >
        <el-icon><House /></el-icon>
        <span>Trang chủ</span>
      </button>
      <button
        type="button"
        class="mobile-tabbar__item"
        :class="{ active: $route.path.startsWith('/assets') }"
        @click="router.push('/assets')"
      >
        <el-icon><Box /></el-icon>
        <span>Tài sản</span>
      </button>
      <button
        type="button"
        class="mobile-tabbar__item"
        :class="{ active: $route.path.startsWith('/inventory') }"
        @click="router.push('/inventory')"
      >
        <el-icon><Notebook /></el-icon>
        <span>Kiểm kê</span>
      </button>
      <button
        type="button"
        class="mobile-tabbar__item"
        :class="{ active: !isHidden }"
        @click="toggleSidebar"
      >
        <el-icon><Menu /></el-icon>
        <span>Menu</span>
      </button>
    </nav>

    <TotpSetupDialog v-model="showTotpDialog" />
    <ChangePasswordDialog v-model="showChangePasswordDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { House, HomeFilled, Box, User, ArrowDown, ArrowLeft, OfficeBuilding, UserFilled, Switch, Tools, Document, Notebook, Fold, Expand, DeleteFilled, DataAnalysis, ShoppingCart, Setting, Grid, Warning, Menu } from '@element-plus/icons-vue';
import NotificationBell from '@/components/Notifications/NotificationBell.vue';
import TotpSetupDialog from '@/components/Auth/TotpSetupDialog.vue';
import ChangePasswordDialog from '@/components/Auth/ChangePasswordDialog.vue';
import { FEATURES } from '@/constants/features';
import { startMobileTableCards, stopMobileTableCards } from '@/utils/mobileTableCards';
import { ElMessage } from 'element-plus';
import { pushSupported, subscribePush, unsubscribePush, getPushSubscription } from '@/services/push.service';


const router = useRouter();
const authStore = useAuthStore();
const showTotpDialog = ref(false);
const showChangePasswordDialog = ref(false);
const isStaffOrHead = computed(() => {
  const role = authStore.user?.role;
  return role === 'staff' || role === 'department_head';
});

const getRoleName = computed(() => {
  const roleNames: Record<string, string> = {
    admin: 'Quản trị viên',
    director: 'Giám hiệu',
    department_head: 'Trưởng đơn vị',
    manager: 'Quản lý',
    staff: 'Viên Chức',
    user: 'Viên Chức',
  };
  return roleNames[authStore.user?.role || ''] || authStore.user?.role;
});

const handleLogout = async () => {
  try {
    if (pushEnabled.value) await unsubscribePush();
  } catch {
    // Bỏ qua lỗi push, vẫn đăng xuất bình thường
  }
  await authStore.logout();
  router.push('/login');
};

const MOBILE_BREAKPOINT = 768;
// Bao gồm cả iPad Pro 12.9" landscape (1366px) để giao diện dùng bottom nav như app.
const TABLET_BREAKPOINT = 1367;

const isMobile = ref(false);
const isTablet = ref(false);
const isHidden = ref(false);
const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false);

const handleOnline = () => { isOffline.value = false; };
const handleOffline = () => { isOffline.value = true; };

const canUsePush = pushSupported();
const pushEnabled = ref(false);
const pushBusy = ref(false);

const refreshPushState = async () => {
  if (!canUsePush) return;
  try {
    const subscription = await getPushSubscription();
    pushEnabled.value = Boolean(subscription);
  } catch {
    pushEnabled.value = false;
  }
};

const togglePushNotifications = async () => {
  if (pushBusy.value || !canUsePush) return;
  pushBusy.value = true;
  try {
    if (pushEnabled.value) {
      await unsubscribePush();
      pushEnabled.value = false;
      ElMessage.success('Đã tắt thông báo đẩy');
    } else {
      await subscribePush();
      pushEnabled.value = true;
      ElMessage.success('Đã bật thông báo đẩy');
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'Không thể thay đổi thông báo đẩy');
  } finally {
    pushBusy.value = false;
  }
};

// Overlay mode: sidebar là drawer trên mobile + tablet (iPad)
const isOverlay = computed(() => isMobile.value || isTablet.value);

const menuWrapperRef = ref<HTMLElement | null>(null);
const menuHighlight = ref({ top: 0, left: 0, width: 0, height: 0, visible: false });
let highlightFrame = 0;

const menuHighlightStyle = computed(() => ({
  transform: `translateY(${menuHighlight.value.top}px)`,
  left: `${menuHighlight.value.left}px`,
  width: `${menuHighlight.value.width}px`,
  height: `${menuHighlight.value.height}px`,
  opacity: menuHighlight.value.visible ? 1 : 0,
}));

const hideMenuHighlight = () => {
  menuHighlight.value = { ...menuHighlight.value, visible: false };
};

const updateMenuHighlight = () => {
  cancelAnimationFrame(highlightFrame);
  highlightFrame = requestAnimationFrame(() => {
    const wrapper = menuWrapperRef.value;
    if (!wrapper || isHidden.value) {
      hideMenuHighlight();
      return;
    }

    const activeItem = wrapper.querySelector<HTMLElement>('.el-menu-item.is-active');
    if (!activeItem) {
      hideMenuHighlight();
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    if (!itemRect.height) {
      hideMenuHighlight();
      return;
    }

    menuHighlight.value = {
      top: itemRect.top - wrapperRect.top,
      left: itemRect.left - wrapperRect.left,
      width: itemRect.width,
      height: itemRect.height,
      visible: true,
    };
  });
};

const updateIsMobile = () => {
  const prevOverlay = isOverlay.value;
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  isTablet.value = window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT;
  document.documentElement.classList.toggle('app-overlay', isMobile.value || isTablet.value);

  // Chuyển sang overlay mode → ẩn sidebar
  if (!prevOverlay && isOverlay.value) {
    isHidden.value = true;
  }
  // Chuyển từ overlay sang desktop (xoay màn hình) → khôi phục trạng thái
  if (prevOverlay && !isOverlay.value) {
    const hiddenState = localStorage.getItem('sidebarHidden');
    isHidden.value = hiddenState === 'true';
  }

  nextTick(updateMenuHighlight);
};

const closeSidebar = () => {
  isHidden.value = true;
};

onMounted(() => {
  updateIsMobile();
  startMobileTableCards();
  window.addEventListener('resize', updateIsMobile);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  void refreshPushState();

  const hiddenState = localStorage.getItem('sidebarHidden');
  if (hiddenState !== null && !isOverlay.value) {
    isHidden.value = hiddenState === 'true';
  }

  if (isOverlay.value) {
    isHidden.value = true;
  }

  nextTick(updateMenuHighlight);
  if (document.fonts) {
    document.fonts.ready.then(() => updateMenuHighlight()).catch(() => {});
  }
});

watch(
  () => router.currentRoute.value.path,
  () => nextTick(updateMenuHighlight),
);

watch([isHidden, isOverlay], () => nextTick(updateMenuHighlight));

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  stopMobileTableCards();
  cancelAnimationFrame(highlightFrame);
});

const handleMenuSelect = () => {
  if (isOverlay.value) {
    closeSidebar();
  }
};

const toggleSidebar = () => {
  isHidden.value = !isHidden.value;
  // Chỉ lưu trạng thái trên desktop (không overlay)
  if (!isOverlay.value) {
    localStorage.setItem('sidebarHidden', String(isHidden.value));
  }
};
</script>

<style scoped>

.main-layout-root {
  /* iOS Safari fix: 100vh không tính browser chrome */
  min-height: 100vh;
  min-height: 100dvh;
  height: 100%;
  width: 100%;
  position: relative;
}

.main-layout {
  height: 100vh;
  height: 100dvh;
  position: relative;
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  z-index: 1999;
}

.sidebar {
  background-color: #0f172a;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  /* iOS smooth scrolling trong sidebar */
  -webkit-overflow-scrolling: touch;
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
}

.sidebar.sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 2000;
  transform: translateX(-100%);
  will-change: transform;
  /* iOS safe-area: tránh notch che sidebar */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sidebar.sidebar--open {
  transform: translateX(0);
  box-shadow: 12px 0 40px rgba(0, 0, 0, 0.18);
}

.menu-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
}

.menu-highlight {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.38);
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  will-change: transform, height, width;
  transition:
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    left 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.el-menu {
  position: relative;
  z-index: 1;
  border-right: none !important;
  background-color: transparent !important;
  padding: 12px 10px 10px;
}

:deep(.el-menu-item) {
  position: relative;
  z-index: 1;
  height: 44px !important;
  line-height: 44px !important;
  border-radius: 10px;
  margin-bottom: 2px;
  color: #94a3b8 !important;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background-color 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Menu item đầu tiên có margin-top nhiều hơn */
:deep(.el-menu-item:first-child) {
  margin-top: 2px;
}

:deep(.el-menu-item:active) {
  transform: scale(0.98);
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

:deep(.el-menu-item.is-active) {
  background: transparent !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: none;
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  color: inherit;
}

.sidebar-divider {
  margin: 10px 8px;
  opacity: 0.1;
  background-color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .menu-highlight {
    transition: opacity 0.01ms !important;
  }
}

.el-header {
  height: 56px !important;
  background-color: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  /* iOS Safari: đảm bảo sticky hoạt động */
  -webkit-transform: translateZ(0);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.header-app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}

.app-title-main {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.app-title-sub {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.header-left .breadcrumb {
  min-width: 0;
  flex-shrink: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 0;
  overflow: visible;
}

.breadcrumb :deep(.el-breadcrumb) {
  display: inline-flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  display: inline-flex;
  align-items: center;
}

.sidebar-toggle {
  border: none;
  background: #f1f5f9;
  color: #64748b;
  width: 32px;
  height: 32px;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  color: #64748b;
  font-weight: 400;
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #0f172a;
  font-weight: 700;
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  color: #cbd5e1;
  margin: 0 10px;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1279px) {
  .header-right {
    gap: 6px;
  }
  .user-name {
    max-width: 100px;
  }
}

@media (max-width: 768px) {
  .user-name {
    max-width: 72px;
    font-size: 13px;
  }

  /* Thu nhỏ toggle button trên mobile */
  .sidebar-toggle {
    width: 36px;
    height: 36px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 12px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.user-info:hover {
  background-color: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.breadcrumb-home-chip {
  width: 38px;
  height: 38px;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #bbf7d0;
  transition: all 0.2s ease;
}

.breadcrumb-home-chip .el-icon {
  font-size: 18px;
}

.breadcrumb-home-chip:hover {
  background: #dcfce7;
  color: #047857;
  border-color: #86efac;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .breadcrumb-home-chip {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .breadcrumb-home-chip .el-icon {
    font-size: 16px;
  }
}

.el-main {
  background-color: #f8fafc;
  padding: 24px;
  /* iOS: smooth scroll trong main content */
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  /* Desktop Chrome/Edge: prevent flash when switching tabs */
  contain: layout style paint;
  isolation: isolate;
  min-width: 0;
  width: 100%;
}

.el-main > :deep(*) {
  width: 100%;
  min-width: 0;
}

@media (min-width: 1366px) {
  .sidebar { width: 230px !important; }

  .el-header {
    height: 64px !important;
    padding: 0 28px;
  }

  :deep(.el-menu-item) {
    height: 44px !important;
    line-height: 44px !important;
    font-size: 14px;
  }

  :deep(.el-menu-item .el-icon) { font-size: 18px; }
  .app-title-main { font-size: 17px; }
  .breadcrumb, .user-info { font-size: 15px; }

  .sidebar-toggle {
    width: 38px;
    height: 38px;
  }
}

@media (min-width: 1920px) {
  .sidebar { width: 230px !important; }

  .el-header {
    height: 70px !important;
    padding: 0 36px;
  }

  :deep(.el-menu-item) {
    height: 44px !important;
    line-height: 44px !important;
    font-size: 14px;
  }
}

/* Desktop-specific optimizations to prevent tab-switch flash */
@media (min-width: 1024px) {
  .el-main {
    /* Keep main scrollable without a permanent scroll-position hint */
    transform: translateZ(0);
  }
}

/* App-like bottom navigation for mobile / tablet / PWA */
.mobile-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  display: flex;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-tabbar__item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 2px 7px;
  border: none;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.mobile-tabbar__item .el-icon {
  font-size: 21px;
}

.mobile-tabbar__item.active {
  color: #2563eb;
}

.has-mobile-tabbar .el-main {
  padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
}

.offline-banner {
  padding: 6px 12px;
  background: #fef3c7;
  color: #92400e;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #fde68a;
}

.mobile-app-title {
  display: none;
}

.mobile-back-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.mobile-back-btn .el-icon {
  font-size: 18px;
}

@media (max-width: 1367px) {
  .mobile-app-title {
    display: inline-block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.footer-copyright {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .header-app-title .app-title-sub {
    display: none;
  }
  
  .header-app-title .app-title-main {
    font-size: 13px;
  }

  .el-main {
    padding: 12px 8px;
    /* iOS safe area - home indicator */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .app-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .footer-copyright {
    max-width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .el-main {
    padding: 16px 12px;
  }
}

/* .route-* transitions: src/styles/motion.scss */
</style>
