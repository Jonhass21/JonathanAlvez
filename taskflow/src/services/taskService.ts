// Every function here returns a Promise even though it's backed by
// localStorage today. That's deliberate: when this moves to Supabase, the call
// sites in components/hooks don't need to change shape.

import type { NewTaskDraft, Task, TaskStatus } from "../types";
import { generateId } from "../utils/id";
import { KEYS, readJSON, writeJSON } from "./storage";
import { buildMockTasks } from "../data/mockData";

function loadAll(): Task[] {
  return readJSON<Task[]>(KEYS.tasks, []);
}

function saveAll(tasks: Task[]): void {
  writeJSON(KEYS.tasks, tasks);
}

export async function ensureSeeded(): Promise<void> {
  if (readJSON<boolean>(KEYS.seeded, false)) return;
  saveAll(buildMockTasks());
  writeJSON(KEYS.seeded, true);
}

export async function listTasks(): Promise<Task[]> {
  return loadAll();
}

export async function createTask(draft: NewTaskDraft): Promise<Task> {
  const task: Task = {
    ...draft,
    title: draft.title.trim(),
    id: generateId("task"),
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  saveAll([...loadAll(), task]);
  return task;
}

/** Used by undo: puts a deleted task back exactly as it was, id included. */
export async function restoreTask(task: Task): Promise<Task> {
  const all = loadAll();
  if (all.some((t) => t.id === task.id)) return task;
  saveAll([...all, task]);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const all = loadAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  saveAll(all);
  return all[idx];
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task | null> {
  return updateTask(id, {
    status,
    completedAt: status === "completed" ? new Date().toISOString() : null,
  });
}

export async function deleteTask(id: string): Promise<void> {
  saveAll(loadAll().filter((t) => t.id !== id));
}

/** Detaches a client's tasks instead of deleting them when the client goes away. */
export async function unassignClient(clientId: string): Promise<void> {
  saveAll(loadAll().map((t) => (t.clientId === clientId ? { ...t, clientId: null } : t)));
}

export async function resetToMockData(): Promise<void> {
  saveAll(buildMockTasks());
  writeJSON(KEYS.seeded, true);
}
