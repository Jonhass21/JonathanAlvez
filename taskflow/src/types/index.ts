export type TaskStatus = "pending" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export const TASK_CATEGORIES = [
  "Contenido",
  "Diseño",
  "Publicidad",
  "Administración",
  "Reunión",
  "Cliente",
  "Otro",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // stored as YYYY-MM-DD, never as a raw Date/ISO string
  dueTime: string | null; // stored as HH:mm
  category: TaskCategory;
  createdAt: string; // ISO timestamp, only used for sorting/display, never re-parsed as a due date
  completedAt: string | null;
}

export const CLIENT_COLORWAYS = ["accent", "gold", "neutral"] as const;

export type ClientColorway = (typeof CLIENT_COLORWAYS)[number];

export interface Client {
  id: string;
  name: string;
  colorway: ClientColorway;
}

export type NewTaskDraft = Omit<Task, "id" | "createdAt" | "completedAt" | "status">;

export interface ParsedTaskResult {
  draft: NewTaskDraft;
  confidence: {
    client: boolean;
    date: boolean;
    time: boolean;
    category: boolean;
    priority: boolean;
  };
}

export interface AppSettings {
  dailySummary: boolean;
  reminders: boolean;
  overdueAlerts: boolean;
  summaryTime: string;
  reminderLeadMinutes: number;
  channels: {
    telegram: boolean;
    whatsapp: boolean;
  };
}

export interface InboxItem {
  id: string;
  rawText: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "warning";
  action?: { label: string; onClick: () => void };
}
