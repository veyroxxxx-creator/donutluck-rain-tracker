import { INDEXED_DB_NAME, INDEXED_DB_STORE, INDEXED_DB_KEY } from '@/lib/constants';

export interface StoredSound {
  blob: Blob;
  name: string;
  type: string;
  storedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(INDEXED_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
        db.createObjectStore(INDEXED_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

/** Persists the user's uploaded alarm sound locally. Never leaves the browser. */
export async function saveCustomSound(file: File): Promise<void> {
  const db = await openDb();
  const record: StoredSound = {
    blob: file,
    name: file.name,
    type: file.type,
    storedAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
    tx.objectStore(INDEXED_DB_STORE).put(record, INDEXED_DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save sound'));
  });
  db.close();
}

export async function loadCustomSound(): Promise<StoredSound | null> {
  const db = await openDb();
  const result = await new Promise<StoredSound | null>((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE, 'readonly');
    const req = tx.objectStore(INDEXED_DB_STORE).get(INDEXED_DB_KEY);
    req.onsuccess = () => resolve((req.result as StoredSound) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to load sound'));
  });
  db.close();
  return result;
}

export async function deleteCustomSound(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
    tx.objectStore(INDEXED_DB_STORE).delete(INDEXED_DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete sound'));
  });
  db.close();
}
