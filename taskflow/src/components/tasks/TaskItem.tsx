import { useState } from "react";
import { Check, Play, Trash2 } from "lucide-react";
import type { Task } from "../../types";
import { useAppData } from "../../context/AppDataContext";
import { useTaskActions } from "../../hooks/useTaskActions";
import { PriorityDot } from "../common/PriorityDot";
import { CategoryTag } from "../common/CategoryTag";
import { TaskEditModal } from "./TaskEditModal";
import { friendlyDate, formatTime, isPast, isToday } from "../../utils/date";
import { cn } from "../../utils/cn";

interface TaskItemProps {
  task: Task;
  showClient?: boolean;
}

export function TaskItem({ task, showClient = true }: TaskItemProps) {
  const { clientById } = useAppData();
  const { save, remove, toggleComplete, toggleInProgress } = useTaskActions();
  const [editing, setEditing] = useState(false);

  const client = clientById(task.clientId);
  const completed = task.status === "completed";
  const overdue = !completed && task.dueDate && isPast(task.dueDate);
  const dueToday = !completed && task.dueDate && isToday(task.dueDate);

  return (
    <>
      <div className="group flex items-start gap-3 rounded-xl2 border border-border bg-surface px-3.5 py-3 transition-colors hover:border-border-strong">
        <button
          onClick={() => void toggleComplete(task)}
          aria-label={
            completed ? `Marcar "${task.title}" como pendiente` : `Completar "${task.title}"`
          }
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
            completed ? "border-accent bg-accent" : "border-border-strong hover:border-accent"
          )}
        >
          {completed && <Check size={11} className="text-accent-fg" strokeWidth={3} />}
        </button>

        {/* The whole body is the edit affordance — works the same on touch and desktop. */}
        <button
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
          aria-label={`Editar "${task.title}"`}
        >
          <p
            className={cn(
              "text-[13.5px] font-medium leading-snug",
              completed ? "text-ink-tertiary line-through" : "text-ink"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 truncate text-[12px] text-ink-tertiary">{task.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-secondary">
            {showClient && client && <span className="font-medium">{client.name}</span>}
            <CategoryTag category={task.category} />
            {task.dueDate && (
              <span
                className={cn(
                  overdue && "font-medium text-accent-text",
                  dueToday && "font-medium text-gold"
                )}
              >
                {friendlyDate(task.dueDate)}
                {task.dueTime ? ` · ${formatTime(task.dueTime)}` : ""}
                {overdue ? " · vencida" : ""}
              </span>
            )}
            {task.status === "in_progress" && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-medium text-gold">
                En curso
              </span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {!completed && (
            <button
              onClick={() => void toggleInProgress(task)}
              aria-label={task.status === "in_progress" ? "Pausar" : "Empezar"}
              title={task.status === "in_progress" ? "Pausar" : "Empezar"}
              className={cn(
                "rounded-md p-1.5 transition-colors hover:bg-surface-hover hover:text-ink-secondary",
                task.status === "in_progress" ? "text-gold" : "text-ink-tertiary",
                // Hidden until hover on desktop; always reachable on touch.
                "md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
              )}
            >
              <Play size={13} />
            </button>
          )}
          <button
            onClick={() => void remove(task)}
            aria-label={`Eliminar "${task.title}"`}
            title="Eliminar"
            className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-accent-text md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
          <PriorityDot priority={task.priority} className="ml-0.5" />
        </div>
      </div>

      {editing && (
        <TaskEditModal
          open={editing}
          task={task}
          onClose={() => setEditing(false)}
          onSave={async (patch) => {
            await save(task.id, patch);
            setEditing(false);
          }}
          onDelete={async () => {
            setEditing(false);
            await remove(task);
          }}
        />
      )}
    </>
  );
}
