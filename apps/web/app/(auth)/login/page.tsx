'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { AuthBackToSiteLink } from '@/components/auth/AuthBackToSiteLink';
import { API_BASE_URL } from '@/lib/api-base-url';
import {
  apiUnreachableUserMessage,
  isBrowserNetworkErrorMessage,
} from '@/lib/browser-network-error';
import {
  loadSavedLoginEmails,
  rememberLoginEmail,
  normalizeLoginEmail,
} from '@/lib/saved-login-emails';
import { buildAuthTokenCookieHeader } from '@/lib/auth-token-cookie';

const API_URL = API_BASE_URL;

const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

function mapLoginApiMessage(raw: unknown): string {
  if (raw == null) return '';
  const s = Array.isArray(raw) ? raw.map(String).join(' ') : String(raw);
  const t = s.trim();
  if (!t) return '';
  if (t === 'Invalid credentials' || t.includes('Invalid credentials')) {
    return 'E-Mail oder Passwort falsch.';
  }
  return t;
}

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
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [fromProtectedRoute, setFromProtectedRoute] = useState<string | null>(
    null,
  );
  /** missing = kein Cookie; invalid = Cookie vorhanden, Middleware-JWT-Prüfung fehlgeschlagen (z. B. JWT_SECRET). */
  const [sessionHint, setSessionHint] = useState<
    'missing' | 'invalid' | null
  >(null);

  useEffect(() => {
    setSavedEmails(loadSavedLoginEmails());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const em = sp.get('email');
    const fromReg = sp.get('from') === 'register';
    const fromPath = sp.get('from');
    const session = sp.get('session');
    if (session === 'missing' || session === 'invalid') {
      setSessionHint(session);
    }
    if (fromPath && fromPath !== 'register' && fromPath.startsWith('/')) {
      setFromProtectedRoute(fromPath);
    }
    if (em) {
      try {
        setEmail(normalizeLoginEmail(decodeURIComponent(em)));
      } catch {
        setEmail(normalizeLoginEmail(em));
      }
    }
    if (fromReg) setFromRegisterBanner(true);
    if (em || fromPath || session === 'missing' || session === 'invalid') {
      const next = new URL(window.location.href);
      next.searchParams.delete('email');
      next.searchParams.delete('from');
      next.searchParams.delete('session');
      window.history.replaceState({}, '', `${next.pathname}${next.search}`);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setError('');
    setNeedsVerification(false);
    setResendMessage('');
    setLoading(true);

    try {
      const requestBody = {
        email: normalizeLoginEmail(email),
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
        const detail = mapLoginApiMessage(
          Array.isArray(msg) ? msg.join(', ') : msg,
        );
        if (
          detail === EMAIL_NOT_VERIFIED ||
          (typeof detail === 'string' && detail.includes(EMAIL_NOT_VERIFIED))
        ) {
          setNeedsVerification(true);
          setError('E-Mail noch nicht bestätigt. Posteingang prüfen oder Link erneut anfordern.');
          return;
        }
        throw new Error(detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.user && data.token) {
        rememberLoginEmail(requestBody.email);
        setSavedEmails(loadSavedLoginEmails());
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        document.cookie = buildAuthTokenCookieHeader(data.token);

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
    const addr = normalizeLoginEmail(email);
    if (!addr) {
      setResendMessage('E-Mail oben eintragen.');
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
    <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <AuthBackToSiteLink />
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <header className="mb-10 border-b border-border pb-8 text-center">
          <DashboardProWordmarkHomeLink className="mx-auto" />
          <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
            Anmelden
          </h1>
        </header>

        {fromProtectedRoute && (
          <div
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
            role="status"
          >
            <p>
              <span className="font-semibold">Anmeldung nötig</span>
              {' · '}
              <span className="font-mono text-xs">{fromProtectedRoute}</span>
            </p>
            {sessionHint === 'missing' && (
              <p className="mt-1.5 text-xs text-amber-900/90">Keine aktive Sitzung.</p>
            )}
            {sessionHint === 'invalid' && (
              <p className="mt-1.5 text-xs text-amber-900/90">
                Sitzung ungültig: <span className="font-mono">JWT_SECRET</span> in Web- und API-
                <span className="font-mono">.env</span> gleich setzen, Dev-Server neu starten.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setFromProtectedRoute(null);
                setSessionHint(null);
              }}
              className="mt-2 text-xs font-medium text-amber-900 underline"
            >
              Ausblenden
            </button>
          </div>
        )}

        {fromRegisterBanner && (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-text"
            role="status"
          >
            <p className="font-semibold text-emerald-900">Registrierung ok</p>
            <p className="mt-1.5 text-sm text-emerald-900/90">
              E-Mail bestätigen, dann hier anmelden.
            </p>
            <button
              type="button"
              onClick={() => setFromRegisterBanner(false)}
              className="mt-2 text-xs font-medium text-emerald-800 underline decoration-emerald-600/50 hover:decoration-emerald-800"
            >
              Ausblenden
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
                  {resendLoading ? 'Senden…' : 'Bestätigung erneut senden'}
                </button>
                {resendMessage && (
                  <p className="mt-2 text-text text-xs">{resendMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          autoComplete="on"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text mb-1"
            >
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              list="saved-login-emails"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={inputClassName}
              autoComplete="username"
            />
            <datalist id="saved-login-emails">
              {Array.from(new Set(savedEmails)).map((addr) => (
                <option key={addr} value={addr} />
              ))}
            </datalist>
            {savedEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2" aria-label="Zuletzt verwendete E-Mail-Adressen">
                {savedEmails.slice(0, 6).map((addr) => (
                  <button
                    key={addr}
                    type="button"
                    disabled={loading}
                    onClick={() => setEmail(addr)}
                    className="rounded-full border border-border bg-light px-3 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {addr}
                  </button>
                ))}
              </div>
            )}
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
              name="password"
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
            {loading ? '…' : 'Anmelden'}
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
