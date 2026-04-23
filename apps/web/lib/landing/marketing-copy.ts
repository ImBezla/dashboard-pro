/**
 * Statischer Marketing-Text (DE) — eine Quelle für Landing-UI, JSON-LD und /llms.txt,
 * damit Crawler & KI dieselben Inhalte ohne Client-JS lesen können.
 */

export const LANDING_USE_CASES = [
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

export const LANDING_FAQS = [
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

/** Fließtext für llms.txt und maschinenlesbare Sektion (1 Absatz). */
export const LANDING_LONG_SUMMARY_DE = `Dashboard Pro ist eine Web-Arbeitsplattform für Teams und Organisationen: Aufgaben, Projekte, Teamverwaltung, Kalender und weitere Module (z. B. Finanzen, Einkauf) in einer Anwendung. Nutzer registrieren sich, legen einen Workspace an und laden Kolleginnen per Einladungscode ein. Rollen steuern den Zugriff; mehrere Organisationen (Mandanten) sind möglich.`;
