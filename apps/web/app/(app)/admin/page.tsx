'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { isPlatformAdminUser } from '@/lib/platform-admin';

type Overview = {
  generatedAt: string;
  totals: {
    users: number;
    organizations: number;
    usersEmailVerified: number;
    usersEmailUnverified: number;
    usersNewLast7Days: number;
    newsletterSubscriptionsConfirmed: number;
    newsletterSubscriptionsPendingConfirm: number;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    kind: string;
    memberCount: number;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string;
    globalRole: string;
    createdAt: string;
    emailVerified: boolean;
  }>;
};

export default function PlatformAdminPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !isPlatformAdminUser(user)) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data: d } = await api.get<Overview>('/admin/overview');
      return d;
    },
    enabled: Boolean(user && isPlatformAdminUser(user)),
    staleTime: 60_000,
  });

  if (!user || !isPlatformAdminUser(user)) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-white p-6 text-text">
        <p className="text-text-light">Zugriff wird geprüft …</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl rounded-xl border border-danger/30 bg-white p-6 text-danger">
        Daten konnten nicht geladen werden. Bitte neu anmelden oder Berechtigung prüfen.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark">Plattform-Admin</h1>
        <p className="mt-1 text-sm text-text-light">
          Nur für dich als Betreiber — Kennzahlen ohne Mandanten-Details.
        </p>
      </div>

      {isLoading || !data ? (
        <p className="text-text-light">Lade Übersicht …</p>
      ) : (
        <>
          <p className="text-xs text-text-light">
            Stand: {new Date(data.generatedAt).toLocaleString('de-DE')}
          </p>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Nutzer gesamt" value={data.totals.users} />
            <StatCard label="Organisationen" value={data.totals.organizations} />
            <StatCard
              label="E-Mail bestätigt"
              value={data.totals.usersEmailVerified}
            />
            <StatCard
              label="E-Mail offen"
              value={data.totals.usersEmailUnverified}
            />
            <StatCard
              label="Neue Nutzer (7 Tage)"
              value={data.totals.usersNewLast7Days}
            />
            <StatCard
              label="Newsletter bestätigt"
              value={data.totals.newsletterSubscriptionsConfirmed}
            />
            <StatCard
              label="Newsletter ausstehend"
              value={data.totals.newsletterSubscriptionsPendingConfirm}
            />
          </section>

          <section className="rounded-xl border border-border bg-white overflow-hidden">
            <h2 className="border-b border-border px-4 py-3 text-lg font-semibold text-dark">
              Zuletzt registrierte Organisationen
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-light text-text-light">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Art</th>
                    <th className="px-4 py-2 font-medium">Mitglieder</th>
                    <th className="px-4 py-2 font-medium">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrganizations.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium text-dark">{o.name}</td>
                      <td className="px-4 py-2 text-text">{o.kind}</td>
                      <td className="px-4 py-2">{o.memberCount}</td>
                      <td className="px-4 py-2 text-text-light">
                        {new Date(o.createdAt).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white overflow-hidden">
            <h2 className="border-b border-border px-4 py-3 text-lg font-semibold text-dark">
              Zuletzt angelegte Nutzer
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-light text-text-light">
                  <tr>
                    <th className="px-4 py-2 font-medium">E-Mail</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Rolle</th>
                    <th className="px-4 py-2 font-medium">Verifiziert</th>
                    <th className="px-4 py-2 font-medium">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-2 text-dark">{u.email}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.globalRole}</td>
                      <td className="px-4 py-2">
                        {u.emailVerified ? 'Ja' : 'Nein'}
                      </td>
                      <td className="px-4 py-2 text-text-light">
                        {new Date(u.createdAt).toLocaleString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-text-light">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}
