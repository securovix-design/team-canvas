import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  onTaskMove: (taskId: string, newStatusId: string) => void;
  onTaskTitleUpdate: (taskId: string, newTitle: string) => void;
  onStatusNameUpdate?: (statusId: string, newName: string) => void;
}

export function KanbanBoard({
  statuses,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskMove,
  onTaskTitleUpdate,
  onStatusNameUpdate,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editStatusName, setEditStatusName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const getTasksForStatus = (statusId: string) => {
    return tasks.filter((task) => task.status_id === statusId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a status column
    const overStatus = statuses.find((s) => s.id === overId);
    if (overStatus) {
      const task = tasks.find((t) => t.id === activeTaskId);
      if (task && task.status_id !== overStatus.id) {
        onTaskMove(activeTaskId, overStatus.id);
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status_id) {
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (activeTask && activeTask.status_id !== overTask.status_id) {
        onTaskMove(activeTaskId, overTask.status_id);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Find what we're over
    const overStatus = statuses.find((s) => s.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    const targetStatusId = overStatus?.id || overTask?.status_id;
    if (targetStatusId && activeTask.status_id !== targetStatusId) {
      // Preview the move by updating visually
    }
  };

  const handleEditStatus = (status: TaskStatus) => {
    setEditingStatusId(status.id);
    setEditStatusName(status.name);
  };

  const handleSaveStatusName = (statusId: string) => {
    if (editStatusName.trim() && onStatusNameUpdate) {
      onStatusNameUpdate(statusId, editStatusName.trim());
    }
    setEditingStatusId(null);
  };

  const handleCancelEditStatus = () => {
    setEditingStatusId(null);
    setEditStatusName('');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {statuses
          .sort((a, b) => a.position - b.position)
          .map((status) => {
            const statusTasks = getTasksForStatus(status.id);
            return (
              <div
                key={status.id}
                className="kanban-column min-w-[300px] w-[300px] flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    {editingStatusId === status.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editStatusName}
                          onChange={(e) => setEditStatusName(e.target.value)}
                          className="h-7 text-sm font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveStatusName(status.id);
                            if (e.key === 'Escape') handleCancelEditStatus();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSaveStatusName(status.id)}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCancelEditStatus}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/header flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {status.name}
                        </h3>
                        <button
                          onClick={() => handleEditStatus(status)}
                          className="opacity-0 group-hover/header:opacity-100 transition-opacity p-1 hover:bg-background rounded"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {statusTasks.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => onAddTask(status.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <SortableContext
                  items={statusTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[400px]" data-status-id={status.id}>
                    {statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task)}
                        onTitleUpdate={onTaskTitleUpdate}
                      />
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                        <p>Drop tasks here</p>
                        <button
                          onClick={() => onAddTask(status.id)}
                          className="text-primary hover:underline mt-1"
                        >
                          or add a task
                        </button>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="task-card shadow-xl ring-2 ring-primary rotate-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground line-clamp-2">
                {activeTask.title}
              </h4>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
