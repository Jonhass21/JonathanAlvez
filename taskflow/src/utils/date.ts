// All dates in this app are stored as plain "YYYY-MM-DD" strings and parsed by
// splitting the parts manually. Passing an ISO string straight into `new Date()`
// gets interpreted as UTC by the engine and can silently shift the day depending
// on the viewer's timezone, so that pattern is avoided everywhere in this file.

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** "HH:mm" for right now — used by the reminder strip on Inicio. */
export function nowTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function addDays(dateStr: string, amount: number): string {
  const date = parseDateStr(dateStr);
  date.setDate(date.getDate() + amount);
  return toDateStr(date);
}

/**
 * Month-aware stepping. Naively adding 30 days drifts: from Jan 31 it lands on
 * Mar 2 and skips February entirely, which the calendar's month arrows hit.
 * Clamps the day so Mar 31 → Feb 28/29 instead of spilling into next month.
 */
export function addMonths(dateStr: string, amount: number): string {
  const date = parseDateStr(dateStr);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateStr(date);
}

export function weekdayIndex(dateStr: string): number {
  return parseDateStr(dateStr).getDay();
}

export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function diffInDays(from: string, to: string): number {
  return Math.round((parseDateStr(to).getTime() - parseDateStr(from).getTime()) / 86400000);
}

export function isPast(dateStr: string): boolean {
  return compareDateStr(dateStr, todayStr()) < 0;
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function isTomorrow(dateStr: string): boolean {
  return dateStr === addDays(todayStr(), 1);
}

export function friendlyDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha";
  if (isToday(dateStr)) return "Hoy";
  if (isTomorrow(dateStr)) return "Mañana";
  const d = parseDateStr(dateStr);
  if (isPast(dateStr)) {
    return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  }
  const diffDays = diffInDays(todayStr(), dateStr);
  if (diffDays > 1 && diffDays < 7) return WEEKDAY_LABELS[weekdayIndex(dateStr)];
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export function fullWeekdayLabel(dateStr: string): string {
  return WEEKDAY_LABELS[weekdayIndex(dateStr)];
}

export function longDateLabel(dateStr: string): string {
  const d = parseDateStr(dateStr);
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()} de ${MONTH_LABELS[d.getMonth()]}`;
}

export function monthLabel(dateStr: string): string {
  const d = parseDateStr(dateStr);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(time: string | null): string {
  if (!time) return "Sin hora";
  return time;
}

/** Minutes from now until `time` on `dateStr`; negative once it has passed. */
export function minutesUntil(dateStr: string, time: string): number {
  const [h, m] = time.split(":").map(Number);
  const target = parseDateStr(dateStr);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - Date.now()) / 60000);
}

export function formatMinutesLabel(minutes: number): string {
  if (minutes <= 0) return "Ahora";
  if (minutes < 60) return `En ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `En ${hours} h`;
  return `En ${hours} h ${rest} min`;
}

/** Monday-first week (7 dates) containing the given date string. */
export function getWeekDates(dateStr: string): string[] {
  const idx = weekdayIndex(dateStr); // 0 = Sunday
  const mondayOffset = idx === 0 ? -6 : 1 - idx;
  const monday = addDays(dateStr, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getMonthGrid(dateStr: string): string[] {
  const d = parseDateStr(dateStr);
  const firstOfMonth = toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  const lastOfMonth = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  const start = getWeekDates(firstOfMonth)[0];
  const end = getWeekDates(lastOfMonth)[6];
  const days: string[] = [];
  let cursor = start;
  while (compareDateStr(cursor, end) <= 0) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export { WEEKDAY_LABELS, WEEKDAY_SHORT, MONTH_SHORT, MONTH_LABELS };
