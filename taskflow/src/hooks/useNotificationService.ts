import { useMemo } from "react";
import { useToasts } from "../context/ToastContext";
import { useAppData } from "../context/AppDataContext";
import { createNotificationService } from "../services/notificationService";

export function useNotificationService() {
  const { push } = useToasts();
  const { settings, clients } = useAppData();
  return useMemo(
    () => createNotificationService(push, settings, clients),
    [push, settings, clients]
  );
}
