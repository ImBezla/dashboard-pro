'use client';

import { useState } from 'react';
import { SUPPORT_EMAIL } from '@/lib/site-url';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      category: 'Projekte',
      question: 'Wie erstelle ich ein neues Projekt?',
      answer:
        'Gehen Sie zur Projekte-Seite und klicken Sie auf den Button "Neues Projekt". Füllen Sie das Formular aus mit Name, Beschreibung, Status und optionalem Deadline-Datum. Klicken Sie auf "Projekt erstellen" um das Projekt anzulegen.',
    },
    {
      id: '2',
      category: 'Projekte',
      question: 'Wie bearbeite ich ein Projekt?',
      answer:
        'Klicken Sie auf ein Projekt in der Projektliste, um zur Detailseite zu gelangen. Dort können Sie auf "Bearbeiten" klicken und alle Projektinformationen ändern.',
    },
    {
      id: '3',
      category: 'Aufgaben',
      question: 'Wie weise ich Aufgaben zu?',
      answer:
        'Beim Erstellen oder Bearbeiten einer Aufgabe können Sie im Feld "Zugewiesen an" einen Benutzer auswählen. Sie können auch eine Aufgabe einem Projekt zuordnen.',
    },
    {
      id: '4',
      category: 'Aufgaben',
      question: 'Wie ändere ich den Status einer Aufgabe?',
      answer:
        'Sie können den Status einer Aufgabe direkt in der Aufgabenliste ändern, indem Sie auf die Checkbox klicken. Alternativ können Sie auf die Aufgabe klicken und auf der Detailseite den Status bearbeiten.',
    },
    {
      id: '5',
      category: 'Team',
      question: 'Wie füge ich ein Team-Mitglied hinzu?',
      answer:
        'Gehen Sie zur Team-Seite und klicken Sie auf "Mitglied hinzufügen". Wählen Sie ein Team und einen Benutzer aus, weisen Sie eine Rolle zu und klicken Sie auf "Hinzufügen".',
    },
    {
      id: '6',
      category: 'Team',
      question: 'Welche Rollen gibt es?',
      answer:
        'Es gibt drei Rollen: Mitglied (MEMBER) - Standard-Berechtigungen, Manager (MANAGER) - kann Projekte und Aufgaben verwalten, und Owner (OWNER) - vollständige Administrationsrechte.',
    },
    {
      id: '7',
      category: 'Dashboard',
      question: 'Was zeigt das Dashboard an?',
      answer:
        'Das Dashboard fasst Kennzahlen und Listen aus Ihren Projekten, Aufgaben und Teams zusammen, soweit Sie Daten angelegt haben. Inhalte kommen aus der Datenbank, nicht aus Beispielwerten.',
    },
    {
      id: '8',
      category: 'Analytics',
      question: 'Wie kann ich Zeiträume für Analysen ändern?',
      answer:
        'Auf der Analytics-Seite können Sie oben rechts zwischen Woche, Monat, Quartal und Jahr wählen. Die Charts und Statistiken werden entsprechend aktualisiert.',
    },
    {
      id: '9',
      category: 'Einstellungen',
      question: 'Wie ändere ich mein Passwort?',
      answer:
        'Gehen Sie zu Einstellungen > Sicherheit. Geben Sie Ihr aktuelles Passwort ein und wählen Sie ein neues Passwort. Bestätigen Sie das neue Passwort und klicken Sie auf "Passwort ändern".',
    },
    {
      id: '10',
      category: 'Einstellungen',
      question: 'Wie aktiviere ich Benachrichtigungen?',
      answer:
        'Gehen Sie zu Einstellungen > Benachrichtigungen. Dort können Sie Push-Benachrichtigungen und E-Mail-Benachrichtigungen aktivieren oder deaktivieren.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark mb-2">Hilfe & Support</h1>
        <p className="text-lg text-text-light">
          Dokumentation und häufig gestellte Fragen
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Suchen Sie nach Hilfe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {categories.map((category) => (
          <div
            key={category}
            className="bg-white rounded-2xl p-6 shadow border border-border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="text-3xl mb-2">
              {category === 'Projekte' && '📁'}
              {category === 'Aufgaben' && '✅'}
              {category === 'Team' && '👥'}
              {category === 'Dashboard' && '📊'}
              {category === 'Analytics' && '📈'}
              {category === 'Einstellungen' && '⚙️'}
            </div>
            <h3 className="text-lg font-bold text-dark mb-1">{category}</h3>
            <p className="text-sm text-text-light">
              {faqs.filter((faq) => faq.category === category).length} Artikel
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-dark">Häufig gestellte Fragen</h2>
        </div>
        <div className="divide-y divide-border">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="p-6">
              <button
                onClick={() =>
                  setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                }
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-primary mb-1 block">
                      {faq.category}
                    </span>
                    <h3 className="font-semibold text-dark">{faq.question}</h3>
                  </div>
                  <span className="text-2xl text-text-light">
                    {expandedFaq === faq.id ? '−' : '+'}
                  </span>
                </div>
              </button>
              {expandedFaq === faq.id && (
                <div className="mt-4 text-text-light leading-relaxed">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 shadow border border-border">
        <h2 className="text-xl font-bold text-dark mb-4">Kontakt & Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-light rounded-lg">
            <h3 className="font-semibold text-dark mb-2">E-Mail-Support</h3>
            <p className="text-sm text-text-light mb-2">
              Schreiben Sie uns bei Fragen zur Nutzung, Fehlern oder Feedback:
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary hover:text-primary-dark font-semibold break-all"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="p-4 bg-light rounded-lg">
            <h3 className="font-semibold text-dark mb-2">Einstellungen</h3>
            <a
              href="/settings"
              className="text-primary hover:text-primary-dark font-semibold"
            >
              Kontoeinstellungen →
            </a>
            <p className="text-sm text-text-light mt-2">
              Profil, Passwort, Theme ändern
            </p>
          </div>
          <div className="p-4 bg-light rounded-lg">
            <h3 className="font-semibold text-dark mb-2">Schnellstart</h3>
            <a
              href="/dashboard"
              className="text-primary hover:text-primary-dark font-semibold"
            >
              Zum Dashboard →
            </a>
            <p className="text-sm text-text-light mt-2">
              Übersicht aller Funktionen
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 shadow border border-border">
        <h2 className="text-xl font-bold text-dark mb-4">Tastenkürzel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Globale Suche</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ K</kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Neues Projekt</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ P</kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Neue Aufgabe</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ T</kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Dashboard</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ D</kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Kalender</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ C</kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-light rounded-lg">
            <span className="text-text">Einstellungen</span>
            <kbd className="px-2 py-1 bg-white border border-border rounded text-sm font-mono">⌘ ,</kbd>
          </div>
        </div>
        <p className="text-sm text-text-light mt-4">
          Auf Windows/Linux: Strg statt ⌘ verwenden
        </p>
      </div>
    </div>
  );
}
