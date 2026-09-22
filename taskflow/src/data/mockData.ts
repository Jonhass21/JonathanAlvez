import type { Client, Task } from "../types";
import { addDays, todayStr } from "../utils/date";
import { generateId } from "../utils/id";

export const MOCK_CLIENTS: Client[] = [
  { id: "san-lucas", name: "San Lucas", colorway: "accent" },
  { id: "estilo-car", name: "Estilo Car", colorway: "gold" },
  { id: "estilo-campo", name: "Estilo Campo", colorway: "neutral" },
  { id: "kaia", name: "Kaia", colorway: "accent" },
  { id: "modhaus", name: "ModHaus", colorway: "gold" },
];

type Draft = Omit<Task, "id" | "createdAt">;

function buildDraft(
  partial: Omit<Draft, "status" | "completedAt"> & { status?: Task["status"] }
): Draft {
  return {
    status: "pending",
    completedAt: null,
    ...partial,
  };
}

export function buildMockTasks(): Task[] {
  const today = todayStr();
  const now = new Date().toISOString();

  const drafts: Draft[] = [
    // San Lucas
    buildDraft({
      title: "Preparar reel sobre mamografía",
      description: "",
      clientId: "san-lucas",
      priority: "high",
      dueDate: today,
      dueTime: "10:00",
      category: "Contenido",
    }),
    buildDraft({
      title: "Revisar métricas de campaña de octubre",
      description: "",
      clientId: "san-lucas",
      priority: "medium",
      dueDate: addDays(today, 1),
      dueTime: null,
      category: "Publicidad",
    }),
    buildDraft({
      title: "Enviar propuesta de tracking actualizada",
      description: "",
      clientId: "san-lucas",
      priority: "high",
      dueDate: addDays(today, -2),
      dueTime: null,
      category: "Administración",
    }),
    buildDraft({
      title: "Coordinar grabación de testimonios",
      description: "",
      clientId: "san-lucas",
      priority: "low",
      dueDate: addDays(today, 5),
      dueTime: null,
      category: "Reunión",
    }),

    // Estilo Car
    buildDraft({
      title: "Revisar calendario de contenido",
      description: "",
      clientId: "estilo-car",
      priority: "medium",
      dueDate: today,
      dueTime: "12:00",
      category: "Contenido",
    }),
    buildDraft({
      title: "Diseñar piezas de promo de service",
      description: "",
      clientId: "estilo-car",
      priority: "medium",
      dueDate: addDays(today, 2),
      dueTime: null,
      category: "Diseño",
    }),
    buildDraft({
      title: "Enviar informe mensual de Instagram",
      description: "",
      clientId: "estilo-car",
      priority: "high",
      dueDate: addDays(today, 1),
      dueTime: null,
      category: "Administración",
      status: "in_progress",
    }),

    // Estilo Campo
    buildDraft({
      title: "Planificar carrusel de temporada",
      description: "",
      clientId: "estilo-campo",
      priority: "low",
      dueDate: addDays(today, 3),
      dueTime: null,
      category: "Contenido",
    }),
    buildDraft({
      title: "Actualizar catálogo de productos",
      description: "",
      clientId: "estilo-campo",
      priority: "medium",
      dueDate: addDays(today, -1),
      dueTime: null,
      category: "Otro",
    }),
    buildDraft({
      title: "Reunión de seguimiento mensual",
      description: "",
      clientId: "estilo-campo",
      priority: "medium",
      dueDate: addDays(today, 4),
      dueTime: "16:30",
      category: "Reunión",
    }),

    // Kaia
    buildDraft({
      title: "Enviar piezas para aprobación",
      description: "",
      clientId: "kaia",
      priority: "medium",
      dueDate: today,
      dueTime: "15:00",
      category: "Contenido",
    }),
    buildDraft({
      title: "Definir paleta para próxima colección",
      description: "",
      clientId: "kaia",
      priority: "high",
      dueDate: addDays(today, 1),
      dueTime: null,
      category: "Diseño",
    }),
    buildDraft({
      title: "Grabar video prompts nuevos",
      description: "",
      clientId: "kaia",
      priority: "low",
      dueDate: addDays(today, 6),
      dueTime: null,
      category: "Contenido",
    }),
    buildDraft({
      title: "Cerrar informe de resultados",
      description: "",
      clientId: "kaia",
      priority: "medium",
      dueDate: addDays(today, -4),
      dueTime: null,
      category: "Administración",
      status: "completed",
    }),

    // ModHaus
    buildDraft({
      title: "Armar plan de contenidos del mes",
      description: "",
      clientId: "modhaus",
      priority: "high",
      dueDate: addDays(today, 2),
      dueTime: null,
      category: "Contenido",
    }),
    buildDraft({
      title: "Revisar pauta activa",
      description: "",
      clientId: "modhaus",
      priority: "medium",
      dueDate: today,
      dueTime: "18:00",
      category: "Publicidad",
      status: "in_progress",
    }),
    buildDraft({
      title: "Enviar propuesta de rediseño de feed",
      description: "",
      clientId: "modhaus",
      priority: "low",
      dueDate: addDays(today, 7),
      dueTime: null,
      category: "Diseño",
    }),
  ];

  return drafts.map((draft) => ({
    ...draft,
    id: generateId("task"),
    createdAt: now,
    completedAt: draft.status === "completed" ? now : null,
  }));
}
