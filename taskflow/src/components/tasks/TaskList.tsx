import type { Task } from "../../types";
import { TaskItem } from "./TaskItem";
import { EmptyState } from "../common/EmptyState";
import { ListChecks } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  showClient?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskList({
  tasks,
  showClient = true,
  emptyTitle = "No hay tareas acá",
  emptyDescription,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} showClient={showClient} />
      ))}
    </div>
  );
}
