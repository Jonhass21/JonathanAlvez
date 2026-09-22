import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppSettings, Client, InboxItem, NewTaskDraft, Task, TaskStatus } from "../types";
import * as taskService from "../services/taskService";
import * as clientService from "../services/clientService";
import * as inboxService from "../services/inboxService";
import * as settingsService from "../services/settingsService";
import { setStorageErrorHandler } from "../services/storage";
import { useToasts } from "./ToastContext";

interface AppDataContextValue {
  tasks: Task[];
  clients: Client[];
  inboxItems: InboxItem[];
  settings: AppSettings;
  loading: boolean;
  clientById: (id: string | null) => Client | null;
  addTask: (draft: NewTaskDraft) => Promise<Task>;
  editTask: (id: string, patch: Partial<Task>) => Promise<void>;
  setStatus: (id: string, status: TaskStatus) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  restoreTask: (task: Task) => Promise<void>;
  addClient: (name: string) => Promise<Client>;
  editClient: (id: string, patch: Partial<Omit<Client, "id">>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  saveSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetDemoData: () => Promise<void>;
  addInboxItem: (rawText: string) => Promise<void>;
  removeInboxItem: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { push } = useToasts();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(settingsService.DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // A failed localStorage write silently loses the user's change on reload,
  // so make it visible instead of swallowing the exception.
  useEffect(() => {
    setStorageErrorHandler(() =>
      push({
        title: "No pudimos guardar los cambios",
        description: "El almacenamiento del navegador está lleno o bloqueado.",
        tone: "warning",
      })
    );
    return () => setStorageErrorHandler(null);
  }, [push]);

  const refresh = useCallback(async () => {
    const [t, c, i, s] = await Promise.all([
      taskService.listTasks(),
      clientService.listClients(),
      inboxService.listInbox(),
      settingsService.getSettings(),
    ]);
    setTasks(t);
    setClients(c);
    setInboxItems(i);
    setSettings(s);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([
        taskService.ensureSeeded(),
        clientService.ensureSeeded(),
        inboxService.ensureSeeded(),
      ]);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  /** Wraps a service call so every mutation re-reads state from the store. */
  const mutate = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const result = await operation();
      await refresh();
      return result;
    },
    [refresh]
  );

  const addTask = useCallback(
    (draft: NewTaskDraft) => mutate(() => taskService.createTask(draft)),
    [mutate]
  );

  const editTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      await mutate(() => taskService.updateTask(id, patch));
    },
    [mutate]
  );

  const setStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      await mutate(() => taskService.setTaskStatus(id, status));
    },
    [mutate]
  );

  const removeTask = useCallback(
    async (id: string) => {
      await mutate(() => taskService.deleteTask(id));
    },
    [mutate]
  );

  const restoreTask = useCallback(
    async (task: Task) => {
      await mutate(() => taskService.restoreTask(task));
    },
    [mutate]
  );

  const addClient = useCallback(
    (name: string) => mutate(() => clientService.createClient(name)),
    [mutate]
  );

  const editClient = useCallback(
    async (id: string, patch: Partial<Omit<Client, "id">>) => {
      await mutate(() => clientService.updateClient(id, patch));
    },
    [mutate]
  );

  const removeClient = useCallback(
    async (id: string) => {
      // Tasks outlive the client: they lose the label, not the work.
      await mutate(async () => {
        await taskService.unassignClient(id);
        await clientService.deleteClient(id);
      });
    },
    [mutate]
  );

  const saveSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings(await settingsService.updateSettings(patch));
  }, []);

  const addInboxItem = useCallback(
    async (rawText: string) => {
      await mutate(() => inboxService.addInboxItem(rawText));
    },
    [mutate]
  );

  const removeInboxItem = useCallback(
    async (id: string) => {
      await mutate(() => inboxService.removeInboxItem(id));
    },
    [mutate]
  );

  const resetDemoData = useCallback(async () => {
    await mutate(async () => {
      await clientService.resetToMockData();
      await taskService.resetToMockData();
      await inboxService.resetToMockData();
    });
  }, [mutate]);

  const clientById = useCallback(
    (id: string | null) => (id ? (clients.find((c) => c.id === id) ?? null) : null),
    [clients]
  );

  const value = useMemo(
    () => ({
      tasks,
      clients,
      inboxItems,
      settings,
      loading,
      clientById,
      addTask,
      editTask,
      setStatus,
      removeTask,
      restoreTask,
      addClient,
      editClient,
      removeClient,
      saveSettings,
      resetDemoData,
      addInboxItem,
      removeInboxItem,
    }),
    [
      tasks,
      clients,
      inboxItems,
      settings,
      loading,
      clientById,
      addTask,
      editTask,
      setStatus,
      removeTask,
      restoreTask,
      addClient,
      editClient,
      removeClient,
      saveSettings,
      resetDemoData,
      addInboxItem,
      removeInboxItem,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
