import { useState } from "react";
import { ArrowUp, Inbox as InboxIcon } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { InboxCard } from "../components/tasks/InboxCard";
import { EmptyState } from "../components/common/EmptyState";
import { PageSkeleton } from "../components/common/PageSkeleton";

export default function InboxPage() {
  const { inboxItems, addInboxItem, loading } = useAppData();
  const [text, setText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await addInboxItem(trimmed);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[20px] font-semibold text-ink">Bandeja</h1>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Instrucciones sin procesar. Acá van a caer los mensajes que lleguen por Telegram o
          WhatsApp.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="relative">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Simular un mensaje entrante…"
          aria-label="Simular un mensaje entrante"
          className="w-full rounded-xl2 border border-border bg-surface px-4 py-3 pr-11 text-[13.5px] text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Sumar a la bandeja"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent p-1.5 text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-25"
        >
          <ArrowUp size={15} />
        </button>
      </form>

      {inboxItems.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Bandeja vacía"
          description="Todo lo que llegue sin procesar va a aparecer acá."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {inboxItems.map((item) => (
            <InboxCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
