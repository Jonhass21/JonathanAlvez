import { cn } from "../../utils/cn";
import type { TaskPriority } from "../../types";

const STYLES: Record<TaskPriority, string> = {
  high: "bg-accent",
  medium: "bg-gold",
  low: "bg-ink-tertiary/50",
};

const LABELS: Record<TaskPriority, string> = {
  high: "Prioridad alta",
  medium: "Prioridad media",
  low: "Prioridad baja",
};

export function PriorityDot({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <span
      title={LABELS[priority]}
      aria-label={LABELS[priority]}
      role="img"
      className={cn("inline-block h-1.5 w-1.5 rounded-full", STYLES[priority], className)}
    />
  );
}
