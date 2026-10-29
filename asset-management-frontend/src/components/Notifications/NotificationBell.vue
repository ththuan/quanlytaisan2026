<template>
  <div class="notification-bell">
    <el-popover
      v-model:visible="showDropdown"
      placement="bottom-end"
      :width="400"
      trigger="click"
      popper-class="notification-popover"
    >
      <template #reference>
        <span class="bell-badge-wrap">
          <el-badge
            :key="unreadCount"
            class="bell-badge"
            :value="unreadCount"
            :hidden="unreadCount === 0"
            :max="99"
          >
            <el-button
              :icon="Bell"
              circle
              class="bell-button"
              :class="{ 'bell-button--pulse': pulse }"
              @click="handleBellClick"
            />
          </el-badge>
          <ParticlesBurst
            :active="pulse"
            :count="10"
            :radius="30"
          />
        </span>
      </template>

      <div
        v-loading="notificationStore.loading"
        class="notification-dropdown"
      >
        <div class="notification-header">
          <h3>Thông báo</h3>
          <el-button
            v-if="unreadCount > 0"
            v-ripple
            text
            size="small"
            @click="markAllAsRead"
          >
            Đánh dấu đã đọc tất cả
          </el-button>
        </div>

        <TransitionGroup
          name="notif"
          tag="div"
          class="notification-list"
        >
          <div
            v-if="notificationStore.notifications.length === 0"
            key="empty"
            class="empty-notifications"
          >
            <el-empty
              description="Không có thông báo mới"
              :image-size="80"
            />
          </div>

          <div
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            class="notification-item"
            @click="handleNotificationClick(notification)"
          >
            <div
              class="notification-icon"
              :class="`icon-${notification.type}`"
            >
              <el-icon v-if="notification.type === 'transfer'">
                <Switch />
              </el-icon>
              <el-icon v-else-if="notification.type === 'maintenance'">
                <Tools />
              </el-icon>
              <el-icon v-else-if="notification.type === 'procurement'">
                <ShoppingCart />
              </el-icon>
              <el-icon v-else-if="notification.type === 'inventory'">
                <List />
              </el-icon>
              <el-icon v-else-if="notification.type === 'disposal'">
                <DeleteFilled />
              </el-icon>
              <el-icon v-else>
                <Document />
              </el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ notification.title }}
              </div>
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="notification-time">
                {{ formatTime(notification.created_at) }}
              </div>
            </div>
            <div class="notification-actions">
              <el-button
                v-ripple
                text
                size="small"
                :icon="Close"
                @click.stop="markAsRead(notification.id)"
              />
            </div>
          </div>
        </TransitionGroup>

        <div
          v-if="notificationStore.notifications.length > 0"
          class="notification-footer"
        >
          <el-button
            v-ripple
            text
            @click="viewAll"
          >
            Xem tất cả
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore, type Notification } from '@/stores/notification.store';
import { Bell, Switch, Tools, Document, Close, List, DeleteFilled, ShoppingCart } from '@element-plus/icons-vue';
import ParticlesBurst from '@/components/animate/ParticlesBurst.vue';
import moment from 'moment';

const router = useRouter();
const notificationStore = useNotificationStore();

const showDropdown = ref(false);
let refreshInterval: number | null = null;
let visibilityTimeout: number | null = null;

const unreadCount = computed(() => notificationStore.unreadCount);
const pulse = ref(false);
let pulseTimer: number | null = null;

watch(unreadCount, (now, previous) => {
  if (previous === undefined || now <= previous) return;
  if (pulseTimer) clearTimeout(pulseTimer);
  pulse.value = false;
  requestAnimationFrame(() => {
    pulse.value = true;
    pulseTimer = window.setTimeout(() => {
      pulse.value = false;
    }, 1100);
  });
});

// Start/stop polling based on tab visibility to prevent unnecessary API calls and UI flashing
function startPolling() {
  if (refreshInterval) return; // Already polling
  refreshInterval = window.setInterval(() => {
    notificationStore.fetchNotifications();
  }, 30000);
}

