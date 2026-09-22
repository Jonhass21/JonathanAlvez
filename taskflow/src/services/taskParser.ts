// Simulated natural-language parser: enough real patterns to demo the
// "yo le cuento y el sistema lo ordena" flow, not a real NLP engine.
//
// Swap this for an OpenAI call later — what the rest of the app depends on is
// the return shape (ParsedTaskResult), not how it was produced. The client list
// is a parameter rather than an import so the parser keeps working when Jona
// adds a client that isn't in the seed data.

import type { Client, NewTaskDraft, ParsedTaskResult, TaskCategory, TaskPriority } from "../types";
import { addDays, addMonths, todayStr, toDateStr, weekdayIndex, parseDateStr } from "../utils/date";

const WEEKDAYS: Array<[string, number]> = [
  ["domingo", 0],
  ["lunes", 1],
  ["martes", 2],
  ["miercoles", 3],
  ["jueves", 4],
  ["viernes", 5],
  ["sabado", 6],
];

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const CATEGORY_KEYWORDS: Array<[TaskCategory, string[]]> = [
  [
    "Reunión",
    ["reunion", "reunirme", "llamada", "llamar", "meet", "zoom", "videollamada", "coordinar"],
  ],
  [
    "Publicidad",
    [
      "campana",
      "pauta",
      "ads",
      "anuncio",
      "publicidad",
      "meta ads",
      "google ads",
      "presupuesto de pauta",
    ],
  ],
  [
    "Administración",
    [
      "factura",
      "facturar",
      "cobro",
      "cobrar",
      "pago",
      "pagar",
      "informe",
      "reporte",
      "administra",
      "presupuesto",
      "propuesta",
      "contrato",
    ],
  ],
  [
    "Diseño",
    [
      "disen",
      "pieza",
      "piezas",
      "arte",
      "banner",
      "flyer",
      "portada",
      "logo",
      "identidad",
      "paleta",
    ],
  ],
  [
    "Contenido",
    [
      "reel",
      "reels",
      "carrusel",
      "historia",
      "historias",
      "post",
      "contenido",
      "video",
      "story",
      "stories",
      "guion",
      "copy",
      "calendario de contenido",
      "grilla",
    ],
  ],
  ["Cliente", ["aprobacion", "feedback", "revision con", "enviar al cliente"]],
];

const FILLER_PREFIXES = [
  "tengo que ",
  "tenemos que ",
  "hay que ",
  "necesito ",
  "necesitamos ",
  "debo ",
  "quiero ",
  "acordate de ",
  "acordarme de ",
  "recordar ",
  "recordarme ",
  "me toca ",
];

/** Leading words left dangling once a client/date/time span is removed. */
const DANGLING_WORDS = [
  "de",
  "del",
  "para",
  "a",
  "al",
  "con",
  "en",
  "el",
  "la",
  "los",
  "las",
  "que",
  "y",
];

interface Span {
  start: number;
  end: number;
}

/**
 * Length-preserving normalization: lowercase plus a 1:1 accent map. Using
 * NFD+strip would shift indices, and we need offsets in the folded string to
 * line up with the original so the title can be cut by position.
 */
export function fold(input: string): string {
  return input
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/ñ/g, "n");
}

/** Widens a span backwards over a preposition/article ("de San Lucas", "para el jueves"). */
function widenLeft(folded: string, span: Span): Span {
  const before = folded.slice(0, span.start).replace(/\s+$/, "");
  for (const word of DANGLING_WORDS) {
    if (before.endsWith(` ${word}`) || before === word) {
      const start = before.length - word.length;
      return { start, end: span.end };
    }
  }
  return span;
}

function matchSpan(folded: string, re: RegExp): { match: RegExpMatchArray; span: Span } | null {
  const m = folded.match(re);
  if (!m || m.index === undefined) return null;
  return { match: m, span: { start: m.index, end: m.index + m[0].length } };
}

function findClient(folded: string, clients: Client[]): { id: string; span: Span } | null {
  // Longest name first so "Estilo Campo" wins over a hypothetical "Estilo".
  const sorted = [...clients].sort((a, b) => b.name.length - a.name.length);
  for (const client of sorted) {
    const needle = fold(client.name);
    const idx = folded.indexOf(needle);
    if (idx !== -1) return { id: client.id, span: { start: idx, end: idx + needle.length } };
  }
  return null;
}

