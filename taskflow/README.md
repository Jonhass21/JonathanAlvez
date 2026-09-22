# TaskFlow

Prototipo funcional de un sistema personal de gestión de clientes y tareas.
React + Vite + TypeScript + Tailwind CSS + Lucide. Sin backend: todo vive en
`localStorage`, con la capa de servicios separada para que conectar Supabase,
OpenAI, Telegram y WhatsApp más adelante sea un cambio acotado y no una
reescritura.

La idea rectora: **le contás lo que tenés que hacer y el sistema lo ordena.**
Escribís una frase en lenguaje natural, confirmás lo que interpretó, y seguís
trabajando. Dos pasos, nunca más.

## Cómo ejecutarlo

Necesitás Node.js 18 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
```

La primera vez siembra 5 clientes y ~17 tareas con fechas relativas a hoy.
Podés volver a ese estado desde **Configuración → Restaurar datos de ejemplo**.

```bash
npm run build        # build de producción a dist/
npm run preview      # sirve ese build
npm test             # vitest (parser, fechas, filtros)
npm run lint         # oxlint
npm run format       # prettier
```

## Estructura del proyecto

```
src/
  types/         Tipos compartidos (Task, Client, InboxItem, AppSettings…)
  data/          mockData.ts (semilla) y defaults.ts (borrador vacío de tarea)
  services/      Toda la lógica de negocio y persistencia — ver abajo
  utils/         Fechas (parseo seguro de timezone), filtros/búsqueda, helpers
  context/       AppDataContext (tareas/clientes/bandeja/ajustes) y ToastContext
  hooks/         useTaskActions, useNotificationService, useMinuteTick
  components/
    layout/      Sidebar (desktop), navegación inferior (mobile), shell general
    tasks/       TaskItem, TaskList, TaskInput, TaskFields, TaskConfirmModal,
                 TaskEditModal, InboxCard
    clients/     ClientCard, ClientFormModal
    calendar/    WeekStrip, MonthGrid
    dashboard/   DailySummary, NotificationCenter (recordatorios y vencidas)
    assistant/   El botón flotante "Ask" y su panel de chat
    common/      Modal, ConfirmDialog, CommandPalette, Toast, Toggle,
                 EmptyState, PageSkeleton, badges
  pages/         Home, Clients, ClientDetail, Calendar, Inbox, Settings
```

Regla general: **las páginas y los componentes no tocan `localStorage`.** Todo
pasa por `services/`, y esos servicios son `async` aunque hoy sean síncronos por
dentro, así el día que cambie la implementación ninguna pantalla se entera.

## Dónde conectar Supabase

`src/services/taskService.ts`, `clientService.ts` e `inboxService.ts`. Cada uno
expone `listX() / createX() / updateX() / deleteX()`: cambiás el cuerpo por la
llamada a Supabase (`supabase.from('tasks').select()`, etc.) manteniendo la
misma firma. `src/services/storage.ts` deja de usarse y `AppDataContext` no se
toca.

Tablas mínimas: `clients (id, name, colorway)` y
`tasks (id, title, description, client_id, status, priority, due_date, due_time,
category, created_at, completed_at)`. `due_date` como `date` y `due_time` como
`time`, no como `timestamptz`: la app trabaja con fechas locales a propósito.

## Dónde conectar OpenAI

Dos lugares:

- `src/services/taskParser.ts` → `parseTaskText(text, clients)`. Hoy interpreta
  cliente, fecha, hora, categoría y prioridad con expresiones regulares.
  Reemplazala por una llamada al modelo que devuelva el mismo `ParsedTaskResult`
  (el `confidence` es lo que pinta los puntitos dorados de "esto lo deduje yo").
- `src/services/assistantService.ts` → `answerQuestion(question, tasks, clients)`.
  Hoy responde con reglas sobre los datos locales. Le pasás la pregunta más las
  tareas como contexto y devolvés el texto del modelo, igual que ahora.

## Dónde conectar Telegram / WhatsApp

`src/services/notificationService.ts`. Los mensajes ya se arman en texto plano
(`buildDailySummaryMessage`, `buildTaskReminderMessage`, `buildOverdueMessage`),
que es exactamente el `text` que espera un `sendMessage`. Lo único simulado es
el último paso: la función `deliver()`, que hoy muestra un toast.

```ts
// Telegram Bot API
await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: CHAT_ID, text }),
});

// WhatsApp Business Cloud API
await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: PHONE,
    type: "text",
    text: { body: text },
  }),
});
```

Los canales activos y los horarios ya salen de `AppSettings`, así que el día que
exista un job que corra a las 08:30 solo tiene que leer los ajustes y llamar a
estas funciones. El camino inverso (mensajes que _entran_ por Telegram) es la
**Bandeja**: el webhook crea un `InboxItem` con `inboxService.addInboxItem()` y
la pantalla ya hace el resto.

## Qué hace hoy

- **Inicio** — saludo, captura en lenguaje natural, recordatorios en vivo
  ("En 30 minutos…"), vencidas, hoy, lo siguiente y el resumen diario.
- **Clientes** — alta, renombrado y baja (las tareas sobreviven sin cliente),
  pendientes, próxima tarea y vencidas por cuenta.
- **Detalle de cliente** — pestañas por estado, filtro por categoría, alta rápida.
- **Calendario** — vista semanal y mensual, día seleccionado con su lista.
- **Bandeja** — instrucciones sin procesar con lo que el parser entendió de cada
  una y los botones Crear / Editar / Descartar.
- **Configuración** — perfil, tema (claro / oscuro / sistema), notificaciones,
  hora del resumen, anticipación de recordatorios, canales y reset de datos.
- **Ask** — botón flotante que responde con los datos locales.
- **⌘K / Ctrl+K** — buscar entre tareas y clientes, o convertir lo que escribas
  en una tarea sin soltar el teclado.

## Notas de diseño

- Paleta neutra y aireada, con borgoña y dorado como únicos acentos (estados y
  prioridades). Playfair Display se usa solo en el wordmark y el saludo; el
  resto es Inter.
- Tema claro por defecto, oscuro disponible, y "sistema" siguiendo el SO. Los
  colores son variables CSS (`src/index.css`) mapeadas en `tailwind.config.js`,
  así que cambiar de tema es un atributo en `<html>`, no una clase por elemento.
- Las prioridades son un punto de color, no emoji, para no ensuciar la lista.
- Las acciones destructivas no piden confirmación: eliminan y ofrecen
  **Deshacer** en el toast. Las que no se pueden deshacer (borrar un cliente,
  resetear los datos) sí preguntan.

## Limitaciones conocidas del prototipo

- Todo vive en `localStorage`: un solo navegador, un solo dispositivo. En
  incógnito o con los datos del sitio borrados, vuelve a la semilla.
- La semilla usa fechas relativas al momento de la primera carga, así que si
  volvés después de unos días las tareas "de hoy" aparecen vencidas. Es el
  comportamiento real; para una demo limpia, restaurá los datos de ejemplo.
- El parser cubre los patrones frecuentes (hoy / mañana / pasado mañana / días
  de la semana / "en 3 días" / "la semana que viene" / fechas explícitas /
  horas en varios formatos / categorías y urgencia por palabra clave), pero no
  es un modelo: una frase muy fuera de esos patrones cae en los valores por
  defecto y se corrige en la ventana de confirmación.
- Los envíos a Telegram/WhatsApp se simulan con un toast; no hay ningún job
  corriendo en segundo plano.
