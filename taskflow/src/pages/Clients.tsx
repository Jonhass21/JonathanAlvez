import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { ClientCard } from "../components/clients/ClientCard";
import { ClientFormModal } from "../components/clients/ClientFormModal";
import { EmptyState } from "../components/common/EmptyState";
import { PageSkeleton } from "../components/common/PageSkeleton";
import { useToasts } from "../context/ToastContext";

export default function Clients() {
  const { clients, tasks, loading, addClient } = useAppData();
  const { push } = useToasts();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const tasksByClient = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks) {
      if (!task.clientId) continue;
      const list = map.get(task.clientId);
      if (list) list.push(task);
      else map.set(task.clientId, [task]);
    }
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Clientes</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">{clients.length} en total</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} />
          Nuevo cliente
        </button>
      </header>

      {clients.length > 3 && (
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            type="search"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "No encontramos ese cliente" : "Todavía no hay clientes"}
          description={
            query ? undefined : "Agregá el primero para empezar a ordenar las tareas por cuenta."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              tasks={tasksByClient.get(client.id) ?? []}
            />
          ))}
        </div>
      )}

      <ClientFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          await addClient(name);
          push({
            title: "Cliente agregado",
            description: name,
            tone: "success",
          });
          setCreating(false);
        }}
      />
    </div>
  );
}
