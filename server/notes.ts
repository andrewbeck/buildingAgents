import fs from "node:fs/promises";
import path from "node:path";

export interface NoteEntry {
  body: string;
  anchors: Record<string, string>;
  updatedAt: string;
}

export interface ProgressEntry {
  read: boolean;
  readAt: string | null;
}

export type NotesMap = Record<string, NoteEntry>;
export type ProgressMap = Record<string, ProgressEntry>;

interface Stores {
  notesPath: string;
  progressPath: string;
}

async function ensureFile(filePath: string, fallback: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fallback, "utf8");
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

export class Store {
  private notesPath: string;
  private progressPath: string;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(stores: Stores) {
    this.notesPath = stores.notesPath;
    this.progressPath = stores.progressPath;
  }

  async init(): Promise<void> {
    await ensureFile(this.notesPath, "{}");
    await ensureFile(this.progressPath, "{}");
  }

  async getNotes(): Promise<NotesMap> {
    return readJson<NotesMap>(this.notesPath, {});
  }

  async setNote(rel: string, entry: Omit<NoteEntry, "updatedAt">): Promise<NoteEntry> {
    const queued = this.writeQueue.then(async () => {
      const notes = await this.getNotes();
      const nextEntry: NoteEntry = {
        body: entry.body,
        anchors: entry.anchors ?? {},
        updatedAt: new Date().toISOString(),
      };
      // Strip empty notes to keep the file clean.
      if (!nextEntry.body.trim() && Object.keys(nextEntry.anchors).length === 0) {
        delete notes[rel];
      } else {
        notes[rel] = nextEntry;
      }
      await writeJsonAtomic(this.notesPath, notes);
      return nextEntry;
    });
    this.writeQueue = queued.catch(() => undefined);
    return queued;
  }

  async getProgress(): Promise<ProgressMap> {
    return readJson<ProgressMap>(this.progressPath, {});
  }

  async setProgress(rel: string, read: boolean): Promise<ProgressEntry> {
    const queued = this.writeQueue.then(async () => {
      const progress = await this.getProgress();
      if (!read) {
        delete progress[rel];
        await writeJsonAtomic(this.progressPath, progress);
        return { read: false, readAt: null };
      }
      const entry: ProgressEntry = { read: true, readAt: new Date().toISOString() };
      progress[rel] = entry;
      await writeJsonAtomic(this.progressPath, progress);
      return entry;
    });
    this.writeQueue = queued.catch(() => undefined);
    return queued;
  }
}
