// Proof files for checklist items. Kept in IndexedDB (browser only): files are too big for localStorage.
export type Proof = {
  id: string;
  programId: string;
  programName: string;
  obligationId: string;
  obligationTitle: string;
  item: string;
  comment: string;
  savedAt: string; // ISO date-time
  file: File;
};

const STORE = "irodymai";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("paramos-sargas", 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    // Resolve on commit, not on request success, so a write is really on disk.
    tx.oncomplete = () => (db.close(), resolve(req.result));
    tx.onerror = tx.onabort = () => (db.close(), reject(tx.error ?? req.error));
  });
}

export const listProofs = () => run<Proof[]>("readonly", (s) => s.getAll());
export const saveProof = (p: Proof) => run("readwrite", (s) => s.put(p));
export const deleteProof = (id: string) => run("readwrite", (s) => s.delete(id));
