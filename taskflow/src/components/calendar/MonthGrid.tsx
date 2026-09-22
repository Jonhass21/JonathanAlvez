import {
  getMonthGrid,
  longDateLabel,
  parseDateStr,
  todayStr,
  WEEKDAY_SHORT,
} from "../../utils/date";
import { cn } from "../../utils/cn";
import type { Task } from "../../types";

interface MonthGridProps {
  anchorDate: string;
  selectedDate: string;
  tasks: Task[];
  onSelect: (date: string) => void;
}

// Monday-first header row.
const HEADERS = [...WEEKDAY_SHORT.slice(1), WEEKDAY_SHORT[0]];

export function MonthGrid({ anchorDate, selectedDate, tasks, onSelect }: MonthGridProps) {
  const days = getMonthGrid(anchorDate);
  const today = todayStr();
  const anchorMonth = parseDateStr(anchorDate).getMonth();

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-medium uppercase text-ink-tertiary">
        {HEADERS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = parseDateStr(day).getMonth() === anchorMonth;
          const isSelected = day === selectedDate;
          const isToday = day === today;
          const count = tasks.filter((t) => t.dueDate === day && t.status !== "completed").length;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={`${longDateLabel(day)}, ${count} tarea${count === 1 ? "" : "s"}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:border-border",
                !inMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11.5px]",
                  isSelected
                    ? "font-semibold text-ink"
                    : isToday
                      ? "bg-gold/15 font-semibold text-gold"
                      : "text-ink-secondary"
                )}
              >
                {parseDateStr(day).getDate()}
              </span>
              <span className="flex h-1 gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-accent" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
