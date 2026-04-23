'use client';

import { useState, useId, FormEvent, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthUser } from '@/lib/store';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { AuthBackToSiteLink } from '@/components/auth/AuthBackToSiteLink';
import { API_BASE_URL } from '@/lib/api-base-url';
import {
  apiUnreachableUserMessage,
  isBrowserNetworkErrorMessage,
} from '@/lib/browser-network-error';
import { rememberLoginEmail } from '@/lib/saved-login-emails';

const API_URL = API_BASE_URL;

const inputClassName =
  'w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

const MIN_PW = 8;

function passwordStrengthLabel(pw: string): { label: string; tone: 'muted' | 'warn' | 'ok' } {
  const len = pw.length;
  if (len === 0) return { label: `mind. ${MIN_PW} Zeichen`, tone: 'muted' };
  if (len < MIN_PW) return { label: `noch ${MIN_PW - len} Zeichen`, tone: 'warn' };
  if (len < 10) return { label: 'ok', tone: 'ok' };
  return { label: 'stark', tone: 'ok' };
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
      next.name = 'Mindestens 2 Zeichen.';
    }
    const mail = email.trim().toLowerCase();
    if (!mail) {
      next.email = 'E-Mail fehlt.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      next.email = 'Ungültige E-Mail.';
    }
    if (password.length < MIN_PW) {
      next.password = `Mind. ${MIN_PW} Zeichen.`;
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwörter unterschiedlich.';
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
        rememberLoginEmail(email);
        setServerMessage(message as string);
        setRedirectSeconds(10);
        setAwaitingVerification(true);
        return;
      }

      setError('Unerwartete Antwort vom Server');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen';
      if (isBrowserNetworkErrorMessage(message)) {
        setError(apiUnreachableUserMessage(API_URL));
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
      <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light px-4 py-8">
        <AuthBackToSiteLink />
        <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <header className="mb-8 border-b border-border pb-8 text-center">
            <DashboardProWordmarkHomeLink className="mx-auto" />
            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
              E-Mail bestätigen
            </h1>
          </header>

          {serverMessage && (
            <p
              className="mb-4 p-3 rounded-lg border border-border bg-light text-sm text-text text-center"
              role="status"
            >
              {serverMessage}
            </p>
          )}

          <p
            className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-text text-center break-all"
            role="status"
          >
            Link an <span className="font-medium">{email.trim().toLowerCase()}</span> — Posteingang
            prüfen, dann anmelden.
          </p>

          <Link
            href={loginAfterRegisterHref}
            className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Zur Anmeldung
          </Link>
          <p className="mt-3 text-center text-xs text-text-light min-h-[1.25rem]">
            {redirectSeconds !== null && redirectSeconds > 0
              ? `Weiter in ${redirectSeconds}s`
              : redirectSeconds === 0
                ? '…'
                : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <AuthBackToSiteLink />
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <header className="mb-10 border-b border-border pb-8 text-center">
          <DashboardProWordmarkHomeLink className="mx-auto" />
            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-text sm:text-[1.65rem]">
              Registrieren
            </h1>
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
              Name
            </label>
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
              aria-describedby={fieldErrors.name ? `${id}-name-err` : undefined}
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
              E-Mail
            </label>
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
              aria-describedby={fieldErrors.email ? `${id}-email-err` : undefined}
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
            {loading ? '…' : 'Konto erstellen'}
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
