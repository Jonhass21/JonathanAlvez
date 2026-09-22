import { useState } from "react";
import { Modal } from "../common/Modal";
import { TaskFields } from "./TaskFields";
import type { NewTaskDraft, ParsedTaskResult } from "../../types";

interface TaskConfirmModalProps {
  open: boolean;
  heading?: string;
  description?: string;
  initialDraft: NewTaskDraft;
  confidence?: ParsedTaskResult["confidence"];
  onClose: () => void;
  onConfirm: (draft: NewTaskDraft) => void;
  confirmLabel?: string;
}

/**
 * The sheet only mounts while it is open, so the draft state starts from
 * `initialDraft` on every open — no effect needed to reset it.
 */
export function TaskConfirmModal(props: TaskConfirmModalProps) {
  if (!props.open) return null;
  return <TaskConfirmSheet {...props} />;
}

function TaskConfirmSheet({
  open,
  heading = "Entendí esto",
  description,
  initialDraft,
  confidence,
  onClose,
  onConfirm,
  confirmLabel = "Crear tarea",
}: TaskConfirmModalProps) {
  const [draft, setDraft] = useState<NewTaskDraft>(initialDraft);

  function submit() {
    if (!draft.title.trim()) return;
    onConfirm({ ...draft, title: draft.title.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading}
      description={description}
      footer={
        <>
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
            {confirmLabel}
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
        <TaskFields draft={draft} onChange={setDraft} confidence={confidence} autoFocus />
        {/* Enter submits the form without needing a visible second button. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
