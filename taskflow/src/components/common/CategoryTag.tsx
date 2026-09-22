import type { TaskCategory } from "../../types";

export function CategoryTag({ category }: { category: TaskCategory }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
      {category}
    </span>
  );
}
