import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import logger from '../utils/logger';
import { PushSubscription } from '../models';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let configured = false;
let vapidKeys: VapidKeys | null = null;

const KEYS_FILE = path.resolve(process.cwd(), 'storage/vapid-keys.json');

function loadOrCreateKeys(): VapidKeys {
  const envPublic = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const envPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (envPublic && envPrivate) {
    return { publicKey: envPublic, privateKey: envPrivate };
  }

  try {
    if (fs.existsSync(KEYS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      if (parsed?.publicKey && parsed?.privateKey) {
        return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
      }
    }
  } catch (error) {
    logger.warn('[push] Không đọc được file VAPID, sẽ tạo mới:', error);
  }

  const generated = webpush.generateVAPIDKeys();
  try {
    fs.mkdirSync(path.dirname(KEYS_FILE), { recursive: true });
    // flag 'wx': chỉ một PM2 worker tạo được file, các worker khác đọc lại
    // để tránh mỗi worker dùng một cặp VAPID key khác nhau.
    fs.writeFileSync(KEYS_FILE, JSON.stringify(generated, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
    });
    logger.info('[push] Đã tạo VAPID keys tại storage/vapid-keys.json');
    return generated;
  } catch (error: any) {
    if (error?.code === 'EEXIST') {
      try {
        const parsed = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        if (parsed?.publicKey && parsed?.privateKey) {
          return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
        }
      } catch {
        // đọc lỗi → dùng tạm key vừa tạo
      }
    }
    logger.warn('[push] Không lưu được VAPID keys (dùng tạm trong bộ nhớ):', error);
    return generated;
  }
}

export function initWebPush(): VapidKeys | null {
  try {
    if (!vapidKeys) vapidKeys = loadOrCreateKeys();
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@quanlytaisan.local';
    webpush.setVapidDetails(subject, vapidKeys.publicKey, vapidKeys.privateKey);
    configured = true;
    return vapidKeys;
  } catch (error) {
    logger.warn('[push] Không cấu hình được Web Push:', error);
    return null;
  }
}

export function getVapidPublicKey(): string | null {
  if (!configured && !initWebPush()) return null;
  return vapidKeys?.publicKey || null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Gửi push tới tất cả thiết bị đã đăng ký của danh sách user. */
export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0 || !initWebPush()) return;

  try {
    const subscriptions = await PushSubscription.findAll({
      where: { user_id: userIds },
    });
    if (subscriptions.length === 0) return;

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/notifications',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag,
    });

    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            body
          );
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.destroy({ where: { id: subscription.id } }).catch(() => undefined);
          } else {
            logger.warn('[push] Gửi thông báo thất bại:', error?.message || error);
          }
        }
      })
    );
  } catch (error) {
    logger.warn('[push] Lỗi gửi push:', error);
  }
}

export default { initWebPush, getVapidPublicKey, sendPushToUsers };
