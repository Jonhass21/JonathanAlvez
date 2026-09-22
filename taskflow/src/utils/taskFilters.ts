import type { Client, Task, TaskPriority } from "../types";
import { compareDateStr, isPast, isToday, minutesUntil, todayStr } from "./date";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      const cmp = compareDateStr(a.dueDate, b.dueDate);
      if (cmp !== 0) return cmp;
      if (a.dueTime && b.dueTime) {
        const byTime = a.dueTime.localeCompare(b.dueTime);
        if (byTime !== 0) return byTime;
      } else if (a.dueTime) {
        return -1;
      } else if (b.dueTime) {
        return 1;
      }
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}

const isOpen = (t: Task) => t.status !== "completed";

export function getOverdueTasks(tasks: Task[]): Task[] {
  return sortTasks(tasks.filter((t) => isOpen(t) && t.dueDate && isPast(t.dueDate)));
}

export function getTodayTasks(tasks: Task[]): Task[] {
  return sortTasks(tasks.filter((t) => isOpen(t) && t.dueDate && isToday(t.dueDate)));
}

export function getUpcomingTasks(tasks: Task[]): Task[] {
  return sortTasks(
    tasks.filter((t) => isOpen(t) && t.dueDate && !isPast(t.dueDate) && !isToday(t.dueDate))
  );
}

export function getTasksForDate(tasks: Task[], dateStr: string): Task[] {
  return sortTasks(tasks.filter((t) => t.dueDate === dateStr));
}

export function getNextUpTask(tasks: Task[]): Task | null {
  return getUpcomingTasks(tasks)[0] ?? null;
}

/**
 * Today's tasks that have a time and are inside the reminder window — this is
 * what the "⏰ En 30 minutos" strip on Inicio renders, and what a scheduled job
 * would iterate over once Telegram is wired up.
 */
export function getDueReminders(tasks: Task[], leadMinutes: number): Task[] {
  return getTodayTasks(tasks)
    .filter((t) => t.dueTime)
    .map((t) => ({
      task: t,
      minutes: minutesUntil(t.dueDate as string, t.dueTime as string),
    }))
    .filter(({ minutes }) => minutes >= 0 && minutes <= leadMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .map(({ task }) => task);
}

export function countByPriority(tasks: Task[]): Record<TaskPriority, number> {
  return tasks.reduce(
    (acc, t) => {
      acc[t.priority] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<TaskPriority, number>
  );
}

export function isTaskOverdue(task: Task): boolean {
  return isOpen(task) && Boolean(task.dueDate) && isPast(task.dueDate as string);
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Matches title, category and client name — what the ⌘K palette searches. */
export function searchTasks(tasks: Task[], clients: Client[], query: string): Task[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const clientName = new Map(clients.map((c) => [c.id, normalize(c.name)]));
  return sortTasks(
    tasks.filter((t) => {
      const haystack = [
        normalize(t.title),
        normalize(t.description),
        normalize(t.category),
        t.clientId ? (clientName.get(t.clientId) ?? "") : "",
      ].join(" ");
      return q.split(/\s+/).every((word) => haystack.includes(word));
    })
  );
}

export { todayStr };
