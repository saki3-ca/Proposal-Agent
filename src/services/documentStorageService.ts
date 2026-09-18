import { LibraryDocumentItem } from './documentLibraryData';
import { ProjectDocument } from '../types';

const DB_NAME = 'acnabin_proposal_agent_db';
const DB_VERSION = 1;
const STORE_LIBRARY_DOCS = 'library_documents';
const STORE_PROJECT_DOCS = 'project_documents';

/**
 * Native IndexedDB Wrapper for persistent document storage
 * Handles large markdown extracts, raw file data, and metadata without 5MB localStorage quota limits.
 */
export class DocumentStorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_LIBRARY_DOCS)) {
          db.createObjectStore(STORE_LIBRARY_DOCS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PROJECT_DOCS)) {
          db.createObjectStore(STORE_PROJECT_DOCS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Check if a document is a duplicate by comparing filename and size (in MB / bytes).
   */
  static isDuplicate(
    newFile: { name: string; size: number },
    existingDocs: { fileName: string; fileSizeMb?: number }[]
  ): boolean {
    const newName = newFile.name.trim().toLowerCase();
    const newSizeMb = parseFloat((newFile.size / (1024 * 1024)).toFixed(2));

    return existingDocs.some((doc) => {
      const existingName = (doc.fileName || '').trim().toLowerCase();
      const existingSizeMb = doc.fileSizeMb || 0;
      const namesMatch = existingName === newName;
      const sizeMatch = Math.abs(existingSizeMb - newSizeMb) < 0.02 || existingSizeMb === newSizeMb;
      return namesMatch && sizeMatch;
    });
  }

  /**
   * Filter out duplicate documents from an existing array
   */
  static deduplicateDocuments<T extends { fileName: string; fileSizeMb?: number }>(docs: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const doc of docs) {
      const key = `${(doc.fileName || '').trim().toLowerCase()}__${(doc.fileSizeMb || 0).toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(doc);
      }
    }

    return result;
  }

  /**
   * Load all library documents from IndexedDB
   */
  static async loadLibraryDocuments(): Promise<LibraryDocumentItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LIBRARY_DOCS, 'readonly');
        const store = tx.objectStore(STORE_LIBRARY_DOCS);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(req.result || []);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DocumentStorageService] Fallback reading library documents:', e);
      return [];
    }
  }

  /**
   * Save all library documents to IndexedDB
   */
  static async saveLibraryDocuments(docs: LibraryDocumentItem[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_LIBRARY_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_LIBRARY_DOCS);

      // Clear old entries and insert current list
      store.clear();
      for (const doc of docs) {
        store.put(doc);
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('[DocumentStorageService] Error saving library documents:', e);
    }
  }

  /**
   * Put a single document or update existing
   */
  static async saveSingleLibraryDocument(doc: LibraryDocumentItem): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_LIBRARY_DOCS, 'readwrite');
      tx.objectStore(STORE_LIBRARY_DOCS).put(doc);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('[DocumentStorageService] Error saving single doc:', e);
    }
  }

  /**
   * Delete a single document from IndexedDB
   */
  static async deleteLibraryDocument(docId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_LIBRARY_DOCS, 'readwrite');
      tx.objectStore(STORE_LIBRARY_DOCS).delete(docId);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('[DocumentStorageService] Error deleting doc:', e);
    }
  }
}
