import { deleteSavedNote, loadSavedNote, saveNote } from "./online-notepad.ts";

export type NotePersistenceState = {
  revision: number;
  status: "loading" | "saved" | "saving" | "error";
  message: string;
};

type NoteStorage = {
  load: () => Promise<string>;
  save: (text: string) => Promise<void>;
  delete: () => Promise<void>;
};

type Timer = ReturnType<typeof setTimeout>;
type Scheduler = {
  setTimeout: (callback: () => void, delay: number) => Timer;
  clearTimeout: (timer: Timer) => void;
};

const browserStorage: NoteStorage = {
  load: loadSavedNote,
  save: saveNote,
  delete: deleteSavedNote,
};

const browserScheduler: Scheduler = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: (timer) => globalThis.clearTimeout(timer),
};

export class NotePersistenceCoordinator {
  private readonly storage: NoteStorage;
  private readonly scheduler: Scheduler;
  private revision = 0;
  private latestText: string | undefined;
  private persistedRevision = 0;
  private pendingTimer: Timer | undefined;
  private queue: Promise<void> = Promise.resolve();
  private readonly pendingWrites = new Map<number, Promise<void>>();
  private readonly listeners = new Set<(state: NotePersistenceState) => void>();
  private state: NotePersistenceState = {
    revision: 0,
    status: "loading",
    message: "Loading your note from this browser…",
  };

  constructor(storage: NoteStorage = browserStorage, scheduler: Scheduler = browserScheduler) {
    this.storage = storage;
    this.scheduler = scheduler;
  }

  getSnapshot(): NotePersistenceState {
    return this.state;
  }

  subscribe(listener: (state: NotePersistenceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async load(): Promise<string> {
    await this.queue;
    if (this.latestText !== undefined) return this.latestText;

    try {
      const stored = await this.storage.load();
      if (this.latestText === undefined) {
        this.latestText = stored;
        this.persistedRevision = this.revision;
        this.publish({
          revision: this.revision,
          status: "saved",
          message: "Your note is loaded from this browser.",
        });
      }
      return this.latestText;
    } catch {
      this.publish({
        revision: this.revision,
        status: "error",
        message: "Browser storage could not be opened. Your edits may not persist after this page closes.",
      });
      if (this.latestText !== undefined) return this.latestText;
      throw new Error("Browser storage could not be opened.");
    }
  }

  update(text: string): number {
    this.latestText = text;
    this.revision += 1;
    const revision = this.revision;
    this.cancelPendingTimer();
    this.publish({
      revision,
      status: "saving",
      message: "Changes will be saved in this browser shortly…",
    });
    this.pendingTimer = this.scheduler.setTimeout(() => {
      this.pendingTimer = undefined;
      void this.flush(revision);
    }, 500);
    return revision;
  }

  flush(revision = this.revision): Promise<void> {
    this.cancelPendingTimer();
    return this.persist(revision);
  }

  clear(): Promise<void> {
    this.cancelPendingTimer();
    this.latestText = "";
    this.revision += 1;
    const revision = this.revision;
    this.publish({ revision, status: "saving", message: "Deleting the saved note from this browser…" });

    return this.enqueue(async () => {
      try {
        await this.storage.delete();
        this.persistedRevision = revision;
        if (revision === this.revision) {
          this.publish({ revision, status: "saved", message: "Note cleared from this browser." });
        }
      } catch {
        if (revision === this.revision) {
          this.publish({
            revision,
            status: "error",
            message: "The note was cleared on screen, but its saved copy could not be deleted.",
          });
        }
        throw new Error("Could not delete the saved note from browser storage.");
      }
    });
  }

  private persist(revision: number): Promise<void> {
    if (revision === this.persistedRevision) return this.queue;
    const pendingWrite = this.pendingWrites.get(revision);
    if (pendingWrite) return pendingWrite;
    const text = this.latestText ?? "";

    const write = this.enqueue(async () => {
      if (revision !== this.revision) return;
      this.publish({ revision, status: "saving", message: "Saving in this browser…" });
      try {
        await this.storage.save(text);
        this.persistedRevision = revision;
        if (revision === this.revision) {
          this.publish({ revision, status: "saved", message: "Saved in this browser." });
        }
      } catch {
        if (revision === this.revision) {
          this.publish({
            revision,
            status: "error",
            message: "Could not save to browser storage. Copy or download your note before leaving this page.",
          });
        }
        throw new Error("Could not save the note to browser storage.");
      }
    });
    this.pendingWrites.set(revision, write);
    void write.then(
      () => { if (this.pendingWrites.get(revision) === write) this.pendingWrites.delete(revision); },
      () => { if (this.pendingWrites.get(revision) === write) this.pendingWrites.delete(revision); },
    );
    return write;
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private cancelPendingTimer(): void {
    if (this.pendingTimer === undefined) return;
    this.scheduler.clearTimeout(this.pendingTimer);
    this.pendingTimer = undefined;
  }

  private publish(state: NotePersistenceState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }
}

export const notePersistence = new NotePersistenceCoordinator();
