'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardProWordmarkHomeLink } from '@/components/brand/DashboardProWordmark';
import { AuthBackToSiteLink } from '@/components/auth/AuthBackToSiteLink';
import { API_BASE_URL } from '@/lib/api-base-url';

const API_URL = API_BASE_URL;

function normalizeTokenFromUrl(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = normalizeTokenFromUrl(searchParams.get('token'));
  const [status, setStatus] = useState<
    'loading' | 'ok' | 'err' | 'missing'
  >('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('Link ungültig oder abgelaufen.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        const msg = data.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        if (cancelled) return;
        if (res.ok) {
          setStatus('ok');
          setMessage(
            typeof detail === 'string'
              ? detail
              : 'E-Mail-Adresse bestätigt.',
          );
        } else {
          setStatus('err');
          setMessage(
            typeof detail === 'string'
              ? detail
              : 'Bestätigung fehlgeschlagen.',
          );
        }
      } catch {
        if (!cancelled) {
          setStatus('err');
          setMessage('Keine Verbindung zur API.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-form-page relative min-h-screen flex items-center justify-center bg-light">
      <AuthBackToSiteLink />
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <DashboardProWordmarkHomeLink />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-4">E-Mail bestätigen</h1>
        {status === 'loading' && (
          <p className="text-text-light">Wird geprüft…</p>
        )}
        {(status === 'ok' || status === 'err' || status === 'missing') && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              status === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message}
          </div>
        )}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Zur Anmeldung
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-form-page min-h-screen flex items-center justify-center bg-light">
          <p className="text-text-light">Laden…</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
