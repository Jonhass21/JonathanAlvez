import type { AppSettings } from "../types";
import { KEYS, readJSON, writeJSON } from "./storage";

export const DEFAULT_SETTINGS: AppSettings = {
  dailySummary: true,
  reminders: true,
  overdueAlerts: true,
  summaryTime: "08:30",
  reminderLeadMinutes: 30,
  channels: { telegram: true, whatsapp: false },
};

export async function getSettings(): Promise<AppSettings> {
  // Spread over the defaults so settings saved by an older build (missing
  // newer keys) don't come back with undefined fields.
  const stored = readJSON<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    channels: { ...DEFAULT_SETTINGS.channels, ...stored.channels },
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    channels: { ...current.channels, ...patch.channels },
  };
  writeJSON(KEYS.settings, next);
  return next;
}
