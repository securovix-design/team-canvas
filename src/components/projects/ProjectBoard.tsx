import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

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

interface ProjectBoardProps {
  project: Project;
  onBack: () => void;
}

const DEFAULT_STATUSES = [
  { name: 'To Do', color: '#6b7280', position: 0 },
  { name: 'In Progress', color: '#0ea5e9', position: 1 },
  { name: 'Review', color: '#8b5cf6', position: 2 },
  { name: 'Done', color: '#22c55e', position: 3 },
];

export function ProjectBoard({ project, onBack }: ProjectBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch statuses and tasks
  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [project.id]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch statuses
    const { data: statusData, error: statusError } = await supabase
      .from('task_statuses')
      .select('*')
      .eq('project_id', project.id)
      .order('position');

    if (statusError) {
      toast({ title: 'Error loading statuses', variant: 'destructive' });
    } else if (statusData.length === 0) {
      // Create default statuses for new project
      await createDefaultStatuses();
    } else {
      setStatuses(statusData);
    }

    // Fetch tasks
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('position');

    if (taskError) {
      toast({ title: 'Error loading tasks', variant: 'destructive' });
    } else {
      setTasks(taskData || []);
    }

    setLoading(false);
  };

  const createDefaultStatuses = async () => {
    const { data, error } = await supabase
      .from('task_statuses')
      .insert(
        DEFAULT_STATUSES.map((s) => ({
          ...s,
          project_id: project.id,
        }))
      )
      .select();

    if (error) {
      toast({ title: 'Error creating statuses', variant: 'destructive' });
    } else {
      setStatuses(data || []);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`tasks-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddTask = (statusId: string) => {
    setSelectedStatusId(statusId);
    setCreateTaskOpen(true);
  };

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    priority: string;
    due_date: string | null;
    status_id: string;
  }) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('tasks').insert({
      ...data,
      project_id: project.id,
      created_by: user?.id,
    });

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
    } else {
      setCreateTaskOpen(false);
      toast({ title: 'Task created!' });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('tasks').update(data).eq('id', taskId);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
    } else {
      setTaskDetailOpen(false);
      toast({ title: 'Task updated!' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      toast({ title: 'Error deleting task', description: error.message, variant: 'destructive' });
    } else {
      setTaskDetailOpen(false);
      toast({ title: 'Task deleted' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 p-6 overflow-hidden">
        <KanbanBoard
          statuses={statuses}
          tasks={tasks}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={handleCreateTask}
        statusId={selectedStatusId}
        isLoading={isSubmitting}
      />

      <TaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        statuses={statuses}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        isLoading={isSubmitting}
      />
    </div>
  );
}
