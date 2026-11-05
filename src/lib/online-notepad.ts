const DATABASE_NAME = "toolsfortoday-notepad";
const DATABASE_VERSION = 1;
const STORE_NAME = "notes";
const CURRENT_NOTE_KEY = "current";

function openDatabase(factory?: IDBFactory): Promise<IDBDatabase> {
  if (!factory) return Promise.reject(new Error("Browser storage is unavailable in this session."));

  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open browser storage."));
    request.onblocked = () => reject(new Error("Browser storage is busy in another tab. Close other ToolsForToday notepad tabs and retry."));
  });
}

function getBrowserFactory(): IDBFactory | undefined {
  return typeof indexedDB === "undefined" ? undefined : indexedDB;
}

export async function loadSavedNote(factory: IDBFactory | undefined = getBrowserFactory()): Promise<string> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CURRENT_NOTE_KEY);
    let result = "";
    request.onsuccess = () => { result = typeof request.result === "string" ? request.result : ""; };
    request.onerror = () => reject(request.error ?? new Error("Could not read the saved note."));
    transaction.oncomplete = () => { database.close(); resolve(result); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Could not read the saved note.")); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Reading the saved note was interrupted.")); };
  });
}

export async function saveNote(text: string, factory: IDBFactory | undefined = getBrowserFactory()): Promise<void> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(text, CURRENT_NOTE_KEY);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Could not save the note.")); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Saving the note was interrupted.")); };
  });
}

export async function deleteSavedNote(factory: IDBFactory | undefined = getBrowserFactory()): Promise<void> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(CURRENT_NOTE_KEY);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Could not delete the saved note.")); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Deleting the note was interrupted.")); };
  });
}

export function countNoteLines(text: string): number {
  return text.length === 0 ? 0 : text.split(/\r\n|\r|\n/u).length;
}

export function replaceNoteText(text: string, find: string, replacement: string, matchCase = true): { text: string; replacements: number } {
  if (!find) return { text, replacements: 0 };
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const expression = new RegExp(escaped, matchCase ? "gu" : "giu");
  let replacements = 0;
  const nextText = text.replace(expression, () => { replacements += 1; return replacement; });
  return { text: nextText, replacements };
}
