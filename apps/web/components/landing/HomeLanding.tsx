/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';
import Link from 'next/link';
import { Instrument_Serif, Poppins } from 'next/font/google';
import { getFooterDisplayHost } from '@/lib/site-url';
import { useTranslation } from '@/lib/i18n/context';
import styles from './HomeLandingV6.module.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--dp-font-sans',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--dp-font-accent',
  display: 'swap',
});

const trustNames = [
  'Valerius Gold Trading Europe',
  'Oper8labs',
  'DornDefence Systems',
  'Sexoo',
  'Northgate Corporate',
] as const;

const useCases = [
  {
    k: 'Team',
    t: 'Wer macht was bis wann?',
    d: 'Aufgaben zuweisen, Status verfolgen und Engpässe früh sehen.',
    c: '#6366f1',
  },
  {
    k: 'Projekte',
    t: 'Alles im Plan — ohne Extra-Tool.',
    d: 'Projekte bündeln Aufgaben, Deadlines und Fortschritt an einem Ort.',
    c: '#10b981',
  },
  {
    k: 'Organisation',
    t: 'Workspaces, Rollen, Zugriff.',
    d: 'Mehrere Organisationen/Mandanten mit Rollen und sauberer Trennung.',
    c: '#f59e0b',
  },
  {
    k: 'Operations',
    t: 'Weniger Reibung im Alltag.',
    d: 'Module wie Kalender, Einkauf oder Finanzen je nach Bedarf aktivieren.',
    c: '#ec4899',
  },
] as const;

const faqs = [
  {
    q: 'Wie laden wir Team-Mitglieder ein?',
    a: 'Über einen Einladungscode für euren Workspace. Danach seht ihr die Mitglieder im Team-Bereich und könnt Rollen verwalten.',
  },
  {
    q: 'Kann ich mehrere Organisationen nutzen?',
    a: 'Ja. Jede Organisation ist ein eigener Workspace mit Teams, Projekten und eigenen Einstellungen.',
  },
  {
    q: 'Braucht man Schulung, um loszulegen?',
    a: 'Nein. Nach der Registrierung könnt ihr direkt einen Workspace anlegen und mit Aufgaben/Projekten starten.',
  },
  {
    q: 'Wie sieht es mit Nachvollziehbarkeit aus?',
    a: 'Wichtige Änderungen können protokolliert werden. Außerdem gibt es Rollen und organisatorische Trennung.',
  },
] as const;

