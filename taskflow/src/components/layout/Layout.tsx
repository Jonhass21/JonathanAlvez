import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ToastViewport } from "../common/ToastViewport";
import { CommandPalette } from "../common/CommandPalette";
import { Assistant } from "../assistant/Assistant";

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // ⌘K / Ctrl+K from anywhere, as long as focus isn't already in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setPaletteOpen((open) => !open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-[100dvh] bg-base">
      <Sidebar onSearch={openPalette} />

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        {/* Mobile header — the sidebar's wordmark and search live here instead. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-base/90 px-4 py-3 backdrop-blur md:hidden">
          <span className="font-display text-[19px] italic text-ink">TaskFlow</span>
          <button
            onClick={openPalette}
            aria-label="Buscar o crear"
            className="rounded-lg p-2 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Search size={17} />
          </button>
        </header>

        <main className="flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-10 md:pb-12">
          <div className="mx-auto w-full max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
      <ToastViewport />
      <Assistant />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
