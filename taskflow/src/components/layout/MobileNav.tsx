import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./nav";
import { useAppData } from "../../context/AppDataContext";
import { cn } from "../../utils/cn";

export function MobileNav() {
  const { inboxItems } = useAppData();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-base-soft/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden">
      {NAV_ITEMS.map((item) => {
        const badge = item.to === "/bandeja" ? inboxItems.length : 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                isActive ? "text-ink" : "text-ink-tertiary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon
                    size={19}
                    className={isActive ? "text-accent-text" : "text-ink-tertiary"}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-none text-accent-fg">
                      {badge}
                    </span>
                  )}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