function findDate(folded: string): { dateStr: string; span: Span } | null {
  const today = todayStr();

  // Order matters: "pasado mañana" has to be tried before the bare "mañana",
  // otherwise \bmanana\b matches inside it and the task lands a day early.
  const relative: Array<[RegExp, () => string]> = [
    [/\bpasado manana\b/, () => addDays(today, 2)],
    [/\bhoy\b/, () => today],
    [/\bmanana\b/, () => addDays(today, 1)],
    [/\ben (\d{1,2}) dias?\b/, () => today],
    [/\b(la semana que viene|la proxima semana|la semana proxima)\b/, () => addDays(today, 7)],
    [/\b(el mes que viene|el proximo mes)\b/, () => addMonths(today, 1)],
    [
      /\b(fin de semana|este finde|el finde)\b/,
      () => {
        const delta = (6 - weekdayIndex(today) + 7) % 7;
        return addDays(today, delta === 0 ? 0 : delta);
      },
    ],
  ];

  for (const [re, resolve] of relative) {
    const hit = matchSpan(folded, re);
    if (!hit) continue;
    if (re.source.includes("dias")) {
      return { dateStr: addDays(today, Number(hit.match[1])), span: hit.span };
    }
    return { dateStr: resolve(), span: hit.span };
  }

  // "12 de marzo" / "3 de abril"
  const named = matchSpan(
    folded,
    new RegExp(`\\b(\\d{1,2}) de (${Object.keys(MONTHS).join("|")})\\b`)
  );
  if (named) {
    const day = Number(named.match[1]);
    const month = MONTHS[named.match[2]];
    const base = parseDateStr(today);
    let candidate = toDateStr(new Date(base.getFullYear(), month, day));
    if (candidate < today) candidate = toDateStr(new Date(base.getFullYear() + 1, month, day));
    return { dateStr: candidate, span: named.span };
  }

  // "12/3" or "12-03", optionally with a year
  const numeric = matchSpan(folded, /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric.match[1]);
    const month = Number(numeric.match[2]) - 1;
    const base = parseDateStr(today);
    let year = numeric.match[3] ? Number(numeric.match[3]) : base.getFullYear();
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      let candidate = toDateStr(new Date(year, month, day));
      if (!numeric.match[3] && candidate < today)
        candidate = toDateStr(new Date(year + 1, month, day));
      return { dateStr: candidate, span: numeric.span };
    }
  }

  // Weekday names. "el jueves" said on a Thursday means today; "el jueves que
  // viene" / "el próximo jueves" always means the next one.
  for (const [name, idx] of WEEKDAYS) {
    const hit = matchSpan(
      folded,
      new RegExp(`\\b(el |este |proximo |el proximo )?${name}( que viene)?\\b`)
    );
    if (!hit) continue;
    const forceNext = Boolean(hit.match[2]) || /proximo/.test(hit.match[1] ?? "");
    let delta = idx - weekdayIndex(today);
    if (delta < 0) delta += 7;
    if (delta === 0 && forceNext) delta = 7;
    return { dateStr: addDays(today, delta), span: hit.span };
  }

  return null;
}

function normalizeHour(hour: number, meridiem: string | undefined, folded: string): number {
  if (meridiem?.startsWith("p") && hour < 12) return hour + 12;
  if (meridiem?.startsWith("a") && hour === 12) return 0;
  if (meridiem) return hour;
  // "a las 3" in a workday context reads as 15:00, not 03:00.
  if (hour >= 1 && hour <= 7 && /\b(tarde|a la tarde|de la tarde)\b/.test(folded)) return hour + 12;
  return hour;
}

