import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Calendar, GripVertical } from 'lucide-react';
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
  onTitleUpdate?: (taskId: string, newTitle: string) => void;
}

const priorityStyles: Record<string, string> = {
  low: 'bg-priority-low/10 text-priority-low',
  medium: 'bg-priority-medium/10 text-priority-medium',
  high: 'bg-priority-high/10 text-priority-high',
  urgent: 'bg-priority-urgent/10 text-priority-urgent',
};

export function TaskCard({ task, onClick, onTitleUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(task.title);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== task.title && onTitleUpdate) {
      onTitleUpdate(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card group ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-sm font-medium"
                autoFocus
              />
            ) : (
              <h4
                className="text-sm font-medium text-foreground line-clamp-2 cursor-text"
                onDoubleClick={handleDoubleClick}
              >
                {task.title}
              </h4>
            )}
          </div>

          <span className={`status-badge text-[10px] flex-shrink-0 ${priorityStyles[task.priority] || priorityStyles.medium}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 ml-5">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 ml-5">
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
