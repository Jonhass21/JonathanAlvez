import { cn } from "../../utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg py-3 text-left"
    >
      <span>
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[12px] text-ink-tertiary">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border-strong"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-subtle transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
