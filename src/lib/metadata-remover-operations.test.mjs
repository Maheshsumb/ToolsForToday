import assert from "node:assert/strict";
import test from "node:test";
import { MetadataSelectionGuard } from "./metadata-remover-operations.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("a delayed inspection cannot replace the latest file selection", async () => {
  const guard = new MetadataSelectionGuard();
  const fileA = deferred();
  const fileB = deferred();
  let displayedFile = "empty";
  const errors = [];
  let busy = false;

  const selectionA = guard.beginSelection();
  busy = true;
  const inspectionA = guard.run(selectionA, () => fileA.promise, {
    onSuccess: (result) => { displayedFile = result; },
    onError: (error) => errors.push(error),
    onFinally: () => { busy = false; },
  });

  const selectionB = guard.beginSelection();
  busy = true;
  const inspectionB = guard.run(selectionB, () => fileB.promise, {
    onSuccess: (result) => { displayedFile = result; },
    onError: (error) => errors.push(error),
    onFinally: () => { busy = false; },
  });
  fileB.resolve("file B inspection");
  await inspectionB;
  assert.equal(displayedFile, "file B inspection");
  assert.equal(busy, false);

  fileA.resolve("stale file A inspection");
  await inspectionA;
  assert.equal(displayedFile, "file B inspection");
  assert.deepEqual(errors, []);
});

test("processing a previous selection cannot publish its output under the next file", async () => {
  const guard = new MetadataSelectionGuard();
  const processingA = deferred();
  const selectionA = guard.beginSelection();
  const outputs = [];
  const errors = [];
  let busy = true;
  assert.equal(guard.beginProcessing(selectionA), true);
  assert.equal(guard.beginProcessing(selectionA), false, "duplicate processing for the same selection is rejected");
  const oldProcess = guard.run(selectionA, () => processingA.promise, {
    onSuccess: (result) => outputs.push(result),
    onError: (error) => errors.push(error),
    onFinally: () => { guard.endProcessing(selectionA); busy = false; },
  });

  const selectionB = guard.beginSelection();
  outputs.push("file B verified output");
  busy = false;
  processingA.resolve("stale file A output");
  await oldProcess;
  assert.deepEqual(outputs, ["file B verified output"]);
  assert.deepEqual(errors, []);
  assert.equal(busy, false);
  assert.equal(guard.isCurrent(selectionB), true);
});

test("clearing selection invalidates in-flight processing and preserves the cleared state", async () => {
  const guard = new MetadataSelectionGuard();
  const processing = deferred();
  const selection = guard.beginSelection();
  let selectedFile = "synthetic.webp";
  let output = "previous verified output";
  let error = "";
  let busy = true;
  assert.equal(guard.beginProcessing(selection), true);
  const oldProcess = guard.run(selection, () => processing.promise, {
    onSuccess: (result) => { output = result; },
    onError: (reason) => { error = String(reason); },
    onFinally: () => { guard.endProcessing(selection); busy = false; },
  });

  guard.beginSelection();
  selectedFile = "";
  output = "";
  error = "";
  busy = false;
  processing.resolve("late output");
  await oldProcess;
  assert.equal(selectedFile, "");
  assert.equal(output, "");
  assert.equal(error, "");
  assert.equal(busy, false);
});

test("current failures leave the selected file and last verified output consistent", async () => {
  const guard = new MetadataSelectionGuard();
  const selection = guard.beginSelection();
  let selectedFile = "current.webp";
  let output = "last verified bytes";
  let error = "";
  let busy = true;
  assert.equal(guard.beginProcessing(selection), true);
  await guard.run(selection, async () => { throw new Error("Synthetic processing failure"); }, {
    onSuccess: (result) => { output = result; },
    onError: (reason) => { error = reason instanceof Error ? reason.message : "unknown"; },
    onFinally: () => { guard.endProcessing(selection); busy = false; },
  });
  assert.equal(selectedFile, "current.webp");
  assert.equal(output, "last verified bytes");
  assert.equal(error, "Synthetic processing failure");
  assert.equal(busy, false);
});

test("a stale rejection cannot replace the current selection's error state", async () => {
  const guard = new MetadataSelectionGuard();
  const failureA = deferred();
  const first = guard.beginSelection();
  let displayedError = "";
  const oldInspection = guard.run(first, () => failureA.promise, {
    onSuccess: () => {},
    onError: (reason) => { displayedError = String(reason); },
  });
  const second = guard.beginSelection();
  displayedError = "";
  failureA.reject(new Error("stale error"));
  await oldInspection;
  assert.equal(guard.isCurrent(second), true);
  assert.equal(displayedError, "");
});
