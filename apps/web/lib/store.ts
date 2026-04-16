import { create } from 'zustand';

export interface OrganizationBranding {
  displayName: string;
  primaryColor: string | null;
  primaryDark: string | null;
  headingColor: string | null;
  displayNameOverride: string | null;
  logoUrl?: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  joinCode?: string;
  /** OPERATING | HOLDING | FAMILY_OFFICE | AG */
  kind?: string;
  /** Fehlt bei veraltetem localStorage bis zum nächsten /users/me. */
  branding?: OrganizationBranding;
}

/** Alle Organisationen, in denen die Person Mitglied ist (Multi-Mandant). */
export interface UserOrganizationSummary {
  id: string;
  name: string;
  kind: string;
  role: string;
}

/** Server: GET/PATCH `/users/me/notification-preferences` bzw. Feld in GET `/users/me`. */
export interface NotificationPreferencesState {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneE164: string | null;
  emailTaskAssigned: boolean;
  emailTaskDue: boolean;
  emailProjectUpdate: boolean;
  emailMentions: boolean;
  emailWeeklyDigest: boolean;
  emailCalendarEvents: boolean;
  smsTaskAssigned: boolean;
  smsTaskDue: boolean;
  smsCalendarEvents: boolean;
  taskDueReminderDaysBefore: number;
  lastWeeklyDigestSentAt: string | null;
  smsConsentAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  organizationId?: string | null;
  orgRole?: string | null;
  organization?: OrganizationSummary | null;
  organizations?: UserOrganizationSummary[];
  /** Modul-Schlüssel aus Org-Paket (GET /users/me). */
  enabledModules?: string[];
  /** Nur OWNER: Pack-Auswahl im Onboarding ausstehend. */
  needsPackSelection?: boolean;
  notificationPreferences?: NotificationPreferencesState | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie =
        'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    set({ user: null, token: null });
  },
}));

// UI state (sidebar drawer on mobile)
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    // Session wird in (app)/layout per /users/me aktualisiert
  }
}
