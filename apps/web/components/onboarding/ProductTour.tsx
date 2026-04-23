'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { isPathAllowedByModules } from '@/lib/route-modules';
import { useTranslation } from '@/lib/i18n/context';
import {
  hasCompletedProductTour,
  markProductTourCompleted,
  PRODUCT_TOUR_RESTART_EVENT,
  requestProductTourRestart,
} from '@/lib/product-tour-storage';

type TourStep = {
  path: string;
  /** z. B. `tab=profile` — Reiter/Deep-Link wirklich öffnen */
  search?: string;
  selector: string;
  title: string;
  body: string;
  /** `start` = Ziel oben im sichtbaren Bereich (z. B. langer Einstellungen-Tab). */
  scrollBlock?: ScrollLogicalPosition;
  /** Hauptbereich nach oben scrollen, bevor das Ziel eingerastet wird. */
  scrollAppMainToTop?: boolean;
  /** Abschlusshinweis (Rundgang-Button in den Einstellungen). */
  kind?: 'outro';
};

function stepHref(step: TourStep): string {
  return step.search ? `${step.path}?${step.search}` : step.path;
}

function stepMatchesLocation(
  pathname: string,
  current: URLSearchParams,
  step: TourStep,
): boolean {
  if (pathname !== step.path) return false;
  if (!step.search) return true;
  const want = new URLSearchParams(step.search);
  const keys = Array.from(want.keys());
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (current.get(k) !== want.get(k)) return false;
  }
  return true;
}

const SETTINGS_TOUR_STEPS: TourStep[] = [
  {
    path: '/settings',
    search: 'tab=profile',
    selector: '[data-tour="settings-tabs"]',
    title: 'Einstellungen · Profil',
    body:
      'Name und E-Mail Ihres Kontos — hier pflegen Sie Ihre sichtbaren Stammdaten.',
  },
  {
    path: '/settings',
    search: 'tab=security',
    selector: '[data-tour="settings-tabs"]',
    title: 'Einstellungen · Sicherheit',
    body:
      'Passwort ändern und Zugang absichern — empfehlenswert nach dem ersten Login.',
  },
  {
    path: '/settings',
    search: 'tab=notifications',
    selector: '[data-tour="settings-tabs"]',
    title: 'Einstellungen · Benachrichtigungen',
    body:
      'E-Mail, Push und SMS steuern Sie zentral — weniger Lärm, nichts Wichtiges verpassen.',
  },
  {
    path: '/settings',
    search: 'tab=personalization',
    selector: '[data-tour="settings-tabs"]',
    title: 'Einstellungen · Darstellung',
    body:
      'Sprache, Theme und Erscheinungsbild — so wirkt die Oberfläche für Sie angenehm.',
  },
];

type TourUserContext = {
  enabledModules?: string[] | null;
  orgRole?: string | null;
};

function canManageWorkspaceTour(ctx: TourUserContext | null | undefined): boolean {
  const r = ctx?.orgRole;
  return r === 'OWNER' || r === 'ADMIN';
}

