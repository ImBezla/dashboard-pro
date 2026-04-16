import Link from 'next/link';
import { getSiteUrl } from '@/lib/site-url';

const features = [
  {
    title: 'Projekte & Aufgaben',
    desc: 'Alles, was ansteht — klar priorisiert, mit Deadlines und Zuweisungen.',
    icon: '◆',
  },
  {
    title: 'Echtzeit',
    desc: 'Änderungen an Aufgaben kommen sofort im Team an — ohne manuelles Aktualisieren.',
    icon: '◇',
  },
  {
    title: 'Organisationen',
    desc: 'Mehrere Arbeitsbereiche, Rollen und Module — so skaliert ihr mit dem Mandanten.',
    icon: '◎',
  },
  {
    title: 'Überblick',
    desc: 'Dashboards und Kennzahlen aus euren Daten — weniger Tabellenjagd.',
    icon: '▣',
  },
  {
    title: 'Flow & Operations',
    desc: 'Prozesse und Bereiche wie Einkauf, Finanzen und mehr an einem Ort.',
    icon: '⬡',
  },
  {
    title: 'Sicherheit',
    desc: 'JWT, organisatorische Trennung und Audit-Spuren für sensible Aktionen.',
    icon: '⬢',
  },
] as const;

function siteHostname(): string {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return 'dashboardpro.de';
  }
}

export function HomeLanding() {
  const host = siteHostname();

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.45), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(236, 72, 153, 0.12), transparent),
            radial-gradient(ellipse 50% 30% at 0% 100%, rgba(14, 165, 233, 0.15), transparent)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-white sm:text-xl"
          >
            Dashboard<span className="text-indigo-400">Pro</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
            >
              Kostenlos starten
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">
            Für Teams, die Tempo brauchen
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Operations, Projekte &amp; Team —{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-white to-cyan-200 bg-clip-text text-transparent">
              eine Oberfläche
            </span>
            , die mitwächst.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Dashboard Pro bündelt Aufgaben, Projekte, Kalender, Finanzen und mehr. Weniger
            Tool-Chaos — mehr Fokus auf das, was euren Betrieb voranbringt.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white px-8 py-3 text-base font-bold text-slate-900 shadow-xl shadow-indigo-500/10 transition hover:bg-slate-100"
            >
              Jetzt einrichten
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Ich habe schon ein Konto
            </Link>
          </div>
          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-10 sm:gap-10">
            {[
              ['Modular', 'Nur die Bereiche, die ihr braucht'],
              ['Schnell', 'Echtzeit-Updates für Aufgaben'],
              ['EU', 'Hosting & Datenhaltung planbar'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wider text-indigo-300/90">
                  {k}
                </dt>
                <dd className="mt-1 text-sm text-slate-500">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-white/5 bg-black/25 py-20 backdrop-blur-sm sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
              Alles, was Teams täglich brauchen
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
              Von der ersten Aufgabe bis zum Mandanten-Workspace — strukturiert, ohne
              Überfrachtung.
            </p>
            <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6 transition hover:border-indigo-400/30 hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <span
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-indigo-500/15 text-lg text-indigo-200"
                    aria-hidden
                  >
                    {f.icon}
                  </span>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-10 sm:p-14 lg:p-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Bereit, weniger hin- und herzuschalten?
              </h2>
              <p className="mt-4 text-slate-300">
                In wenigen Minuten Workspace anlegen, Team einladen, loslegen — ohne
                Wochen-Projekt „Tool-Einführung“.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-indigo-500 px-8 py-3 text-base font-bold text-white transition hover:bg-indigo-400"
              >
                Account erstellen
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 sm:text-left">
            © {new Date().getFullYear()} Dashboard Pro ·{' '}
            <Link href="/impressum" className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
              Impressum
            </Link>
            <span className="text-slate-600"> · </span>
            <Link href="/datenschutz" className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
              Datenschutz
            </Link>
            <span className="text-slate-600"> · </span>
            <Link href="/agb" className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
              AGB
            </Link>
          </p>
          <p className="text-center text-xs text-slate-600 sm:text-right">
            Bereitgestellt unter{' '}
            <span className="font-medium text-slate-500">{host}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
