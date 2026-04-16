import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  deadline?: string;
  tasksCount: number;
  completedTasks: number;
  teamId?: string;
  teamName?: string;
  teamMembers?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  teamMembersCount?: number;
}

interface ProjectCardProps {
  project: Project;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PENDING: 'Wartend',
  COMPLETED: 'Abgeschlossen',
  ARCHIVED: 'Archiviert',
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-border hover:shadow-md transition-all duration-300 cursor-pointer animate-fadeIn min-w-0 overflow-hidden">
      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 text-base font-bold text-dark sm:text-lg" title={project.name}>
          <span className="line-clamp-2 sm:truncate">{project.name}</span>
        </div>
        <span
          className={`self-start rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200 sm:shrink-0 sm:px-3 ${statusColors[project.status] || statusColors.PENDING}`}
        >
          {statusLabels[project.status] || project.status}
        </span>
      </div>
      <div className="mb-4 min-w-0">
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-500 ease-out animate-progressBar"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex justify-between gap-2 mt-2 text-xs sm:text-sm text-text-light animate-fadeIn min-w-0">
          <span className="truncate min-w-0">{project.progress}% abgeschlossen</span>
          {project.deadline && (
            <span className="shrink-0">
              {format(new Date(project.deadline), 'dd.MM.yy', { locale: de })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm mb-3 min-w-0">
        <div className="flex items-center gap-4 text-text-light min-w-0">
          <span className="flex items-center gap-1 truncate">
            <span className="shrink-0">✅</span>
            <span className="truncate">{project.completedTasks || 0}/{project.tasksCount || 0} Aufgaben</span>
          </span>
        </div>
      </div>
      {project.teamName && (
        <div className="pt-3 border-t border-border min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="text-xs text-text-light font-semibold uppercase tracking-wider truncate min-w-0" title={project.teamName}>
              Team: {project.teamName}
            </div>
            {project.teamMembers && project.teamMembers.length > 0 && (
              <div className="text-xs text-text-light shrink-0">
                {project.teamMembers.length} {project.teamMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}
              </div>
            )}
          </div>
          {project.teamMembers && project.teamMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.teamMembers.slice(0, 3).map((member) => (
                <span
                  key={member.id}
                  className="px-2 py-1 bg-light text-text rounded text-xs"
                  title={member.email}
                >
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              ))}
              {project.teamMembersCount && project.teamMembersCount > 3 && (
                <span className="px-2 py-1 bg-light text-text-light rounded text-xs">
                  +{project.teamMembersCount - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

