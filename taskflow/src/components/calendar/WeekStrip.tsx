import {
  getWeekDates,
  todayStr,
  weekdayIndex,
  WEEKDAY_SHORT,
  longDateLabel,
} from "../../utils/date";
import { cn } from "../../utils/cn";
import type { Task } from "../../types";

interface WeekStripProps {
  anchorDate: string;
  selectedDate: string;
  tasks: Task[];
  onSelect: (date: string) => void;
}

export function WeekStrip({ anchorDate, selectedDate, tasks, onSelect }: WeekStripProps) {
  const days = getWeekDates(anchorDate);
  const today = todayStr();

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const count = tasks.filter((t) => t.dueDate === day && t.status !== "completed").length;
        const isSelected = day === selectedDate;
        const isToday = day === today;
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            aria-pressed={isSelected}
            aria-label={`${longDateLabel(day)}, ${count} tarea${count === 1 ? "" : "s"}`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 transition-colors",
              isSelected
                ? "border-accent bg-accent/10"
                : "border-border hover:border-border-strong hover:bg-surface-hover"
            )}
          >
            <span className="text-[10px] font-medium uppercase text-ink-tertiary">
              {WEEKDAY_SHORT[weekdayIndex(day)]}
            </span>
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-medium",
                isSelected
                  ? "text-ink"
                  : isToday
                    ? "bg-gold/15 font-semibold text-gold"
                    : "text-ink-secondary"
              )}
            >
              {Number(day.split("-")[2])}
            </span>
            <span
              className={cn("h-1 w-1 rounded-full", count > 0 ? "bg-accent" : "bg-transparent")}
            />
          </button>
        );
      })}
    </div>
  );
}