function stopPolling() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Handle tab visibility changes with debounce to prevent flash on desktop browsers
function handleVisibilityChange() {
  // Clear any pending visibility timeout
  if (visibilityTimeout) {
    clearTimeout(visibilityTimeout);
    visibilityTimeout = null;
  }

  if (document.hidden) {
    // Tab is hidden - pause polling immediately to save resources
    stopPolling();
  } else {
    // Tab is visible again - debounce the fetch to prevent flash on desktop Chrome/Edge
    // Desktop browsers may trigger visibility change multiple times rapidly
    visibilityTimeout = window.setTimeout(() => {
      // Only fetch if user hasn't switched tabs again
      if (!document.hidden) {
        notificationStore.fetchNotifications();
        startPolling();
      }
    }, 500); // 500ms debounce - enough to prevent flash but not noticeable to users
  }
}

onMounted(() => {
  // Fetch notifications immediately on mount
  notificationStore.fetchNotifications(true);
  
  // Start polling only if tab is currently visible
  if (!document.hidden) {
    startPolling();
  }
  
  // Listen for tab visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  stopPolling();
  if (visibilityTimeout) {
    clearTimeout(visibilityTimeout);
  }
  if (pulseTimer) {
    clearTimeout(pulseTimer);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// Force-refresh notifications when the bell button is clicked
const handleBellClick = () => {
  // If dropdown will open (currently closed), fetch fresh data immediately
  if (!showDropdown.value) {
    notificationStore.fetchNotifications(true);
  }
};

// Also watch dropdown open as a fallback (e.g., keyboard or programmatic open)
let dropdownWatchTimeout: number | null = null;
watch(() => showDropdown.value, (isOpen) => {
  if (isOpen) {
    if (dropdownWatchTimeout) {
      clearTimeout(dropdownWatchTimeout);
    }
    // Small delay to avoid double-fetch if handleBellClick already fired
    dropdownWatchTimeout = window.setTimeout(() => {
      notificationStore.fetchNotifications(true);
    }, 50);
  }
});

const typeRouteMap: Record<string, string> = {
  transfer: '/transfers',
  maintenance: '/maintenance',
  procurement: '/purchase-requests',
  inventory: '/inventory',
  disposal: '/asset-disposals',
};

const handleNotificationClick = (notification: Notification) => {
  const route = notification.link || typeRouteMap[notification.type];
  if (!notification.is_read) {
    notificationStore.markAsRead(notification.id);
  }
  if (route) {
    router.push(route);
    showDropdown.value = false;
  }
};

const markAsRead = (id: number) => {
  notificationStore.markAsRead(id);
};

const markAllAsRead = () => {
  notificationStore.markAllAsRead();
};

const viewAll = () => {
  showDropdown.value = false;
  router.push('/notifications');
};

const formatTime = (date: string) => {
  return moment(date).fromNow();
};
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-badge-wrap {
  position: relative;
  display: inline-flex;
}

.bell-button {
  border: none;
  background: transparent;
  color: #606266;
  font-size: 20px;
  padding: 8px;
}

.bell-button:hover {
  color: #409eff;
  background: #f5f7fa;
}

.bell-button--pulse {
  animation: bell-ring 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.bell-badge :deep(.el-badge__content) {
  border: 2px solid #fff;
  animation: badge-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes badge-pop {
  0% {
    transform: translateY(-50%) translateX(100%) scale(0.4);
  }
  60% {
    transform: translateY(-50%) translateX(100%) scale(1.25);
  }
  100% {
    transform: translateY(-50%) translateX(100%) scale(1);
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0);
  }
  15% {
    transform: rotate(-14deg);
  }
  35% {
    transform: rotate(12deg);
  }
  55% {
    transform: rotate(-8deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.notif-enter-active {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.notif-move {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-enter-from {
  opacity: 0;
  transform: translateX(14px) scale(0.98);
}

.notif-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .bell-button--pulse,
  .bell-badge :deep(.el-badge__content) {
    animation: none;
  }

  .notif-enter-active,
  .notif-leave-active,
  .notif-move {
    transition: none;
  }
}

.notification-dropdown {
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-notifications {
  padding: 40px 20px;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f7fa;
  gap: 12px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 20px;
}
.notification-icon.icon-maintenance { background: #fdf6ec; color: #e6a23c; }
.notification-icon.icon-inventory   { background: #f0f9eb; color: #67c23a; }
.notification-icon.icon-disposal    { background: #fef0f0; color: #f56c6c; }
.notification-icon.icon-transfer    { background: #ecf5ff; color: #409eff; }

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

:deep(.notification-popover) {
  padding: 0 !important;
}
</style>
