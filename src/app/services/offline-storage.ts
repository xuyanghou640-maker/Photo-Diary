import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DiaryEntry } from '../components/diary-entry-form';

interface PhotoDiaryDB extends DBSchema {
  entries: {
    key: string;
    value: DiaryEntry;
    indexes: { 'by-date': string };
  };
  pending_actions: {
    key: number;
    value: PendingAction;
    autoIncrement: true;
  };
}

export interface PendingAction {
  id?: number;
  type: 'create' | 'update' | 'delete';
  payload: any;
  targetGroups: string[]; // To know where to sync
  timestamp: number;
}

const DB_NAME = 'photo-diary-db';
const DB_VERSION = 1;

class OfflineStorage {
  private dbPromise: Promise<IDBPDatabase<PhotoDiaryDB>>;

  constructor() {
    this.dbPromise = openDB<PhotoDiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Entries store
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('by-date', 'date');

        // Pending actions store for sync
        db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
      },
    });
  }

  async saveEntry(entry: DiaryEntry): Promise<void> {
    const db = await this.dbPromise;
    await db.put('entries', entry);
  }

  async saveEntries(entries: DiaryEntry[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('entries', 'readwrite');
    await Promise.all(entries.map(entry => tx.store.put(entry)));
    await tx.done;
  }

  async getEntries(): Promise<DiaryEntry[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('entries', 'by-date');
  }

  async getEntry(id: string): Promise<DiaryEntry | undefined> {
    const db = await this.dbPromise;
    return db.get('entries', id);
  }

  async deleteEntry(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('entries', id);
  }

  async addPendingAction(action: Omit<PendingAction, 'id'>): Promise<number> {
    const db = await this.dbPromise;
    return db.add('pending_actions', action as PendingAction);
  }

  async getPendingActions(): Promise<PendingAction[]> {
    const db = await this.dbPromise;
    return db.getAll('pending_actions');
  }

  async removePendingAction(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('pending_actions', id);
  }

  async clearPendingActions(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('pending_actions');
  }
}

export const offlineStorage = new OfflineStorage();
