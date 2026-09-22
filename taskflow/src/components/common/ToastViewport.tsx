import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useToasts } from "../../context/ToastContext";
import type { ToastMessage } from "../../types";
import { cn } from "../../utils/cn";

const ICONS: Record<NonNullable<ToastMessage["tone"]>, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
};

const ICON_TONE: Record<NonNullable<ToastMessage["tone"]>, string> = {
  default: "text-ink-tertiary",
  success: "text-gold",
  warning: "text-accent-text",
};

export function ToastViewport() {
  const { toasts, dismiss } = useToasts();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {toasts.map((toast) => {
        const tone = toast.tone ?? "default";
        const Icon = ICONS[tone];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl2 border border-border-strong bg-surface-raised px-4 py-3 shadow-card animate-toast-in"
          >
            <Icon size={16} className={cn("mt-0.5 shrink-0", ICON_TONE[tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 whitespace-pre-line text-[12px] text-ink-secondary">
                  {toast.description}
                </p>
              )}
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold text-accent-text transition-colors hover:bg-surface-hover"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-ink-tertiary transition-colors hover:text-ink"
              aria-label="Cerrar aviso"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
