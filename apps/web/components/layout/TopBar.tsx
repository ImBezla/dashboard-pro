'use client';

import { useAuthStore, useUIStore, type AuthUser } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/lib/i18n/context';
import { getDateFnsLocale } from '@/lib/i18n/date-locale';

function fillMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

interface SearchResult {
  id: string;
  type:
    | 'project'
    | 'task'
    | 'customer'
    | 'supplier'
    | 'team'
    | 'product'
    | 'invoice'
    | 'tag';
  title: string;
  subtitle?: string;
}

export function TopBar() {
  const { locale, t } = useTranslation();
  const dfLocale = getDateFnsLocale(locale);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const orgName =
    user?.organization?.branding?.displayName ??
    user?.organization?.name;
  const organizations = user?.organizations ?? [];
  const hasMultipleOrgs = organizations.length > 1;
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile search when a result is selected
  const handleSearchResultClickMobile = (result: SearchResult) => {
    handleSearchResultClick(result);
    setShowMobileSearch(false);
  };

  const closeMobileSearch = () => {
    setShowMobileSearch(false);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Escape schließt Such-Overlay
  useEffect(() => {
    if (!showMobileSearch) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMobileSearch]);

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const [
          projectsRes,
          tasksRes,
          customersRes,
          suppliersRes,
          usersRes,
          teamsRes,
          productsRes,
          invoicesRes,
          tagsRes,
        ] = await Promise.allSettled([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/customers'),
          api.get('/suppliers'),
          api.get('/users'),
          api.get('/team'),
          api.get('/products'),
          api.get('/invoices'),
          api.get('/tags'),
        ]);

        const results: SearchResult[] = [];
        const query = searchQuery.toLowerCase().trim();

        const statusText = (st?: string) => {
          if (!st) return '';
          const key = `topbar.status.${st}`;
          const val = t(key);
          return val === key ? st : val;
        };

        // Search projects
        if (projectsRes.status === 'fulfilled') {
          const projects = projectsRes.value.data || [];
          projects.forEach((p: any) => {
            if (
              p.name?.toLowerCase().includes(query) || 
              p.description?.toLowerCase().includes(query)
            ) {
              results.push({
                id: p.id,
                type: 'project',
                title: p.name,
                subtitle: statusText(p.status),
              });
            }
          });
        }

        // Search tasks
        if (tasksRes.status === 'fulfilled') {
          const tasks = tasksRes.value.data || [];
          tasks.forEach((task: any) => {
            if (
              task.title?.toLowerCase().includes(query) ||
              task.description?.toLowerCase().includes(query)
            ) {
              results.push({
                id: task.id,
                type: 'task',
                title: task.title,
                subtitle: statusText(task.status),
              });
            }
          });
        }

        // Search customers
        if (customersRes.status === 'fulfilled') {
          const customers = customersRes.value.data || [];
          customers.forEach((c: any) => {
            if (
              c.name?.toLowerCase().includes(query) || 
              c.email?.toLowerCase().includes(query) || 
              c.company?.toLowerCase().includes(query) ||
              c.phone?.toLowerCase().includes(query)
            ) {
              results.push({
                id: c.id,
                type: 'customer',
                title: c.name,
                subtitle: c.company || c.email,
              });
            }
          });
        }

        if (suppliersRes.status === 'fulfilled') {
          const suppliers = suppliersRes.value.data || [];
          suppliers.forEach((s: any) => {
            if (
              s.name?.toLowerCase().includes(query) ||
              s.email?.toLowerCase().includes(query) ||
              s.company?.toLowerCase().includes(query) ||
              s.phone?.toLowerCase().includes(query)
            ) {
              results.push({
                id: s.id,
                type: 'supplier',
                title: s.name,
                subtitle: s.company || s.email || t('topbar.supplierFallback'),
              });
            }
          });
        }

        // Search users (team members)
        if (usersRes.status === 'fulfilled') {
          const users = usersRes.value.data || [];
          users.forEach((u: any) => {
            if (
              u.name?.toLowerCase().includes(query) || 
              u.email?.toLowerCase().includes(query) ||
              u.role?.toLowerCase().includes(query)
            ) {
              results.push({
                id: u.id,
                type: 'team',
                title: u.name,
                subtitle: u.role || u.email,
              });
            }
          });
        }

        // Also search teams themselves
        if (teamsRes.status === 'fulfilled') {
          const teams = teamsRes.value.data || [];
          teams.forEach((teamRow: any) => {
            // Search team name
            if (teamRow.name?.toLowerCase().includes(query)) {
              results.push({
                id: teamRow.id,
                type: 'team',
                title: fillMessage(t('topbar.teamNamed'), { name: teamRow.name }),
                subtitle: fillMessage(t('topbar.membersCount'), {
                  n: teamRow.members?.length || 0,
                }),
              });
            }
            // Also search through team members
            if (teamRow.members) {
              teamRow.members.forEach((m: any) => {
                const user = m.user;
                if (user && (
                  user.name?.toLowerCase().includes(query) ||
                  user.email?.toLowerCase().includes(query) ||
                  user.role?.toLowerCase().includes(query) ||
                  m.role?.toLowerCase().includes(query)
                )) {
                  // Avoid duplicates
                  if (!results.find(r => r.type === 'team' && r.id === user.id)) {
                    results.push({
                      id: user.id,
                      type: 'team',
                      title: user.name,
                      subtitle: m.role || user.role || user.email,
                    });
                  }
                }
              });
            }
          });
        }

        // Search products
        if (productsRes.status === 'fulfilled') {
          const products = productsRes.value.data || [];
          products.forEach((p: any) => {
            if (
              p.name?.toLowerCase().includes(query) || 
              p.description?.toLowerCase().includes(query) ||
              p.sku?.toLowerCase().includes(query)
            ) {
              results.push({
                id: p.id,
                type: 'product',
                title: p.name,
                subtitle: p.price ? `${p.price.toFixed(2)} €` : p.sku,
              });
            }
          });
        }

        // Search invoices
        if (invoicesRes.status === 'fulfilled') {
          const invoices = invoicesRes.value.data || [];
          invoices.forEach((i: any) => {
            const invoiceNumber = i.invoiceNumber || i.number || `#${i.id}`;
            const customerName = i.customer?.name || '';
            if (
              invoiceNumber?.toLowerCase().includes(query) ||
              customerName?.toLowerCase().includes(query)
            ) {
              results.push({
                id: i.id,
                type: 'invoice',
                title: fillMessage(t('topbar.invoiceSearchTitle'), { num: invoiceNumber }),
                subtitle: customerName || statusText(i.status),
              });
            }
          });
        }

        // Search tags
        if (tagsRes.status === 'fulfilled') {
          const tags = tagsRes.value.data || [];
          tags.forEach((tagItem: any) => {
            if (tagItem.name?.toLowerCase().includes(query)) {
              results.push({
                id: tagItem.id,
                type: 'tag',
                title: tagItem.name,
                subtitle: fillMessage(t('topbar.tagMeta'), {
                  color: tagItem.color || '#6366f1',
                }),
              });
            }
          });
        }

        setSearchResults(results.slice(0, 15)); // Limit to 15 results
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, t]);

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    switch (result.type) {
      case 'project':
        router.push(`/projects/${result.id}`);
        break;
      case 'task':
        router.push(`/tasks/${result.id}`);
        break;
      case 'customer':
        router.push(`/customers/${result.id}`);
        break;
      case 'supplier':
        router.push(`/suppliers/${result.id}`);
        break;
      case 'team':
        router.push(`/team`);
        break;
      case 'product':
        router.push(`/products`);
        break;
      case 'invoice':
        router.push(`/finance`);
        break;
      case 'tag':
        router.push(`/tasks?tag=${encodeURIComponent(result.title)}`);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return '📁';
      case 'task': return '✅';
      case 'customer': return '👤';
      case 'supplier': return '🏭';
      case 'team': return '👥';
      case 'product': return '📦';
      case 'invoice': return '🧾';
      case 'tag': return '🏷️';
      default: return '📄';
    }
  };

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=100');
        const activities = response.data || [];
        
        const readActivities = JSON.parse(localStorage.getItem('readActivities') || '[]');
        
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

  const { data: recentActivities, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=5');
        return response.data || [];
      } catch (error: any) {
        console.error('Failed to fetch recent activities:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return [];
      }
    },
    enabled: showNotifications,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('PROJECT')) return '📁';
    if (type.includes('TASK')) return '✅';
    if (type.includes('TEAM')) return '👥';
    return '🔔';
  };

  const getActivityColor = (type: string) => {
    if (type.includes('PROJECT')) return 'bg-blue-100 text-blue-700';
    if (type.includes('TASK')) return 'bg-green-100 text-green-700';
    if (type.includes('TEAM')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const searchResultsList = (
    <>
      {searchResults.length > 0 ? (
        <div>
          {(['project', 'task', 'customer', 'team', 'product', 'invoice', 'tag'] as const).map((type) => {
            const typeResults = searchResults.filter(r => r.type === type);
            if (typeResults.length === 0) return null;
            return (
              <div key={type}>
                <div className="px-3 py-2.5 sm:py-2 bg-light text-xs font-semibold text-text-light uppercase tracking-wider sticky top-0">
                  {t(`topbar.searchSection.${type}`)} ({typeResults.length})
                </div>
                {typeResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => (showMobileSearch ? handleSearchResultClickMobile(result) : handleSearchResultClick(result))}
                    className="w-full p-3 sm:p-3 min-h-[56px] sm:min-h-0 hover:bg-primary/5 active:bg-primary/10 transition-colors text-left flex items-center gap-3 border-b border-border/50 last:border-b-0 touch-manipulation"
                  >
                    <span className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center rounded-xl bg-slate-100 sm:bg-transparent text-lg sm:rounded-none">
                      {getTypeIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-dark text-sm truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-text-light truncate mt-0.5">{result.subtitle}</div>
                      )}
                    </div>
                    <span className="text-text-light text-sm">→</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : searchQuery.trim().length >= 2 ? (
        <div className="p-6 sm:p-6 text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-text-light text-sm">
            {fillMessage(t('topbar.searchNoResults'), { query: searchQuery })}
          </div>
          <div className="text-xs text-text-light/70 mt-1">{t('topbar.searchMoreHint')}</div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {/* Mobile: Such-Overlay mit Backdrop */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          {/* Safe Area oben (Notch) */}
          <div className="shrink-0 bg-white w-full" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
          <div className="flex-1 flex flex-col min-h-0 animate-fadeIn">
            <div className="flex items-center gap-3 p-3 pb-2 border-b border-border shrink-0 bg-white">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-xl">🔍</span>
                  )}
                </span>
                <input
                  type="text"
                  placeholder={t('topbar.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 border-0 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors placeholder:text-text-light/80"
                />
              </div>
              <button
                type="button"
                onClick={closeMobileSearch}
                className="shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl bg-slate-100 text-dark font-semibold touch-manipulation active:scale-95 transition-transform"
              >
                {t('topbar.close')}
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              {searchResultsList}
              {searchQuery.trim().length < 2 && (
                <div className="px-6 py-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    🔍
                  </div>
                  <p className="text-text-light text-sm font-medium mb-1">
                    {t('topbar.searchStartTitle')}
                  </p>
                  <p className="text-text-light/80 text-xs max-w-[260px] mx-auto">
                    {t('topbar.searchStartHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-white/95 px-3 py-2 backdrop-blur-sm sm:px-8 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Links: Menü + Titel/Breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleSidebar}
            className="lg:hidden shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center -ml-0.5 rounded-2xl text-text-light hover:bg-slate-100 hover:text-primary active:bg-slate-200 transition-colors touch-manipulation"
            aria-label={t('topbar.openMenu')}
          >
            <span className="text-[1.25rem]" aria-hidden>☰</span>
          </button>
          {hasMultipleOrgs ? (
            <div
              className="relative min-w-0 flex-1 sm:max-w-[min(100%,14rem)] lg:max-w-xs"
              ref={orgMenuRef}
            >
              <button
                type="button"
                onClick={() => setOrgMenuOpen((o) => !o)}
                className="flex w-full min-h-[44px] max-w-full items-center justify-between gap-2 rounded-xl border border-border bg-light/80 px-3 py-2 text-left hover:bg-slate-100 touch-manipulation sm:min-h-[40px] sm:py-1.5"
                aria-expanded={orgMenuOpen}
                aria-haspopup="listbox"
              >
                <span className="truncate pl-0.5 text-[15px] font-bold text-dark sm:text-sm sm:font-normal sm:text-text">
                  {orgName || t('nav.dashboard')}
                </span>
                <span className="shrink-0 text-xs text-text-light" aria-hidden>
                  ▾
                </span>
              </button>
              {orgMenuOpen ? (
                <ul
                  className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-[min(65dvh,20rem)] min-w-[12rem] overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-xl sm:right-auto sm:min-w-[14rem]"
                  role="listbox"
                >
                  {organizations.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={o.id === user?.organizationId}
                        disabled={o.id === user?.organizationId}
                        onClick={async () => {
                          if (o.id === user?.organizationId) return;
                          setOrgMenuOpen(false);
                          try {
                            const { data } = await api.patch<AuthUser & { token: string }>(
                              '/users/me/active-organization',
                              { organizationId: o.id },
                            );
                            const { token, ...nextUser } = data;
                            setAuth(nextUser, token);
                            window.location.reload();
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="flex w-full min-h-[48px] flex-col items-start px-3 py-2.5 text-left text-sm hover:bg-slate-50 disabled:bg-slate-50/80 disabled:opacity-60 touch-manipulation"
                      >
                        <span className="truncate font-medium text-text">{o.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-light">
                          {o.kind === 'HOLDING'
                            ? 'Holding'
                            : o.kind === 'FAMILY_OFFICE'
                              ? 'Family Office'
                              : o.kind === 'AG'
                                ? 'AG'
                                : 'Operating'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <>
              <div className="hidden min-w-0 sm:flex sm:items-center sm:gap-2 sm:text-text-light">
                <span className="truncate">{orgName || t('nav.dashboard')}</span>
                <span className="shrink-0">/</span>
                <span className="text-text font-semibold truncate">{t('topbar.breadcrumbPage')}</span>
              </div>
              <span className="truncate pl-0.5 text-[15px] font-bold text-dark sm:hidden">
                {orgName || t('nav.dashboard')}
              </span>
            </>
          )}
          {hasMultipleOrgs ? (
            <div className="hidden sm:flex shrink-0 items-center gap-2 text-text-light">
              <span>/</span>
              <span className="text-text font-semibold truncate">{t('topbar.breadcrumbPage')}</span>
            </div>
          ) : null}
        </div>

        {/* Rechts: Suche (Desktop) / Such-Icon (Mobil) + Benachrichtigungen + User */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Search: Desktop immer sichtbar, Mobil nur Icon */}
          <div className="relative hidden sm:block sm:w-56 md:w-64" ref={searchRef}>
            <input
              type="text"
              placeholder={t('topbar.searchPlaceholderShort')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl bg-light text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                '🔍'
              )}
            </span>
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-border z-50 max-h-96 overflow-y-auto animate-fadeIn">
                {searchResultsList}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileSearch(true)}
            className="sm:hidden shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl text-text-light hover:bg-slate-100 hover:text-primary active:bg-slate-200 transition-colors touch-manipulation"
            aria-label={t('topbar.searchAria')}
          >
            <span className="text-xl">🔍</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl text-text-light hover:bg-slate-100 hover:text-primary active:bg-slate-200 transition-colors touch-manipulation"
              aria-label={
                unreadCount
                  ? fillMessage(t('topbar.notificationsCount'), { count: unreadCount })
                  : t('topbar.notificationsAria')
              }
            >
              <span className="text-xl">🔔</span>
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-danger text-white rounded-full text-[11px] font-bold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications && (
              <>
                {/* Auf Mobil: Backdrop + feste Position, damit das Panel nie aus dem Screen rausgeht */}
                <div
                  className="sm:hidden fixed inset-0 z-40 bg-black/20"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden
                />
                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 sm:top-full sm:mt-2 top-24 sm:top-auto w-auto sm:w-[400px] max-w-none bg-white rounded-2xl shadow-xl border border-border z-50 max-h-[75vh] sm:max-h-[600px] overflow-hidden animate-fadeIn ring-1 ring-black/5 flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between gap-2 bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔔</span>
                    <h3 className="font-bold text-dark text-[15px]">{t('topbar.notificationsTitle')}</h3>
                    {unreadCount != null && unreadCount > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      router.push('/notifications');
                    }}
                    className="text-primary hover:text-primary-dark text-sm font-semibold py-2.5 px-3 min-h-[44px] flex items-center rounded-xl hover:bg-primary/10 touch-manipulation"
                  >
                    {t('topbar.notificationsAll')}
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 max-h-[60vh] sm:max-h-[500px] pb-[env(safe-area-inset-bottom)]">
                  {isLoadingRecent ? (
                    <div className="p-10 text-center">
                      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-text-light text-sm">{t('topbar.notificationsLoading')}</p>
                    </div>
                  ) : recentActivities && recentActivities.length > 0 ? (
                    <div className="py-1">
                      {recentActivities.map((activity: any) => {
                        const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: dfLocale,
                        });
                        const fullDate = format(
                          new Date(activity.createdAt),
                          'EEEE, d. MMMM · HH:mm',
                          { locale: dfLocale },
                        );
                        return (
                          <button
                            type="button"
                            key={activity.id}
                            onClick={() => {
                              setShowNotifications(false);
                              router.push('/notifications');
                            }}
                            className="w-full px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left touch-manipulation flex items-start gap-3 border-b border-border/50 last:border-b-0"
                          >
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${getActivityColor(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-dark text-[15px] leading-snug mb-1 line-clamp-2">
                                {activity.message}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-text-light" title={fullDate}>
                                  {timeAgo}
                                </span>
                                {activity.user?.name && (
                                  <>
                                    <span className="text-text-light/50">·</span>
                                    <span className="text-xs text-primary font-medium">{activity.user.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-text-light/60 text-lg flex-shrink-0 mt-0.5">→</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                        🔔
                      </div>
                      <p className="font-semibold text-dark text-[15px] mb-1">
                        {t('topbar.notificationsEmpty')}
                      </p>
                      <p className="text-text-light text-sm">{t('topbar.notificationsEmptyHint')}</p>
                      <button
                        type="button"
                        onClick={() => { setShowNotifications(false); router.push('/notifications'); }}
                        className="mt-4 text-primary font-semibold text-sm hover:underline"
                      >
                        {t('topbar.notificationsShowAll')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </div>

          {/* User: Desktop ausführlich, Mobil kompaktes Menü */}
          <div className="hidden sm:flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-light transition-colors cursor-pointer">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user ? getInitials(user.name) : 'VM'}
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.name || 'Valentin Manager'}</div>
              <div className="text-xs text-text-light">{user?.role || 'CEO'}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 text-text-light hover:text-danger text-sm"
            >
              {t('topbar.logout')}
            </button>
          </div>

          <div className="relative sm:hidden" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation ring-0 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              aria-label={t('topbar.userMenuAria')}
              aria-expanded={showUserMenu}
            >
              <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                {user ? getInitials(user.name) : 'VM'}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden animate-fadeIn ring-1 ring-black/5">
                <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-border">
                  <div className="font-bold text-dark text-[15px]">{user?.name || 'Valentin Manager'}</div>
                  <div className="text-xs text-text-light mt-0.5">{user?.role || 'CEO'}</div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-3.5 text-left text-dark font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] flex items-center gap-3 border-b border-border/50"
                >
                  <span className="text-lg">⚙️</span>
                  {t('topbar.settings')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3.5 text-left text-danger font-semibold hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation min-h-[52px] flex items-center gap-3"
                >
                  <span className="text-lg">🚪</span>
                  {t('topbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
