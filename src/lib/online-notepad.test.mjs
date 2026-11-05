import assert from "node:assert/strict";
import test from "node:test";
import { countNoteLines, deleteSavedNote, loadSavedNote, replaceNoteText, saveNote } from "./online-notepad.ts";
import { NotePersistenceCoordinator } from "./online-notepad-persistence.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function fakeScheduler() {
  let nextId = 1;
  let now = 0;
  const timers = new Map();
  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    async advance(milliseconds) {
      now += milliseconds;
      while (true) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= now).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        due[1].callback();
        await Promise.resolve();
      }
    },
  };
}

function harness({ initial = "", save, remove } = {}) {
  const clock = fakeScheduler();
  const values = { current: initial };
  const writes = [];
  const storage = {
    async load() { return values.current; },
    async save(text) {
      writes.push(text);
      if (save) await save(text, writes.length);
      values.current = text;
    },
    async delete() {
      if (remove) await remove();
      values.current = undefined;
    },
  };
  const coordinator = new NotePersistenceCoordinator(storage, clock);
  return { coordinator, clock, values, writes };
}

async function settle(coordinator) {
  await coordinator.flush();
  await Promise.resolve();
}

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

test("debounced autosave writes after the 500 ms editing pause", async () => {
  const h = harness();
  await h.coordinator.load();
  h.coordinator.update("autosaved");
  await h.clock.advance(499);
  assert.deepEqual(h.writes, []);
  await h.clock.advance(1);
  await settle(h.coordinator);
  assert.deepEqual(h.writes, ["autosaved"]);
  assert.equal(h.values.current, "autosaved");
});

test("navigation before 500 ms flushes the latest edit", async () => {
  const h = harness();
  await h.coordinator.load();
  h.coordinator.update("edited immediately before navigation");
  const navigationFlush = h.coordinator.flush();
  await navigationFlush;
  assert.equal(h.values.current, "edited immediately before navigation");
});

test("an immediate remount waits for an in-flight navigation flush", async () => {
  const write = deferred();
  const h = harness({ save: () => write.promise });
  await h.coordinator.load();
  h.coordinator.update("latest on unmount");
  const flush = h.coordinator.flush();
  await Promise.resolve();
  const remountedValue = h.coordinator.load();
  write.resolve();
  await flush;
  assert.equal(await remountedValue, "latest on unmount");
  assert.equal(h.values.current, "latest on unmount");
});

test("a newer edit during an in-flight save is serialized after it", async () => {
  const first = deferred();
  const second = deferred();
  const h = harness({ save: (_text, count) => count === 1 ? first.promise : second.promise });
  await h.coordinator.load();
  h.coordinator.update("older");
  const olderFlush = h.coordinator.flush();
  await Promise.resolve();
  h.coordinator.update("newer");
  const newerFlush = h.coordinator.flush();
  first.resolve();
  await Promise.resolve();
  second.resolve();
  await Promise.all([olderFlush, newerFlush]);
  assert.deepEqual(h.writes, ["older", "newer"]);
  assert.equal(h.values.current, "newer");
});

test("rapid consecutive edits reset debounce and write only the last value", async () => {
  const h = harness();
  await h.coordinator.load();
  h.coordinator.update("first");
  await h.clock.advance(200);
  h.coordinator.update("second");
  await h.clock.advance(200);
  h.coordinator.update("final");
  await h.clock.advance(499);
  assert.deepEqual(h.writes, []);
  await h.clock.advance(1);
  await settle(h.coordinator);
  assert.deepEqual(h.writes, ["final"]);
});

test("serialized persistence prevents out-of-order completion from restoring stale text", async () => {
  const first = deferred();
  const second = deferred();
  const secondStarted = deferred();
  const h = harness({ save: (_text, count) => {
    if (count === 1) return first.promise;
    secondStarted.resolve();
    return second.promise;
  } });
  await h.coordinator.load();
  h.coordinator.update("first revision");
  const firstFlush = h.coordinator.flush();
  await Promise.resolve();
  h.coordinator.update("second revision");
  const secondFlush = h.coordinator.flush();
  first.resolve();
  await secondStarted.promise;
  assert.equal(h.writes.length, 2);
  second.resolve();
  await Promise.all([firstFlush, secondFlush]);
  assert.equal(h.values.current, "second revision");
});

test("clear cancels a pending debounce and deletes after any started save", async () => {
  const h = harness({ initial: "old note" });
  await h.coordinator.load();
  h.coordinator.update("edited note");
  await h.coordinator.clear();
  await h.clock.advance(500);
  assert.equal(h.values.current, undefined);
  assert.equal(await h.coordinator.load(), "");
});

