import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    status?: string;
    teamId?: string;
    teamName?: string;
  };
  projectId?: string;
}

interface TaskItemProps {
  task: Task;
  onUpdate?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  OPEN: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: '○',
    label: 'Offen',
  },
  IN_PROGRESS: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '▶',
    label: 'In Bearbeitung',
  },
  DONE: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: '✓',
    label: 'Erledigt',
  },
};

const priorityColors: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  HIGH: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '🔴',
    label: 'Hoch',
  },
  MEDIUM: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: '🟡',
    label: 'Mittel',
  },
  LOW: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: '🟢',
    label: 'Niedrig',
  },
};

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = task.status === 'DONE';

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const newStatus = isCompleted ? 'OPEN' : 'DONE';
      
      // Optimistic update
      const updatedTask = { ...task, status: newStatus };
      queryClient.setQueryData(['task', task.id], updatedTask);
      
      const response = await api.patch(`/tasks/${task.id}`, {
        status: newStatus,
      });
      
      // Update with server response
      queryClient.setQueryData(['task', task.id], response.data);
      
          // Invalidate only necessary queries (they will refetch when needed)
          queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          
          if (task.projectId) {
            queryClient.invalidateQueries({ queryKey: ['project', task.projectId], refetchType: 'none' });
          }
          if (task.project?.id) {
            queryClient.invalidateQueries({ queryKey: ['project', task.project.id], refetchType: 'none' });
          }
          
          onUpdate?.();
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border hover:bg-light transition-all duration-200 cursor-pointer animate-fadeIn touch-manipulation min-w-0 overflow-hidden"
    >
      <div
        onClick={handleToggle}
        className={`w-6 h-6 sm:w-5 sm:h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0 mt-0.5 touch-manipulation ${
          isCompleted
            ? 'bg-primary border-primary text-white scale-110'
            : 'border-border hover:border-primary hover:scale-105'
        } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isUpdating ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isCompleted ? (
          <span className="text-xs animate-scaleIn">✓</span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 min-w-0">
          <div className={`font-semibold text-dark transition-all duration-200 flex-1 min-w-0 truncate ${
            isCompleted ? 'line-through text-text-light' : ''
          }`}
            title={task.title}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Status Tag */}
            {(() => {
              const status = statusColors[task.status] || statusColors.OPEN;
              return (
                <span
                  className={`px-2.5 py-1 ${status.bg} ${status.text} ${status.border} border rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 min-w-0`}
                >
                  <span className="text-[10px] opacity-70 shrink-0">{status.icon}</span>
                  <span className="truncate">{status.label}</span>
                </span>
              );
            })()}
            
            {/* Priority Tag */}
            {(() => {
              const priority = priorityColors[task.priority] || priorityColors.MEDIUM;
              return (
                <span
                  className={`px-2.5 py-1 ${priority.bg} ${priority.text} ${priority.border} border rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 min-w-0`}
                >
                  <span className="text-[10px] shrink-0">{priority.icon}</span>
                  <span className="truncate">{priority.label}</span>
                </span>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Tag */}
          {task.project && (
            <span className="px-2.5 py-1 bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px]">📁</span>
              <span className="truncate max-w-[120px]">{task.project.name}</span>
              {task.project.teamName && (
                <span className="text-[10px] opacity-70 hidden md:inline">• {task.project.teamName}</span>
              )}
            </span>
          )}
          
          {/* Assignee Tag */}
          {task.assignee && (
            <span className="px-2.5 py-1 bg-gradient-to-br from-slate-50 to-gray-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px]">👤</span>
              <span className="truncate max-w-[100px]">{task.assignee.name}</span>
            </span>
          )}
          
          {/* Deadline Tag */}
          {task.deadline && (
            <span className="px-2.5 py-1 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-medium flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] shrink-0">📅</span>
              <span className="shrink-0">Fällig:</span>
              <span className="truncate">{format(new Date(task.deadline), 'dd.MM.yyyy', { locale: de })}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

