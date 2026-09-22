import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { parseTaskText } from "../../services/taskParser";
import { TaskConfirmModal } from "./TaskConfirmModal";
import { useAppData } from "../../context/AppDataContext";
import { useTaskActions } from "../../hooks/useTaskActions";
import type { NewTaskDraft, ParsedTaskResult } from "../../types";

const EXAMPLES = [
  "Preparar el reel de San Lucas mañana a las 10",
  "El jueves enviar el calendario de Estilo Car",
  "Factura de Kaia el 5 de cada mes",
];

export function TaskInput() {
  const { clients } = useAppData();
  const { create } = useTaskActions();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedTaskResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setParsed(parseTaskText(text, clients));
  }

  async function handleConfirm(draft: NewTaskDraft) {
    await create(draft);
    setParsed(null);
    setText("");
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Sparkles
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
            aria-hidden="true"
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué necesitás hacer?"
            aria-label="¿Qué necesitás hacer?"
            enterKeyHint="done"
            className="w-full rounded-xl2 border border-border bg-surface py-3.5 pl-10 pr-11 text-[14.5px] text-ink shadow-subtle placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Interpretar y crear tarea"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent p-1.5 text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-25"
          >
            <ArrowUp size={16} />
          </button>
        </div>
        {!text && (
          <p className="mt-2 px-1 text-[11.5px] text-ink-tertiary">
            Escribilo como lo dirías: “{EXAMPLES[0]}”
          </p>
        )}
      </form>

      {parsed && (
        <TaskConfirmModal
          open
          initialDraft={parsed.draft}
          confidence={parsed.confidence}
          description="Revisá lo que interpreté y corregí lo que haga falta."
          onClose={() => setParsed(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
