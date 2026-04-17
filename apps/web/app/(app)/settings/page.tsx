'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore, type NotificationPreferencesState } from '@/lib/store';
import type { NavModuleKey } from '@/lib/module-nav';
import { NAV_MODULE_LABEL_KEYS } from '@/lib/module-nav';
import { WorkspaceModulePicker } from '@/components/workspace/WorkspaceModulePicker';
import { SegmentedControl } from '@/components/ui/choice-controls';
import { useTranslation, PREFERENCES_CHANGED_EVENT } from '@/lib/i18n/context';
import {
  applyDocumentTheme,
  DASHBOARD_PREFERENCES_KEY,
} from '@/lib/theme-document';

const PREFERENCES_KEY = DASHBOARD_PREFERENCES_KEY;

/** Hell: weiße Karte; Dark: gleiche Werte wie globales `.dark input` (dunkles Feld, helle Schrift). */
const SETTINGS_TEXT_INPUT_CLASS =
  'w-full rounded-lg border border-border bg-white px-4 py-2 text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary dark:!bg-[#0c121e] dark:!border-[#243042] dark:!text-zinc-100 dark:placeholder:!text-[#8fa1b8] dark:caret-zinc-100 dark:[-webkit-text-fill-color:var(--text)]';

const SETTINGS_HEX_INPUT_CLASS =
  'flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-4 py-2 font-mono text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary dark:!bg-[#0c121e] dark:!border-[#243042] dark:!text-zinc-100 dark:placeholder:!text-[#8fa1b8] dark:caret-zinc-100 dark:[-webkit-text-fill-color:var(--text)]';

interface Preferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'de' | 'en';
}

