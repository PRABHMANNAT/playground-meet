export type LocalRecording = {
  id: string;
  scope: string;
  title: string;
  started: number;
  lastWrite?: number;
  finished?: boolean;
  mime: string;
};

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('playground-meet-recordings', 1);
      open.onupgradeneeded = () => {
        const db = open.result;
        db.createObjectStore('recordings', { keyPath: 'id' }).createIndex('scope', 'scope');
        db.createObjectStore('chunks');
      };
      open.onsuccess = () => {
        const db = open.result;
        db.onversionchange = () => {
          db.close();
          database = undefined;
        };
        resolve(db);
      };
      open.onerror = () => {
        database = undefined;
        reject(open.error);
      };
    });
  }
  return database;
}

function committed(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Local storage is unavailable.'));
  });
}
function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
const chunkRange = (id: string) => IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]);

export async function appendRecordingChunk(
  recording: LocalRecording,
  sequence: number,
  blob: Blob,
) {
  const db = await openDatabase();
  const tx = db.transaction(['recordings', 'chunks'], 'readwrite');
  const rows = tx.objectStore('recordings');
  if (sequence > 0 && !(await result(rows.getKey(recording.id))))
    throw new Error('Local recording was removed.');
  rows.put({ ...recording, lastWrite: Date.now() });
  tx.objectStore('chunks').add(blob, [recording.id, sequence]);
  await committed(tx);
}
export async function finishRecording(recording: LocalRecording) {
  const db = await openDatabase();
  const tx = db.transaction('recordings', 'readwrite');
  const rows = tx.objectStore('recordings');
  if (await result(rows.getKey(recording.id))) rows.put({ ...recording, finished: true });
  await committed(tx);
}
export async function localRecordings(scope: string): Promise<LocalRecording[]> {
  const db = await openDatabase();
  const rows = await result<LocalRecording[]>(
    db.transaction('recordings').objectStore('recordings').index('scope').getAll(scope),
  );
  return rows.sort((a, b) => b.started - a.started);
}
export async function downloadRecording(recording: LocalRecording) {
  const db = await openDatabase();
  const chunks = await result<Blob[]>(
    db.transaction('chunks').objectStore('chunks').getAll(chunkRange(recording.id)),
  );
  if (!chunks.length) throw new Error('There is no recorded video to download.');
  const url = URL.createObjectURL(new Blob(chunks, { type: recording.mime }));
  const link = document.createElement('a');
  const title = recording.title.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80) || 'Meeting';
  const timestamp = new Date(recording.started).toISOString().replace(/[:.]/g, '-');
  link.download = title + '-' + timestamp + (recording.mime.includes('mp4') ? '.mp4' : '.webm');
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export async function deleteRecording(id: string) {
  const db = await openDatabase();
  const tx = db.transaction(['recordings', 'chunks'], 'readwrite');
  const rows = tx.objectStore('recordings');
  const item = await result<LocalRecording | undefined>(rows.get(id));
  if (item && !item.finished && Date.now() - (item.lastWrite ?? 0) < 60000)
    throw new Error('Stop recording before deleting this local copy.');
  rows.delete(id);
  tx.objectStore('chunks').delete(chunkRange(id));
  await committed(tx);
}
