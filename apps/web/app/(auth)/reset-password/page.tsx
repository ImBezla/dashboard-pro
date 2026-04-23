'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { AuthBackToSiteLink } from '@/components/auth/AuthBackToSiteLink';
import { API_BASE_URL } from '@/lib/api-base-url';
import {
  apiUnreachableUserMessage,
  isBrowserNetworkErrorMessage,
} from '@/lib/browser-network-error';

const API_URL = API_BASE_URL;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) {
      setError('Ungültiger Link. Bitte fordern Sie eine neue E-Mail an.');
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tokenFromUrl) return;
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }
    if (password !== password2) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        throw new Error(detail || `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Zurücksetzen fehlgeschlagen';
      setError(
        isBrowserNetworkErrorMessage(msg) ? apiUnreachableUserMessage(API_URL) : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light">
        <AuthBackToSiteLink />
        <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Passwort geändert</h1>
          <p className="text-text-light mb-6">
            Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
          </p>
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light">
      <AuthBackToSiteLink />
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <DashboardProWordmarkHomeLink
            className="mx-auto"
            wordmarkClassName="h-10 w-auto"
          />
          <p className="mt-4 text-text-light">Neues Passwort setzen</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text mb-1"
            >
              Neues Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || !tokenFromUrl}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="password2"
              className="block text-sm font-medium text-text mb-1"
            >
              Passwort wiederholen
            </label>
            <input
              id="password2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={6}
              disabled={loading || !tokenFromUrl}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !tokenFromUrl}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-light">
          <Link href="/login" className="text-primary hover:underline">
            Zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-form-page min-h-screen flex items-center justify-center bg-light">
          <p className="text-text-light">Laden…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
