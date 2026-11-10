import inventoryService from '@/services/inventory.service';

const DB_NAME = 'qlts-offline';
const DB_VERSION = 1;
const SNAPSHOT_STORE = 'snapshots';
const QUEUE_STORE = 'queue';

export interface OfflineSnapshot {
  key: string;
  reportId: number;
  roundId: number;
  round: any;
  report: any;
  assets: any[];
  categories: any[];
  cachedAt: number;
}

export interface OfflineDetailAction {
  key: string;
  op: 'add' | 'update';
  reportId: number;
  assetId: number;
  detailId?: number;
  data: any;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

export const cacheInventorySnapshot = async (snapshot: OfflineSnapshot): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put({ ...snapshot, cachedAt: Date.now() });
    await transactionDone(tx);
  } catch {
    // IndexedDB có thể bị chặn ở chế độ riêng tư; bỏ qua.
  }
};

export const getInventorySnapshot = async (
  reportId?: number
): Promise<OfflineSnapshot | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOT_STORE);
    if (reportId) {
      const item = await requestToPromise<OfflineSnapshot | undefined>(store.get(`report:${reportId}`));
      await transactionDone(tx);
      return item || null;
    }
    const all = await requestToPromise<OfflineSnapshot[]>(store.getAll());
    await transactionDone(tx);
    if (!all.length) return null;
    return all.sort((a, b) => b.cachedAt - a.cachedAt)[0];
  } catch {
    return null;
  }
};

export const enqueueDetailAction = async (
  action: Omit<OfflineDetailAction, 'key' | 'createdAt'>
): Promise<OfflineDetailAction> => {
  const key = action.detailId && action.detailId > 0
    ? `r${action.reportId}:d${action.detailId}`
    : `r${action.reportId}:a${action.assetId}`;
  const record: OfflineDetailAction = {
    ...action,
    key,
    createdAt: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).put(record);
    await transactionDone(tx);
  } catch {
    // bỏ qua
  }
  return record;
};

export const getOfflineQueue = async (): Promise<OfflineDetailAction[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const all = await requestToPromise<OfflineDetailAction[]>(tx.objectStore(QUEUE_STORE).getAll());
    await transactionDone(tx);
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
};

export const getOfflineQueueCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const count = await requestToPromise<number>(tx.objectStore(QUEUE_STORE).count());
    await transactionDone(tx);
    return count;
  } catch {
    return 0;
  }
};

const removeQueueItems = async (keys: string[]): Promise<void> => {
  if (!keys.length) return;
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  keys.forEach((key) => store.delete(key));
  await transactionDone(tx);
};

const resolveOfflineImages = async (
  data: any,
  imageCache: Map<string, string>
): Promise<any> => {
  const imageUrls = Array.isArray(data?.image_urls) ? data.image_urls : [];
  if (imageUrls.length === 0) return data;

  const resolved: string[] = [];
  for (const url of imageUrls) {
    if (typeof url === 'string' && url.startsWith('data:')) {
      const cached = imageCache.get(url);
      if (cached) {
        resolved.push(cached);
      } else {
        const uploaded = await inventoryService.uploadImageDataUrl(url);
        imageCache.set(url, uploaded);
        resolved.push(uploaded);
      }
    } else {
      resolved.push(url);
    }
  }
  return { ...data, image_urls: resolved };
};

export interface OfflineSyncResult {
  synced: number;
  remaining: number;
  error?: string;
}

/** Đồng bộ các thao tác kiểm kê đã lưu offline lên server. */
export const syncOfflineInventoryQueue = async (): Promise<OfflineSyncResult> => {
  if (!navigator.onLine) {
    return { synced: 0, remaining: await getOfflineQueueCount(), error: 'offline' };
  }

  const actions = await getOfflineQueue();
  if (actions.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  const imageCache = new Map<string, string>();
  try {
    // Cập nhật các detail đã có trên server trước.
    const updates = actions.filter((action) => action.op === 'update' && action.detailId);
    for (const action of updates) {
      const data = await resolveOfflineImages(action.data, imageCache);
      await inventoryService.updateDetail(action.reportId, action.detailId as number, data);
      await removeQueueItems([action.key]);
      synced += 1;
    }

    // Thêm mới theo lô, gom theo báo cáo.
    const adds = actions.filter((action) => action.op === 'add');
    const byReport = new Map<number, OfflineDetailAction[]>();
    for (const action of adds) {
      const list = byReport.get(action.reportId) || [];
      list.push(action);
      byReport.set(action.reportId, list);
    }

    for (const [reportId, reportActions] of byReport.entries()) {
      const items = [];
      for (const action of reportActions) {
        const data = await resolveOfflineImages(action.data, imageCache);
        items.push({ asset_id: action.assetId, ...data });
      }
      await inventoryService.addDetailsBulk(reportId, items);
      await removeQueueItems(reportActions.map((action) => action.key));
      synced += reportActions.length;
    }

    return { synced, remaining: await getOfflineQueueCount() };
  } catch (error: any) {
    return {
      synced,
      remaining: await getOfflineQueueCount(),
      error: error?.response?.data?.message || error?.message || 'Không thể đồng bộ',
    };
  }
};