function buildTourSteps(ctx: TourUserContext | null | undefined): TourStep[] {
  const enabledModules = ctx?.enabledModules;
  const can = (p: string) => isPathAllowedByModules(p, enabledModules);
  const steps: TourStep[] = [
    {
      path: '/dashboard',
      selector: '[data-tour="app-main"]',
      title: 'Dashboard',
      body:
        'Hier sehen Sie Kennzahlen, Teams, Projekte und Aktivitäten. Mit „Weiter“ wechseln wir die Seiten — Sie werden jeden Bereich kurz hervorgehoben.',
    },
  ];

  if (can('/projects')) {
    steps.push({
      path: '/dashboard',
      selector: 'a[data-tour-nav="/projects"]',
      title: 'Navigation',
      body:
        'Alle Hauptbereiche liegen in der linken Leiste. Mit dem nächsten Schritt öffnen wir die Seite „Projekte“.',
    });
  } else if (can('/tasks')) {
    steps.push({
      path: '/dashboard',
      selector: 'a[data-tour-nav="/tasks"]',
      title: 'Navigation',
      body:
        'Alle Hauptbereiche liegen in der linken Leiste. Mit dem nächsten Schritt öffnen wir die Seite „Aufgaben“.',
    });
  } else {
    steps.push({
      path: '/dashboard',
      selector: 'a[data-tour-nav="/command-feed"]',
      title: 'Navigation',
      body:
        'Alle Hauptbereiche liegen in der linken Leiste. Als Nächstes zeigen wir den Command Feed.',
    });
  }

  if (can('/projects')) {
    steps.push({
      path: '/projects',
      selector: '[data-tour="page-projects"]',
      title: 'Projekte',
      body:
        'Hier legen Sie Mandate und Projekte an, suchen und springen in die Detailansicht. Über „+ Neues Projekt“ starten Sie direkt.',
    });
  }
  if (can('/tasks')) {
    steps.push({
      path: '/tasks',
      selector: '[data-tour="page-tasks"]',
      title: 'Aufgaben',
      body:
        'Aufgaben listen, filtern, per Kanban verschieben und im Team zuweisen — das Zentrum für Ihre operative Arbeit.',
    });
  }

  if (can('/team')) {
    steps.push({
      path: '/team',
      selector: '[data-tour="page-team"]',
      title: 'Team',
      body:
        'Teams und Mitglieder verwalten — Zuordnung zu Projekten und Rollen im Arbeitsalltag.',
    });
  }

  if (can('/notifications')) {
    steps.push({
      path: '/notifications',
      selector: '[data-tour="page-notifications"]',
      title: 'Benachrichtigungen',
      body:
        'Aktivitäten und Hinweise aus Projekten, Aufgaben und Team — alles chronologisch im Blick.',
    });
  }

  steps.push(
    {
      path: '/command-feed',
      selector: '[data-tour="page-command-feed"]',
      title: 'Command Feed',
      body:
        'Priorisierte Vorschläge: überfällige Punkte, offene Posten, Risiken — oft mit Aktionen in einem Klick.',
    },
    {
      path: '/deals',
      selector: '[data-tour="page-deals"]',
      title: 'Deals',
      body:
        'Verkaufs- und Projektchancen mit Meilensteinen im Blick — ideal für Pipeline und nächste Schritte.',
    },
  );

  if (can('/analytics')) {
    steps.push({
      path: '/analytics',
      selector: '[data-tour="page-analytics"]',
      title: 'Analytics',
      body:
        'Kennzahlen, Verläufe und Verteilungen — Überblick über Projekte, Aufgaben und Nutzung im Zeitverlauf.',
    });
  }
  if (can('/invoices')) {
    steps.push({
      path: '/invoices',
      selector: '[data-tour="page-invoices"]',
      title: 'Rechnungen',
      body:
        'Rechnungen erfassen, Status verfolgen und mit Kunden verknüpfen — Finanzen im Blick behalten.',
    });
  }
  if (can('/customers')) {
    steps.push({
      path: '/customers',
      selector: '[data-tour="page-customers"]',
      title: 'Kunden',
      body:
        'Stammdaten und Suche — die Basis für Angebote, Projekte und Rechnungen.',
    });
  }

  if (can('/settings')) {
    steps.push(...SETTINGS_TOUR_STEPS);
    if (canManageWorkspaceTour(ctx)) {
      steps.push(
        {
          path: '/settings',
          search: 'tab=workspace',
          selector: '[data-tour="settings-workspace"]',
          title: 'Einstellungen · Organisation',
          body:
            'Erscheinungsbild, Module und weitere Organisationseinstellungen — alles, was für den Arbeitsbereich gilt.',
          scrollBlock: 'start',
          scrollAppMainToTop: true,
        },
        {
          path: '/settings',
          search: 'tab=workspace&tourInvite=1',
          selector: '[data-tour="workspace-invite-code"]',
          title: 'Einstellungen · Einladungscode',
          body:
            'Nach der Gründung teilen Sie diesen Code mit Kolleginnen und Kollegen: damit treten sie Ihrer Organisation bei (über „Workspace beitreten“). Link kopieren oder Code per E-Mail schicken.',
        },
      );
    }
  }

  return steps;
}

