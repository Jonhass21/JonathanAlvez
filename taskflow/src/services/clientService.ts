// Same shape as taskService: async today for no reason other than making the
// Supabase swap a body change instead of a call-site change.

import type { Client, ClientColorway } from "../types";
import { KEYS, readJSON, writeJSON } from "./storage";
import { MOCK_CLIENTS } from "../data/mockData";
import { generateId } from "../utils/id";

const COLORWAYS: ClientColorway[] = ["accent", "gold", "neutral"];

function loadAll(): Client[] {
  return readJSON<Client[]>(KEYS.clients, []);
}

function saveAll(clients: Client[]): void {
  writeJSON(KEYS.clients, clients);
}

export async function ensureSeeded(): Promise<void> {
  if (loadAll().length > 0) return;
  saveAll(MOCK_CLIENTS);
}

export async function listClients(): Promise<Client[]> {
  return loadAll();
}

export async function getClient(id: string): Promise<Client | null> {
  return loadAll().find((c) => c.id === id) ?? null;
}

export async function createClient(name: string): Promise<Client> {
  const all = loadAll();
  const client: Client = {
    id: generateId("client"),
    name: name.trim(),
    // Cycle the accent colors so a new client never looks identical to the last.
    colorway: COLORWAYS[all.length % COLORWAYS.length],
  };
  saveAll([...all, client]);
  return client;
}

export async function updateClient(
  id: string,
  patch: Partial<Omit<Client, "id">>
): Promise<Client | null> {
  const all = loadAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  saveAll(all);
  return all[idx];
}

export async function deleteClient(id: string): Promise<void> {
  saveAll(loadAll().filter((c) => c.id !== id));
}

export async function resetToMockData(): Promise<void> {
  saveAll(MOCK_CLIENTS);
}
