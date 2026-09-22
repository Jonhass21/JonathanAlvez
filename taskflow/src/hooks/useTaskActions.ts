import { useCallback } from "react";
import type { NewTaskDraft, Task } from "../types";
import { useAppData } from "../context/AppDataContext";
import { useToasts } from "../context/ToastContext";

/**
 * Task mutations plus the feedback that goes with them. Deleting keeps a copy
 * of the task in the toast closure so "Deshacer" can put it back with the same
 * id — no confirmation dialog needed for a one-tap action.
 */
export function useTaskActions() {
  const { addTask, editTask, removeTask, restoreTask, setStatus } = useAppData();
  const { push } = useToasts();

  const create = useCallback(
    async (draft: NewTaskDraft) => {
      const task = await addTask(draft);
      push({ title: "Tarea creada", description: task.title, tone: "success" });
      return task;
    },
    [addTask, push]
  );

  const save = useCallback(
    async (id: string, patch: Partial<Task>) => {
      await editTask(id, patch);
      push({ title: "Tarea actualizada", tone: "success" });
    },
    [editTask, push]
  );

  const remove = useCallback(
    async (task: Task) => {
      await removeTask(task.id);
      push({
        title: "Tarea eliminada",
        description: task.title,
        action: { label: "Deshacer", onClick: () => void restoreTask(task) },
      });
    },
    [removeTask, restoreTask, push]
  );

  const toggleComplete = useCallback(
    async (task: Task) => {
      const completing = task.status !== "completed";
      await setStatus(task.id, completing ? "completed" : "pending");
      if (completing) push({ title: "Listo", description: task.title, tone: "success" });
    },
    [setStatus, push]
  );

  const toggleInProgress = useCallback(
    async (task: Task) => {
      await setStatus(task.id, task.status === "in_progress" ? "pending" : "in_progress");
    },
    [setStatus]
  );

  return { create, save, remove, toggleComplete, toggleInProgress };
}