function findTime(folded: string): { time: string; span: Span } | null {
  const build = (h: number, m: number) =>
    `${String(Math.min(h, 23)).padStart(2, "0")}:${String(Math.min(m, 59)).padStart(2, "0")}`;

  const mediodia = matchSpan(folded, /\b(al |a la |el )?mediodia\b/);
  if (mediodia) return { time: "12:00", span: mediodia.span };

  const laUna = matchSpan(folded, /\ba la una\b/);
  if (laUna) return { time: "13:00", span: laUna.span };

  const half = matchSpan(folded, /\ba las (\d{1,2}) y (media|cuarto)\b/);
  if (half) {
    const hour = normalizeHour(Number(half.match[1]), undefined, folded);
    return {
      time: build(hour, half.match[2] === "media" ? 30 : 15),
      span: half.span,
    };
  }

  const spoken = matchSpan(folded, /\ba las (\d{1,2})(?::(\d{2}))?\s?(am|pm|hs|h)?\b/);
  if (spoken) {
    const hour = normalizeHour(Number(spoken.match[1]), spoken.match[3], folded);
    return {
      time: build(hour, Number(spoken.match[2] ?? 0)),
      span: spoken.span,
    };
  }

  const suffixed = matchSpan(folded, /\b(\d{1,2})(?::(\d{2}))?\s?(hs|h|am|pm)\b/);
  if (suffixed) {
    const hour = normalizeHour(Number(suffixed.match[1]), suffixed.match[3], folded);
    return {
      time: build(hour, Number(suffixed.match[2] ?? 0)),
      span: suffixed.span,
    };
  }

  const clock = matchSpan(folded, /\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (clock)
    return {
      time: build(Number(clock.match[1]), Number(clock.match[2])),
      span: clock.span,
    };

  return null;
}

function findCategory(folded: string): {
  category: TaskCategory;
  matched: boolean;
} {
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => folded.includes(k))) return { category, matched: true };
  }
  return { category: "Otro", matched: false };
}

function findPriority(folded: string): {
  priority: TaskPriority;
  matched: boolean;
} {
  if (
    /\b(urgente|urgentisimo|importante|prioridad alta|ya mismo|cuanto antes|si o si)\b/.test(folded)
  ) {
    return { priority: "high", matched: true };
  }
  if (
    /\b(sin apuro|cuando pueda|cuando puedas|no es urgente|prioridad baja|algun dia)\b/.test(folded)
  ) {
    return { priority: "low", matched: true };
  }
  return { priority: "medium", matched: false };
}

/** Overlapping spans would corrupt the slice, so collapse them first. */
function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}

function buildTitle(original: string, spans: Span[]): string {
  // Cut from the end so earlier offsets stay valid.
  const ordered = mergeSpans(spans).sort((a, b) => b.start - a.start);
  let text = original;
  for (const span of ordered) {
    text = text.slice(0, span.start) + " " + text.slice(span.end);
  }

  let cleaned = text.replace(/\s{2,}/g, " ").trim();

  let changed = true;
  while (changed) {
    changed = false;
    const lower = fold(cleaned);
    for (const prefix of FILLER_PREFIXES) {
      if (lower.startsWith(prefix)) {
        cleaned = cleaned.slice(prefix.length).trim();
        changed = true;
        break;
      }
    }
  }

  cleaned = cleaned
    .replace(/^[,:;.\-–—\s]+/, "")
    .replace(/[,:;\-–—\s]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // A trailing dangling preposition ("Preparar el reel de") reads badly.
  const words = cleaned.split(" ");
  while (words.length > 1 && DANGLING_WORDS.includes(fold(words[words.length - 1]))) words.pop();
  cleaned = words.join(" ");

  if (!cleaned) return "Nueva tarea";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function parseTaskText(input: string, clients: Client[]): ParsedTaskResult {
  const original = input.trim();
  const folded = fold(original);

  const client = findClient(folded, clients);
  const date = findDate(folded);
  const time = findTime(folded);
  const category = findCategory(folded);
  const priority = findPriority(folded);

  const spans: Span[] = [];
  if (client) spans.push(widenLeft(folded, client.span));
  if (date) spans.push(widenLeft(folded, date.span));
  if (time) spans.push(widenLeft(folded, time.span));

  const draft: NewTaskDraft = {
    title: buildTitle(original, spans),
    description: "",
    clientId: client?.id ?? null,
    priority: priority.priority,
    dueDate: date?.dateStr ?? null,
    dueTime: time?.time ?? null,
    category: category.category,
  };

  return {
    draft,
    confidence: {
      client: Boolean(client),
      date: Boolean(date),
      time: Boolean(time),
      category: category.matched,
      priority: priority.matched,
    },
  };
}
