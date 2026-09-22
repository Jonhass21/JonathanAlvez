import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { InboxItem, NewTaskDraft } from "../../types";
import { parseTaskText } from "../../services/taskParser";
import { useAppData } from "../../context/AppDataContext";
import { useToasts } from "../../context/ToastContext";
import { useTaskActions } from "../../hooks/useTaskActions";
import { TaskConfirmModal } from "./TaskConfirmModal";
import { friendlyDate, formatTime } from "../../utils/date";
import { cn } from "../../utils/cn";

function Field({ label, value, inferred }: { label: string; value: string; inferred: boolean }) {
  return (
    <div>
      <dt className="text-[11.5px] text-ink-tertiary">{label}</dt>
      <dd className={cn("text-[12.5px]", inferred ? "text-ink" : "text-ink-tertiary")}>{value}</dd>
    </div>
  );
}

export function InboxCard({ item }: { item: InboxItem }) {
  const { clients, clientById, removeInboxItem } = useAppData();
  const { create } = useTaskActions();
  const { push } = useToasts();
  const [editing, setEditing] = useState(false);

  const result = useMemo(() => parseTaskText(item.rawText, clients), [item.rawText, clients]);
  const client = clientById(result.draft.clientId);

  async function handleCreate(draft: NewTaskDraft) {
    await create(draft);
    await removeInboxItem(item.id);
    setEditing(false);
  }

  async function handleDiscard() {
    await removeInboxItem(item.id);
    push({ title: "Instrucción descartada", description: item.rawText });
  }

  return (
    <>
      <article className="rounded-xl2 border border-border bg-surface p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
          Nueva tarea detectada
        </p>
        <p className="mb-3.5 text-[13px] italic text-ink-secondary">“{item.rawText}”</p>

        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
          <Field
            label="Cliente"
            value={client ? client.name : "No especificado"}
            inferred={result.confidence.client}
          />
          <Field label="Tarea" value={result.draft.title} inferred />
          <Field
            label="Fecha"
            value={friendlyDate(result.draft.dueDate)}
            inferred={result.confidence.date}
          />
          <Field
            label="Hora"
            value={formatTime(result.draft.dueTime)}
            inferred={result.confidence.time}
          />
          <Field
            label="Categoría"
            value={result.draft.category}
            inferred={result.confidence.category}
          />
        </dl>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void handleCreate(result.draft)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Check size={13} />
            Crear tarea
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={() => void handleDiscard()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-accent-text"
          >
            <X size={13} />
            Descartar
          </button>
        </div>
      </article>

      <TaskConfirmModal
        open={editing}
        heading="Revisar tarea"
        initialDraft={result.draft}
        confidence={result.confidence}
        onClose={() => setEditing(false)}
        onConfirm={handleCreate}
      />
    </>
  );
}
