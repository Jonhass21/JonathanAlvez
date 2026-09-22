import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-border px-6 py-10 text-center">
      <Icon size={20} className="mb-3 text-ink-tertiary" aria-hidden="true" />
      <p className="text-[13.5px] font-medium text-ink-secondary">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[12.5px] text-ink-tertiary">{description}</p>
      )}
    </div>
  );
}
