import type { NewTaskDraft } from "../types";

/** Starting point for a task created from a button rather than from text. */
export const EMPTY_DRAFT: NewTaskDraft = {
  title: "",
  description: "",
  clientId: null,
  priority: "medium",
  dueDate: null,
  dueTime: null,
  category: "Otro",
};