export function ProductTour() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const steps = useMemo((): TourStep[] => {
    const base = buildTourSteps({
      enabledModules: user?.enabledModules,
      orgRole: user?.orgRole ?? null,
    });
    return [
      ...base,
      {
        path: '/dashboard',
        selector: '[data-tour="app-main"]',
        title: t('tour.outro.title'),
        body: t('tour.outro.body'),
        kind: 'outro',
      },
    ];
  }, [user?.enabledModules, user?.orgRole, t]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStepIndex((i) =>
      steps.length === 0 ? 0 : Math.min(i, Math.max(0, steps.length - 1)),
    );
  }, [steps]);

  const closeTour = useCallback(() => {
    markProductTourCompleted();
    setOpen(false);
  }, []);

  const skipTour = useCallback(() => {
    markProductTourCompleted();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (pathname !== '/dashboard' || !user?.organizationId) {
      return;
    }
    if (hasCompletedProductTour()) {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [pathname, user?.organizationId]);

  useEffect(() => {
    const onRestart = () => {
      setStepIndex(0);
      setAnchor(null);
      if (pathname === '/dashboard' && user?.organizationId) {
        setOpen(true);
      }
    };
    window.addEventListener(PRODUCT_TOUR_RESTART_EVENT, onRestart);
    return () =>
      window.removeEventListener(PRODUCT_TOUR_RESTART_EVENT, onRestart);
  }, [pathname, user?.organizationId]);

  const step = steps[stepIndex];
  const isNavSidebarStep =
    step?.path === '/dashboard' && step?.selector.startsWith('a[data-tour-nav=');

  /** Unter lg ist die Sidebar zu — Nav-Link im Rundgang sichtbar machen. */
  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (pathname === '/dashboard' && isNavSidebarStep && mq.matches) {
      setSidebarOpen(true);
    }
  }, [open, pathname, isNavSidebarStep, setSidebarOpen]);

  /** Nach echtem Seitenwechsel Overlay-Menü schließen (Navigation erfolgt per router, nicht per Link-Klick). */
  useEffect(() => {
    if (!open) return;
    if (pathname !== '/dashboard') {
      setSidebarOpen(false);
    }
  }, [open, pathname, setSidebarOpen]);

  useLayoutEffect(() => {
    if (!open || !step) {
      return;
    }

    const queryNow = new URLSearchParams(searchParams.toString());
    if (!stepMatchesLocation(pathname, queryNow, step)) {
      setAnchor(null);
      router.push(stepHref(step));
      return;
    }

    const updateAnchor = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        setAnchor(null);
        return;
      }
      if (step.scrollAppMainToTop) {
        const main = document.querySelector(
          '[data-tour="app-main"]',
        ) as HTMLElement | null;
        main?.scrollTo({ top: 0, behavior: 'auto' });
      }
      el.scrollIntoView({
        block: step.scrollBlock ?? 'center',
        behavior: 'auto',
      });
      setAnchor(el.getBoundingClientRect());
    };

    const schedule = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(updateAnchor);
      });
    };

    schedule();
    const onResize = () => updateAnchor();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', schedule, true);

    /** Kein aggressives „Weiter“ nach 1,6s: Ziel erscheint oft erst nach Client-Navigation / Daten. */
    const poll = window.setInterval(() => {
      const el = document.querySelector(step.selector);
      if (el) {
        updateAnchor();
      }
    }, 200);
    const pollMax = window.setTimeout(() => window.clearInterval(poll), 45_000);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', schedule, true);
      window.clearInterval(poll);
      window.clearTimeout(pollMax);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [open, stepIndex, pathname, router, searchParams, step]);

  /** Nur überspringen, wenn die Route im Pack wirklich fehlt (nicht während pathname noch nachlädt). */
  useEffect(() => {
    if (!open) return;
    const current = steps[stepIndex];
    if (!current) return;
    const wantedPath = current.path;
    if (!wantedPath || pathname === wantedPath) return;
    const allowedHere = isPathAllowedByModules(wantedPath, user?.enabledModules);
    if (!allowedHere && pathname === '/dashboard') {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }
  }, [open, stepIndex, pathname, steps, user?.enabledModules, user?.orgRole]);

  useLayoutEffect(() => {
    if (!open || !steps[stepIndex]) return;
    const id = window.requestAnimationFrame(() => {
      primaryActionRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, stepIndex, steps]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
        return;
      }
      if (e.key !== 'Enter' || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('a[href]')) return;
      if (target?.closest('[data-tour-dialog-actions]')) return;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      const last = stepIndex >= steps.length - 1;
      if (last) {
        closeTour();
      } else {
        setStepIndex((i) => i + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, skipTour, closeTour, stepIndex, steps.length]);

  if (!open || !step) {
    return null;
  }

  const isLast = stepIndex >= steps.length - 1;
  const popoverBottom = 24;

  /** Echtes „Loch“: nur außerhalb wird gemalt — der markierte Bereich bleibt unverdunkelt (kein Vollbild-Overlay darüber). */
  const dimClipPath =
    anchor && typeof window !== 'undefined'
      ? (() => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const pad = 8;
          const l = Math.max(0, anchor.left - pad);
          const t = Math.max(0, anchor.top - pad);
          const r = Math.min(vw, anchor.left + anchor.width + pad);
          const b = Math.min(vh, anchor.top + anchor.height + pad);
          const lp = (l / vw) * 100;
          const tp = (t / vh) * 100;
          const rp = (r / vw) * 100;
          const bp = (b / vh) * 100;
          return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${lp}% ${tp}%, ${rp}% ${tp}%, ${rp}% ${bp}%, ${lp}% ${bp}%, ${lp}% ${tp}%)`;
        })()
      : undefined;

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] bg-slate-900/50 ${anchor ? '' : 'backdrop-blur-[1px] motion-reduce:backdrop-blur-none'}`}
        aria-hidden
        style={{
          pointerEvents: 'auto',
          ...(dimClipPath
            ? { clipPath: dimClipPath, WebkitClipPath: dimClipPath }
            : {}),
        }}
      />
      {anchor ? (
        <div
          className="pointer-events-none fixed z-[201] rounded-lg border-2 border-primary shadow-[0_0_0_1px_rgba(255,255,255,0.35)] transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0 dark:shadow-[0_0_0_1px_rgba(15,23,42,0.35)]"
          style={{
            top: anchor.top - 8,
            left: anchor.left - 8,
            width: anchor.width + 16,
            height: anchor.height + 16,
          }}
        />
      ) : null}

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="fixed left-1/2 z-[210] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-border bg-white p-5 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          bottom: popoverBottom,
          pointerEvents: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-body"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-light">
          Rundgang · {stepIndex + 1} / {steps.length}
        </p>
        <div aria-live="polite" aria-atomic="true">
          <h2
            id="product-tour-title"
            className="mt-1 text-lg font-bold text-text sm:text-xl"
          >
            {step.title}
          </h2>
          <p
            id="product-tour-body"
            className="mt-3 text-sm leading-relaxed text-text sm:text-base"
          >
            {step.body}
          </p>
        </div>
        {step.kind === 'outro' ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-light p-4 dark:border-zinc-700/80 dark:bg-[#0c121e]">
            <p className="text-sm text-text dark:text-zinc-200">
              {t('tour.outro.ctaHint')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/settings?tab=personalization"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:bg-slate-50 dark:border-zinc-600 dark:bg-[#0b1220] dark:text-zinc-100 dark:hover:bg-[#111a2c]"
                onClick={() => {
                  markProductTourCompleted();
                  setOpen(false);
                }}
              >
                {t('tour.outro.ctaLink')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  requestProductTourRestart();
                  router.replace('/dashboard');
                }}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                {t('tour.outro.again')}
              </button>
            </div>
          </div>
        ) : null}
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-2"
          data-tour-dialog-actions
        >
          <button
            type="button"
            onClick={skipTour}
            className="text-sm font-medium text-text-light underline-offset-2 hover:text-text hover:underline"
          >
            Überspringen
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-light"
              >
                Zurück
              </button>
            ) : null}
            {!isLast ? (
              <button
                ref={primaryActionRef}
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                Weiter
              </button>
            ) : (
              <button
                ref={primaryActionRef}
                type="button"
                onClick={closeTour}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                Fertig
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
