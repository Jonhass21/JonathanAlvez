import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { WeekStrip } from "../components/calendar/WeekStrip";
import { MonthGrid } from "../components/calendar/MonthGrid";
import { TaskList } from "../components/tasks/TaskList";
import { PageSkeleton } from "../components/common/PageSkeleton";
import { addDays, addMonths, longDateLabel, monthLabel, todayStr } from "../utils/date";
import { getTasksForDate } from "../utils/taskFilters";
import { cn } from "../utils/cn";

type ViewMode = "week" | "month";

export default function CalendarPage() {
  const { tasks, loading } = useAppData();
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(todayStr());
  const [selected, setSelected] = useState(todayStr());

  if (loading) return <PageSkeleton />;

  // Months step by month, not by 30 days — otherwise the arrows drift and skip
  // February entirely when the anchor lands on a 31st.
  function step(direction: 1 | -1) {
    setAnchor((prev) =>
      view === "week" ? addDays(prev, direction * 7) : addMonths(prev, direction)
    );
  }

  function jumpToToday() {
    setAnchor(todayStr());
    setSelected(todayStr());
  }

  function handleSelect(date: string) {
    setSelected(date);
    setAnchor(date);
  }

  const dayTasks = getTasksForDate(tasks, selected).filter((t) => t.status !== "completed");
  const isOnToday = anchor === todayStr() && selected === todayStr();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold text-ink">Calendario</h1>
        <div className="flex items-center gap-2">
          {!isOnToday && (
            <button
              onClick={jumpToToday}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
            >
              Hoy
            </button>
          )}
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {(["week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                  view === mode
                    ? "bg-surface text-ink shadow-subtle"
                    : "text-ink-tertiary hover:text-ink-secondary"
                )}
              >
                {mode === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          aria-label={view === "week" ? "Semana anterior" : "Mes anterior"}
          className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[13px] font-medium capitalize text-ink-secondary">
          {monthLabel(anchor)}
        </span>
        <button
          onClick={() => step(1)}
          aria-label={view === "week" ? "Semana siguiente" : "Mes siguiente"}
          className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {view === "week" ? (
        <WeekStrip
          anchorDate={anchor}
          selectedDate={selected}
          tasks={tasks}
          onSelect={handleSelect}
        />
      ) : (
        <MonthGrid
          anchorDate={anchor}
          selectedDate={selected}
          tasks={tasks}
          onSelect={handleSelect}
        />
      )}

      <section>
        <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-tertiary">
          {selected === todayStr() ? "Hoy" : longDateLabel(selected)}
        </h2>
        <TaskList tasks={dayTasks} emptyTitle="Sin tareas para este día" />
      </section>
    </div>
  );
}
