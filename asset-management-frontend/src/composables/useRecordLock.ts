import { computed, onBeforeUnmount, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  recordLockService,
  type RecordLockEntity,
  type RecordLockInfo,
} from '@/services/recordLock.service';

/**
 * Giữ khóa mềm khi mở form sửa/duyệt hồ sơ.
 * Nếu người khác đang giữ khóa, API trả 409 và UI hiển thị cảnh báo.
 */
export function useRecordLock(entityType: RecordLockEntity) {
  const lock = ref<RecordLockInfo | null>(null);
  const busy = ref(false);
  let heartbeatTimer: number | null = null;
  let lockedId: number | null = null;

  const lockedByOther = computed(() => Boolean(lock.value?.locked && !lock.value?.mine));
  const lockedByName = computed(() => {
    const user = lock.value?.locked_by;
    return user?.fullname || user?.username || 'người khác';
  });

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const startHeartbeat = (entityId: number, token?: string) => {
    stopHeartbeat();
    if (!token) return;
    heartbeatTimer = window.setInterval(async () => {
      try {
        await recordLockService.heartbeat(entityType, entityId, token);
      } catch {
        stopHeartbeat();
      }
    }, 4 * 60 * 1000);
  };

  async function claim(entityId: number): Promise<boolean> {
    if (!entityId || busy.value) return false;
    busy.value = true;
    try {
      const response = await recordLockService.claim(entityType, entityId);
      lock.value = response.data;
      lockedId = entityId;
      startHeartbeat(entityId, response.data.lock_token);
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Hồ sơ đang được người khác xử lý';
      ElMessage.warning({ message, duration: 5000, showClose: true });
      return false;
    } finally {
      busy.value = false;
    }
  }

  async function release(): Promise<void> {
    stopHeartbeat();
    if (!lockedId) return;
    const entityId = lockedId;
    lockedId = null;
    try {
      await recordLockService.release(entityType, entityId);
    } catch {
      // Không chặn thao tác đóng form nếu mất khóa.
    } finally {
      lock.value = null;
    }
  }

  async function refreshStatus(entityId: number): Promise<void> {
    try {
      const response = await recordLockService.status(entityType, entityId);
      lock.value = response.data;
    } catch {
      lock.value = null;
    }
  }

  onBeforeUnmount(() => {
    stopHeartbeat();
    if (lockedId) {
      const entityId = lockedId;
      lockedId = null;
      void recordLockService.release(entityType, entityId).catch(() => undefined);
    }
  });

  return {
    lock,
    busy,
    lockedByOther,
    lockedByName,
    claim,
    release,
    refreshStatus,
  };
}
