<template>
  <div class="notifications-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Hộp thư thông báo</h3>
          <div style="display: flex; gap: 8px;">
            <el-button :icon="Refresh" :loading="loading" @click="refresh">Làm mới</el-button>
            <el-button
              v-if="store.notifications.length > 0"
              type="primary"
              plain
              @click="markAllRead"
            >
              Đánh dấu tất cả đã đọc
            </el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!loading && store.notifications.length === 0" description="Không có thông báo nào đang chờ" />

      <div v-else class="notification-list">
        <div
          v-for="n in store.notifications"
          :key="n.id"
          class="notification-item"
          @click="handleClick(n)"
        >
          <div class="notif-icon" :class="typeColor(n.type)">
            <el-icon :size="22"><component :is="typeIcon(n.type)" /></el-icon>
          </div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-meta">
              <span v-if="n.asset">
                <el-icon><Box /></el-icon> {{ n.asset.asset_code }} — {{ n.asset.name }}
              </span>
              <span v-if="n.department"> &nbsp;|&nbsp; {{ n.department.name }}</span>
              <span class="notif-time">{{ formatDate(n.created_at) }}</span>
            </div>
          </div>
          <div class="notif-actions">
            <el-tag size="small" :type="typeTagColor(n.type)">{{ typeLabel(n.type) }}</el-tag>
            <el-button
              size="small"
              text
              title="Đánh dấu đã đọc"
              @click.stop="markRead(n.id)"
            >
              <el-icon><Check /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="loading" v-loading="true" style="min-height: 120px;" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Refresh, Check, Box, Switch, Tools, Notebook, DeleteFilled, Document, Warning } from '@element-plus/icons-vue';
import { useNotificationStore } from '@/stores/notification.store';
import type { Notification } from '@/stores/notification.store';

const store = useNotificationStore();
const router = useRouter();
const loading = store.loading;

const refresh = () => store.fetchNotifications(true);
const markRead = (id: number) => store.markAsRead(id);
const markAllRead = () => store.markAllAsRead();

const handleClick = (n: Notification) => {
  if (n.type === 'transfer' && n.transfer_id) router.push('/transfers');
  else if (n.type === 'maintenance' && n.maintenance_id) router.push('/maintenance');
  else if (n.type === 'disposal' && n.disposal_id) router.push('/asset-disposals');
  else if (n.type === 'report' && n.report_id) router.push('/reports');
  else if (n.type === 'inventory') router.push('/inventory');
  else if (n.type === 'procurement') router.push('/procurements');
};

const typeIcon = (type: string) => {
  const map: Record<string, any> = {
    transfer: Switch,
    maintenance: Tools,
    inventory: Notebook,
    disposal: DeleteFilled,
    report: Warning,
    procurement: Document,
    request: Document,
  };
  return map[type] || Box;
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    transfer: 'Điều chuyển',
    maintenance: 'Bảo trì',
    inventory: 'Kiểm kê',
    disposal: 'Thanh lý',
    report: 'Báo hỏng',
    procurement: 'Mua sắm',
    request: 'Yêu cầu',
  };
  return map[type] || type;
};

const typeColor = (type: string) => {
  const map: Record<string, string> = {
    transfer: 'color-transfer',
    maintenance: 'color-maintenance',
    inventory: 'color-inventory',
    disposal: 'color-disposal',
    report: 'color-report',
    procurement: 'color-procurement',
  };
  return map[type] || 'color-default';
};

const typeTagColor = (type: string): any => {
  const map: Record<string, string> = {
    transfer: 'primary',
    maintenance: 'warning',
    disposal: 'danger',
    report: 'danger',
    inventory: 'success',
    procurement: 'info',
  };
  return map[type] || '';
};

const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

onMounted(() => store.fetchNotifications(true));
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; }
.notification-list { display: flex; flex-direction: column; gap: 12px; }

.notification-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.notification-item:hover { background: #f9fafb; }

.notif-icon {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.color-transfer   { background: #dbeafe; color: #2563eb; }
.color-maintenance{ background: #fef3c7; color: #d97706; }
.color-inventory  { background: #d1fae5; color: #059669; }
.color-disposal   { background: #fee2e2; color: #dc2626; }
.color-report     { background: #fee2e2; color: #dc2626; }
.color-procurement{ background: #e0e7ff; color: #4f46e5; }
.color-default    { background: #f3f4f6; color: #6b7280; }

.notif-body { flex: 1; min-width: 0; }
.notif-title { font-weight: 600; font-size: 0.95rem; color: #111827; margin-bottom: 4px; }
.notif-message { font-size: 0.875rem; color: #4b5563; margin-bottom: 6px; }
.notif-meta { font-size: 0.78rem; color: #9ca3af; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.notif-time { margin-left: auto; }

.notif-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
</style>
