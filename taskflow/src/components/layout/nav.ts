import { Home, Users, CalendarDays, Inbox, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/clientes", label: "Clientes", icon: Users, end: false },
  { to: "/calendario", label: "Calendario", icon: CalendarDays, end: false },
  { to: "/bandeja", label: "Bandeja", icon: Inbox, end: false },
  { to: "/configuracion", label: "Configuración", icon: Settings, end: false },
] as const;
