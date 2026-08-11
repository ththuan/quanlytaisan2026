import { defineStore } from 'pinia';
import api from '../services/api';
import { useAuthStore } from './auth.store';

export interface Notification {
  id: number;
  type: 'transfer' | 'maintenance' | 'procurement' | 'inventory' | 'disposal' | 'report' | 'request';
  title: string;
  message: string;
  status: string;
  created_at: string;
  transfer_id?: number;
  maintenance_id?: number;
  report_id?: number;
  disposal_id?: number;
  asset?: {
    id: number;
    asset_code: string;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  from_department?: {
    id: number;
    name: string;
  };
  to_department?: {
    id: number;
    name: string;
  };
  requester?: {
    id: number;
    fullname: string;
    username?: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isFetching: boolean;
  retryDelay: number;
  dismissedNotifications: Set<string>; // Store dismissed notification keys
}

// Helper to generate unique key for notification
function getNotificationKey(notification: Notification): string {
  // Use type + related ID to uniquely identify a notification
  if (notification.transfer_id) return `transfer-${notification.transfer_id}`;
  if (notification.maintenance_id) return `maintenance-${notification.maintenance_id}`;
  if (notification.report_id) return `report-${notification.report_id}`;
  if (notification.disposal_id) return `disposal-${notification.disposal_id}`;
  return `notification-${notification.id}`;
}

// Load dismissed notifications from localStorage (permanent)
function loadDismissedNotifications(): Set<string> {
  try {
    const stored = localStorage.getItem('dismissed_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Object.keys(parsed));
    }
  } catch (e) {
    console.error('Error loading dismissed notifications:', e);
  }
  return new Set();
}

// Save dismissed notifications to localStorage
function saveDismissedNotifications(dismissed: Set<string>) {
  try {
    const obj: Record<string, number> = {};
    dismissed.forEach(key => {
      obj[key] = Date.now();
    });
    localStorage.setItem('dismissed_notifications', JSON.stringify(obj));
  } catch (e) {
    console.error('Error saving dismissed notifications:', e);
  }
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    lastFetchTime: null,
    isFetching: false,
    retryDelay: 60000,
    dismissedNotifications: loadDismissedNotifications(),
  }),

  getters: {
    pendingTransfers: (state) => state.notifications.filter(n => n.type === 'transfer'),
    pendingMaintenances: (state) => state.notifications.filter(n => n.type === 'maintenance'),
    pendingInventory: (state) => state.notifications.filter(n => n.type === 'inventory'),
    pendingDisposals: (state) => state.notifications.filter(n => n.type === 'disposal'),
    totalPending: (state) => state.notifications.length,
  },

  actions: {
    async fetchNotifications(force = false) {
      if (this.isFetching && !force) return;

      const now = Date.now();
      if (!force && this.lastFetchTime && (now - this.lastFetchTime) < 10000) return;

      this.isFetching = true;
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const user = authStore.user;

        if (!user) {
          this.notifications = [];
          this.unreadCount = 0;
          this.lastFetchTime = now;
          return;
        }

        const response: any = await api.get('/notifications/pending-approvals');
        const items: Notification[] = response?.data || response || [];

        // Filter out dismissed notifications
        const filteredItems = items.filter(item => {
          const key = getNotificationKey(item);
          return !this.dismissedNotifications.has(key);
        });

        this.notifications = filteredItems;
        this.unreadCount = filteredItems.length;
        this.lastFetchTime = now;
        this.retryDelay = 60000;
      } catch (error: any) {
        if (error.response?.status === 429) {
          this.retryDelay = Math.min(this.retryDelay * 2, 300000);
          this.error = `Quá nhiều yêu cầu. Sẽ thử lại sau ${Math.round(this.retryDelay / 1000)} giây`;
        } else {
          this.error = error.response?.data?.message || 'Không thể tải thông báo';
          console.error('Error fetching notifications:', error);
        }
        this.lastFetchTime = now;
      } finally {
        this.loading = false;
        this.isFetching = false;
      }
    },

    async markAsRead(notificationId: number) {
      // Find notification and add to dismissed set
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        const key = getNotificationKey(notification);
        this.dismissedNotifications.add(key);
        saveDismissedNotifications(this.dismissedNotifications);
      }
      
      // Remove from current list
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.unreadCount = this.notifications.length;
    },

    async markAllAsRead() {
      // Add all current notifications to dismissed set
      this.notifications.forEach(notification => {
        const key = getNotificationKey(notification);
        this.dismissedNotifications.add(key);
      });
      saveDismissedNotifications(this.dismissedNotifications);
      
      // Clear current list
      this.notifications = [];
      this.unreadCount = 0;
    },

    clearNotifications() {
      this.notifications = [];
      this.unreadCount = 0;
    },

    clearDismissedNotifications() {
      this.dismissedNotifications.clear();
      saveDismissedNotifications(this.dismissedNotifications);
      // Refresh to show all notifications again
      this.fetchNotifications(true);
    },
  },
});
