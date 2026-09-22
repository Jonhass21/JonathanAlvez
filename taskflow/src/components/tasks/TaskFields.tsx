import {
  TASK_CATEGORIES,
  type NewTaskDraft,
  type ParsedTaskResult,
  type TaskCategory,
  type TaskPriority,
} from "../../types";
import { useAppData } from "../../context/AppDataContext";
import { cn } from "../../utils/cn";

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const fieldClass =
  "w-full rounded-lg border border-border bg-base px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

type Confidence = ParsedTaskResult["confidence"];

/** Small marker on the fields the parser filled in on its own. */
function Label({ children, inferred }: { children: React.ReactNode; inferred?: boolean }) {
  return (
    <label className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-tertiary">
      {children}
      {inferred && (
        <span title="Detectado del texto" className="inline-block h-1 w-1 rounded-full bg-gold" />
      )}
    </label>
  );
}

interface TaskFieldsProps {
  draft: NewTaskDraft;
  onChange: (draft: NewTaskDraft) => void;
  confidence?: Confidence;
  autoFocus?: boolean;
}

export function TaskFields({ draft, onChange, confidence, autoFocus }: TaskFieldsProps) {
  const { clients } = useAppData();
  const set = (patch: Partial<NewTaskDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="space-y-3.5">
      <div>
        <Label>Tarea</Label>
        <input
          autoFocus={autoFocus}
          className={fieldClass}
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="¿Qué hay que hacer?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label inferred={confidence?.client}>Cliente</Label>
          <select
            className={fieldClass}
            value={draft.clientId ?? ""}
            onChange={(e) => set({ clientId: e.target.value || null })}
          >
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label inferred={confidence?.category}>Categoría</Label>
          <select
            className={fieldClass}
            value={draft.category}
            onChange={(e) => set({ category: e.target.value as TaskCategory })}
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label inferred={confidence?.date}>Fecha</Label>
          <input
            type="date"
            className={fieldClass}
            value={draft.dueDate ?? ""}
            onChange={(e) => set({ dueDate: e.target.value || null })}
          />
        </div>
        <div>
          <Label inferred={confidence?.time}>Hora</Label>
          <input
            type="time"
            className={fieldClass}
            value={draft.dueTime ?? ""}
            onChange={(e) => set({ dueTime: e.target.value || null })}
          />
        </div>
      </div>

      <div>
        <Label inferred={confidence?.priority}>Prioridad</Label>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set({ priority: p.value })}
              aria-pressed={draft.priority === p.value}
              className={cn(
                "flex-1 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                draft.priority === p.value
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-border text-ink-secondary hover:bg-surface-hover"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Nota (opcional)</Label>
        <textarea
          rows={2}
          className={cn(fieldClass, "resize-none")}
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Detalle, link, referencia…"
        />
      </div>
    </div>
  );
}
