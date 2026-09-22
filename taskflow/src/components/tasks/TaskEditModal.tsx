import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { TaskFields } from "./TaskFields";
import type { NewTaskDraft, Task } from "../../types";

function toDraft(task: Task): NewTaskDraft {
  const { title, description, clientId, priority, dueDate, dueTime, category } = task;
  return { title, description, clientId, priority, dueDate, dueTime, category };
}

interface TaskEditModalProps {
  open: boolean;
  task: Task;
  onClose: () => void;
  onSave: (patch: NewTaskDraft) => void;
  onDelete: () => void;
}

export function TaskEditModal(props: TaskEditModalProps) {
  if (!props.open) return null;
  return <TaskEditSheet {...props} />;
}

function TaskEditSheet({ open, task, onClose, onSave, onDelete }: TaskEditModalProps) {
  const [draft, setDraft] = useState<NewTaskDraft>(() => toDraft(task));

  function submit() {
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar tarea"
      footer={
        <>
          <button
            onClick={onDelete}
            className="mr-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-accent-text"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!draft.title.trim()}
            className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
          >
            Guardar
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TaskFields draft={draft} onChange={setDraft} autoFocus />
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
