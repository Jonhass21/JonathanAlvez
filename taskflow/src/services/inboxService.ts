import type { InboxItem } from "../types";
import { generateId } from "../utils/id";
import { KEYS, readJSON, writeJSON } from "./storage";

const SEEDED_KEY = "taskflow.inbox.seeded.v1";

// Stand-ins for the messages that will arrive over Telegram/WhatsApp later.
const SEED_TEXTS = [
  "Preparar reel de San Lucas para mañana",
  "Enviar factura a Estilo Campo el viernes",
  "Kaia necesita las piezas de la campaña a las 11",
];

function loadAll(): InboxItem[] {
  return readJSON<InboxItem[]>(KEYS.inbox, []);
}

function saveAll(items: InboxItem[]): void {
  writeJSON(KEYS.inbox, items);
}

function seedItems(): InboxItem[] {
  const now = Date.now();
  return SEED_TEXTS.map((rawText, i) => ({
    id: generateId("inbox"),
    rawText,
    // Stagger the timestamps so the list has a stable, meaningful order.
    createdAt: new Date(now - (SEED_TEXTS.length - i) * 60000).toISOString(),
  }));
}

export async function ensureSeeded(): Promise<void> {
  if (readJSON<boolean>(SEEDED_KEY, false)) return;
  saveAll(seedItems());
  writeJSON(SEEDED_KEY, true);
}

export async function listInbox(): Promise<InboxItem[]> {
  return [...loadAll()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addInboxItem(rawText: string): Promise<InboxItem> {
  const item: InboxItem = {
    id: generateId("inbox"),
    rawText,
    createdAt: new Date().toISOString(),
  };
  saveAll([...loadAll(), item]);
  return item;
}

export async function removeInboxItem(id: string): Promise<void> {
  saveAll(loadAll().filter((i) => i.id !== id));
}

export async function resetToMockData(): Promise<void> {
  saveAll(seedItems());
  writeJSON(SEEDED_KEY, true);
}
