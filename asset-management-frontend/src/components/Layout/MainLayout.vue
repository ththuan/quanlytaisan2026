<template>
  <!-- Một root duy nhất để <Transition name="app-view"> trong App.vue hoạt động (Vue không animate fragment) -->
  <div class="main-layout-root">
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
        width="250px"
        class="sidebar"
        :class="{ 'sidebar--mobile': isOverlay, 'sidebar--open': isOverlay && !isHidden }"
      >
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

          <!-- Mua sắm thiết bị -->
          <el-menu-item index="/purchase-requests">
            <el-icon><ShoppingCart /></el-icon>
            <span>{{ $t('menu.purchaseRequests') }}</span>
          </el-menu-item>

          <!-- Bảo trì / Sửa chữa -->
          <el-menu-item index="/maintenance">
            <el-icon><Tools /></el-icon>
            <span>{{ $t('menu.repairTracking') }}</span>
          </el-menu-item>

          <!-- Mua sắm/Cấp phát: admin + director -->
          <el-menu-item
            v-if="isAdminOrDirector"
            index="/procurements"
          >
            <el-icon><Document /></el-icon>
            <span>{{ $t('menu.procurements') }}</span>
          </el-menu-item>

          <!-- Kho vật tư: admin + director -->
          <el-menu-item
            v-if="isAdminOrDirector"
            index="/stock"
          >
            <el-icon><Box /></el-icon>
            <span>Kho vật tư</span>
          </el-menu-item>

          <el-menu-item index="/inventory">
            <el-icon><Notebook /></el-icon>
            <span>{{ $t('inventory.title') }}</span>
          </el-menu-item>

          <!-- Thanh lý / Tiêu hủy -->
          <el-menu-item index="/asset-disposals">
            <el-icon><DeleteFilled /></el-icon>
            <span>Thanh lý tài sản</span>
          </el-menu-item>

          <!-- Báo cáo: admin + director -->
          <el-menu-item
            v-if="isAdminOrDirector"
            index="/reports"
          >
            <el-icon><DataAnalysis /></el-icon>
            <span>Báo cáo</span>
          </el-menu-item>

          <el-divider class="sidebar-divider" />

          <!-- Admin-only modules moved to bottom for nicer visual order -->
          <el-menu-item
            v-if="isAdminOrDirector"
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
            v-if="authStore.user?.role === 'admin'"
            index="/system-admin"
          >
            <el-icon><Setting /></el-icon>
            <span>Quản trị hệ thống</span>
          </el-menu-item>

          <el-menu-item
            v-if="authStore.user?.role === 'admin'"
            index="/asset-categories"
          >
            <el-icon><Grid /></el-icon>
            <span>{{ $t('menu.assetCategories') }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-content">
            <div class="header-left">
              <el-button
                :icon="isHidden ? Expand : Fold"
                circle
                size="small"
                class="sidebar-toggle"
                @click="toggleSidebar"
              />
              <div class="breadcrumb">
                <el-breadcrumb separator="/">
                  <el-breadcrumb-item :to="{ path: '/' }">
                    <span
                      class="breadcrumb-home-chip"
                      :title="$t('common.home')"
                      aria-label="Trang chủ"
                    >
                      <el-icon>
                        <HomeFilled />
                      </el-icon>
                    </span>
                  </el-breadcrumb-item>
                  <template
                    v-for="(item, idx) in breadcrumbItems"
                    :key="idx"
                  >
                    <el-breadcrumb-item
                      v-if="item.path"
                      :to="item.path"
                    >
                      {{ item.label }}
                    </el-breadcrumb-item>
                    <el-breadcrumb-item v-else>
                      {{ item.label }}
                    </el-breadcrumb-item>
                  </template>
                </el-breadcrumb>
              </div>
            </div>
            <div class="header-right">
              <div v-if="!isTablet" class="header-help-links">
                <el-button
                  text
                  bg
                  class="header-help-btn"
                  :title="$t('menu.documentation')"
                  @click="router.push('/documentation')"
                >
                  <el-icon class="header-help-ic">
                    <Document />
                  </el-icon>
                  <span>{{ $t('menu.documentation') }}</span>
                </el-button>
                <span
                  class="header-help-divider"
                  aria-hidden="true"
                />
                <el-button
                  text
                  bg
                  class="header-help-btn"
                  :title="$t('menu.support')"
                  @click="router.push('/support')"
                >
                  <el-icon class="header-help-ic">
                    <QuestionFilled />
                  </el-icon>
                  <span>{{ $t('menu.support') }}</span>
                </el-button>
              </div>
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
                    <el-dropdown-item @click="showTotpDialog = true">
                      🔐 Xác thực 2 bước
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

        <el-main>
          <router-view v-slot="{ Component }">
            <transition
              name="route"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
        <footer class="app-footer">
          Copyright &copy; 2026 Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ.
        </footer>
      </el-container>
    </el-container>

    <TotpSetupDialog v-model="showTotpDialog" />
    <ChangePasswordDialog v-model="showChangePasswordDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { House, HomeFilled, Box, User, ArrowDown, OfficeBuilding, UserFilled, Switch, Tools, Document, Notebook, Fold, Expand, DeleteFilled, DataAnalysis, ShoppingCart, Setting, QuestionFilled, Grid } from '@element-plus/icons-vue';
import NotificationBell from '@/components/Notifications/NotificationBell.vue';
import TotpSetupDialog from '@/components/Auth/TotpSetupDialog.vue';
import ChangePasswordDialog from '@/components/Auth/ChangePasswordDialog.vue';


const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const showTotpDialog = ref(false);
const showChangePasswordDialog = ref(false);

const breadcrumbItems = computed(() => {
  const route = router.currentRoute.value;
  const meta = route.meta as { titleKey?: string; breadcrumbParent?: { path: string; titleKey: string } };
  const items: { path?: string; label: string }[] = [];

  if (route.name === 'Dashboard') return items;

  const parent = meta?.breadcrumbParent;
  if (parent) {
    items.push({ path: parent.path, label: t(parent.titleKey) });
  }
  const titleKey = meta?.titleKey;
  items.push({ label: titleKey ? t(titleKey) : (typeof route.name === 'string' ? route.name : '') });
  return items;
});

const isAdminOrDirector = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || role === 'director';
});

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
  await authStore.logout();
  router.push('/login');
};

