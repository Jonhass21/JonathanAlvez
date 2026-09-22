import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Search, Users } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";
import { useTaskActions } from "../../hooks/useTaskActions";
import { parseTaskText } from "../../services/taskParser";
import { TaskConfirmModal } from "../tasks/TaskConfirmModal";
import { PriorityDot } from "./PriorityDot";
import { friendlyDate } from "../../utils/date";
import { searchTasks } from "../../utils/taskFilters";
import { cn } from "../../utils/cn";
import type { NewTaskDraft, ParsedTaskResult } from "../../types";

type Row =
  | { kind: "create"; label: string }
  | {
      kind: "task";
      id: string;
      title: string;
      meta: string;
      priority: "low" | "medium" | "high";
      clientId: string | null;
    }
  | { kind: "client"; id: string; name: string; pending: number };

const MAX_TASKS = 6;
const MAX_CLIENTS = 3;

/**
 * ⌘K / Ctrl+K from anywhere: search across tasks and clients, or turn whatever
 * you typed into a task without leaving the keyboard. This is the "faster than
 * Notion" path — open, type, Enter, done.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients } = useAppData();
  const { create } = useTaskActions();
  const [parsed, setParsed] = useState<ParsedTaskResult | null>(null);

  async function handleConfirm(draft: NewTaskDraft) {
    await create(draft);
    setParsed(null);
    onClose();
  }

  return (
    <>
      {open && (
        <PaletteSheet
          onClose={onClose}
          onCreate={(text) => {
            setParsed(parseTaskText(text, clients));
            onClose(); // hand off to the confirm sheet
          }}
        />
      )}

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

/** Mounted only while open, so query and cursor start clean every time. */
function PaletteSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (text: string) => void;
}) {
  const { tasks, clients } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Wait a frame so the input exists before focusing it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const rows = useMemo<Row[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const matchedTasks = searchTasks(tasks, clients, trimmed)
      .slice(0, MAX_TASKS)
      .map<Row>((t) => ({
        kind: "task",
        id: t.id,
        title: t.title,
        meta: [clients.find((c) => c.id === t.clientId)?.name, friendlyDate(t.dueDate)]
          .filter(Boolean)
          .join(" · "),
        priority: t.priority,
        clientId: t.clientId,
      }));

    const normalized = trimmed.toLowerCase();
    const matchedClients = clients
      .filter((c) => c.name.toLowerCase().includes(normalized))
      .slice(0, MAX_CLIENTS)
      .map<Row>((c) => ({
        kind: "client",
        id: c.id,
        name: c.name,
        pending: tasks.filter((t) => t.clientId === c.id && t.status !== "completed").length,
      }));

    return [{ kind: "create", label: trimmed }, ...matchedTasks, ...matchedClients];
  }, [query, tasks, clients]);

  function run(row: Row) {
    if (row.kind === "create") {
      onCreate(row.label);
      return;
    }
    if (row.kind === "client") {
      navigate(`/clientes/${row.id}`);
      onClose();
      return;
    }
    // Tasks live inside their client's screen; unassigned ones live on Inicio.
    navigate(row.clientId ? `/clientes/${row.clientId}` : "/");
    onClose();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = rows[cursor];
      if (row) run(row);
    } else if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar o crear"
        className="relative w-full max-w-lg overflow-hidden rounded-xl2 border border-border-strong bg-surface-raised shadow-card animate-sheet-in"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={15} className="shrink-0 text-ink-tertiary" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar una tarea o escribir una nueva…"
            aria-label="Buscar una tarea o escribir una nueva"
            className="w-full bg-transparent py-3.5 text-[14px] text-ink placeholder:text-ink-tertiary focus:outline-none"
          />
        </div>

        {rows.length > 0 ? (
          <ul className="max-h-[50vh] overflow-y-auto p-1.5">
            {rows.map((row, i) => {
              const active = i === cursor;
              const key = row.kind === "create" ? "create" : `${row.kind}-${row.id}`;
              return (
                <li key={key}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => run(row)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-surface-hover" : "hover:bg-surface-hover"
                    )}
                  >
                    {row.kind === "create" && (
                      <>
                        <Plus size={14} className="shrink-0 text-accent-text" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                          Crear tarea: <span className="font-medium">{row.label}</span>
                        </span>
                      </>
                    )}
                    {row.kind === "task" && (
                      <>
                        <PriorityDot priority={row.priority} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                          {row.title}
                        </span>
                        <span className="shrink-0 text-[11.5px] text-ink-tertiary">{row.meta}</span>
                      </>
                    )}
                    {row.kind === "client" && (
                      <>
                        <Users size={14} className="shrink-0 text-ink-tertiary" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-[11.5px] text-ink-tertiary">
                          {row.pending} pendiente{row.pending === 1 ? "" : "s"}
                        </span>
                        <ArrowRight size={13} className="shrink-0 text-ink-tertiary" />
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-5 text-[12.5px] text-ink-tertiary">
            Escribí para buscar entre tus tareas, o contá algo nuevo y lo convierto en tarea.
          </p>
        )}
      </div>
    </div>
  );
}
