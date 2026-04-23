interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  /** Rolle im Workspace (Organisation) */
  orgRole?: string | null;
  teamName: string;
  projectsCount: number;
  performance: number;
  tasksCount: number;
  projects?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

interface TeamCardProps {
  member: TeamMember;
  onClick?: () => void;
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Aktiv',
  IN_PROGRESS: 'Läuft',
  PENDING: 'Ausstehend',
  COMPLETED: 'Fertig',
  ARCHIVED: 'Archiv',
};

export function TeamCard({ member, onClick }: TeamCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-border shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-3 sm:gap-4 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            getInitials(member.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-dark truncate">{member.name}</div>
          <div className="text-xs text-text-light truncate">
            Team: {member.role}
            {member.orgRole ? ` · Workspace: ${member.orgRole}` : ''}
          </div>
        </div>
      </div>

      {/* Bei schmalem Bildschirm: neue Zeile pro Wert, damit alles ausgeschrieben bleibt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 py-3 border-y border-slate-100 min-w-0">
        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start gap-0.5 min-w-0">
          <div className="text-xs text-text-light">Projekte</div>
          <div className="text-base sm:text-lg font-semibold text-primary tabular-nums">{member.projectsCount}</div>
        </div>
        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start gap-0.5 min-w-0">
          <div className="text-xs text-text-light">Performance</div>
          <div className={`text-base sm:text-lg font-semibold tabular-nums ${member.performance >= 70 ? 'text-success' : member.performance >= 40 ? 'text-amber-600' : 'text-dark'}`}>
            {member.performance}%
          </div>
        </div>
        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start gap-0.5 min-w-0">
          <div className="text-xs text-text-light">Aufgaben</div>
          <div className="text-base sm:text-lg font-semibold text-primary tabular-nums">{member.tasksCount}</div>
        </div>
      </div>

      {member.projects && member.projects.length > 0 && (
        <div className="pt-3 mt-3 min-w-0 overflow-hidden">
          <div className="text-xs text-text-light mb-2 truncate">Projekte</div>
          <div className="flex flex-wrap gap-1.5">
            {member.projects.slice(0, 4).map((project) => {
              const statusStyle: Record<string, string> = {
                ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
                PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
                ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-100',
              };
              const style = statusStyle[project.status] || 'bg-slate-50 text-slate-700 border-slate-100';
              return (
                <span
                  key={project.id}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border truncate max-w-full ${style}`}
                  title={project.name}
                >
                  <span className="truncate">{project.name}</span>
                  {project.status && (
                    <span className="ml-1 opacity-80 text-[10px] shrink-0">
                      {statusLabel[project.status] || project.status}
                    </span>
                  )}
                </span>
              );
            })}
            {member.projectsCount > member.projects.length && (
              <span className="inline-flex px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                +{member.projectsCount - member.projects.length}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