const MOBILE_BREAKPOINT = 768;
// Tăng lên 1280 để bao gồm tất cả iPad (landscape iPad Pro 11" = 1194px, iPad Air = 1180px)
const TABLET_BREAKPOINT = 1280;

const isMobile = ref(false);
const isTablet = ref(false);
const isHidden = ref(false);

// Overlay mode: sidebar là drawer trên mobile + tablet (iPad)
const isOverlay = computed(() => isMobile.value || isTablet.value);

const updateIsMobile = () => {
  const prevOverlay = isOverlay.value;
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  isTablet.value = window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT;

  // Chuyển sang overlay mode → ẩn sidebar
  if (!prevOverlay && isOverlay.value) {
    isHidden.value = true;
  }
  // Chuyển từ overlay sang desktop (xoay màn hình) → khôi phục trạng thái
  if (prevOverlay && !isOverlay.value) {
    const hiddenState = localStorage.getItem('sidebarHidden');
    isHidden.value = hiddenState === 'true';
  }
};

const closeSidebar = () => {
  isHidden.value = true;
};

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  const hiddenState = localStorage.getItem('sidebarHidden');
  if (hiddenState !== null && !isOverlay.value) {
    isHidden.value = hiddenState === 'true';
  }

  if (isOverlay.value) {
    isHidden.value = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
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
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #f8fafc;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
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

.el-menu {
  border-right: none !important;
  background-color: transparent !important;
  padding: 0 12px;
}

:deep(.el-menu-item) {
  height: 48px !important;
  line-height: 48px !important;
  border-radius: 12px;
  margin-bottom: 4px;
  color: #94a3b8 !important;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background-color 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}

:deep(.el-menu-item:active) {
  transform: scale(0.98);
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  color: inherit;
}

.sidebar-divider {
  margin: 16px 12px;
  opacity: 0.1;
  background-color: #fff;
}

.el-header {
  height: 56px !important;
  background-color: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  padding: 0 20px;
  /* iOS safe-area: tránh notch ở landscape */
  padding-left: calc(20px + env(safe-area-inset-left, 0px));
  padding-right: calc(20px + env(safe-area-inset-right, 0px));
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

.header-left .breadcrumb {
  min-width: 0;
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

.header-help-links {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 8px;
  margin-right: 4px;
  border-right: 1px solid #e2e8f0;
}

.header-help-btn {
  font-weight: 600;
  color: #475569 !important;
  padding: 6px 10px !important;
}

.header-help-btn:hover {
  color: #0f172a !important;
}

.header-help-ic {
  margin-right: 6px;
  font-size: 16px;
}

.header-help-divider {
  width: 1px;
  height: 18px;
  background: #e2e8f0;
  margin: 0 2px;
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
}

.app-footer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .el-main {
    padding: 12px 8px;
    /* iOS safe area - home indicator */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .el-main {
    padding: 16px 12px;
  }
}

/* .route-* transitions: src/styles/motion.scss */
</style>
