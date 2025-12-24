import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    due_date?: string | null;
    assignee?: {
      email: string;
      full_name?: string | null;
    } | null;
  };
  onClick: () => void;
}

const priorityStyles: Record<string, string> = {
  low: 'bg-priority-low/10 text-priority-low',
  medium: 'bg-priority-medium/10 text-priority-medium',
  high: 'bg-priority-high/10 text-priority-high',
  urgent: 'bg-priority-urgent/10 text-priority-urgent',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="task-card" onClick={onClick}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {task.title}
          </h4>
          <span className={`status-badge text-[10px] ${priorityStyles[task.priority] || priorityStyles.medium}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>

          {task.assignee && (
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(task.assignee.full_name || task.assignee.email)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
