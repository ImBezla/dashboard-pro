'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { TeamCard } from '@/components/dashboard/TeamCard';

export default function TeamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [newMember, setNewMember] = useState({ userId: '', role: 'MEMBER' });
  const [newTeamName, setNewTeamName] = useState('');

  const { data: teams, isLoading: isLoadingTeams, error: teamsError } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        const response = await api.get('/team');
        return response.data;
      } catch (err: any) {
        console.error('Teams API error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return [];
      }
    },
    retry: 1,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await api.get('/users');
        return response.data;
      } catch (err: any) {
        console.error('Users API error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await api.get('/tasks');
        return response.data;
      } catch (err: any) {
        console.error('Tasks API error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/projects');
        return response.data;
      } catch (err: any) {
        console.error('Projects API error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const isLoading = isLoadingTeams || isLoadingUsers;

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId, role }: any) => {
      await api.post(`/team/${teamId}/member`, { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAddMember(false);
      setNewMember({ userId: '', role: 'MEMBER' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/team/member/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/team', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateTeam(false);
      setNewTeamName('');
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam && newMember.userId) {
      addMemberMutation.mutate({
        teamId: selectedTeam,
        userId: newMember.userId,
        role: newMember.role,
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Möchten Sie dieses Mitglied wirklich entfernen?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      createTeamMutation.mutate(newTeamName.trim());
    }
  };

  // Calculate real data for each team member
  const allMembers = teams?.flatMap((team: any) =>
    team.members?.map((member: any) => {
      if (!member.user) return null;
      
      // Get all tasks assigned to this member
      const memberTasks = tasks?.filter((task: any) => task.assignedToId === member.userId) || [];
      const completedTasks = memberTasks.filter((task: any) => task.status === 'DONE');
      const totalTasks = memberTasks.length;
      const performance = totalTasks > 0 
        ? Math.round((completedTasks.length / totalTasks) * 100) 
        : 0;

      // Get unique projects from member's tasks
      const memberProjectIds = new Set(
        memberTasks
          .map((task: any) => task.projectId)
          .filter(Boolean)
      );
      const projectsCount = memberProjectIds.size;

      return {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        memberId: member.id,
        role: member.role,
        teamName: team.name,
        teamId: team.id,
        projectsCount,
        performance,
        tasksCount: totalTasks,
      };
    }).filter(Boolean) || [],
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Team-Daten...</div>
        </div>
      </div>
    );
  }

  if (teamsError && !teams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">Fehler beim Laden der Team-Daten</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-dark mb-1 truncate">Team</h1>
          <p className="text-sm sm:text-base text-text-light truncate">
            Team und Mitarbeiter verwalten
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowCreateTeam(true)}
            className="bg-white border border-border text-text px-4 sm:px-6 py-3 rounded-xl font-semibold hover:bg-light transition-colors min-h-[44px] touch-manipulation"
          >
            + Team erstellen
          </button>
          <button
            onClick={() => setShowAddMember(true)}
            disabled={!teams || teams.length === 0}
            className="bg-primary text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            + Mitglied hinzufügen
          </button>
        </div>
      </div>

      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto min-w-0">
            <h3 className="text-lg sm:text-xl font-bold mb-4 truncate">Neues Team erstellen</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Team-Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending || !newTeamName.trim()}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {createTeamMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeam(false);
                    setNewTeamName('');
                  }}
                  className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto min-w-0">
            <h3 className="text-lg sm:text-xl font-bold mb-4 truncate">Mitglied hinzufügen</h3>
            {(!teams || teams.length === 0) ? (
              <div className="space-y-4">
                <p className="text-text-light">
                  Sie müssen zuerst ein Team erstellen, bevor Sie Mitglieder hinzufügen können.
                </p>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setShowCreateTeam(true);
                  }}
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Team erstellen
                </button>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="w-full bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Team auswählen</option>
                    {teams?.map((team: any) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Benutzer
                </label>
                <select
                  value={newMember.userId}
                  onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Benutzer auswählen</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Rolle
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MEMBER">Mitglied</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addMemberMutation.isPending ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
                >
                  Abbrechen
                </button>
              </div>
              </form>
            )}
          </div>
        </div>
      )}

      {(!teams || teams.length === 0) ? (
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow border border-border text-center min-w-0 overflow-hidden">
          <div className="text-4xl sm:text-6xl mb-4">👥</div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark mb-2">Noch keine Teams vorhanden</h2>
          <p className="text-sm sm:text-base text-text-light mb-6 break-words">
            Erstellen Sie Ihr erstes Team, um Mitglieder hinzuzufügen und zu verwalten.
          </p>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            + Erstes Team erstellen
          </button>
        </div>
      ) : allMembers && allMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {allMembers.map((member: any) => (
            <div key={member.id} className="relative group min-w-0">
              <TeamCard 
                member={member} 
                onClick={() => router.push(`/team/${member.id}`)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMember(member.memberId);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-danger text-white p-2 rounded-lg hover:bg-red-600 transition-opacity z-10"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow border border-border text-center min-w-0 overflow-hidden">
          <div className="text-4xl sm:text-6xl mb-4">👤</div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark mb-2">Keine Team-Mitglieder vorhanden</h2>
          <p className="text-sm sm:text-base text-text-light mb-6 break-words">
            Fügen Sie ein Mitglied zu einem Team hinzu, um zu beginnen.
          </p>
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            + Mitglied hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}

