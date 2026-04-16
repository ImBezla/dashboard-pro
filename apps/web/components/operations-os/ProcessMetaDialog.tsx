'use client';

import { useEffect, useState } from 'react';
import type { Flow, OperationalDomain } from '@/lib/operations-os/types';
import type { CreateFlowPayload } from '@/lib/operations-os/use-ops-process-store';
import { FieldSelect } from '@/components/ui/choice-controls';
import { TokenChipInput } from '@/components/operations-os/TokenChipInput';
import { cn } from '@/lib/cn';

const DOMAIN_OPTIONS: { value: OperationalDomain; label: string }[] = [
  { value: 'generic', label: 'Allgemein' },
  { value: 'healthcare', label: 'Gesundheit / Patient' },
  { value: 'customer_success', label: 'Kunde & Onboarding' },
  { value: 'internal', label: 'Intern' },
];

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Flow | null;
  onClose: () => void;
  onSubmit: (payload: CreateFlowPayload) => void;
  onDelete?: () => void;
  phaseSuggestions: string[];
  tagSuggestions: string[];
};

export function ProcessMetaDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  onDelete,
  phaseSuggestions,
  tagSuggestions,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<OperationalDomain>('generic');
  const [goal, setGoal] = useState('');
  const [phaseTokens, setPhaseTokens] = useState<string[]>([]);
  const [tagTokens, setTagTokens] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setTitle(initial.title);
      setDescription(initial.description ?? '');
      setDomain(initial.domain ?? 'generic');
      setGoal(initial.goal ?? '');
      setPhaseTokens(initial.phases?.length ? [...initial.phases] : []);
      setTagTokens(initial.tags?.length ? [...initial.tags] : []);
    } else {
      setTitle('');
      setDescription('');
      setDomain('generic');
      setGoal('');
      setPhaseTokens([]);
      setTagTokens([]);
    }
  }, [open, mode, initial]);

  if (!open) return null;

  const inputClass = cn(
    'min-h-[48px] w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base font-normal leading-snug tracking-tight text-text antialiased shadow-sm sm:min-h-0 sm:py-2 sm:text-sm',
    'focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15',
    'dark:border-zinc-600 dark:!bg-zinc-900 dark:text-zinc-100 dark:focus:ring-primary/20',
  );

  const footerBtn =
    'min-h-[48px] touch-manipulation rounded-xl px-4 py-2.5 text-sm font-semibold sm:min-h-0 sm:py-2 sm:text-xs';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 dark:bg-black/55"
        aria-label="Dialog schließen"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-process-dialog-title"
        className={cn(
          'relative z-[81] flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-2xl',
          'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))] dark:border-zinc-700 dark:bg-zinc-950',
          'sm:max-h-[min(92vh,42rem)] sm:rounded-2xl',
        )}
      >
        <div className="shrink-0 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-zinc-800">
          <h2 id="ops-process-dialog-title" className="text-lg font-semibold text-text dark:text-zinc-100 sm:text-base">
            {mode === 'create' ? 'Neuer Prozess' : 'Prozess bearbeiten'}
          </h2>
          <p className="mt-1 text-sm leading-snug text-text-light dark:text-zinc-400 sm:text-xs">
            Lokal im Browser gespeichert. Tags & Phasen: tippen, Vorschlag antippen oder mit Komma/Enter
            hinzufügen.
          </p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSubmit({
              title: title.trim(),
              description: description.trim() || undefined,
              domain,
              goal: goal.trim() || undefined,
              phasesText: phaseTokens.length ? phaseTokens.join(', ') : undefined,
              tagsText: tagTokens.length ? tagTokens.join(', ') : undefined,
            });
            onClose();
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3 sm:space-y-3">
            <div>
              <label className="text-sm font-medium text-text dark:text-zinc-300 sm:text-xs" htmlFor="pm-title">
                Titel <span className="text-red-600">*</span>
              </label>
              <input
                id="pm-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(inputClass, 'mt-1.5')}
                placeholder="z. B. Onboarding Vertrieb Süd"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-zinc-300 sm:text-xs" htmlFor="pm-desc">
                Kurzbeschreibung
              </label>
              <textarea
                id="pm-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(inputClass, 'mt-1.5 resize-y')}
                placeholder="Worum geht es in einem Satz?"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-zinc-300 sm:text-xs" htmlFor="pm-domain">
                Bereich
              </label>
              <FieldSelect
                id="pm-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value as OperationalDomain)}
                wrapperClassName="mt-1.5"
                className="min-h-[48px] py-2.5 text-base sm:min-h-0 sm:py-2 sm:text-sm"
              >
                {DOMAIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FieldSelect>
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-zinc-300 sm:text-xs" htmlFor="pm-goal">
                Ziel (optional)
              </label>
              <textarea
                id="pm-goal"
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className={cn(inputClass, 'mt-1.5 resize-y')}
                placeholder="Was soll am Ende erreicht sein?"
              />
            </div>
            <TokenChipInput
              id="pm-phases"
              label="Phasen (optional)"
              tokens={phaseTokens}
              onTokensChange={setPhaseTokens}
              suggestions={phaseSuggestions}
              placeholder="Phase suchen oder neu eingeben…"
              hint="Vorschläge aus Vorlagen und deinen anderen Prozessen. Antippen zum Übernehmen."
            />
            <TokenChipInput
              id="pm-tags"
              label="Tags (optional)"
              tokens={tagTokens}
              onTokensChange={setTagTokens}
              suggestions={tagSuggestions}
              placeholder="Tag suchen oder neu eingeben…"
              hint="Vorschläge aus Vorlagen und bestehenden Tags. Mehrere mit Komma oder Enter."
            />
          </div>

          <div
            className={cn(
              'shrink-0 border-t border-border bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            )}
          >
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {mode === 'edit' && onDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Diesen Prozess inkl. gespeichertem Ablauf wirklich löschen?')) {
                        onDelete();
                        onClose();
                      }
                    }}
                    className={cn(
                      footerBtn,
                      'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200',
                    )}
                  >
                    Prozess löschen
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    footerBtn,
                    'flex-1 border border-border text-text hover:bg-slate-50 dark:border-zinc-600 dark:hover:bg-zinc-800 sm:flex-none',
                  )}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className={cn(footerBtn, 'flex-1 bg-primary text-white hover:bg-primary-dark sm:flex-none')}
                >
                  {mode === 'create' ? 'Anlegen' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
