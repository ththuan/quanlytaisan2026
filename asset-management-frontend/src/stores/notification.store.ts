import { defineStore } from 'pinia';
import api from '../services/api';
import { useAuthStore } from './auth.store';

export interface Notification {
  id: number;
  type: 'transfer' | 'maintenance' | 'procurement' | 'inventory' | 'disposal' | 'report' | 'request' | 'system';
  title: string;
  message: string;
  status?: string;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  // Giữ tương thích với dữ liệu cũ (nếu có)
  transfer_id?: number;
  maintenance_id?: number;
  report_id?: number;
  disposal_id?: number;
  asset?: { id: number; asset_code: string; name: string };
  department?: { id: number; name: string };
  from_department?: { id: number; name: string };
  to_department?: { id: number; name: string };
  requester?: { id: number; fullname: string; username?: string };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isFetching: boolean;
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    lastFetchTime: null,
    isFetching: false,
  }),

  getters: {
    pendingTransfers: (state) => state.notifications.filter((n) => n.type === 'transfer' && !n.is_read),
    pendingMaintenances: (state) => state.notifications.filter((n) => n.type === 'maintenance' && !n.is_read),
    pendingInventory: (state) => state.notifications.filter((n) => n.type === 'inventory' && !n.is_read),
    pendingDisposals: (state) => state.notifications.filter((n) => n.type === 'disposal' && !n.is_read),
    totalPending: (state) => state.unreadCount,
  },

  actions: {
    async fetchNotifications(force = false) {
      if (this.isFetching && !force) return;

      const now = Date.now();
      if (!force && this.lastFetchTime && now - this.lastFetchTime < 10000) return;

      this.isFetching = true;
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        if (!authStore.user) {
          this.notifications = [];
          this.unreadCount = 0;
          this.lastFetchTime = now;
          return;
        }

        const response: any = await api.get('/notifications', { params: { limit: 50 } });
        const items: Notification[] = response?.data?.items || [];
        this.notifications = items;
        this.unreadCount = response?.data?.unread_count ?? items.filter((n) => !n.is_read).length;
        this.lastFetchTime = now;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Không thể tải thông báo';
        console.error('Error fetching notifications:', error);
        this.lastFetchTime = now;
      } finally {
        this.loading = false;
        this.isFetching = false;
      }
    },

    async markAsRead(notificationId: number) {
      const item = this.notifications.find((n) => n.id === notificationId);
      if (!item || item.is_read) return;

      item.is_read = true;
      item.read_at = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);

      try {
        await api.post(`/notifications/${notificationId}/read`);
      } catch {
        // Nếu lỗi, tải lại để đồng bộ trạng thái thật
        this.fetchNotifications(true);
      }
    },

    async markAllAsRead() {
      this.notifications.forEach((n) => {
        n.is_read = true;
        n.read_at = n.read_at || new Date().toISOString();
      });
      this.unreadCount = 0;

      try {
        await api.post('/notifications/read-all');
      } catch {
        this.fetchNotifications(true);
      }
    },

    clearNotifications() {
      this.notifications = [];
      this.unreadCount = 0;
    },
  },
});