test("clear queues deletion behind a save that is already in flight", async () => {
  const write = deferred();
  const h = harness({ initial: "old note", save: () => write.promise });
  await h.coordinator.load();
  h.coordinator.update("edited note");
  const save = h.coordinator.flush();
  await Promise.resolve();
  const deletion = h.coordinator.clear();
  write.resolve();
  await Promise.all([save, deletion]);
  assert.equal(h.values.current, undefined);
  assert.equal(h.coordinator.getSnapshot().message, "Note cleared from this browser.");
});

test("New Note writes blank content after earlier pending edits", async () => {
  const h = harness({ initial: "old note" });
  await h.coordinator.load();
  h.coordinator.update("edited old note");
  h.coordinator.update("");
  await h.clock.advance(500);
  await settle(h.coordinator);
  assert.deepEqual(h.writes, [""]);
  assert.equal(h.values.current, "");
});

test("New Note queues the blank note after an in-flight previous save", async () => {
  const oldWrite = deferred();
  const blankWrite = deferred();
  const h = harness({ save: (_text, count) => count === 1 ? oldWrite.promise : blankWrite.promise });
  await h.coordinator.load();
  h.coordinator.update("old note");
  const oldFlush = h.coordinator.flush();
  await Promise.resolve();
  h.coordinator.update("");
  const blankFlush = h.coordinator.flush();
  oldWrite.resolve();
  await Promise.resolve();
  blankWrite.resolve();
  await Promise.all([oldFlush, blankFlush]);
  assert.deepEqual(h.writes, ["old note", ""]);
  assert.equal(h.values.current, "");
});

test("clear failure keeps the note blank in memory and announces the deletion failure", async () => {
  const h = harness({ initial: "saved note", remove: async () => { throw new Error("storage denied"); } });
  await h.coordinator.load();
  await assert.rejects(h.coordinator.clear(), /Could not delete/u);
  assert.equal(await h.coordinator.load(), "");
  assert.equal(h.coordinator.getSnapshot().status, "error");
  assert.match(h.coordinator.getSnapshot().message, /could not be deleted/u);
});

test("quota failure keeps current text available and reports storage failure", async () => {
  const h = harness({ save: async () => { throw new Error("QuotaExceededError"); } });
  await h.coordinator.load();
  h.coordinator.update("keep this in the editor");
  await assert.rejects(h.coordinator.flush(), /Could not save/u);
  assert.equal(await h.coordinator.load(), "keep this in the editor");
  assert.equal(h.coordinator.getSnapshot().status, "error");
  assert.match(h.coordinator.getSnapshot().message, /Copy or download/u);
});

test("a later edit recovers after a temporary storage failure", async () => {
  let fail = true;
  const h = harness({ save: async () => { if (fail) throw new Error("temporary failure"); } });
  await h.coordinator.load();
  h.coordinator.update("first attempt");
  await assert.rejects(h.coordinator.flush());
  fail = false;
  h.coordinator.update("recovered note");
  await h.coordinator.flush();
  assert.equal(h.values.current, "recovered note");
  assert.equal(h.coordinator.getSnapshot().status, "saved");
});

test("shared coordinator preserves a note across unmount flush and remount", async () => {
  const h = harness();
  await h.coordinator.load();
  h.coordinator.update("route change value");
  const unmountFlush = h.coordinator.flush();
  const remountedLoad = h.coordinator.load();
  await Promise.all([unmountFlush, remountedLoad]);
  assert.equal(await remountedLoad, "route change value");
  assert.equal(h.values.current, "route change value");
});

test("Saved is not announced until IndexedDB's write promise completes", async () => {
  const write = deferred();
  const h = harness({ save: () => write.promise });
  await h.coordinator.load();
  h.coordinator.update("pending write");
  const saving = h.coordinator.flush();
  await Promise.resolve();
  assert.equal(h.coordinator.getSnapshot().status, "saving");
  assert.notEqual(h.coordinator.getSnapshot().message, "Saved in this browser.");
  write.resolve();
  await saving;
  assert.equal(h.coordinator.getSnapshot().status, "saved");
});

test("repeated navigation flushes share one pending write", async () => {
  const write = deferred();
  const h = harness({ save: () => write.promise });
  await h.coordinator.load();
  h.coordinator.update("one write for this revision");
  const firstFlush = h.coordinator.flush();
  const secondFlush = h.coordinator.flush();
  await Promise.resolve();
  assert.deepEqual(h.writes, ["one write for this revision"]);
  write.resolve();
  await Promise.all([firstFlush, secondFlush]);
  assert.deepEqual(h.writes, ["one write for this revision"]);
});

test("text replacement result can be persisted through the same note lifecycle", async () => {
  const h = harness({ initial: "replace this phrase" });
  await h.coordinator.load();
  const result = replaceNoteText("replace this phrase", "replace", "updated");
  h.coordinator.update(result.text);
  await h.coordinator.flush();
  assert.equal(h.values.current, "updated this phrase");
});
