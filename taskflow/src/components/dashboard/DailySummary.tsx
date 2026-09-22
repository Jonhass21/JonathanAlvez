import { Send, Sun } from "lucide-react";
import type { Task } from "../../types";
import { useAppData } from "../../context/AppDataContext";
import { useNotificationService } from "../../hooks/useNotificationService";
import { countByPriority, sortTasks } from "../../utils/taskFilters";
import { formatTime } from "../../utils/date";

/**
 * The block that will later be delivered as the 08:30 Telegram message.
 * `notificationService.buildDailySummaryMessage` renders the same content as
 * text, so what Jona reads here is what the bot would send.
 */
export function DailySummary({ todayTasks }: { todayTasks: Task[] }) {
  const { clientById, settings } = useAppData();
  const notifications = useNotificationService();
  const counts = countByPriority(todayTasks);
  const first = sortTasks(todayTasks)[0] ?? null;
  const firstClient = first ? clientById(first.clientId) : null;

  return (
    <section className="rounded-xl2 border border-border bg-base-soft p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Sun size={14} className="text-gold" aria-hidden="true" />
          Resumen de hoy
        </h2>
        <button
          onClick={() => notifications.sendDailySummary(todayTasks)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <Send size={12} />
          Enviar ahora
        </button>
      </div>

      <p className="text-[13px] text-ink-secondary">
        {todayTasks.length === 0
          ? "Hoy no tenés tareas agendadas."
          : `Hoy tenés ${todayTasks.length} tarea${todayTasks.length === 1 ? "" : "s"}.`}
      </p>

      {todayTasks.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-secondary">
          <span>
            <span className="font-semibold text-accent-text">{counts.high}</span> de prioridad alta
          </span>
          <span>
            <span className="font-semibold text-gold">{counts.medium}</span> normales
          </span>
          <span>
            <span className="font-semibold text-ink-tertiary">{counts.low}</span> sin apuro
          </span>
        </div>
      )}

      {first && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-tertiary">
            Primera tarea
          </p>
          <p className="mt-1 text-[13px] text-ink">
            {firstClient ? `${firstClient.name} · ` : ""}
            {first.title}
            {first.dueTime ? ` — ${formatTime(first.dueTime)}` : ""}
          </p>
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-ink-tertiary">
        Se enviaría a las {settings.summaryTime} por{" "}
        {settings.channels.telegram && settings.channels.whatsapp
          ? "Telegram y WhatsApp"
          : settings.channels.telegram
            ? "Telegram"
            : settings.channels.whatsapp
              ? "WhatsApp"
              : "ningún canal activo"}
        .
      </p>
    </section>
  );
}
