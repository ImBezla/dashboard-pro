'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore, useAuthStore } from '@/lib/store';
import {
  SIDEBAR_NAV_SECTIONS,
  isNavItemVisible,
} from '@/lib/module-nav';
import { useTranslation } from '@/lib/i18n/context';

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const enabledModules = useAuthStore((s) => s.user?.enabledModules);
  const org = useAuthStore((s) => s.user?.organization);
  const brand = org?.branding;
  const sidebarTitle = brand?.displayName ?? org?.name ?? t('sidebar.workspace');
  const headingStyle = brand?.headingColor
    ? { color: brand.headingColor }
    : brand?.primaryColor
      ? { color: brand.primaryColor }
      : undefined;

  const [logoBroken, setLogoBroken] = useState(false);
  useEffect(() => {
    setLogoBroken(false);
  }, [brand?.logoUrl]);

  const showLogo = Boolean(brand?.logoUrl && !logoBroken);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=100');
        const activities = response.data || [];

        const readActivities = JSON.parse(
          localStorage.getItem('readActivities') || '[]',
        );

        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);

        const unread = activities.filter((activity: any) => {
          const isOld = new Date(activity.createdAt) < last24Hours;
          const isExplicitlyRead = readActivities.includes(activity.id);
          return !isOld && !isExplicitlyRead;
        });

        return unread.length;
      } catch (error: any) {
        console.error('Failed to fetch unread count:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return 0;
      }
    },
    refetchInterval: 30000,
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        style={{
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
        }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <nav
        className={`fixed left-0 top-0 z-50 h-dvh max-h-dvh w-64 max-w-[85vw] overflow-y-auto border-r border-border bg-white pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-200 ease-out
          pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)]
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className={`flex min-w-0 items-center gap-3 text-lg font-bold sm:text-xl rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:opacity-90 transition-opacity ${headingStyle ? '' : 'text-primary'}`}
            style={headingStyle}
          >
            {showLogo ? (
              <img
                src={brand!.logoUrl!}
                alt=""
                className="h-9 max-w-[120px] w-auto object-contain object-left shrink-0"
                onError={() => setLogoBroken(true)}
              />
            ) : (
              <span className="shrink-0 text-xl" aria-hidden>
                💼
              </span>
            )}
            <span className="truncate" title={sidebarTitle}>
              {sidebarTitle}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 rounded-lg text-text-light hover:bg-light hover:text-dark"
            aria-label={t('sidebar.closeMenu')}
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {SIDEBAR_NAV_SECTIONS.map((section, idx) => {
            const visibleItems = section.items.filter((item) =>
              isNavItemVisible(item, enabledModules),
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={idx} className="mb-8">
                <div className="px-4 text-xs font-semibold text-text-light uppercase tracking-wider mb-3">
                  {t(section.sectionKey)}
                </div>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.matchChildren &&
                      item.href !== '/' &&
                      pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors relative min-h-[44px] ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-text hover:bg-light hover:text-primary'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />
                      )}
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {item.hasBadge && unreadCount && unreadCount > 0 ? (
                        <span className="bg-danger text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-semibold px-1.5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
