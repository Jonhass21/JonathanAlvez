import { AlertTriangle, Clock, Send } from "lucide-react";
import type { Task } from "../../types";
import { useAppData } from "../../context/AppDataContext";
import { useMinuteTick } from "../../hooks/useMinuteTick";
import { useNotificationService } from "../../hooks/useNotificationService";
import { formatMinutesLabel, minutesUntil } from "../../utils/date";
import { getDueReminders } from "../../utils/taskFilters";

/**
 * The reminder surface: what is about to happen, and what already slipped.
 * Everything here is what a scheduled Telegram job would send once the real
 * integration exists — the "Avisar" buttons run the same message builders.
 */
export function NotificationCenter({ overdue }: { overdue: Task[] }) {
  const { tasks, settings, clientById } = useAppData();
  const notifications = useNotificationService();
  useMinuteTick(); // keeps the countdown current

  const reminders = settings.reminders ? getDueReminders(tasks, settings.reminderLeadMinutes) : [];
  const showOverdue = settings.overdueAlerts && overdue.length > 0;

  if (reminders.length === 0 && !showOverdue) return null;

  return (
    <div className="flex flex-col gap-2">
      {reminders.map((task) => {
        const minutes = minutesUntil(task.dueDate as string, task.dueTime as string);
        const client = clientById(task.clientId);
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-xl2 border border-gold/35 bg-gold/[0.07] px-3.5 py-2.5"
          >
            <Clock size={15} className="shrink-0 text-gold" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink">{formatMinutesLabel(minutes)}</p>
              <p className="truncate text-[12.5px] text-ink-secondary">
                {task.title}
                {client ? ` · ${client.name}` : ""}
              </p>
            </div>
            <button
              onClick={() => notifications.sendTaskReminder(task)}
              className="shrink-0 rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
              aria-label={`Enviar recordatorio de "${task.title}"`}
              title="Enviar recordatorio"
            >
              <Send size={13} />
            </button>
          </div>
        );
      })}

      {showOverdue && (
        <div className="flex items-center gap-3 rounded-xl2 border border-accent/35 bg-accent/[0.06] px-3.5 py-2.5">
          <AlertTriangle size={15} className="shrink-0 text-accent-text" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[12.5px] text-ink-secondary">
            <span className="font-semibold text-ink">
              {overdue.length} tarea{overdue.length === 1 ? "" : "s"} vencida
              {overdue.length === 1 ? "" : "s"}
            </span>{" "}
            sin completar.
          </p>
          <button
            onClick={() => notifications.sendOverdueTasks(overdue)}
            className="shrink-0 rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Enviar aviso de tareas vencidas"
            title="Enviar aviso"
          >
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
