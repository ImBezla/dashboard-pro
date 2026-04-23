'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function TeamMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', memberId],
    queryFn: async () => {
      const response = await api.get(`/users/${memberId}`);
      return response.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/team');
      return response.data;
    },
  });

  const { data: userTasks } = useQuery({
    queryKey: ['tasks', 'user', memberId],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data.filter((task: any) => task.assignedToId === memberId);
    },
    enabled: !!memberId,
  });

  const { data: userProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.filter((project: any) => 
        project.tasks?.some((task: any) => task.assignedToId === memberId)
      );
    },
  });

  const memberTeam = teams?.find((team: any) => 
    team.members.some((member: any) => member.userId === memberId)
  );

  const memberInfo = memberTeam?.members.find((member: any) => member.userId === memberId);

  const updateOrgRoleMutation = useMutation({
    mutationFn: async (role: 'MEMBER' | 'ADMIN') => {
      await api.patch(`/organizations/members/${memberId}/org-role`, { role });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', memberId] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const updateTeamRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      if (!memberInfo?.id) return;
      await api.patch(`/team/member/${memberInfo.id}`, { role });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
      void queryClient.invalidateQueries({ queryKey: ['user', memberId] });
    },
  });

  const canManageOrgRoles =
    currentUser?.orgRole === 'OWNER' || currentUser?.orgRole === 'ADMIN';
  const isSelf = currentUser?.id === memberId;

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  if (!user) {
    return <div className="p-8">Mitglied nicht gefunden</div>;
  }

  const targetOrgRole = (user as { orgRole?: string }).orgRole;
  const canEditWorkspaceRole =
    canManageOrgRoles &&
    !isSelf &&
    targetOrgRole &&
    targetOrgRole !== 'OWNER' &&
    !(currentUser?.orgRole === 'ADMIN' && targetOrgRole === 'ADMIN');
  const canEditTeamRole =
    (currentUser?.orgRole === 'OWNER' || currentUser?.orgRole === 'ADMIN') &&
    !isSelf &&
    memberInfo;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const completedTasks = userTasks?.filter((t: any) => t.status === 'DONE').length || 0;
  const totalTasks = userTasks?.length || 0;
  const performance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-text-light hover:text-primary mb-2"
          >
            ← Zurück
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {getInitials(user.name)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-dark mb-2">{user.name}</h1>
              <p className="text-lg text-text-light">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h2 className="text-xl font-bold text-dark mb-4">Informationen</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-text-light">Team-Rolle</div>
                <div className="font-semibold">{memberInfo?.role || 'Nicht zugewiesen'}</div>
              </div>
              <div>
                <div className="text-sm text-text-light">Workspace-Rolle</div>
                <div className="font-semibold">{targetOrgRole || '—'}</div>
              </div>
              {memberTeam && (
                <div>
                  <div className="text-sm text-text-light">Team</div>
                  <div className="font-semibold">{memberTeam.name}</div>
                </div>
              )}
              {(canEditWorkspaceRole || canEditTeamRole) && (
                <div className="mt-4 border-t border-border pt-4 space-y-3">
                  <div className="text-sm font-semibold text-dark">Rollen anpassen</div>
                  {canEditWorkspaceRole ? (
                    <div>
                      <label className="block text-xs text-text-light mb-1">
                        Workspace (Organisation)
                      </label>
                      <select
                        className="w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm"
                        value={targetOrgRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                        disabled={updateOrgRoleMutation.isPending}
                        onChange={(e) => {
                          const v = e.target.value as 'MEMBER' | 'ADMIN';
                          if (v !== targetOrgRole) {
                            updateOrgRoleMutation.mutate(v);
                          }
                        }}
                      >
                        <option value="MEMBER">Mitglied</option>
                        {currentUser?.orgRole === 'OWNER' ? (
                          <option value="ADMIN">Administrator</option>
                        ) : null}
                      </select>
                      {currentUser?.orgRole === 'ADMIN' ? (
                        <p className="mt-1 text-xs text-text-light">
                          Als Administrator können Sie keine weiteren Admins ernennen.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {canEditTeamRole ? (
                    <div>
                      <label className="block text-xs text-text-light mb-1">Im Team</label>
                      <select
                        className="w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm"
                        value={memberInfo?.role ?? 'MEMBER'}
                        disabled={updateTeamRoleMutation.isPending}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v !== memberInfo?.role) {
                            updateTeamRoleMutation.mutate(v);
                          }
                        }}
                      >
                        <option value="MEMBER">Mitglied</option>
                        <option value="MANAGER">Manager</option>
                        <option value="OWNER">Owner (Team)</option>
                      </select>
                    </div>
                  ) : null}
                </div>
              )}
              <div>
                <div className="text-sm text-text-light">E-Mail</div>
                <div className="font-semibold">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h2 className="text-xl font-bold text-dark mb-4">Aufgaben</h2>
            <div className="space-y-2">
              {userTasks && userTasks.length > 0 ? (
                userTasks.map((task: any) => {
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

                  const colors = statusColors[task.status] || statusColors.OPEN;

                  return (
                    <div
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-light transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-dark mb-2">{task.title}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 ${colors.bg} ${colors.text} ${colors.border} border rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5`}
                          >
                            <span className="text-[10px] opacity-70">{colors.icon}</span>
                            <span>{colors.label}</span>
                          </span>
                          {task.priority && (
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                task.priority === 'HIGH'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : task.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  : 'bg-green-100 text-green-700 border border-green-200'
                              }`}
                            >
                              {task.priority === 'HIGH' ? '🔴 Hoch' : task.priority === 'MEDIUM' ? '🟡 Mittel' : '🟢 Niedrig'}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.project && (
                        <div className="ml-4 flex-shrink-0">
                          <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium">
                            {task.project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-text-light">Keine Aufgaben zugewiesen</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h2 className="text-xl font-bold text-dark mb-4">Projekte</h2>
            <div className="space-y-2">
              {userProjects && userProjects.length > 0 ? (
                userProjects.map((project: any) => {
                  const statusColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
                    ACTIVE: {
                      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
                      text: 'text-green-700',
                      border: 'border-green-200',
                      icon: '●',
                    },
                    IN_PROGRESS: {
                      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
                      text: 'text-blue-700',
                      border: 'border-blue-200',
                      icon: '▶',
                    },
                    PENDING: {
                      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
                      text: 'text-yellow-700',
                      border: 'border-yellow-200',
                      icon: '⏸',
                    },
                    COMPLETED: {
                      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
                      text: 'text-purple-700',
                      border: 'border-purple-200',
                      icon: '✓',
                    },
                    ARCHIVED: {
                      bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
                      text: 'text-gray-700',
                      border: 'border-gray-200',
                      icon: '📦',
                    },
                  };

                  const colors = statusColors[project.status] || statusColors.PENDING;

                  return (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-light transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-dark mb-2">{project.name}</div>
                        <span
                          className={`px-3 py-1 ${colors.bg} ${colors.text} ${colors.border} border rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 w-fit`}
                        >
                          <span className="text-[10px] opacity-70">{colors.icon}</span>
                          <span>
                            {project.status === 'ACTIVE' ? 'Aktiv' :
                             project.status === 'IN_PROGRESS' ? 'In Bearbeitung' :
                             project.status === 'PENDING' ? 'Wartend' :
                             project.status === 'COMPLETED' ? 'Abgeschlossen' :
                             project.status === 'ARCHIVED' ? 'Archiviert' : project.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-text-light">Keine Projekte zugewiesen</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h3 className="text-lg font-bold text-dark mb-4">Statistiken</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-3xl font-black text-primary mb-1">
                  {userProjects?.length || 0}
                </div>
                <div className="text-sm text-text-light uppercase tracking-wider">
                  Projekte
                </div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-3xl font-black text-primary mb-1">
                  {performance}%
                </div>
                <div className="text-sm text-text-light uppercase tracking-wider">
                  Performance
                </div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-3xl font-black text-primary mb-1">
                  {totalTasks}
                </div>
                <div className="text-sm text-text-light uppercase tracking-wider">
                  Aufgaben
                </div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-3xl font-black text-primary mb-1">
                  {completedTasks}
                </div>
                <div className="text-sm text-text-light uppercase tracking-wider">
                  Erledigt
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

