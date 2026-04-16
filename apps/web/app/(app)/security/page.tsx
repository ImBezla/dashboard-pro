'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

const PERMISSIONS_KEY = 'dashboardpro_permissions';

interface Permissions {
  manageProjects: boolean;
  manageTasks: boolean;
  manageTeam: boolean;
  viewFinance: boolean;
  isAdmin: boolean;
}

const defaultPermissions: Permissions = {
  manageProjects: true,
  manageTasks: true,
  manageTeam: true,
  viewFinance: true,
  isAdmin: false,
};

function loadPermissions(): Permissions {
  if (typeof window === 'undefined') return defaultPermissions;
  try {
    const stored = localStorage.getItem(PERMISSIONS_KEY);
    return stored ? { ...defaultPermissions, ...JSON.parse(stored) } : defaultPermissions;
  } catch {
    return defaultPermissions;
  }
}

function savePermissions(perms: Permissions) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions' | 'permissions'>('logs');
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setPermissions(loadPermissions());
  }, []);

  const updatePermission = (key: keyof Permissions, value: boolean) => {
    const updated = { ...permissions, [key]: value };
    
    // Wenn Admin aktiviert wird, alle anderen auch aktivieren
    if (key === 'isAdmin' && value) {
      updated.manageProjects = true;
      updated.manageTasks = true;
      updated.manageTeam = true;
      updated.viewFinance = true;
    }
    
    setPermissions(updated);
    savePermissions(updated);
    setSaveMessage('Berechtigungen gespeichert');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=100');
        return response.data.map((activity: any) => ({
          id: activity.id,
          user: activity.user?.name || 'Unbekannt',
          action: activity.type.split('_')[0] || 'UNKNOWN',
          resource: activity.type.split('_').slice(1).join(' ') || 'Resource',
          ipAddress: 'N/A',
          timestamp: new Date(activity.createdAt),
          status: 'success',
          message: activity.message,
        }));
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        return [];
      }
    },
  });

  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          return [
            {
              id: 'current',
              device: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser',
              ipAddress: 'Lokal',
              location: 'Aktuelles Gerät',
              lastActivity: new Date(),
              current: true,
            },
          ];
        }
        return [];
      } catch (error) {
        return [];
      }
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return '🔐';
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark mb-2">Sicherheit</h1>
        <p className="text-lg text-text-light">
          Sicherheitseinstellungen und Zugriffskontrolle
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['logs', 'sessions', 'permissions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-white text-text hover:bg-light'
            }`}
          >
            {tab === 'logs' && 'Audit-Logs'}
            {tab === 'sessions' && 'Aktive Sessions'}
            {tab === 'permissions' && 'Berechtigungen'}
          </button>
        ))}
      </div>

      {saveMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {saveMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-border">
        {activeTab === 'logs' && (
          <div>
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-dark">Audit-Logs</h2>
              <p className="text-sm text-text-light mt-1">
                Alle Sicherheitsrelevanten Aktionen werden hier protokolliert
              </p>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-text-light">Lädt...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-6 hover:bg-light transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-light flex items-center justify-center text-xl flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-dark">
                              {log.message || `${log.user} - ${log.action} ${log.resource}`}
                            </p>
                            <p className="text-sm text-text-light">
                              {format(log.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}
                          >
                            {log.status === 'success' ? 'Erfolgreich' : 'Fehlgeschlagen'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-text-light">
                Keine Audit-Logs vorhanden
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-dark">Aktive Sessions</h2>
              <p className="text-sm text-text-light mt-1">
                Verwalten Sie Ihre aktiven Anmeldesitzungen
              </p>
            </div>
            {activeSessions && activeSessions.length > 0 ? (
              <div className="divide-y divide-border">
                {activeSessions.map((session: any) => (
                <div key={session.id} className="p-6 hover:bg-light transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-dark">{session.device}</p>
                        {session.current && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-primary text-white">
                            Aktuell
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-light space-y-1">
                        <p>Standort: {session.location}</p>
                        <p>
                          Letzte Aktivität:{' '}
                          {format(session.lastActivity, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-danger hover:text-red-700 font-semibold text-sm">
                        Beenden
                      </button>
                    )}
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-text-light">
                Keine aktiven Sessions gefunden
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-dark">Berechtigungen</h2>
                <p className="text-sm text-text-light mt-1">
                  Änderungen werden automatisch gespeichert
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="p-4 border border-border rounded-lg flex items-center justify-between cursor-pointer hover:bg-light transition-colors">
                <div>
                  <p className="font-semibold text-dark">Projekte verwalten</p>
                  <p className="text-sm text-text-light">
                    Erstellen, bearbeiten und löschen von Projekten
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.manageProjects}
                  onChange={(e) => updatePermission('manageProjects', e.target.checked)}
                  disabled={permissions.isAdmin}
                  className="w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50"
                />
              </label>
              <label className="p-4 border border-border rounded-lg flex items-center justify-between cursor-pointer hover:bg-light transition-colors">
                <div>
                  <p className="font-semibold text-dark">Aufgaben verwalten</p>
                  <p className="text-sm text-text-light">
                    Erstellen, bearbeiten und löschen von Aufgaben
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.manageTasks}
                  onChange={(e) => updatePermission('manageTasks', e.target.checked)}
                  disabled={permissions.isAdmin}
                  className="w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50"
                />
              </label>
              <label className="p-4 border border-border rounded-lg flex items-center justify-between cursor-pointer hover:bg-light transition-colors">
                <div>
                  <p className="font-semibold text-dark">Team verwalten</p>
                  <p className="text-sm text-text-light">
                    Team-Mitglieder hinzufügen und entfernen
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.manageTeam}
                  onChange={(e) => updatePermission('manageTeam', e.target.checked)}
                  disabled={permissions.isAdmin}
                  className="w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50"
                />
              </label>
              <label className="p-4 border border-border rounded-lg flex items-center justify-between cursor-pointer hover:bg-light transition-colors">
                <div>
                  <p className="font-semibold text-dark">Finanzen einsehen</p>
                  <p className="text-sm text-text-light">
                    Zugriff auf Finanzdaten und Berichte
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.viewFinance}
                  onChange={(e) => updatePermission('viewFinance', e.target.checked)}
                  disabled={permissions.isAdmin}
                  className="w-5 h-5 text-primary rounded focus:ring-primary disabled:opacity-50"
                />
              </label>
              <label className="p-4 border-2 border-primary/30 bg-primary/5 rounded-lg flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors">
                <div>
                  <p className="font-semibold text-dark">Administrator-Rechte</p>
                  <p className="text-sm text-text-light">
                    Vollzugriff auf alle Funktionen (aktiviert alle anderen Berechtigungen)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.isAdmin}
                  onChange={(e) => updatePermission('isAdmin', e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
