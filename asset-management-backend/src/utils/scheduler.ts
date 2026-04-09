/**
 * Scheduler đơn giản không cần thư viện ngoài.
 * Chạy backup database lúc 2:00 AM hàng ngày và tự dọn file cũ hơn 7 ngày.
 */
import logger from './logger';
import systemAdminService from '../services/systemAdmin.service';

const BACKUP_HOUR = 2;       // 2:00 AM
const RETENTION_DAYS = 7;    // giữ backup trong 7 ngày

/** Tính số ms đến lần chạy tiếp theo (giờ BACKUP_HOUR hôm nay hoặc ngày mai). */
function msUntilNextRun(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(BACKUP_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function runDailyJob() {
  try {
    logger.info('[Scheduler] Bắt đầu backup tự động hàng ngày...');
    const result = await systemAdminService.createBackup();
    if (result.success) {
      logger.info(`[Scheduler] Backup thành công: ${result.filename}`);
    } else {
      logger.error(`[Scheduler] Backup thất bại: ${result.message}`);
    }

    const deleted = await systemAdminService.deleteOldBackups(RETENTION_DAYS);
    if (deleted > 0) {
      logger.info(`[Scheduler] Đã xóa ${deleted} file backup cũ hơn ${RETENTION_DAYS} ngày`);
    }
  } catch (error) {
    logger.error('[Scheduler] Lỗi không xử lý được trong backup tự động:', error);
  } finally {
    // Luôn lên lịch cho ngày hôm sau dù có lỗi hay không
    schedule();
  }
}

function schedule() {
  const ms = msUntilNextRun();
  const nextRun = new Date(Date.now() + ms);
  logger.info(`[Scheduler] Backup tiếp theo lúc: ${nextRun.toLocaleString('vi-VN')}`);
  setTimeout(runDailyJob, ms).unref();
}

export function startScheduler() {
  schedule();
}
