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
        <el-badge
          :value="unreadCount"
          :hidden="unreadCount === 0"
          :max="99"
        >
          <el-button
            :icon="Bell"
            circle
            class="bell-button"
            @click="handleBellClick"
          />
        </el-badge>
      </template>

      <div class="notification-dropdown">
        <div class="notification-header">
          <h3>Thông báo</h3>
          <el-button
            v-if="unreadCount > 0"
            text
            size="small"
            @click="markAllAsRead"
          >
            Đánh dấu đã đọc tất cả
          </el-button>
        </div>

        <div
          v-loading="notificationStore.loading"
          class="notification-list"
        >
          <div
            v-if="notificationStore.notifications.length === 0"
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
                text
                size="small"
                :icon="Close"
                @click.stop="markAsRead(notification.id)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="notificationStore.notifications.length > 0"
          class="notification-footer"
        >
          <el-button
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
import moment from 'moment';

const router = useRouter();
const notificationStore = useNotificationStore();

const showDropdown = ref(false);
let refreshInterval: number | null = null;

const unreadCount = computed(() => notificationStore.unreadCount);

onMounted(() => {
  // Fetch notifications immediately on mount
  notificationStore.fetchNotifications(true);
  
  // Refresh every 30 seconds to catch approvals by other users quickly
  refreshInterval = window.setInterval(() => {
    notificationStore.fetchNotifications();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
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
  const route = typeRouteMap[notification.type];
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

:deep(.el-badge__content) {
  border: 2px solid #fff;
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
