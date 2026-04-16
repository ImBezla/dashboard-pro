'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BrandingEffect } from '@/components/layout/BrandingEffect';
import { useEffect } from 'react';
import { useAuthStore, type AuthUser } from '@/lib/store';
import api from '@/lib/api';
import { connectSocket } from '@/lib/realtime';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRouter, usePathname } from 'next/navigation';
import { isPathAllowedByModules } from '@/lib/route-modules';

export function AppShell({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  useKeyboardShortcuts();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      const checkToken = setTimeout(() => {
        if (!localStorage.getItem('token')) {
          window.location.href = '/login';
        }
      }, 500);
      return () => clearTimeout(checkToken);
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr) as AuthUser;
        setAuth(userData, token);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie =
          'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return;
      }
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<AuthUser>('/users/me');
        if (cancelled) return;
        setAuth(data, token);
        if (!data.organizationId) {
          router.replace('/setup-workspace');
        } else if (data.needsPackSelection && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } catch {
        if (cancelled) return;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie =
          'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuth, router, pathname]);

  useEffect(() => {
    if (!user?.organizationId || !user.enabledModules?.length) return;
    if (!isPathAllowedByModules(pathname, user.enabledModules)) {
      router.replace('/dashboard');
    }
  }, [user?.organizationId, user?.enabledModules, pathname, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('token')) return;

    try {
      const socket = connectSocket();
      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }, []);

  return (
    <div className="relative isolate h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-light">
      <BrandingEffect />
      <Sidebar />
      {/*
        Hauptbereich absolut positioniert (nicht in einer Flex-Zeile mit fixed-Sidebar-Geschwistern).
        z-0 unter Sidebar (z-40/z-50). lg:left-64 = gleiche Breite wie Sidebar w-64.
      */}
      <div className="absolute inset-0 left-0 z-0 flex min-h-0 min-w-0 flex-col lg:left-64">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
