// Theme lives outside React state so it can be applied before the first paint
// (see the inline script in index.html) and read back by the Settings screen.

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const KEY = "taskflow.theme.v1";

function systemTheme(): ResolvedTheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getThemePreference(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* private mode / storage disabled — fall through to the default */
  }
  return "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function setThemePreference(preference: ThemePreference): ResolvedTheme {
  try {
    window.localStorage.setItem(KEY, preference);
  } catch {
    /* preference just won't survive the reload */
  }
  return applyTheme(preference);
}

/** Keeps "system" in sync when the OS flips between light and dark. */
export function watchSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
