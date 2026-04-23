'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { isPlatformAdminUser } from '@/lib/platform-admin';

type Overview = {
  totals: {
    users: number;
    organizations: number;
    newsletterSubscriptionsConfirmed: number;
    newsletterSubscriptionsPendingConfirm: number;
  };
};

export function PlatformAdminOverviewStripe() {
  const user = useAuthStore((s) => s.user);
  const enabled = Boolean(user && isPlatformAdminUser(user));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data: d } = await api.get<Overview>('/admin/overview');
      return d;
    },
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 to-primary/5 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Plattform
          </p>
          <p className="mt-0.5 text-sm text-dark">
            Nach Newsletter-Double-Opt-in erhältst du eine Info-Mail (Einstellung in
            der API: <span className="font-medium">NEWSLETTER_ADMIN_EMAIL</span>).
            Detailübersicht:{' '}
            <Link href="/admin" className="font-semibold text-primary underline">
              Plattform-Admin
            </Link>
            .
          </p>
        </div>
        {isLoading || !data ? (
          <p className="text-sm text-text-light">Lade Kennzahlen…</p>
        ) : (
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-text-light">Newsletter bestätigt</dt>
              <dd className="font-semibold tabular-nums text-dark">
                {data.totals.newsletterSubscriptionsConfirmed}
              </dd>
            </div>
            <div>
              <dt className="text-text-light">Newsletter offen</dt>
              <dd className="font-semibold tabular-nums text-dark">
                {data.totals.newsletterSubscriptionsPendingConfirm}
              </dd>
            </div>
            <div>
              <dt className="text-text-light">Nutzer</dt>
              <dd className="font-semibold tabular-nums text-dark">
                {data.totals.users}
              </dd>
            </div>
            <div>
              <dt className="text-text-light">Organisationen</dt>
              <dd className="font-semibold tabular-nums text-dark">
                {data.totals.organizations}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
