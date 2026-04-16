'use client';

import { useState, useId, FormEvent, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthUser } from '@/lib/store';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { API_BASE_URL } from '@/lib/api-base-url';

const API_URL = API_BASE_URL;

const inputClassName =
  'w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

function passwordStrengthLabel(pw: string): { label: string; tone: 'muted' | 'warn' | 'ok' } {
  const len = pw.length;
  if (len === 0) return { label: 'Mindestens 6 Zeichen', tone: 'muted' };
  if (len < 6) return { label: `Noch ${6 - len} Zeichen bis zum Minimum`, tone: 'warn' };
  if (len < 10) return { label: 'Ausreichend — längere Passwörter sind sicherer', tone: 'ok' };
  return { label: 'Starkes Passwort', tone: 'ok' };
}

export default function RegisterPage() {
  const id = useId();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

  const strength = useMemo(() => passwordStrengthLabel(password), [password]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      next.name = 'Bitte geben Sie mindestens 2 Zeichen ein.';
    }
    const mail = email.trim().toLowerCase();
    if (!mail) {
      next.email = 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      next.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    if (password.length < 6) {
      next.password = 'Das Passwort muss mindestens 6 Zeichen haben.';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Die Passwörter stimmen nicht überein.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        throw new Error(detail || `HTTP ${response.status}`);
      }

      const { user: nextUser, token, message } = data as {
        user?: unknown;
        token?: string;
        message?: string;
        email?: string;
      };

      if (token && nextUser) {
        const u = nextUser as AuthUser;
        setAuth(u, token);
        if (u.organizationId) {
          router.push('/dashboard');
        } else {
          router.push('/setup-workspace');
        }
        return;
      }

      const mustVerify =
        !token &&
        typeof message === 'string' &&
        message.length > 0 &&
        typeof (data as { email?: string }).email === 'string';

      if (mustVerify) {
        setServerMessage(message as string);
        setRedirectSeconds(10);
        setAwaitingVerification(true);
        return;
      }

      setError('Unerwartete Antwort vom Server');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen';
      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError')
      ) {
        setError(
          `Keine Verbindung zur API (${API_URL}). Läuft das Backend auf Port 3002?`,
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAfterRegisterHref = `/login?from=register&email=${encodeURIComponent(
    email.trim().toLowerCase(),
  )}`;

  useEffect(() => {
    if (!awaitingVerification) return;
    let seconds = 10;
    const interval = window.setInterval(() => {
      seconds -= 1;
      setRedirectSeconds(seconds);
      if (seconds <= 0) {
        window.clearInterval(interval);
        router.replace(loginAfterRegisterHref);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [awaitingVerification, router, loginAfterRegisterHref]);

  const strengthColor =
    strength.tone === 'warn'
      ? 'text-amber-700'
      : strength.tone === 'ok'
        ? 'text-emerald-700'
        : 'text-text-light';

  if (awaitingVerification) {
    return (
      <div className="auth-form-page min-h-screen flex items-center justify-center bg-light px-4 py-8">
        <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <header className="mb-8 border-b border-border pb-8 text-center">
            <DashboardProWordmarkHomeLink className="mx-auto" />
            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
              Fast geschafft
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-light">
              Bestätigen Sie Ihre E-Mail — danach können Sie sich anmelden.
            </p>
          </header>

          {serverMessage && (
            <p
              className="mb-4 p-3 rounded-lg border border-border bg-light text-sm text-text text-center"
              role="status"
            >
              {serverMessage}
            </p>
          )}

          <div
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-text"
            role="region"
            aria-label="Nächste Schritte"
          >
            <p className="mb-3">
              Wir haben eine <strong>Bestätigungs-E-Mail</strong> an{' '}
              <span className="font-medium break-all">{email.trim().toLowerCase()}</span>{' '}
              gesendet. Bitte klicken Sie auf den Link in der E-Mail, bevor Sie sich
              anmelden.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-text-light">
              <li>Posteingang (und ggf. Spam-Ordner) prüfen</li>
              <li>Bestätigungslink in der E-Mail öffnen</li>
              <li>Mit E-Mail und Passwort anmelden</li>
            </ol>
          </div>

          <Link
            href={loginAfterRegisterHref}
            className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Zur Anmeldung
          </Link>
          <p className="mt-3 text-center text-xs text-text-light min-h-[1.25rem]">
            {redirectSeconds !== null && redirectSeconds > 0
              ? `Automatische Weiterleitung in ${redirectSeconds}s …`
              : redirectSeconds === 0
                ? 'Weiterleitung …'
                : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-page min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <header className="mb-10 border-b border-border pb-8 text-center">
          <DashboardProWordmarkHomeLink className="mx-auto" />
          <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
            Neues Konto erstellen
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-light">
            Füllen Sie die Felder aus — danach richten Sie Ihren Workspace ein oder
            treten Sie einem Team bei.
          </p>
        </header>

        {error && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          autoComplete="on"
          name="register"
        >
          <div>
            <label
              htmlFor={`${id}-name`}
              className="block text-sm font-medium text-text mb-1"
            >
              Ihr Name
            </label>
            <p id={`${id}-name-hint`} className="text-xs text-text-light mb-1">
              So erscheinen Sie später im Workspace (z.&nbsp;B. Vor- und Nachname).
            </p>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: '' }));
              }}
              required
              minLength={2}
              disabled={loading}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="Max Mustermann"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? `${id}-name-err` : `${id}-name-hint`
              }
              className={`${inputClassName} disabled:cursor-not-allowed ${
                fieldErrors.name ? 'border-red-400' : ''
              }`}
            />
            {fieldErrors.name && (
              <p id={`${id}-name-err`} className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${id}-email`}
              className="block text-sm font-medium text-text mb-1"
            >
              E-Mail-Adresse
            </label>
            <p id={`${id}-email-hint`} className="text-xs text-text-light mb-1">
              Wir senden den Bestätigungslink an diese Adresse.
            </p>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }));
              }}
              required
              disabled={loading}
              autoComplete="email"
              enterKeyHint="next"
              placeholder="name@firma.de"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? `${id}-email-err` : `${id}-email-hint`
              }
              className={`${inputClassName} disabled:cursor-not-allowed ${
                fieldErrors.email ? 'border-red-400' : ''
              }`}
            />
            {fieldErrors.email && (
              <p id={`${id}-email-err`} className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor={`${id}-password`}
                className="block text-sm font-medium text-text"
              >
                Passwort
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
              >
                {showPassword ? 'Ausblenden' : 'Anzeigen'}
              </button>
            </div>
            <input
              id={`${id}-password`}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }));
              }}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
              enterKeyHint="next"
              placeholder="••••••••"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={`${id}-pw-hint ${fieldErrors.password ? `${id}-pw-err` : ''}`}
              className={`${inputClassName} disabled:cursor-not-allowed ${
                fieldErrors.password ? 'border-red-400' : ''
              }`}
            />
            <p id={`${id}-pw-hint`} className={`mt-1 text-xs ${strengthColor}`}>
              {strength.label}
            </p>
            {fieldErrors.password && (
              <p id={`${id}-pw-err`} className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${id}-confirm`}
              className="block text-sm font-medium text-text mb-1"
            >
              Passwort wiederholen
            </label>
            <input
              id={`${id}-confirm`}
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((f) => ({ ...f, confirmPassword: '' }));
              }}
              required
              disabled={loading}
              autoComplete="new-password"
              enterKeyHint="done"
              placeholder="••••••••"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword ? `${id}-confirm-err` : undefined
              }
              className={`${inputClassName} disabled:cursor-not-allowed ${
                fieldErrors.confirmPassword ? 'border-red-400' : ''
              }`}
            />
            {fieldErrors.confirmPassword && (
              <p
                id={`${id}-confirm-err`}
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Konto wird erstellt…' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-light">
          Bereits ein Konto?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
