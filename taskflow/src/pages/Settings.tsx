import { useEffect, useState } from "react";
import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { Toggle } from "../components/common/Toggle";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useAppData } from "../context/AppDataContext";
import { useToasts } from "../context/ToastContext";
import {
  getThemePreference,
  setThemePreference,
  watchSystemTheme,
  applyTheme,
  type ThemePreference,
} from "../services/themeService";
import { cn } from "../utils/cn";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const LEAD_OPTIONS = [15, 30, 60];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Settings() {
  const { settings, saveSettings, resetDemoData, tasks, clients } = useAppData();
  const { push } = useToasts();
  const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference());
  const [confirmingReset, setConfirmingReset] = useState(false);

  // When the preference is "system", follow the OS as it changes.
  useEffect(() => {
    if (theme !== "system") return;
    return watchSystemTheme(() => applyTheme("system"));
  }, [theme]);

  function chooseTheme(next: ThemePreference) {
    setTheme(next);
    setThemePreference(next);
  }

  return (
    <div className="flex flex-col gap-8 pb-6">
      <h1 className="text-[20px] font-semibold text-ink">Configuración</h1>

      <Section title="Perfil">
        <div className="rounded-xl2 border border-border bg-surface px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/12 text-[14px] font-semibold text-accent-text">
              J
            </div>
            <div>
              <p className="text-[13.5px] font-medium text-ink">Jona</p>
              <p className="text-[12px] text-ink-tertiary">
                {clients.length} clientes · {tasks.filter((t) => t.status !== "completed").length}{" "}
                tareas abiertas
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Apariencia">
        <div className="flex gap-1.5">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => chooseTheme(value)}
              aria-pressed={theme === value}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors",
                theme === value
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-border text-ink-secondary hover:bg-surface-hover"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notificaciones">
        <div className="divide-y divide-border rounded-xl2 border border-border bg-surface px-4">
          <Toggle
            checked={settings.dailySummary}
            onChange={(v) => void saveSettings({ dailySummary: v })}
            label="Resumen diario"
            description="Un repaso de tus tareas cada mañana"
          />
          <Toggle
            checked={settings.reminders}
            onChange={(v) => void saveSettings({ reminders: v })}
            label="Recordatorios"
            description="Avisos antes de la hora de una tarea"
          />
          <Toggle
            checked={settings.overdueAlerts}
            onChange={(v) => void saveSettings({ overdueAlerts: v })}
            label="Tareas vencidas"
            description="Avisos de lo que quedó sin hacer"
          />
        </div>
      </Section>

      <Section title="Horarios">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="summary-time" className="mb-1 block text-[12px] text-ink-secondary">
              Hora del resumen
            </label>
            <input
              id="summary-time"
              type="time"
              value={settings.summaryTime}
              onChange={(e) => void saveSettings({ summaryTime: e.target.value })}
              className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <span className="mb-1 block text-[12px] text-ink-secondary">
              Avisar antes de cada tarea
            </span>
            <div className="flex gap-1.5">
              {LEAD_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => void saveSettings({ reminderLeadMinutes: minutes })}
                  aria-pressed={settings.reminderLeadMinutes === minutes}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors",
                    settings.reminderLeadMinutes === minutes
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-border text-ink-secondary hover:bg-surface-hover"
                  )}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Canales">
        <div className="divide-y divide-border rounded-xl2 border border-border bg-surface px-4">
          <Toggle
            checked={settings.channels.telegram}
            onChange={(v) =>
              void saveSettings({
                channels: { ...settings.channels, telegram: v },
              })
            }
            label="Telegram"
            description="Conexión pendiente — los envíos se simulan dentro de la app"
          />
          <Toggle
            checked={settings.channels.whatsapp}
            onChange={(v) =>
              void saveSettings({
                channels: { ...settings.channels, whatsapp: v },
              })
            }
            label="WhatsApp"
            description="Conexión pendiente — los envíos se simulan dentro de la app"
          />
        </div>
      </Section>

      <Section title="Datos">
        <p className="mb-2.5 text-[12.5px] text-ink-tertiary">
          Todo se guarda en este navegador. Restaurar vuelve a los 5 clientes y las tareas de
          ejemplo, y descarta lo que hayas cargado.
        </p>
        <button
          onClick={() => setConfirmingReset(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
        >
          <RotateCcw size={13} />
          Restaurar datos de ejemplo
        </button>
      </Section>

      <ConfirmDialog
        open={confirmingReset}
        title="¿Restaurar los datos de ejemplo?"
        description="Se pierden las tareas y clientes que hayas creado en este navegador."
        confirmLabel="Restaurar"
        onClose={() => setConfirmingReset(false)}
        onConfirm={async () => {
          await resetDemoData();
          push({ title: "Datos de ejemplo restaurados", tone: "success" });
        }}
      />
    </div>
  );
}
