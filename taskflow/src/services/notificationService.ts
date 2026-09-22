// Placeholder for Telegram / WhatsApp delivery.
//
// The message bodies are built here, in the same plain-text shape a Bot API
// `sendMessage` call takes, and only the last step (actually sending) is
// simulated with a toast. When the real integration lands, replace the body of
// `deliver()` with the HTTP call — every call site and every message stays put.

import type { AppSettings, Client, Task, ToastMessage } from "../types";
import { formatTime, friendlyDate } from "../utils/date";
import { countByPriority, sortTasks } from "../utils/taskFilters";

export type NotificationChannel = "telegram" | "whatsapp";

type NotifyFn = (toast: Omit<ToastMessage, "id">) => void;

export interface NotificationPayload {
  channel: NotificationChannel;
  text: string;
}

function activeChannels(settings: AppSettings): NotificationChannel[] {
  const channels: NotificationChannel[] = [];
  if (settings.channels.telegram) channels.push("telegram");
  if (settings.channels.whatsapp) channels.push("whatsapp");
  return channels;
}

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

function taskLine(task: Task, clients: Client[]): string {
  const client = clients.find((c) => c.id === task.clientId);
  const when = task.dueTime ? ` — ${formatTime(task.dueTime)}` : "";
  return `• ${client ? `${client.name}: ` : ""}${task.title}${when}`;
}

export function buildDailySummaryMessage(tasks: Task[], clients: Client[], name: string): string {
  if (tasks.length === 0) return `Buen día, ${name}. Hoy no tenés tareas agendadas.`;
  const counts = countByPriority(tasks);
  const sorted = sortTasks(tasks);
  return [
    `Buen día, ${name}.`,
    `Hoy tenés ${tasks.length} tarea${tasks.length === 1 ? "" : "s"}.`,
    "",
    `${counts.high} de prioridad alta · ${counts.medium} normales · ${counts.low} sin apuro`,
    "",
    "Primera tarea:",
    taskLine(sorted[0], clients),
  ].join("\n");
}

export function buildTaskReminderMessage(task: Task, clients: Client[]): string {
  const client = clients.find((c) => c.id === task.clientId);
  const when = task.dueTime ? ` a las ${formatTime(task.dueTime)}` : "";
  return `Recordatorio${when}: ${task.title}${client ? ` (${client.name})` : ""}`;
}

export function buildOverdueMessage(tasks: Task[], clients: Client[]): string {
  if (tasks.length === 0) return "No tenés tareas vencidas.";
  return [
    `Tenés ${tasks.length} tarea${tasks.length === 1 ? "" : "s"} vencida${tasks.length === 1 ? "" : "s"}:`,
    "",
    ...tasks.map((t) => `${taskLine(t, clients)} (${friendlyDate(t.dueDate)})`),
  ].join("\n");
}

export function createNotificationService(
  notify: NotifyFn,
  settings: AppSettings,
  clients: Client[]
) {
  /**
   * The seam. Today: a toast. Tomorrow:
   *   await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { ... })
   *   await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, { ... })
   */
  function deliver(title: string, text: string, tone: ToastMessage["tone"]): NotificationPayload[] {
    const channels = activeChannels(settings);
    if (channels.length === 0) {
      notify({
        title: "No hay canales activos",
        description: "Activá Telegram o WhatsApp en Configuración para recibir avisos.",
        tone: "warning",
      });
      return [];
    }
    notify({
      title,
      description: `Simulado por ${channels.map((c) => CHANNEL_LABEL[c]).join(" y ")} · ${text.split("\n")[0]}`,
      tone,
    });
    return channels.map((channel) => ({ channel, text }));
  }

  return {
    sendDailySummary(todayTasks: Task[], name = "Jona") {
      if (!settings.dailySummary) {
        notify({
          title: "El resumen diario está desactivado",
          tone: "warning",
        });
        return [];
      }
      return deliver(
        "Resumen diario enviado",
        buildDailySummaryMessage(todayTasks, clients, name),
        "success"
      );
    },
    sendTaskReminder(task: Task) {
      if (!settings.reminders) {
        notify({
          title: "Los recordatorios están desactivados",
          tone: "warning",
        });
        return [];
      }
      return deliver("Recordatorio enviado", buildTaskReminderMessage(task, clients), "default");
    },
    sendOverdueTasks(overdue: Task[]) {
      if (!settings.overdueAlerts) {
        notify({
          title: "Los avisos de vencidas están desactivados",
          tone: "warning",
        });
        return [];
      }
      return deliver("Aviso de vencidas enviado", buildOverdueMessage(overdue, clients), "warning");
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
