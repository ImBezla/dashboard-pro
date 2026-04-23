'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { AuthBackToSiteLink } from '@/components/auth/AuthBackToSiteLink';
import { API_BASE_URL } from '@/lib/api-base-url';
import {
  apiUnreachableUserMessage,
  isBrowserNetworkErrorMessage,
} from '@/lib/browser-network-error';

const API_URL = API_BASE_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        throw new Error(detail || `HTTP ${res.status}`);
      }
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Anfrage fehlgeschlagen';
      setError(
        isBrowserNetworkErrorMessage(msg) ? apiUnreachableUserMessage(API_URL) : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light">
      <AuthBackToSiteLink />
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <DashboardProWordmarkHomeLink
            className="mx-auto"
            wordmarkClassName="h-10 w-auto"
          />
          <p className="mt-4 text-text-light">Passwort vergessen</p>
        </div>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm mb-6">
            Wenn ein Konto existiert, kommt eine E-Mail mit Link zum Zurücksetzen.
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text mb-1"
                >
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Wird gesendet…' : 'Link anfordern'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-text-light">
          <Link href="/login" className="text-primary hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
