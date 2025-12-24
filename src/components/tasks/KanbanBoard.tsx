import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  due_date?: string | null;
  status_id: string | null;
  assignee?: {
    email: string;
    full_name?: string | null;
  } | null;
}

interface KanbanBoardProps {
  statuses: TaskStatus[];
  tasks: Task[];
  onAddTask: (statusId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ statuses, tasks, onAddTask, onTaskClick }: KanbanBoardProps) {
  const getTasksForStatus = (statusId: string) => {
    return tasks.filter((task) => task.status_id === statusId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {statuses
        .sort((a, b) => a.position - b.position)
        .map((status) => (
          <div key={status.id} className="kanban-column min-w-[300px] w-[300px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="font-semibold text-sm text-foreground">
                  {status.name}
                </h3>
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                  {getTasksForStatus(status.id).length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddTask(status.id)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {getTasksForStatus(status.id).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}

              {getTasksForStatus(status.id).length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>No tasks</p>
                  <button
                    onClick={() => onAddTask(status.id)}
                    className="text-primary hover:underline mt-1"
                  >
                    Add a task
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
