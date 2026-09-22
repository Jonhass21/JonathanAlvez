import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Client, Task } from "../../types";
import { friendlyDate } from "../../utils/date";
import { getUpcomingTasks, isTaskOverdue, sortTasks } from "../../utils/taskFilters";
import { cn } from "../../utils/cn";

const COLORWAY_DOT: Record<Client["colorway"], string> = {
  accent: "bg-accent",
  gold: "bg-gold",
  neutral: "bg-ink-tertiary",
};

export function ClientCard({ client, tasks }: { client: Client; tasks: Task[] }) {
  const pending = tasks.filter((t) => t.status !== "completed");
  const overdueCount = pending.filter(isTaskOverdue).length;
  const next = sortTasks(pending)[0] ?? getUpcomingTasks(tasks)[0] ?? null;

  return (
    <Link
      to={`/clientes/${client.id}`}
      className="flex items-center gap-3 rounded-xl2 border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", COLORWAY_DOT[client.colorway])} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">{client.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-ink-secondary">
          {next ? (
            <>
              {next.title} · {friendlyDate(next.dueDate)}
            </>
          ) : (
            "Sin tareas pendientes"
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {overdueCount > 0 && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent-text">
            {overdueCount} vencida{overdueCount === 1 ? "" : "s"}
          </span>
        )}
        <span className="text-[12px] text-ink-tertiary">{pending.length}</span>
        <ChevronRight size={15} className="text-ink-tertiary" />
      </div>
    </Link>
  );
}
