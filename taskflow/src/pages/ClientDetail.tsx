import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useToasts } from "../context/ToastContext";
import { useTaskActions } from "../hooks/useTaskActions";
import { TaskList } from "../components/tasks/TaskList";
import { TaskConfirmModal } from "../components/tasks/TaskConfirmModal";
import { EMPTY_DRAFT } from "../data/defaults";
import { ClientFormModal } from "../components/clients/ClientFormModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageSkeleton } from "../components/common/PageSkeleton";
import { TASK_CATEGORIES, type NewTaskDraft, type TaskCategory, type TaskStatus } from "../types";
import { isTaskOverdue, sortTasks } from "../utils/taskFilters";
import { cn } from "../utils/cn";

const TABS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "in_progress", label: "En proceso" },
  { value: "completed", label: "Completadas" },
];

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const { clients, tasks, loading, editClient, removeClient } = useAppData();
  const { create } = useTaskActions();
  const { push } = useToasts();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TaskStatus>("pending");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const client = clients.find((c) => c.id === clientId) ?? null;

  const clientTasks = useMemo(
    () => sortTasks(tasks.filter((t) => t.clientId === clientId)),
    [tasks, clientId]
  );

  // Only offer category chips that this client actually uses.
  const usedCategories = useMemo(
    () => TASK_CATEGORIES.filter((c) => clientTasks.some((t) => t.category === c)),
    [clientTasks]
  );

  const visible = clientTasks.filter(
    (t) => t.status === tab && (category === "all" || t.category === category)
  );
  const overdueCount = clientTasks.filter(isTaskOverdue).length;

  if (loading) return <PageSkeleton />;

  if (!client) {
    return (
      <div>
        <Link to="/clientes" className="text-[13px] text-ink-secondary hover:text-ink">
          ← Volver a clientes
        </Link>
        <p className="mt-4 text-[14px] text-ink-secondary">No encontramos ese cliente.</p>
      </div>
    );
  }

  async function handleCreate(draft: NewTaskDraft) {
    await create(draft);
    setShowNew(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link
          to="/clientes"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          <ArrowLeft size={13} />
          Clientes
        </Link>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-semibold text-ink">{client.name}</h1>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              {clientTasks.filter((t) => t.status !== "completed").length} pendientes
              {overdueCount > 0 && ` · ${overdueCount} vencida${overdueCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setRenaming(true)}
              aria-label="Renombrar cliente"
              title="Renombrar"
              className="rounded-md p-2 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              aria-label="Eliminar cliente"
              title="Eliminar cliente"
              className="rounded-md p-2 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-accent-text"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="ml-1 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <Plus size={14} />
              Nueva tarea
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const count = clientTasks.filter((task) => task.status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              aria-pressed={tab === t.value}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors",
                tab === t.value
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              {t.label} {count > 0 && <span className="text-ink-tertiary">({count})</span>}
            </button>
          );
        })}
      </div>

      {usedCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...usedCategories] as const).map((value) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                category === value
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-border text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              {value === "all" ? "Todas" : value}
            </button>
          ))}
        </div>
      )}

      <TaskList tasks={visible} showClient={false} emptyTitle="Nada acá por ahora" />

      <TaskConfirmModal
        open={showNew}
        heading="Nueva tarea"
        initialDraft={{ ...EMPTY_DRAFT, clientId: client.id }}
        onClose={() => setShowNew(false)}
        onConfirm={handleCreate}
      />

      <ClientFormModal
        open={renaming}
        initialName={client.name}
        onClose={() => setRenaming(false)}
        onSubmit={async (name) => {
          await editClient(client.id, { name });
          push({ title: "Cliente actualizado", tone: "success" });
          setRenaming(false);
        }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title={`¿Eliminar ${client.name}?`}
        description={
          clientTasks.length > 0
            ? `Sus ${clientTasks.length} tarea${clientTasks.length === 1 ? "" : "s"} se mantienen, pero quedan sin cliente asignado.`
            : "El cliente no tiene tareas asociadas."
        }
        confirmLabel="Eliminar cliente"
        onClose={() => setConfirmingDelete(false)}
        onConfirm={async () => {
          await removeClient(client.id);
          push({ title: "Cliente eliminado", description: client.name });
          navigate("/clientes");
        }}
      />
    </div>
  );
}
