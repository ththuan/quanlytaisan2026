import api from './api';

const isSupported = (): boolean =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

export const pushSupported = (): boolean => isSupported();

export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

export const subscribePush = async (): Promise<void> => {
  if (!isSupported()) {
    throw new Error('Thiết bị/trình duyệt không hỗ trợ thông báo đẩy');
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isIOS && !standalone) {
    throw new Error('Trên iPhone/iPad, hãy thêm ứng dụng vào Màn hình chính rồi bật thông báo đẩy');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Bạn chưa cho phép nhận thông báo');
  }

  const keyResponse: any = await api.get('/notifications/push/public-key');
  const publicKey = keyResponse?.data?.publicKey || keyResponse?.publicKey;
  if (!publicKey) {
    throw new Error('Máy chủ chưa cấu hình thông báo đẩy');
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const existingKey = subscription.options?.applicationServerKey;
    const existingBytes = existingKey ? new Uint8Array(existingKey) : null;
    const matches = existingBytes
      && existingBytes.length === applicationServerKey.length
      && existingBytes.every((value, index) => value === applicationServerKey[index]);

    if (!matches) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  }

  await api.post('/notifications/push/subscribe', subscription.toJSON());
};

export const unsubscribePush = async (): Promise<void> => {
  if (!isSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await api.post('/notifications/push/unsubscribe', { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
};

export default { pushSupported, getPushSubscription, subscribePush, unsubscribePush };
