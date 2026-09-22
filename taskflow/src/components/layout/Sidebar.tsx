import { NavLink } from "react-router-dom";
import { Search } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useAppData } from "../../context/AppDataContext";
import { cn } from "../../utils/cn";

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const { inboxItems } = useAppData();

  return (
    <aside className="sticky top-0 hidden h-[100dvh] md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-base-soft md:px-4 md:py-6">
      <div className="mb-5 px-2">
        <span className="font-display text-[22px] italic text-ink">TaskFlow</span>
      </div>

      <button
        onClick={onSearch}
        className="mb-5 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-ink-tertiary transition-colors hover:border-border-strong hover:text-ink-secondary"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar o crear</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 font-sans text-[10px] text-ink-tertiary">
          ⌘K
        </kbd>
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const badge = item.to === "/bandeja" ? inboxItems.length : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  isActive
                    ? "bg-surface text-ink shadow-subtle"
                    : "text-ink-secondary hover:bg-surface hover:text-ink"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={16}
                    className={isActive ? "text-accent-text" : "text-ink-tertiary"}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-fg">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/12 text-[12px] font-semibold text-accent-text">
          J
        </div>
        <span className="text-[13px] font-medium text-ink-secondary">Jona</span>
      </div>
    </aside>
  );
}
