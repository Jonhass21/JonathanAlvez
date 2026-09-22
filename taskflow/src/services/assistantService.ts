// Rule-based responder over local data. No real LLM call — this is the seam
// where an OpenAI request would go later, taking the same (question, tasks,
// clients) input and returning the same kind of plain-text answer.

import type { Client, Task } from "../types";
import { fold } from "./taskParser";
import { addDays, formatTime, friendlyDate, getWeekDates, todayStr } from "../utils/date";
import { getOverdueTasks, getTodayTasks, getTasksForDate, sortTasks } from "../utils/taskFilters";

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

function taskLine(task: Task, clients: Client[], withClient = true): string {
  const client = clients.find((c) => c.id === task.clientId);
  const when = task.dueDate
    ? `${friendlyDate(task.dueDate)}${task.dueTime ? ` ${formatTime(task.dueTime)}` : ""}`
    : "sin fecha";
  return `• ${task.title}${withClient && client ? ` (${client.name})` : ""} — ${when}`;
}

function list(tasks: Task[], clients: Client[], withClient = true): string {
  return tasks.map((t) => taskLine(t, clients, withClient)).join("\n");
}

function findMentionedClient(folded: string, clients: Client[]): Client | null {
  const sorted = [...clients].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((c) => folded.includes(fold(c.name))) ?? null;
}

export function answerQuestion(question: string, tasks: Task[], clients: Client[]): string {
  const q = fold(question);
  const open = tasks.filter((t) => t.status !== "completed");

  // A client mention narrows everything else, so resolve it first.
  const client = findMentionedClient(q, clients);
  if (client) {
    const clientTasks = open.filter((t) => t.clientId === client.id);
    if (/vencid/.test(q)) {
      const overdue = getOverdueTasks(clientTasks);
      return overdue.length === 0
        ? `No tenés nada vencido de ${client.name}.`
        : `De ${client.name} tenés ${plural(overdue.length, "tarea vencida", "tareas vencidas")}:\n\n${list(overdue, clients, false)}`;
    }
    if (/\bhoy\b/.test(q)) {
      const today = getTodayTasks(clientTasks);
      return today.length === 0
        ? `Hoy no tenés nada de ${client.name}.`
        : `Hoy tenés ${plural(today.length, "tarea", "tareas")} de ${client.name}:\n\n${list(today, clients, false)}`;
    }
    if (clientTasks.length === 0) return `No tenés tareas pendientes de ${client.name}.`;
    return `Tenés ${plural(clientTasks.length, "tarea pendiente", "tareas pendientes")} de ${client.name}:\n\n${list(sortTasks(clientTasks), clients, false)}`;
  }

  if (/vencid|atrasad/.test(q)) {
    const overdue = getOverdueTasks(tasks);
    return overdue.length === 0
      ? "No tenés tareas vencidas. Vas al día."
      : `Tenés ${plural(overdue.length, "tarea vencida", "tareas vencidas")}:\n\n${list(overdue, clients)}`;
  }

  if (/(hice|complet|termin|cerre)/.test(q)) {
    const week = new Set(getWeekDates(todayStr()));
    const done = tasks.filter(
      (t) => t.status === "completed" && t.completedAt && week.has(t.completedAt.slice(0, 10))
    );
    return done.length === 0
      ? "Todavía no marcaste tareas como completadas esta semana."
      : `Esta semana completaste ${plural(done.length, "tarea", "tareas")}:\n\n${list(done, clients)}`;
  }

  if (/\bmanana\b/.test(q)) {
    const tomorrow = getTasksForDate(open, addDays(todayStr(), 1));
    return tomorrow.length === 0
      ? "Mañana no tenés nada agendado."
      : `Mañana tenés ${plural(tomorrow.length, "tarea", "tareas")}:\n\n${list(tomorrow, clients)}`;
  }

  if (/\bhoy\b/.test(q)) {
    const today = getTodayTasks(tasks);
    return today.length === 0
      ? "No tenés tareas para hoy. Buen momento para adelantar algo."
      : `Hoy tenés ${plural(today.length, "tarea", "tareas")}:\n\n${list(today, clients)}`;
  }

  if (/semana/.test(q)) {
    const week = new Set(getWeekDates(todayStr()));
    const weekTasks = sortTasks(open.filter((t) => t.dueDate && week.has(t.dueDate)));
    return weekTasks.length === 0
      ? "No tenés nada agendado para esta semana."
      : `Esta semana tenés ${plural(weekTasks.length, "tarea", "tareas")}:\n\n${list(weekTasks, clients)}`;
  }

  if (/pendient|que tengo|falta|proxim/.test(q)) {
    const pending = sortTasks(open).slice(0, 8);
    return pending.length === 0
      ? "No tenés tareas pendientes. Estás al día."
      : `Tus próximas tareas:\n\n${list(pending, clients)}`;
  }

  return [
    "No entendí esa. Probá con algo así:",
    "",
    "• ¿Qué tengo hoy?",
    "• ¿Qué tengo pendiente de Kaia?",
    "• ¿Qué tareas están vencidas?",
    "• ¿Qué hice esta semana?",
  ].join("\n");
}
