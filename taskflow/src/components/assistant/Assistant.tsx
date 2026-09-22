import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircleQuestion, X } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";
import { answerQuestion } from "../../services/assistantService";
import { generateId } from "../../utils/id";
import { cn } from "../../utils/cn";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = ["¿Qué tengo hoy?", "¿Qué está vencido?", "¿Qué hice esta semana?"];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Preguntame lo que necesites: qué tenés pendiente de un cliente, qué se venció o qué cerraste esta semana.",
};

export function Assistant() {
  const { tasks, clients } = useAppData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: generateId("u"), role: "user", text: trimmed },
      {
        id: generateId("a"),
        role: "assistant",
        text: answerQuestion(trimmed, tasks, clients),
      },
    ]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-card transition-colors hover:bg-accent-hover md:bottom-6 md:right-6"
      >
        {open ? <X size={18} /> : <MessageCircleQuestion size={19} />}
      </button>

      {open && (
        <div className="fixed inset-x-4 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-50 flex max-h-[58dvh] flex-col overflow-hidden rounded-xl2 border border-border-strong bg-surface-raised shadow-card animate-sheet-in sm:inset-x-auto sm:right-6 sm:w-[22rem] md:bottom-24">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">Ask</p>
            <p className="text-[11.5px] text-ink-tertiary">Responde con tus datos locales</p>
          </div>

          <div
            ref={scrollRef}
            className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 py-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[88%] whitespace-pre-line rounded-lg px-3 py-2 text-[12.5px] leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-accent/12 text-ink"
                    : "bg-surface text-ink-secondary"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-tertiary transition-colors hover:border-border-strong hover:text-ink-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="relative border-t border-border p-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu pregunta…"
              aria-label="Escribí tu pregunta"
              className="w-full rounded-lg border border-border bg-base px-3 py-2 pr-9 text-[12.5px] text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Enviar pregunta"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-accent p-1 text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-25"
            >
              <ArrowUp size={13} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
