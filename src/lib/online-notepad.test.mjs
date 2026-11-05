import assert from "node:assert/strict";
import test from "node:test";
import { countNoteLines, deleteSavedNote, loadSavedNote, replaceNoteText, saveNote } from "./online-notepad.ts";

function memoryIndexedDb({ failWrite = false } = {}) {
  const values = new Map();
  const database = {
    objectStoreNames: { contains: () => true },
    close() {},
    transaction() {
      const transaction = { error: null, oncomplete: null, onerror: null, onabort: null };
      transaction.objectStore = () => ({
        get(key) {
          const request = { result: undefined, error: null, onsuccess: null, onerror: null };
          queueMicrotask(() => { request.result = values.get(key); request.onsuccess?.(); transaction.oncomplete?.(); });
          return request;
        },
        put(value, key) {
          queueMicrotask(() => {
            if (failWrite) {
              transaction.error = new Error("Quota exceeded");
              transaction.onerror?.();
            } else {
              values.set(key, value);
              transaction.oncomplete?.();
            }
          });
        },
        delete(key) {
          queueMicrotask(() => { values.delete(key); transaction.oncomplete?.(); });
        },
      });
      return transaction;
    },
  };
  return {
    open() {
      const request = { result: database, error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
}

test("line counts handle LF, CRLF, lone CR, and the empty note", () => {
  assert.equal(countNoteLines(""), 0);
  assert.equal(countNoteLines("one"), 1);
  assert.equal(countNoteLines("one\ntwo\r\nthree\rfour"), 4);
  assert.equal(countNoteLines("one\n"), 2);
});

test("find and replace treats the search text literally and supports match-case control", () => {
  assert.deepEqual(replaceNoteText("a.b A.B", "a.b", "x"), { text: "x A.B", replacements: 1 });
  assert.deepEqual(replaceNoteText("a.b A.B", "a.b", "x", false), { text: "x x", replacements: 2 });
  assert.deepEqual(replaceNoteText("nothing", "absent", "x"), { text: "nothing", replacements: 0 });
  assert.deepEqual(replaceNoteText("unchanged", "", "x"), { text: "unchanged", replacements: 0 });
});

test("storage operations fail clearly when IndexedDB is unavailable", async () => {
  await assert.rejects(loadSavedNote(undefined), /Browser storage is unavailable/u);
  await assert.rejects(saveNote("long note 🧪" , undefined), /Browser storage is unavailable/u);
  await assert.rejects(deleteSavedNote(undefined), /Browser storage is unavailable/u);
});

test("IndexedDB repository saves, restores Unicode long notes, deletes them, and reports quota errors", async () => {
  const factory = memoryIndexedDb();
  const longNote = `${"नमस्ते 👩‍💻\n".repeat(10000)}終わり`;
  await saveNote(longNote, factory);
  assert.equal(await loadSavedNote(factory), longNote);
  assert.equal(countNoteLines(longNote), 10001);
  await deleteSavedNote(factory);
  assert.equal(await loadSavedNote(factory), "");

  await assert.rejects(saveNote("quota test", memoryIndexedDb({ failWrite: true })), /Quota exceeded/u);
});
