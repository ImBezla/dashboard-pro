'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { API_BASE_URL } from '@/lib/api-base-url';
import {
  apiUnreachableUserMessage,
  isBrowserNetworkErrorMessage,
} from '@/lib/browser-network-error';

const API_URL = API_BASE_URL;

const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

const inputClassName =
  'w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [fromRegisterBanner, setFromRegisterBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const em = sp.get('email');
    const fromReg = sp.get('from') === 'register';
    if (em) {
      try {
        setEmail(decodeURIComponent(em));
      } catch {
        setEmail(em);
      }
    }
    if (fromReg) setFromRegisterBanner(true);
    if (em || fromReg) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    setError('');
    setNeedsVerification(false);
    setResendMessage('');
    setLoading(true);

    try {
      const requestBody = {
        email: email.trim().toLowerCase(),
        password: password,
      };

      const response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        if (
          detail === EMAIL_NOT_VERIFIED ||
          (typeof detail === 'string' && detail.includes(EMAIL_NOT_VERIFIED))
        ) {
          setNeedsVerification(true);
          setError(
            'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Wir haben Ihnen einen Link gesendet.',
          );
          return;
        }
        throw new Error(detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.user && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;

        await new Promise((resolve) => setTimeout(resolve, 200));

        window.location.href = data.user?.organizationId
          ? '/dashboard'
          : '/setup-workspace';
      } else {
        throw new Error('Ungültige Antwort vom Server');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login fehlgeschlagen';
      let errorMessage = 'Login fehlgeschlagen';

      if (isBrowserNetworkErrorMessage(message)) {
        errorMessage = apiUnreachableUserMessage(API_URL);
      } else {
        errorMessage = message || 'Fehler beim Senden der Anfrage';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr) {
      setResendMessage('Bitte geben Sie Ihre E-Mail oben ein.');
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        setResendMessage(
          typeof detail === 'string'
            ? detail
            : 'Bitte warten Sie kurz vor dem nächsten Versuch.',
        );
        return;
      }
      if (!res.ok) {
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        setResendMessage(
          typeof detail === 'string' ? detail : 'Anfrage fehlgeschlagen.',
        );
        return;
      }
      setResendMessage(
        typeof data.message === 'string'
          ? data.message
          : 'Wenn ein Konto existiert, wurde eine E-Mail gesendet.',
      );
    } catch {
      setResendMessage('Keine Verbindung zur API.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-form-page min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <header className="mb-10 border-b border-border pb-8 text-center">
          <DashboardProWordmarkHomeLink className="mx-auto" />
          <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
            Anmelden
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-light">
            Melden Sie sich mit E-Mail und Passwort an — danach geht es weiter zu
            Ihrem Workspace.
          </p>
        </header>

        {fromRegisterBanner && (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-text"
            role="status"
          >
            <p className="font-semibold text-emerald-900">
              Registrierung erfolgreich
            </p>
            <p className="mt-2 leading-relaxed text-emerald-900/90">
              Bitte bestätigen Sie zuerst den Link in Ihrer E-Mail. Danach geben Sie
              unten E-Mail und Passwort ein — nach der Anmeldung leiten wir Sie zum
              Workspace weiter (oder zur Einrichtung).
            </p>
            <button
              type="button"
              onClick={() => setFromRegisterBanner(false)}
              className="mt-3 text-xs font-medium text-emerald-800 underline decoration-emerald-600/50 hover:decoration-emerald-800"
            >
              Hinweis ausblenden
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            {needsVerification && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {resendLoading
                    ? 'Wird gesendet…'
                    : 'Bestätigungs-E-Mail erneut senden'}
                </button>
                {resendMessage && (
                  <p className="mt-2 text-text text-xs">{resendMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text mb-1"
            >
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={inputClassName}
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text mb-1"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={inputClassName}
              autoComplete="current-password"
            />
          </div>

          <div className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Anmeldung läuft…' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-light">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