const defaultPreferences: Preferences = {
  theme: 'light',
  language: 'de',
};

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return defaultPreferences;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return {
      theme:
        parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'auto'
          ? parsed.theme
          : defaultPreferences.theme,
      language:
        parsed.language === 'en' || parsed.language === 'de'
          ? parsed.language
          : defaultPreferences.language,
    };
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(prefs: Preferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function IconAuto({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications' | 'preferences' | 'workspace'
  >('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const {
    data: notifPrefs,
    isLoading: notifLoading,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async (): Promise<NotificationPreferencesState> =>
      (await api.get('/users/me/notification-preferences')).data,
    enabled: !!user,
  });

  const [phoneDraft, setPhoneDraft] = useState('');
  const [reminderDaysDraft, setReminderDaysDraft] = useState<string>('');
  const [smsConsentAccepted, setSmsConsentAccepted] = useState(false);

  useEffect(() => {
    if (notifPrefs?.phoneE164 !== undefined) {
      setPhoneDraft(notifPrefs.phoneE164 ?? '');
    }
  }, [notifPrefs?.phoneE164]);

  useEffect(() => {
    if (notifPrefs) {
      setReminderDaysDraft(String(notifPrefs.taskDueReminderDaysBefore));
    }
  }, [notifPrefs?.taskDueReminderDaysBefore]);

  useEffect(() => {
    if (notifPrefs?.smsConsentAt) {
      setSmsConsentAccepted(false);
    }
  }, [notifPrefs?.smsConsentAt]);

  const patchNotifMutation = useMutation({
    mutationFn: async (patch: Partial<Record<string, unknown>>) =>
      (
        await api.patch<NotificationPreferencesState>(
          '/users/me/notification-preferences',
          patch,
        )
      ).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
      const u = useAuthStore.getState().user;
      const token = useAuthStore.getState().token;
      if (u && token) {
        useAuthStore.getState().setAuth({ ...u, notificationPreferences: data }, token);
      }
      setSuccess(t('settings.saved'));
      setTimeout(() => setSuccess(''), 2000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(', ') : msg || t('settings.notifications.saveError'),
      );
      setTimeout(() => setError(''), 6000);
    },
  });

  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    applyDocumentTheme(prefs.theme);

    // Listen for system theme changes when auto is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const prefs = loadPreferences();
      if (prefs.theme === 'auto') {
        applyDocumentTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Save preferences when they change
  const updatePreferences = (newPrefs: Partial<Preferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    savePreferences(updated);
    
    if (newPrefs.theme !== undefined) {
      applyDocumentTheme(updated.theme);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT));
    }

    setSuccess(t('settings.saved'));
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      setSuccess(t('settings.profileUpdated'));
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data }));
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.profileError'));
      setTimeout(() => setError(''), 5000);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.patch('/auth/change-password', data);
    },
    onSuccess: () => {
      setSuccess(t('settings.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.passwordError'));
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError(t('settings.passwordTooShort'));
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const canManageInvite =
    !!user?.organizationId &&
    (user.orgRole === 'OWNER' || user.orgRole === 'ADMIN');

  const canManageWorkspaceModules =
    !!user?.organizationId && user.orgRole === 'OWNER';

  const { data: workspace } = useQuery({
    queryKey: ['organizations', 'workspace'],
    queryFn: async () => (await api.get('/organizations/workspace')).data,
    enabled: activeTab === 'workspace' && canManageInvite,
  });

  const [workspaceModules, setWorkspaceModules] = useState<NavModuleKey[]>([]);

  const [appearance, setAppearance] = useState({
    organizationName: '',
    displayName: '',
    primaryColor: '',
    headingColor: '',
    logoUrl: '',
  });

  useEffect(() => {
    const list = workspace?.organization?.enabledModules;
    if (activeTab === 'workspace' && Array.isArray(list) && list.length > 0) {
      setWorkspaceModules([...list] as NavModuleKey[]);
    }
  }, [activeTab, workspace?.organization?.enabledModules]);

  useEffect(() => {
    const o = workspace?.organization as
      | {
          name?: string;
          branding?: {
            displayNameOverride?: string | null;
            primaryColor?: string | null;
            headingColor?: string | null;
            logoUrl?: string | null;
          };
        }
      | undefined;
    if (!o || activeTab !== 'workspace') return;
    const b = o.branding;
    setAppearance({
      organizationName: o.name ?? '',
      displayName: b?.displayNameOverride ?? '',
      primaryColor: b?.primaryColor ?? '',
      headingColor: b?.headingColor ?? '',
      logoUrl: b?.logoUrl ?? '',
    });
  }, [workspace, activeTab]);

  const updateWorkspaceModulesMutation = useMutation({
    mutationFn: async (modules: NavModuleKey[]) => {
      await api.patch('/organizations/workspace/modules', { modules });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', 'workspace'] });
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/users/me');
        useAuthStore.getState().setAuth(data, token);
      }
      setSuccess(t('settings.modulesUpdated'));
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.modulesError'));
      setTimeout(() => setError(''), 5000);
    },
  });

  const updateAppearanceMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/organizations/workspace/appearance', {
        organizationName: appearance.organizationName.trim(),
        displayName: appearance.displayName.trim(),
        primaryColor: appearance.primaryColor.trim(),
        headingColor: appearance.headingColor.trim(),
        logoUrl: appearance.logoUrl.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', 'workspace'] });
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/users/me');
        useAuthStore.getState().setAuth(data, token);
      }
      setSuccess(t('settings.appearanceSaved'));
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.appearanceError'));
      setTimeout(() => setError(''), 5000);
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      await api.post('/organizations/workspace/regenerate-code');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', 'workspace'] });
      setSuccess(t('settings.codeRegenerated'));
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.codeError'));
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleLogout = () => {
    logoutStore();
    router.push('/login');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark mb-2">{t('settings.pageTitle')}</h1>
        <p className="text-lg text-text-light">{t('settings.pageSubtitle')}</p>
      </div>

      <div className="-mx-1 mb-6 overflow-x-auto pb-1">
        <SegmentedControl
          aria-label={t('settings.tabs.label')}
          className="min-w-max sm:min-w-0 sm:max-w-4xl"
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          options={[
            { value: 'profile', label: t('settings.tab.profile') },
            { value: 'security', label: t('settings.tab.security') },
            { value: 'notifications', label: t('settings.tab.notifications') },
            { value: 'preferences', label: t('settings.tab.preferences') },
            ...(canManageInvite ? [{ value: 'workspace' as const, label: t('settings.tab.workspace') }] : []),
          ]}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-6 shadow dark:border-zinc-700/80 dark:bg-[var(--bg-card)] dark:shadow-none">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-dark mb-4">{t('settings.profile.title')}</h2>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('settings.profile.name')}
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                className={SETTINGS_TEXT_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('settings.profile.email')}
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                className={SETTINGS_TEXT_INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {updateProfileMutation.isPending
                ? t('settings.profile.saving')
                : t('settings.profile.save')}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-dark mb-4">{t('settings.security.title')}</h2>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('settings.security.current')}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                className={SETTINGS_TEXT_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('settings.security.new')}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
                className={SETTINGS_TEXT_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('settings.security.confirm')}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
                className={SETTINGS_TEXT_INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {updatePasswordMutation.isPending
                ? t('settings.security.submitting')
                : t('settings.security.submit')}
            </button>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark mb-2">{t('settings.notifications.title')}</h2>
            <p className="text-sm text-text-light mb-4">{t('settings.notifications.serverHint')}</p>
            {notifLoading || !notifPrefs ? (
              <p className="text-text-light text-sm">{t('settings.workspace.loading')}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text" htmlFor="notif-reminder-days">
                    {t('settings.notifications.reminderDays')}
                  </label>
                  <input
                    id="notif-reminder-days"
                    type="number"
                    min={0}
                    max={30}
                    value={reminderDaysDraft}
                    disabled={patchNotifMutation.isPending}
                    onChange={(e) => setReminderDaysDraft(e.target.value)}
                    onBlur={() => {
                      const n = Math.min(30, Math.max(0, parseInt(reminderDaysDraft, 10) || 0));
                      setReminderDaysDraft(String(n));
                      if (n !== notifPrefs.taskDueReminderDaysBefore) {
                        patchNotifMutation.mutate({ taskDueReminderDaysBefore: n });
                      }
                    }}
                    className={`max-w-[8rem] ${SETTINGS_TEXT_INPUT_CLASS}`}
                  />
                  <p className="mt-1 text-xs text-text-light">{t('settings.notifications.reminderDaysHint')}</p>
                </div>

                <label className="flex items-center justify-between cursor-pointer rounded-lg bg-light p-4">
                  <div>
                    <div className="font-semibold text-dark">{t('settings.notifications.push')}</div>
                    <div className="text-sm text-text-light">{t('settings.notifications.pushHint')}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.pushEnabled}
                    disabled={patchNotifMutation.isPending}
                    onChange={(e) => patchNotifMutation.mutate({ pushEnabled: e.target.checked })}
                    className="h-5 w-5 rounded text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer rounded-lg bg-light p-4">
                  <div>
                    <div className="font-semibold text-dark">{t('settings.notifications.email')}</div>
                    <div className="text-sm text-text-light">{t('settings.notifications.emailHint')}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.emailEnabled}
                    disabled={patchNotifMutation.isPending}
                    onChange={(e) => patchNotifMutation.mutate({ emailEnabled: e.target.checked })}
                    className="h-5 w-5 rounded text-primary focus:ring-primary"
                  />
                </label>

                {notifPrefs.emailEnabled && (
                  <div className="ml-4 space-y-3 border-l-2 border-primary/20 pl-4">
                    <p className="mb-2 text-sm font-medium text-text-light">
                      {t('settings.notifications.emailOptions')}
                    </p>

                    {(
                      [
                        ['emailTaskAssigned', 'settings.notifications.taskAssigned', 'settings.notifications.taskAssignedHint', '📋'],
                        ['emailTaskDue', 'settings.notifications.taskDue', 'settings.notifications.taskDueHint', '⏰'],
                        ['emailProjectUpdate', 'settings.notifications.projectUpdate', 'settings.notifications.projectUpdateHint', '📁'],
                        ['emailMentions', 'settings.notifications.mentions', 'settings.notifications.mentionsHint', '💬'],
                        ['emailWeeklyDigest', 'settings.notifications.digest', 'settings.notifications.digestHint', '📊'],
                        ['emailCalendarEvents', 'settings.notifications.calendarEmail', 'settings.notifications.calendarEmailHint', '📅'],
                      ] as const
                    ).map(([key, titleKey, hintKey, icon]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-white p-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-dark">
                            {icon} {t(titleKey)}
                          </div>
                          <div className="text-xs text-text-light">{t(hintKey)}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifPrefs[key]}
                          disabled={patchNotifMutation.isPending}
                          onChange={(e) =>
                            patchNotifMutation.mutate({ [key]: e.target.checked })
                          }
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                      </label>
                    ))}

                    <div className="border-t border-border pt-3">
                      <button
                        type="button"
                        disabled={patchNotifMutation.isPending}
                        onClick={async () => {
                          try {
                            const response = await api.post('/email/test');
                            alert(response.data.message);
                          } catch (err: any) {
                            alert(err.response?.data?.message || t('settings.testEmailError'));
                          }
                        }}
                        className="w-full rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                      >
                        📧 {t('settings.notifications.testEmail')}
                      </button>
                      <p className="mt-2 text-center text-xs text-text-light">
                        {t('settings.notifications.testEmailHint')}
                      </p>
                    </div>
                  </div>
                )}

                {!notifPrefs.smsConsentAt && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
                      checked={smsConsentAccepted}
                      disabled={patchNotifMutation.isPending}
                      onChange={(e) => setSmsConsentAccepted(e.target.checked)}
                    />
                    <span className="text-sm text-text dark:text-zinc-200">
                      {t('settings.notifications.smsConsentLabel')}
                    </span>
                  </label>
                )}

                <label className="flex items-center justify-between cursor-pointer rounded-lg bg-light p-4">
                  <div>
                    <div className="font-semibold text-dark">{t('settings.notifications.sms')}</div>
                    <div className="text-sm text-text-light">{t('settings.notifications.smsHint')}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.smsEnabled}
                    disabled={patchNotifMutation.isPending}
                    onChange={(e) => {
                      const on = e.target.checked;
                      if (on && !notifPrefs.smsConsentAt && !smsConsentAccepted) {
                        setError(t('settings.notifications.smsConsentRequired'));
                        setTimeout(() => setError(''), 5000);
                        return;
                      }
                      patchNotifMutation.mutate({
                        smsEnabled: on,
                        ...(on && !notifPrefs.smsConsentAt
                          ? { acceptSmsConsent: true as const }
                          : {}),
                      });
                    }}
                    className="h-5 w-5 rounded text-primary focus:ring-primary"
                  />
                </label>

                <div className="rounded-lg border border-border bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-text" htmlFor="notif-phone">
                    {t('settings.notifications.phone')}
                  </label>
                  <input
                    id="notif-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder={t('settings.notifications.phonePlaceholder')}
                    value={phoneDraft}
                    disabled={patchNotifMutation.isPending}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    className={SETTINGS_TEXT_INPUT_CLASS}
                  />
                  <p className="mt-1 text-xs text-text-light">{t('settings.notifications.phoneHint')}</p>
                  <button
                    type="button"
                    disabled={patchNotifMutation.isPending}
                    onClick={() => {
                      const trimmed = phoneDraft.trim();
                      if (trimmed && !/^\+[1-9]\d{6,14}$/.test(trimmed)) {
                        setError(t('settings.notifications.phoneInvalid'));
                        setTimeout(() => setError(''), 5000);
                        return;
                      }
                      patchNotifMutation.mutate({
                        phoneE164: trimmed === '' ? null : trimmed,
                      });
                    }}
                    className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {t('settings.notifications.savePhone')}
                  </button>
                </div>

                {notifPrefs.smsEnabled && (
                  <div className="ml-4 space-y-3 border-l-2 border-primary/20 pl-4">
                    <p className="mb-2 text-sm font-medium text-text-light">
                      {t('settings.notifications.smsOptions')}
                    </p>
                    {(
                      [
                        ['smsTaskAssigned', 'settings.notifications.smsTaskAssigned'],
                        ['smsTaskDue', 'settings.notifications.smsTaskDue'],
                        ['smsCalendarEvents', 'settings.notifications.smsCalendar'],
                      ] as const
                    ).map(([key, titleKey]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-white p-3"
                      >
                        <span className="text-sm font-medium text-dark">{t(titleKey)}</span>
                        <input
                          type="checkbox"
                          checked={notifPrefs[key]}
                          disabled={patchNotifMutation.isPending}
                          onChange={(e) =>
                            patchNotifMutation.mutate({ [key]: e.target.checked })
                          }
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                      </label>
                    ))}
                    {!notifPrefs.phoneE164 && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {t('settings.notifications.phoneHint')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'workspace' && canManageInvite && (
          <div className="space-y-10">
            {canManageWorkspaceModules && (
              <div>
                <h2 className="text-xl font-bold text-dark mb-2">
                  {t('settings.workspace.appearanceTitle')}
                </h2>
                <p className="text-text-light text-sm mb-4">
                  {t('settings.workspace.appearanceIntro')}
                </p>
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      {t('settings.workspace.companyName')}
                    </label>
                    <input
                      type="text"
                      value={appearance.organizationName}
                      onChange={(e) =>
                        setAppearance((a) => ({ ...a, organizationName: e.target.value }))
                      }
                      className={SETTINGS_TEXT_INPUT_CLASS}
                      placeholder={t('settings.workspace.companyPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      {t('settings.workspace.displayName')}
                    </label>
                    <input
                      type="text"
                      value={appearance.displayName}
                      onChange={(e) =>
                        setAppearance((a) => ({ ...a, displayName: e.target.value }))
                      }
                      className={SETTINGS_TEXT_INPUT_CLASS}
                      placeholder={t('settings.workspace.displayNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      {t('settings.workspace.logo')}
                    </label>
                    <input
                      type="url"
                      value={appearance.logoUrl}
                      onChange={(e) =>
                        setAppearance((a) => ({ ...a, logoUrl: e.target.value }))
                      }
                      className={SETTINGS_TEXT_INPUT_CLASS}
                      placeholder={t('settings.workspace.logoPlaceholder')}
                    />
                    <p className="text-xs text-text-light mt-1">{t('settings.workspace.logoHint')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      {t('settings.workspace.accent')}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        aria-label={t('settings.workspace.accentAria')}
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(appearance.primaryColor)
                            ? appearance.primaryColor
                            : '#6366f1'
                        }
                        onChange={(e) =>
                          setAppearance((a) => ({ ...a, primaryColor: e.target.value }))
                        }
                        className="h-10 w-14 rounded border border-border cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={appearance.primaryColor}
                        onChange={(e) =>
                          setAppearance((a) => ({ ...a, primaryColor: e.target.value }))
                        }
                        className={SETTINGS_HEX_INPUT_CLASS}
                        placeholder={t('settings.workspace.accentPlaceholder')}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(
                        [
                          ['settings.workspace.colorIndigo', '#6366f1'],
                          ['settings.workspace.colorBlue', '#0ea5e9'],
                          ['settings.workspace.colorGreen', '#059669'],
                          ['settings.workspace.colorOrange', '#d97706'],
                          ['settings.workspace.colorRed', '#dc2626'],
                          ['settings.workspace.colorViolet', '#7c3aed'],
                        ] as const
                      ).map(([labelKey, hex]) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            setAppearance((a) => ({ ...a, primaryColor: hex }))
                          }
                          className="text-xs px-2 py-1 rounded-md border border-border hover:bg-light"
                        >
                          <span
                            className="inline-block w-3 h-3 rounded-full align-middle mr-1"
                            style={{ backgroundColor: hex }}
                          />
                          {t(labelKey)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setAppearance((a) => ({ ...a, primaryColor: '' }))
                        }
                        className="text-xs px-2 py-1 rounded-md border border-border text-text-light hover:bg-light"
                      >
                        {t('settings.workspace.standard')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      {t('settings.workspace.headingColor')}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        aria-label={t('settings.workspace.headingColorAria')}
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(appearance.headingColor)
                            ? appearance.headingColor
                            : '#6366f1'
                        }
                        onChange={(e) =>
                          setAppearance((a) => ({ ...a, headingColor: e.target.value }))
                        }
                        className="h-10 w-14 rounded border border-border cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={appearance.headingColor}
                        onChange={(e) =>
                          setAppearance((a) => ({ ...a, headingColor: e.target.value }))
                        }
                        className={SETTINGS_HEX_INPUT_CLASS}
                        placeholder={t('settings.workspace.headingPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAppearance((a) => ({ ...a, headingColor: '' }))
                        }
                        className="text-sm text-text-light hover:text-dark"
                      >
                        {t('settings.workspace.reset')}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={updateAppearanceMutation.isPending}
                    onClick={() => updateAppearanceMutation.mutate()}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
                  >
                    {updateAppearanceMutation.isPending
                      ? t('settings.workspace.saving')
                      : t('settings.workspace.saveAppearance')}
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-dark mb-2">{t('settings.workspace.modulesTitle')}</h2>
              <p className="text-text-light text-sm mb-4">{t('settings.workspace.modulesIntro')}</p>

              {workspace?.organization?.moduleSetup && (
                <div className="mb-4 p-4 rounded-xl bg-light border border-border text-sm text-text">
                  {workspace.organization.moduleSetup.status === 'pending' && (
                    <span>{t('settings.workspace.modulePending')}</span>
                  )}
                  {workspace.organization.moduleSetup.status === 'pack' && (
                    <span>
                      {t('settings.workspace.modulePack')}{' '}
                      <strong>{workspace.organization.moduleSetup.label}</strong> (
                      <code className="text-xs bg-white px-1 rounded">
                        {workspace.organization.moduleSetup.packId}
                      </code>
                      )
                    </span>
                  )}
                  {workspace.organization.moduleSetup.status === 'custom' && (
                    <span>{t('settings.workspace.moduleCustom')}</span>
                  )}
                </div>
              )}

              {workspace?.organization?.enabledModules?.length ? (
                canManageWorkspaceModules ? (
                  <>
                    <WorkspaceModulePicker
                      selected={workspaceModules}
                      onChange={setWorkspaceModules}
                      disabled={updateWorkspaceModulesMutation.isPending}
                      showPresets
                    />
                    <button
                      type="button"
                      disabled={updateWorkspaceModulesMutation.isPending}
                      onClick={() => updateWorkspaceModulesMutation.mutate(workspaceModules)}
                      className="mt-4 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
                    >
                      {updateWorkspaceModulesMutation.isPending
                        ? t('settings.workspace.saving')
                        : t('settings.workspace.saveModules')}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm text-text-light mb-3">{t('settings.workspace.ownerOnly')}</p>
                    <ul className="flex flex-wrap gap-2">
                      {(workspace.organization.enabledModules as NavModuleKey[]).map((k) => (
                        <li
                          key={k}
                          className="text-xs px-2 py-1 rounded-md bg-light text-dark font-medium"
                        >
                          {t(NAV_MODULE_LABEL_KEYS[k] ?? k)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ) : (
                <p className="text-text-light text-sm">{t('settings.workspace.loading')}</p>
              )}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-dark mb-2">
                {t('settings.workspace.multiOrgTitle')}
              </h2>
              <p className="text-text-light text-sm mb-4">
                {t('settings.workspace.multiOrgIntro')}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/setup-workspace?additional=1"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark touch-manipulation"
                >
                  {t('settings.workspace.multiOrgCta')}
                </Link>
                <Link
                  href="/setup-workspace?mode=join"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-slate-50 touch-manipulation"
                >
                  {t('settings.workspace.multiOrgJoin')}
                </Link>
              </div>
            </div>

            <h2 className="text-xl font-bold text-dark mb-4 mt-10">{t('settings.workspace.joinTitle')}</h2>
            <p className="text-text-light text-sm mb-4">{t('settings.workspace.joinIntro')}</p>
            {workspace?.organization?.joinCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-light rounded-xl border border-border">
                  <div className="text-xs font-semibold text-text-light uppercase mb-2">
                    {t('settings.workspace.currentCode')}
                  </div>
                  <div className="font-mono text-2xl font-bold tracking-widest text-dark break-all">
                    {workspace.organization.joinCode}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(workspace.organization.joinCode);
                      setSuccess(t('settings.codeCopied'));
                      setTimeout(() => setSuccess(''), 2000);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    {t('settings.workspace.copy')}
                  </button>
                  <button
                    type="button"
                    disabled={regenerateCodeMutation.isPending}
                    onClick={() => {
                      if (confirm(t('settings.workspace.confirmRegenerate'))) {
                        regenerateCodeMutation.mutate();
                      }
                    }}
                    className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
                  >
                    {regenerateCodeMutation.isPending
                      ? t('settings.workspace.regenerating')
                      : t('settings.workspace.regenerate')}
                  </button>
                </div>
                <p className="text-xs text-text-light">
                  {t('settings.workspace.directLink')}{' '}
                  <code className="bg-light px-1 rounded">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/setup-workspace?mode=join&code=${workspace.organization.joinCode}`
                      : '/setup-workspace?mode=join&code=…'}
                  </code>
                </p>
              </div>
            ) : (
              <p className="text-text-light text-sm">{t('settings.workspace.loading')}</p>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark mb-4">{t('settings.preferences.title')}</h2>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-text dark:text-zinc-200">
                  {t('settings.preferences.colorScheme')}
                </label>
                <SegmentedControl
                  aria-label={t('settings.preferences.colorAria')}
                  equalWidth
                  className="w-full max-w-xl"
                  value={preferences.theme}
                  onChange={(v) => updatePreferences({ theme: v })}
                  options={[
                    {
                      value: 'light',
                      label: t('settings.preferences.themeLight'),
                      icon: <IconSun className="h-3.5 w-3.5 shrink-0" />,
                    },
                    {
                      value: 'dark',
                      label: t('settings.preferences.themeDark'),
                      icon: <IconMoon className="h-3.5 w-3.5 shrink-0" />,
                    },
                    {
                      value: 'auto',
                      label: t('settings.preferences.themeAuto'),
                      icon: <IconAuto className="h-3.5 w-3.5 shrink-0" />,
                    },
                  ]}
                />
                <p className="mt-2 text-xs leading-relaxed text-text-light dark:text-zinc-400">
                  {preferences.theme === 'auto'
                    ? t('settings.preferences.themeHintAuto')
                    : preferences.theme === 'dark'
                      ? t('settings.preferences.themeHintDark')
                      : t('settings.preferences.themeHintLight')}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text dark:text-zinc-200">
                  {t('settings.preferences.language')}
                </label>
                <SegmentedControl
                  aria-label={t('settings.preferences.languageAria')}
                  equalWidth
                  className="w-full max-w-xs"
                  value={preferences.language}
                  onChange={(v) => updatePreferences({ language: v })}
                  options={[
                    { value: 'de', label: t('settings.preferences.langDe') },
                    { value: 'en', label: t('settings.preferences.langEn') },
                  ]}
                />
                <p className="mt-2 text-xs text-text-light dark:text-zinc-400">
                  {t('settings.preferences.languageHint')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow dark:border-zinc-700/80 dark:bg-[var(--bg-card)] dark:shadow-none">
        <h2 className="text-xl font-bold text-dark mb-4">{t('settings.danger.title')}</h2>
        <button
          onClick={handleLogout}
          className="bg-danger text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          {t('settings.danger.logout')}
        </button>
      </div>
    </div>
  );
}
