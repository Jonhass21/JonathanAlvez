import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Client, Task } from "../../types";
import {
  getDueReminders,
  getOverdueTasks,
  getTodayTasks,
  isTaskOverdue,
  searchTasks,
  sortTasks,
} from "../taskFilters";
import { addDays, todayStr } from "../date";

const CLIENTS: Client[] = [
  { id: "san-lucas", name: "San Lucas", colorway: "accent" },
  { id: "kaia", name: "Kaia", colorway: "gold" },
];

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    title: "Tarea",
    description: "",
    clientId: null,
    status: "pending",
    priority: "medium",
    dueDate: null,
    dueTime: null,
    category: "Otro",
    createdAt: "2026-09-01T00:00:00.000Z",
    completedAt: null,
    ...partial,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 23, 9, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sortTasks", () => {
  it("orders by date, then time, then priority", () => {
    const order = sortTasks([
      task({ id: "c", dueDate: addDays(todayStr(), 1) }),
      task({ id: "a", dueDate: todayStr(), dueTime: "09:00" }),
      task({ id: "b", dueDate: todayStr(), dueTime: "15:00" }),
    ]).map((t) => t.id);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("puts timed tasks before untimed ones on the same day", () => {
    const order = sortTasks([
      task({ id: "untimed", dueDate: todayStr() }),
      task({ id: "timed", dueDate: todayStr(), dueTime: "18:00" }),
    ]).map((t) => t.id);
    expect(order).toEqual(["timed", "untimed"]);
  });

  it("sinks undated tasks and breaks their tie by priority", () => {
    const order = sortTasks([
      task({ id: "low", priority: "low" }),
      task({ id: "dated", dueDate: todayStr() }),
      task({ id: "high", priority: "high" }),
    ]).map((t) => t.id);
    expect(order).toEqual(["dated", "high", "low"]);
  });

  it("does not mutate its input", () => {
    const input = [
      task({ id: "b", dueDate: addDays(todayStr(), 1) }),
      task({ id: "a", dueDate: todayStr() }),
    ];
    sortTasks(input);
    expect(input.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("buckets", () => {
  // Built inside the test: `todayStr()` has to run under the fake clock.
  const build = () => [
    task({ id: "overdue", dueDate: addDays(todayStr(), -2) }),
    task({ id: "today", dueDate: todayStr() }),
    task({ id: "done", dueDate: addDays(todayStr(), -1), status: "completed" }),
  ];

  it("ignores completed tasks", () => {
    const tasks = build();
    expect(getOverdueTasks(tasks).map((t) => t.id)).toEqual(["overdue"]);
    expect(getTodayTasks(tasks).map((t) => t.id)).toEqual(["today"]);
    expect(isTaskOverdue(tasks[2])).toBe(false);
  });
});

describe("getDueReminders", () => {
  it("only returns today's timed tasks inside the window", () => {
    const tasks = [
      task({ id: "soon", dueDate: todayStr(), dueTime: "09:20" }),
      task({ id: "later", dueDate: todayStr(), dueTime: "17:00" }),
      task({ id: "passed", dueDate: todayStr(), dueTime: "08:00" }),
      task({ id: "untimed", dueDate: todayStr() }),
      task({ id: "tomorrow", dueDate: addDays(todayStr(), 1), dueTime: "09:20" }),
    ];
    expect(getDueReminders(tasks, 30).map((t) => t.id)).toEqual(["soon"]);
  });
});

describe("searchTasks", () => {
  const tasks = [
    task({ id: "reel", title: "Preparar reel", clientId: "san-lucas", category: "Contenido" }),
    task({ id: "factura", title: "Enviar factura", clientId: "kaia", category: "Administración" }),
  ];

  it("matches the title, the client name and the category", () => {
    expect(searchTasks(tasks, CLIENTS, "reel").map((t) => t.id)).toEqual(["reel"]);
    expect(searchTasks(tasks, CLIENTS, "kaia").map((t) => t.id)).toEqual(["factura"]);
    expect(searchTasks(tasks, CLIENTS, "contenido").map((t) => t.id)).toEqual(["reel"]);
  });

  it("ignores accents and case, and requires every word", () => {
    expect(searchTasks(tasks, CLIENTS, "ADMINISTRACION").map((t) => t.id)).toEqual(["factura"]);
    expect(searchTasks(tasks, CLIENTS, "enviar kaia").map((t) => t.id)).toEqual(["factura"]);
    expect(searchTasks(tasks, CLIENTS, "enviar lucas")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchTasks(tasks, CLIENTS, "   ")).toEqual([]);
  });
});
