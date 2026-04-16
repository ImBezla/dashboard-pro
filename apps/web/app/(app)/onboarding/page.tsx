'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import type { NavModuleKey } from '@/lib/module-nav';
import {
  FOCUS_OPTIONS,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  type FocusAreaId,
  type IndustryId,
  type TeamSizeId,
  PACK_PRESET_MODULES,
} from '@/lib/workspace-modules-ui';
import { WorkspaceModulePicker } from '@/components/workspace/WorkspaceModulePicker';

const PACK_OPTIONS = [
  {
    id: 'full' as const,
    title: 'Komplett',
    description: 'Alle Module – für maximale Flexibilität.',
    icon: '🧩',
  },
  {
    id: 'core' as const,
    title: 'Kern',
    description: 'Team, Projekte, Aufgaben, Termine, Dashboard.',
    icon: '🎯',
  },
  {
    id: 'sales' as const,
    title: 'Vertrieb & Einkauf',
    description: 'Kunden, Lieferanten, Produkte, Rechnungen, Einkauf.',
    icon: '📦',
  },
];

export default function OnboardingPackPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<1 | 2>(1);
  const [industry, setIndustry] = useState<IndustryId | ''>('');
  const [teamSize, setTeamSize] = useState<TeamSizeId | ''>('');
  const [focusAreas, setFocusAreas] = useState<FocusAreaId[]>([]);
  const [modules, setModules] = useState<NavModuleKey[]>([]);
  const [suggestError, setSuggestError] = useState('');

  useEffect(() => {
    if (user === null) return;
    if (!user.organizationId) {
      router.replace('/setup-workspace');
      return;
    }
    if (user.orgRole !== 'OWNER' || user.needsPackSelection !== true) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const refreshSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const { data } = await api.get('/users/me');
    setAuth(data, token);
  };

  const selectPack = useMutation({
    mutationFn: async (packId: 'full' | 'core' | 'sales') => {
      await api.patch('/organizations/workspace/pack', { packId });
    },
    onSuccess: async () => {
      await refreshSession();
      router.replace('/dashboard');
    },
    onError: () => {
      alert('Paket konnte nicht gespeichert werden. Bitte erneut versuchen.');
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async (payload: {
      areas: FocusAreaId[];
      industry: IndustryId;
      teamSize: TeamSizeId;
    }) => {
      const { data } = await api.post('/organizations/workspace/suggest-modules', {
        focusAreas: payload.areas,
        industry: payload.industry,
        teamSize: payload.teamSize,
      });
      return data.modules as string[];
    },
    onSuccess: (list) => {
      setSuggestError('');
      setModules(list as NavModuleKey[]);
      setStep(2);
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      setSuggestError(Array.isArray(msg) ? msg.join(', ') : msg || 'Vorschlag fehlgeschlagen.');
    },
  });

  const saveModules = useMutation({
    mutationFn: async (mods: NavModuleKey[]) => {
      await api.patch('/organizations/workspace/modules', { modules: mods });
    },
    onSuccess: async () => {
      await refreshSession();
      router.replace('/dashboard');
    },
    onError: () => {
      alert('Module konnten nicht gespeichert werden. Bitte erneut versuchen.');
    },
  });

  const toggleFocus = (id: FocusAreaId) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const skipToManualSetup = () => {
    setModules([...PACK_PRESET_MODULES.core]);
    setSuggestError('');
    setStep(2);
  };

  const canRequestSuggestion =
    focusAreas.length > 0 &&
    industry !== '' &&
    teamSize !== '' &&
    !suggestMutation.isPending;

  if (
    !user?.organizationId ||
    user.orgRole !== 'OWNER' ||
    user.needsPackSelection !== true
  ) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-light">
        Weiterleitung…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-1">
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-text-light mb-2">
          <span>Schritt {step} von 2</span>
          <span>{step === 1 ? 'Unternehmensprofil' : 'App-Bereiche'}</span>
        </div>
        <div className="h-2 bg-light rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out rounded-full"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <h1 className="text-3xl font-black text-dark mb-2">
        {step === 1 ? 'Workspace einrichten' : 'Bereiche festlegen'}
      </h1>
      <p className="text-text-light mb-8">
        {step === 1 ? (
          <>
            Du leitest <strong>{user.organization?.name ?? 'eure Organisation'}</strong> als
            Inhaber:in. Ein paar Angaben helfen uns, passende Menüpunkte vorzuschlagen – du kannst
            danach alles anpassen oder direkt ein Paket wählen.
          </>
        ) : (
          <>
            So sieht unser Vorschlag aus. Nutze die Schnellwahl oder setze einzelne Bereiche. Nur
            die Inhaber:in kann diese Liste später dauerhaft ändern (Einstellungen → Organisation).
          </>
        )}
      </p>

      {step === 1 && (
        <div className="space-y-10">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-dark mb-1">Branche</h2>
              <p className="text-sm text-text-light mb-3">
                Passt die Vorschläge an eure typischen Abläufe an.
              </p>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as IndustryId | '')}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Bitte wählen…</option>
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="text-lg font-bold text-dark mb-1">Teamgröße</h2>
              <p className="text-sm text-text-light mb-3">
                Größere Teams erhalten z. B. eher Reporting &amp; Analytics im Vorschlag.
              </p>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value as TeamSizeId | '')}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Bitte wählen…</option>
                {TEAM_SIZE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="text-lg font-bold text-dark mb-1">Schwerpunkte</h2>
              <p className="text-sm text-text-light mb-4">
                Mehrfachauswahl. Mindestens einen Schwerpunkt auswählen.
              </p>
              <div className="space-y-3">
                {FOCUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      focusAreas.includes(opt.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(opt.id)}
                      onChange={() => toggleFocus(opt.id)}
                      className="mt-1 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-semibold text-dark">{opt.title}</div>
                      <p className="text-sm text-text-light">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {suggestError && (
              <p className="text-sm text-red-600">{suggestError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={!canRequestSuggestion}
                onClick={() =>
                  suggestMutation.mutate({
                    areas: focusAreas,
                    industry: industry as IndustryId,
                    teamSize: teamSize as TeamSizeId,
                  })
                }
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestMutation.isPending ? '…' : 'Vorschlag ansehen & anpassen'}
              </button>
              <button
                type="button"
                disabled={suggestMutation.isPending}
                onClick={skipToManualSetup}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border border-border bg-white hover:bg-light"
              >
                Ohne Vorschlag – manuell wählen
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-border bg-light/80 p-6">
            <h2 className="text-lg font-bold text-dark mb-2">Oder: klassische Paketwahl</h2>
            <p className="text-sm text-text-light mb-4">
              Fertiges Paket ohne Fragebogen. Die genaue Modulliste kann später nur die
              Inhaber:in unter Einstellungen → Organisation anpassen.
            </p>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              {PACK_OPTIONS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={selectPack.isPending || suggestMutation.isPending}
                  onClick={() => selectPack.mutate(pack.id)}
                  className="text-left p-5 rounded-2xl border-2 border-border bg-white hover:border-primary hover:shadow-lg transition-all disabled:opacity-60"
                >
                  <div className="text-2xl mb-2">{pack.icon}</div>
                  <div className="font-bold text-dark mb-1">{pack.title}</div>
                  <p className="text-xs text-text-light leading-relaxed">{pack.description}</p>
                  <div className="mt-3 text-primary font-semibold text-sm">
                    {selectPack.isPending ? '…' : 'Paket wählen →'}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <WorkspaceModulePicker
            selected={modules}
            onChange={setModules}
            disabled={saveModules.isPending}
            showPresets
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={saveModules.isPending}
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-xl font-semibold border border-border bg-white hover:bg-light"
            >
              Zurück
            </button>
            <button
              type="button"
              disabled={saveModules.isPending}
              onClick={() => saveModules.mutate(modules)}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50"
            >
              {saveModules.isPending ? 'Speichern…' : 'Speichern & zum Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
