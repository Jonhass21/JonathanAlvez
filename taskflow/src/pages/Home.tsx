import { useAppData } from "../context/AppDataContext";
import { TaskInput } from "../components/tasks/TaskInput";
import { TaskList } from "../components/tasks/TaskList";
import { TaskItem } from "../components/tasks/TaskItem";
import { DailySummary } from "../components/dashboard/DailySummary";
import { NotificationCenter } from "../components/dashboard/NotificationCenter";
import { PageSkeleton } from "../components/common/PageSkeleton";
import { getNextUpTask, getOverdueTasks, getTodayTasks } from "../utils/taskFilters";
import { longDateLabel, todayStr } from "../utils/date";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Home() {
  const { tasks, loading } = useAppData();

  if (loading) return <PageSkeleton />;

  const overdue = getOverdueTasks(tasks);
  const today = getTodayTasks(tasks);
  const nextUp = getNextUpTask(tasks);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-tertiary">
          {longDateLabel(todayStr())}
        </p>
        <h1 className="mt-1.5 font-display text-[28px] italic leading-tight text-ink">
          {getGreeting()}, Jona
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-secondary">
          {today.length === 0
            ? "Hoy no tenés tareas agendadas."
            : `Hoy tenés ${today.length} tarea${today.length === 1 ? "" : "s"}.`}
          {overdue.length > 0 && ` Quedaron ${overdue.length} sin completar de días anteriores.`}
        </p>
      </header>

      <TaskInput />

      <NotificationCenter overdue={overdue} />

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-accent-text">
            Vencidas
          </h2>
          <TaskList tasks={overdue} />
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Hoy
        </h2>
        <TaskList
          tasks={today}
          emptyTitle="Nada para hoy"
          emptyDescription="Aprovechá para adelantar algo de mañana."
        />
      </section>

      {nextUp && (
        <section>
          <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-tertiary">
            Lo siguiente
          </h2>
          <TaskItem task={nextUp} />
        </section>
      )}

      <DailySummary todayTasks={today} />
    </div>
  );
}
