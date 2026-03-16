<template>
  <el-container class="main-layout">
    <div
      v-if="isMobile && !isHidden"
      class="sidebar-backdrop"
      @click="closeSidebar"
    />

    <el-aside
      v-show="!isHidden"
      width="250px"
      class="sidebar"
      :class="{ 'sidebar--mobile': isMobile, 'sidebar--open': isMobile && !isHidden }"
    >
      <div class="logo">
        <h3>Quản lý tài sản</h3>
      </div>
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
          <span>Kiểm kê tài sản</span>
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
                  {{ $t('common.home') }}
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
            <NotificationBell />

            <el-dropdown class="user-dropdown">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ authStore.user?.fullname || authStore.user?.username }}
                <el-tag
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
    </el-container>
  </el-container>

  <TotpSetupDialog v-model="showTotpDialog" />
  <ChangePasswordDialog v-model="showChangePasswordDialog" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { House, Box, User, ArrowDown, OfficeBuilding, UserFilled, Switch, Tools, Document, Notebook, Fold, Expand, DeleteFilled, DataAnalysis, ShoppingCart, Setting } from '@element-plus/icons-vue';
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

const isMobile = ref(false);
const isHidden = ref(false);

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
};

const closeSidebar = () => {
  isHidden.value = true;
};

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  const hiddenState = localStorage.getItem('sidebarHidden');
  if (hiddenState !== null) {
    isHidden.value = hiddenState === 'true';
  }

  if (isMobile.value) {
    isHidden.value = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
});

const handleMenuSelect = () => {
  if (isMobile.value) {
    closeSidebar();
  }
};

const toggleSidebar = () => {
  isHidden.value = !isHidden.value;
  localStorage.setItem('sidebarHidden', String(isHidden.value));
};
</script>

<style scoped>

.main-layout {
  height: 100vh;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
}

.sidebar.sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 2000;
  transform: translateX(-100%);
}

.sidebar.sidebar--open {
  transform: translateX(0);
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #0f172a;
  margin-bottom: 5px;
}

.logo h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
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
  transition: all 0.3s ease;
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
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
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
  gap: 20px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.user-info:hover {
  background-color: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.el-main {
  background-color: #f8fafc;
  padding: 24px;
}

.route-enter-active,
.route-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.route-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.route-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
