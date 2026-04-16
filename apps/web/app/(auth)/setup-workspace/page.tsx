'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function SetupWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const codeFromUrl = searchParams.get('code')?.trim() ?? '';
  const modeParam = searchParams.get('mode')?.toLowerCase();
  const additionalOrg = searchParams.get('additional') === '1';

  const [mode, setMode] = useState<'create' | 'join'>(
    modeParam === 'join' || codeFromUrl ? 'join' : 'create',
  );
  const [companyName, setCompanyName] = useState('');
  const [orgKind, setOrgKind] = useState<
    'OPERATING' | 'HOLDING' | 'FAMILY_OFFICE' | 'AG'
  >('OPERATING');
  const [joinCode, setJoinCode] = useState(
    codeFromUrl ? codeFromUrl.toUpperCase() : '',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (additionalOrg) {
      setMode('create');
      return;
    }
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
      setMode('join');
    }
  }, [codeFromUrl, additionalOrg]);

  useEffect(() => {
    const allowStayWithoutRedirect =
      additionalOrg || mode === 'join' || Boolean(codeFromUrl);
    if (user?.organizationId && !allowStayWithoutRedirect) {
      router.replace('/dashboard');
    }
  }, [user?.organizationId, additionalOrg, mode, codeFromUrl, router]);

  const applySession = (token: string, nextUser: Parameters<typeof setAuth>[0]) => {
    setAuth(nextUser, token);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/organizations', {
        name: companyName.trim(),
        kind: orgKind,
      });
      applySession(data.token, data.user);
      router.push(additionalOrg ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Firma konnte nicht angelegt werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/organizations/join', {
        code: joinCode.trim(),
      });
      applySession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Beitritt fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-page min-h-screen flex items-center justify-center bg-light p-4">
      <div className="auth-form-card bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {additionalOrg ? 'Weiteres Unternehmen' : 'Workspace einrichten'}
          </h1>
          <p className="text-text-light text-sm">
            {additionalOrg
              ? 'Neues Mandat anlegen (Operating, Holding, Family Office oder AG) — danach wechselst du oben zwischen den Organisationen.'
              : 'Lege eine Firma an oder tritt mit einem Beitrittscode bei.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {!additionalOrg ? (
          <div className="flex rounded-lg border border-border p-1 mb-6 bg-light">
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'create'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-light hover:text-text'
              }`}
            >
              Firma gründen
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'join'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-light hover:text-text'
              }`}
            >
              Code eingeben
            </button>
          </div>
        ) : null}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Firmenname
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                minLength={2}
                placeholder="z. B. Muster GmbH"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="setup-org-kind"
                className="block text-sm font-medium text-text mb-1"
              >
                Struktur / Mandat
              </label>
              <select
                id="setup-org-kind"
                value={orgKind}
                onChange={(e) =>
                  setOrgKind(
                    e.target.value as
                      | 'OPERATING'
                      | 'HOLDING'
                      | 'FAMILY_OFFICE'
                      | 'AG',
                  )
                }
                className="w-full min-h-[44px] px-4 py-2 border border-border rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              >
                <option value="OPERATING">Operatives Unternehmen / GmbH &amp; Co.</option>
                <option value="AG">AG / börsennotiert</option>
                <option value="HOLDING">Holding / Dachgesellschaft</option>
                <option value="FAMILY_OFFICE">Family Office / Vermögensverwaltung</option>
              </select>
              <p className="mt-1.5 text-xs text-text-light leading-relaxed">
                Dient der Einordnung im Workspace; du kannst mehrere Mandanten parallel führen.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 touch-manipulation"
            >
              {loading
                ? 'Wird erstellt…'
                : additionalOrg
                  ? 'Unternehmen anlegen'
                  : 'Workspace anlegen'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Beitrittscode
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                minLength={4}
                placeholder="z. B. ABCD1234"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-wider uppercase"
                autoCapitalize="characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Wird beigetreten…' : 'Organisation beitreten'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-text-light">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-primary hover:underline"
          >
            Abmelden
          </button>
        </p>
      </div>
    </div>
  );
}

export default function SetupWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="auth-form-page min-h-screen flex items-center justify-center bg-light text-text-light">
          Lädt…
        </div>
      }
    >
      <SetupWorkspaceInner />
    </Suspense>
  );
}