export function HomeLanding() {
  const { t } = useTranslation();
  const footerHost = getFooterDisplayHost();
  const [openFaq, setOpenFaq] = React.useState<number>(0);
  const [navOpen, setNavOpen] = React.useState(false);
  const navDialogRef = React.useRef<HTMLDialogElement>(null);

  const [series, setSeries] = React.useState<number[]>(() => {
    const N = 42;
    const SEED = 1;
    const pts: number[] = [];
    let v = 50 + SEED * 3;
    for (let i = 0; i < N; i++) {
      // Deterministisch für SSR/CSR: keine Randomness im Initial-Render.
      v += Math.sin(i / 3 + SEED) * 4;
      v = Math.max(10, Math.min(95, v));
      pts.push(v);
    }
    return pts;
  });
  const [mrr, setMrr] = React.useState<number>(184_200);
  const [signups, setSignups] = React.useState<number>(247);

  React.useEffect(() => {
    const id1 = window.setInterval(() => {
      setSeries((prev) => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1] ?? 50;
        const v = Math.max(10, Math.min(95, last + (Math.random() - 0.45) * 9));
        next.push(v);
        return next;
      });
    }, 900);

    const id2 = window.setInterval(() => {
      setMrr((v) => v + Math.round((Math.random() - 0.3) * 140));
    }, 1100);

    const id3 = window.setInterval(() => {
      setSignups((v) => v + Math.round((Math.random() - 0.3) * 3));
    }, 1500);

    return () => {
      window.clearInterval(id1);
      window.clearInterval(id2);
      window.clearInterval(id3);
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.add('dp-landing-home');
    return () => {
      document.documentElement.classList.remove('dp-landing-home');
    };
  }, []);

  const closeNav = React.useCallback(() => setNavOpen(false), []);

  React.useEffect(() => {
    const el = navDialogRef.current;
    if (!el) return;
    const onDialogClose = () => setNavOpen(false);
    el.addEventListener('close', onDialogClose);
    return () => {
      el.removeEventListener('close', onDialogClose);
      if (el.open) el.close();
    };
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onMq = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  React.useEffect(() => {
    const el = navDialogRef.current;
    if (!el) return;
    const desktop = window.matchMedia('(min-width: 901px)').matches;
    if (desktop) {
      if (el.open) el.close();
      return;
    }
    if (navOpen) {
      if (!el.open) {
        try {
          el.showModal();
        } catch {
          setNavOpen(false);
        }
      }
    } else if (el.open) {
      el.close();
    }
  }, [navOpen]);

  const churn = React.useMemo(() => {
    const last = series[series.length - 1] ?? 50;
    return 2.1 + (last - 50) / 200;
  }, [series]);

  const spark = React.useMemo(() => {
    const W = 260;
    const H = 56;
    const N = series.length;
    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = max - min || 1;

    const coords = series.map((val, i) => {
      const x = (i / (N - 1)) * W;
      const y = H - ((val - min) / range) * (H - 4) - 2;
      return [x, y] as const;
    });

    const d = coords
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ');
    const area = `${d} L ${W} ${H} L 0 ${H} Z`;
    const last = coords[coords.length - 1] ?? [0, 0];

    return {
      d,
      area,
      lastX: last[0],
      lastY: last[1],
    };
  }, [series]);

  return (
    <div className={`${styles.root} ${poppins.variable} ${instrumentSerif.variable}`}>
      <a href="#inhalt" className={styles.skip}>
        Zum Inhalt springen
      </a>

      <nav className={styles.nav} aria-label="Hauptnavigation">
        <div className={styles.navIn}>
          <Link href="/" className={styles.brand} aria-label="Dashboard Pro Startseite">
            <img
              src="/brand/logo-wordmark.svg"
              alt="Dashboard Pro"
              width={200}
              height={40}
              className={styles.brandLogo}
              decoding="async"
            />
          </Link>
          <div className={styles.navDesktop}>
            <div className={styles.navLinks}>
              <a href="#tour" className={`${styles.navLink} ${styles.navAnchor}`}>
                {t('landing.footer.anchor.tour')}
              </a>
              <a href="#use" className={`${styles.navLink} ${styles.navAnchor}`}>
                {t('landing.footer.anchor.use')}
              </a>
              <a href="#faq" className={`${styles.navLink} ${styles.navAnchor}`}>
                {t('landing.footer.anchor.faq')}
              </a>
              <Link href="/login" className={styles.navLink}>
                {t('landing.footer.signIn')}
              </Link>
              <Link href="/register" className={styles.navCta}>
                Kostenlos starten
              </Link>
            </div>
          </div>
          <button
            type="button"
            className={styles.navBurger}
            aria-expanded={navOpen}
            aria-controls="landing-nav-dialog"
            aria-label={navOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className={styles.navBurgerLines} aria-hidden>
              <span className={styles.navBurgerLine} />
              <span className={styles.navBurgerLine} />
              <span className={styles.navBurgerLine} />
            </span>
          </button>
        </div>
      </nav>

      <dialog
        ref={navDialogRef}
        id="landing-nav-dialog"
        className={styles.navDialogShell}
        aria-modal="true"
        aria-labelledby="landing-nav-title"
      >
        <div className={styles.navDialogLayout}>
          <div
            className={styles.navDialogCover}
            role="presentation"
            aria-hidden
            onClick={closeNav}
          />
          <div className={styles.navSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.navDrawerTop}>
              <span id="landing-nav-title" className={styles.navDrawerTitle}>
                {t('landing.nav.menuTitle')}
              </span>
              <button
                type="button"
                className={styles.navDrawerClose}
                aria-label={t('landing.nav.closeMenu')}
                onClick={closeNav}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.navDrawerBody}>
              <p className={styles.navDrawerGroupLabel}>{t('landing.nav.sectionExplore')}</p>
              <ul className={styles.navDrawerList}>
                <li>
                  <a href="#tour" className={styles.navDrawerRow} onClick={closeNav}>
                    <span className={styles.navDrawerRowLabel}>{t('landing.footer.anchor.tour')}</span>
                  </a>
                </li>
                <li>
                  <a href="#use" className={styles.navDrawerRow} onClick={closeNav}>
                    <span className={styles.navDrawerRowLabel}>{t('landing.footer.anchor.use')}</span>
                  </a>
                </li>
                <li>
                  <a href="#faq" className={styles.navDrawerRow} onClick={closeNav}>
                    <span className={styles.navDrawerRowLabel}>{t('landing.footer.anchor.faq')}</span>
                  </a>
                </li>
                <li>
                  <a href="#sicherheit" className={styles.navDrawerRow} onClick={closeNav}>
                    <span className={styles.navDrawerRowLabel}>{t('landing.footer.anchor.security')}</span>
                  </a>
                </li>
              </ul>
              <p className={styles.navDrawerGroupLabel}>{t('landing.nav.sectionAccount')}</p>
              <div className={styles.navDrawerAccount}>
                <Link href="/login" className={styles.navDrawerSecondary} onClick={closeNav}>
                  {t('landing.footer.signIn')}
                </Link>
                <Link href="/register" className={styles.navDrawerCta} onClick={closeNav}>
                  Kostenlos starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      <main id="inhalt" className={styles.sectionAnchor}>
        <section className={`${styles.hero} ${styles.sectionFirst}`}>
          <div className={styles.wrap}>
            <div className={styles.heroGrid}>
              <div>
                <div className={styles.eyebrow}>01 · Klarer Überblick</div>
                <h1 className={styles.heroTitle}>
                  <em>Aufgaben,</em>
                  <br />
                  die vorankommen.
          </h1>
                <p className={styles.heroSub}>
                  Dashboard Pro bündelt Aufgaben, Projekte und Teamarbeit in einem Workspace.
                  Weniger Reibung, mehr Klarheit im Alltag.
                </p>
                <div className={styles.heroCtas}>
                  <Link href="/register" className={styles.btnPrimary}>
                    Kostenlos starten →
            </Link>
                  <a href="#tour" className={styles.btnGhost}>
                    Produkt ansehen
                  </a>
                </div>
                <div className={styles.heroMeta}>
                  Ohne Kreditkarte · Team einladen per <strong>Code</strong> · Mehrere{' '}
                  <strong>Organisationen</strong>
          </div>
              </div>

              <aside className={styles.dash} aria-label="Vorschau">
                <div className={styles.dashH}>
                  <div className={styles.dashOverview}>Übersicht</div>
                  <div className={styles.dashRt}>
                    <span className={styles.liveDot} aria-hidden />
                    <span>Aktuell</span>
                  </div>
                </div>
                <div className={styles.dashTiles}>
                  <div className={styles.dashTile}>
                    <div className={styles.dashTileL}>MRR</div>
                    <div className={styles.dashTileV}>
                      €
                      {Math.round(mrr).toLocaleString('de-DE')}
                    </div>
                    <div className={styles.dashTileD}>+12.4%</div>
                  </div>
                  <div className={styles.dashTile}>
                    <div className={styles.dashTileL}>Signups heute</div>
                    <div className={styles.dashTileV}>
                      {Math.round(signups).toLocaleString('de-DE')}
                    </div>
                    <div className={styles.dashTileD}>+3</div>
                  </div>
                </div>

                <div className={styles.dashSpark} aria-hidden>
                  <svg viewBox="0 0 260 56" preserveAspectRatio="none">
                    <path fill="rgba(99,102,241,0.12)" d={spark.area} />
                    <path
                      stroke="#6366f1"
                      strokeWidth="1.75"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={spark.d}
                    />
                    <circle r="3.2" fill="#6366f1" cx={spark.lastX} cy={spark.lastY} />
                  </svg>
                </div>

                <div className={styles.dashAxis}>
                  <span>00:00</span>
                  <span>
                    Churn <em>{churn.toFixed(2)}</em>%
                  </span>
                  <span>now</span>
                </div>

                <ul className={styles.dashList}>
                  <li className={styles.dashRow}>
                    <div>
                      <div className={styles.dashRowT}>Heute</div>
                      <div className={styles.dashRowM}>3 Aufgaben fällig · 1 Meeting</div>
                    </div>
                    <div className={styles.dashRowM}>09:00</div>
                  </li>
                  <li className={styles.dashRow}>
                    <div>
                      <div className={styles.dashRowT}>Diese Woche</div>
                      <div className={styles.dashRowM}>2 Releases · 4 Meilensteine</div>
                    </div>
                    <div className={styles.dashRowM}>KW</div>
                  </li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.trust} aria-label="Vertraut von">
          <div className={`${styles.wrap} ${styles.trustIn}`}>
            <div className={styles.trustLbl}>Vertraut von</div>
            <div className={styles.trustLogos}>
              {trustNames.map((n) => (
                <div key={n} className={styles.trustLogo}>
                  {n}
              </div>
            ))}
            </div>
          </div>
        </section>

        <section id="use" className={`${styles.section} ${styles.sectionAnchor}`}>
          <div className={styles.wrap}>
            <div className={styles.useHead}>
              <div className={styles.eyebrow}>02 · Für wen</div>
              <h2 className={styles.title}>
                <em>Ein</em> Workspace,
                <br />
                für euren Alltag.
            </h2>
              <p className={styles.lede}>
                Für Teams, die Aufgaben nicht in fünf Tools verteilen wollen — sondern an einem Ort
                planen und umsetzen.
              </p>
            </div>

            <div className={styles.useGrid}>
              {useCases.map((c) => (
                <div
                  key={c.k}
                  className={styles.useCard}
                  style={{ ['--c' as any]: c.c }}
                >
                  <div className={styles.useK}>{c.k}</div>
                  <div className={styles.useT}>{c.t}</div>
                  <div className={styles.useD}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tour" className={`${styles.section} ${styles.sectionAnchor}`}>
          <div className={styles.wrap}>
            <div className={styles.tourHead}>
              <div className={styles.eyebrow}>03 · Produkt</div>
              <h2 className={styles.title}>
                <em>Drei</em> Dinge,
                <br />
                die ihr jeden Tag nutzt.
              </h2>
              <p className={styles.lede}>
                Aufgaben, Projekte und Team-Rollen — ohne Show, ohne neue „Methodik“ verkaufen zu
                müssen.
              </p>
            </div>

            <div className={styles.tourRow}>
              <div className={styles.tourCopy}>
                <div className={styles.tourK}>Aufgaben</div>
                <div className={styles.tourT}>
                  <em>Klar</em> zuweisen.
                </div>
                <div className={styles.tourD}>
                  Zuständigkeit, Status und Fälligkeit sind sichtbar — damit Arbeit nicht in Chats
                  verschwindet.
                </div>
              </div>
              <div className={styles.tourArt}>
                <div className={styles.artStack}>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Nächste Aufgabe</div>
                    <div className={styles.artCardV}>Angebot finalisieren</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>Fällig: Fr</span>
                      <span className={styles.pill}>Zuständig: Team</span>
                      <span className={styles.pill}>Priorität: Hoch</span>
                    </div>
                  </div>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Status</div>
                    <div className={styles.artCardV}>In Arbeit</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>Kommentar</span>
                      <span className={styles.pill}>Anhänge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.tourRow} ${styles.tourRowFlip}`}>
              <div className={styles.tourCopy}>
                <div className={styles.tourK}>Projekte</div>
                <div className={styles.tourT}>
                  <em>Zusammen</em> planen.
                </div>
                <div className={styles.tourD}>
                  Projekte bündeln Aufgaben und Fortschritt. So bleibt sichtbar, was als Nächstes
                  dran ist.
                </div>
              </div>
              <div className={styles.tourArt}>
                <div className={styles.artStack}>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Projekt</div>
                    <div className={styles.artCardV}>Website Relaunch</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>6 Aufgaben</span>
                      <span className={styles.pill}>2 offen</span>
                      <span className={styles.pill}>Deadline: 30.05.</span>
                    </div>
                  </div>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Projekt</div>
                    <div className={styles.artCardV}>Onboarding Flow</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>4 Aufgaben</span>
                      <span className={styles.pill}>Review</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tourRow}>
              <div className={styles.tourCopy}>
                <div className={styles.tourK}>Teams</div>
                <div className={styles.tourT}>
                  <em>Rollen</em> verwalten.
                </div>
                <div className={styles.tourD}>
                  Owner, Manager, Member — Zuständigkeiten bleiben klar. Einladungen laufen über
                  einen Code pro Workspace.
                </div>
              </div>
              <div className={styles.tourArt}>
                <div className={styles.artStack}>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Team</div>
                    <div className={styles.artCardV}>Hauptteam</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>Owner</span>
                      <span className={styles.pill}>2 Manager</span>
                      <span className={styles.pill}>6 Mitglieder</span>
                    </div>
                  </div>
                  <div className={styles.artCard}>
                    <div className={styles.artCardT}>Einladung</div>
                    <div className={styles.artCardV}>Code: X7K9-…</div>
                    <div className={styles.artPills}>
                      <span className={styles.pill}>Kopieren</span>
                      <span className={styles.pill}>Teilen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sicherheit" className={`${styles.sec} ${styles.sectionAnchor}`} aria-label="Sicherheit">
          <div className={styles.secWrap}>
            <div className={styles.secGrid}>
              <div>
                <div className={styles.eyebrow}>04 · Sicherheit</div>
                <h2 className={styles.title}>
                  <em>Daten</em>
                  <br />
                  sauber getrennt.
                </h2>
                <p className={styles.lede}>
                  Organisationsgrenzen, Rollen und nachvollziehbare Änderungen — damit Teams im
                  Alltag schnell arbeiten können, ohne Kontrollverlust.
                </p>
                <div className={styles.secBadges}>
                  <div className={styles.secBadge}>
                    <div className={styles.secBadgeT}>Rollen & Rechte</div>
                    <div className={styles.secBadgeD}>Owner / Manager / Member</div>
                  </div>
                  <div className={styles.secBadge}>
                    <div className={styles.secBadgeT}>Audit-Spuren</div>
                    <div className={styles.secBadgeD}>für sensible Aktionen</div>
                  </div>
                  <div className={styles.secBadge}>
                    <div className={styles.secBadgeT}>Workspace-Trennung</div>
                    <div className={styles.secBadgeD}>pro Organisation/Mandant</div>
                  </div>
                  <div className={styles.secBadge}>
                    <div className={styles.secBadgeT}>Einladungscode</div>
                    <div className={styles.secBadgeD}>kontrollierter Zugang</div>
                  </div>
                </div>
              </div>

              <ul className={styles.secList}>
                {[
                  {
                    n: 'i.',
                    t: 'Organisationen getrennt.',
                    d: 'Daten, Teams und Projekte sind pro Workspace isoliert.',
                  },
                  {
                    n: 'ii.',
                    t: 'Rollen im Team.',
                    d: 'Rechte lassen sich nachvollziehbar und konsistent vergeben.',
                  },
                  {
                    n: 'iii.',
                    t: 'Nachvollziehbarkeit.',
                    d: 'Wichtige Schreibaktionen können protokolliert werden.',
                  },
                  {
                    n: 'iv.',
                    t: 'Einladungen kontrolliert.',
                    d: 'Beitritt per Code, nicht über unübersichtliche E-Mail-Ketten.',
                  },
                ].map((x) => (
                  <li key={x.n} className={styles.secLi}>
                    <span className={styles.secNum}>{x.n}</span>
                    <span>
                      <span className={styles.secStrong}>{x.t}</span>
                      <span className={styles.secTxt}>{x.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className={`${styles.section} ${styles.sectionAnchor}`}>
          <div className={styles.wrap}>
            <div className={styles.faqGrid}>
              <div>
                <div className={styles.eyebrow}>05 · FAQ</div>
                <h2 className={styles.title} style={{ fontSize: 56 }}>
                  <em>Häufig</em>
                  <br />
                  gefragt.
                </h2>
                <p className={styles.lede}>
                  Kurz beantwortet — damit ihr schnell entscheiden könnt, ob das für euer Team
                  passt.
                </p>
              </div>

              <div className={styles.faqList}>
                {faqs.map((f, idx) => {
                  const open = openFaq === idx;
                  return (
                    <div
                      key={f.q}
                      className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}
                    >
                      <div
                        className={styles.faqQ}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenFaq(open ? -1 : idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpenFaq(open ? -1 : idx);
                          }
                        }}
                        aria-expanded={open}
                      >
                        <div className={styles.faqQt}>{f.q}</div>
                        <div className={styles.faqTog} aria-hidden>
                          +
                        </div>
                      </div>
                      <div className={styles.faqA}>{f.a}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.final}>
          <div className={styles.wrap}>
            <h2 className={styles.finalTitle}>
              <em>In Minuten</em>
              <br />
              arbeitsfähig.
            </h2>
            <p className={styles.finalP}>Registrieren, Workspace anlegen, Team per Code einladen.</p>
            <div className={styles.finalCtas}>
              <Link href="/register" className={styles.btnPrimary}>
                Kostenlos starten →
              </Link>
              <Link href="/login" className={styles.btnGhost}>
                {t('landing.footer.signIn')}
              </Link>
            </div>
          </div>
        </section>

        <footer className={styles.foot}>
          <div className={styles.wrap}>
            <div className={styles.footTop}>
              <div className={styles.footBrand}>
                <div className={styles.footBrandTitle}>Dashboard Pro</div>
                <p className={styles.footBrandP}>
                  Aufgaben, Projekte und Teams in einem Workspace — klar, ruhig und ohne
                  Marketingtheater.
                </p>
              </div>
              <div className={`${styles.footCol} ${styles.footNavMerge}`}>
                <div className={styles.footSection}>
                  <div className={styles.footSectionT}>{t('landing.footer.onThisPage')}</div>
                  <a href="#tour">{t('landing.footer.anchor.tour')}</a>
                  <a href="#use">{t('landing.footer.anchor.use')}</a>
                  <a href="#faq">{t('landing.footer.anchor.faq')}</a>
                  <a href="#sicherheit">{t('landing.footer.anchor.security')}</a>
                </div>
                <div className={styles.footSection}>
                  <div className={styles.footSectionT}>{t('landing.footer.start')}</div>
                  <Link href="/login">{t('landing.footer.signIn')}</Link>
                  <Link href="/register">{t('landing.footer.signUp')}</Link>
                  <Link href="/forgot-password">{t('landing.footer.forgotPassword')}</Link>
                </div>
                <p className={styles.footHint}>{t('landing.footer.appTeaser')}</p>
              </div>
              <div className={styles.footCol}>
                <div className={styles.footColT}>{t('landing.footer.legal')}</div>
                <Link href="/datenschutz">{t('landing.footer.linkPrivacy')}</Link>
                <Link href="/agb">{t('landing.footer.linkTerms')}</Link>
                <Link href="/impressum">{t('landing.footer.linkImprint')}</Link>
              </div>
            </div>
            <div className={styles.footBot}>
              <p className={styles.footCopyright}>
                © {new Date().getFullYear()} Dashboard Pro · {footerHost}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
