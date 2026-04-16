'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  id: string;
  label: string;
  /** Bereits gewählte Einträge (Reihenfolge bleibt). */
  tokens: string[];
  onTokensChange: (next: string[]) => void;
  /** Vorschläge (z. B. aus anderen Prozessen + Presets). */
  suggestions: string[];
  placeholder?: string;
  hint?: string;
};

function normalizeToken(raw: string) {
  return raw.replace(/\s+/g, ' ').trim();
}

function commitDraft(draft: string, tokens: string[], onTokensChange: (next: string[]) => void) {
  const t = normalizeToken(draft);
  if (!t) return;
  const parts = t.split(/[,;]/).map((p) => normalizeToken(p)).filter(Boolean);
  if (parts.length === 0) return;
  const next = [...tokens];
  for (const p of parts) {
    if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
  }
  onTokensChange(next);
}

/**
 * Tags/Phasen als Chips + tippen mit Vorschlagsliste (Touch-freundlich).
 */
export function TokenChipInput({
  id,
  label,
  tokens,
  onTokensChange,
  suggestions,
  placeholder = 'Tippen und Enter oder Vorschlag wählen…',
  hint,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [listOpen, setListOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const taken = new Set(tokens.map((t) => t.toLowerCase()));
    return suggestions
      .filter((s) => !taken.has(s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 24);
  }, [draft, suggestions, tokens]);

  const addSuggestion = useCallback(
    (s: string) => {
      const t = normalizeToken(s);
      if (!t) return;
      if (tokens.some((x) => x.toLowerCase() === t.toLowerCase())) return;
      onTokensChange([...tokens, t]);
      setDraft('');
      setListOpen(false);
      inputRef.current?.focus();
    },
    [tokens, onTokensChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      onTokensChange(tokens.filter((_, i) => i !== index));
    },
    [tokens, onTokensChange],
  );

  const inputClass = cn(
    'min-h-[48px] w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base font-normal leading-snug tracking-tight text-text antialiased shadow-sm sm:text-sm',
    'focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15',
    'dark:border-zinc-600 dark:!bg-zinc-900 dark:text-zinc-100 dark:focus:ring-primary/20',
  );

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text dark:text-zinc-300" htmlFor={id}>
        {label}
      </label>
      <div
        className={cn(
          'rounded-xl border border-border bg-white p-2 shadow-sm dark:border-zinc-600 dark:bg-zinc-900/80',
          listOpen && filtered.length > 0 && 'ring-2 ring-primary/20',
        )}
      >
        {tokens.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tokens.map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="inline-flex max-w-full items-center gap-1 rounded-lg bg-slate-100 py-1.5 pl-2.5 pr-1 text-sm font-medium text-text dark:bg-zinc-800 dark:text-zinc-200"
              >
                <span className="max-w-[14rem] truncate">{t}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md text-text-light hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
                  aria-label={`${t} entfernen`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="done"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setListOpen(true);
          }}
          onFocus={() => setListOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setListOpen(false), 180);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commitDraft(draft, tokens, onTokensChange);
              setDraft('');
              setListOpen(true);
            }
            if (e.key === 'Backspace' && draft === '' && tokens.length > 0) {
              removeAt(tokens.length - 1);
            }
          }}
          className={inputClass}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={listOpen && filtered.length > 0}
          aria-controls={listOpen && filtered.length > 0 ? listId : undefined}
        />
        {listOpen && filtered.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="mt-2 max-h-[min(12rem,40dvh)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-white dark:border-zinc-700 dark:bg-zinc-950"
          >
            {filtered.map((s) => (
              <li key={s} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="flex min-h-[48px] w-full items-center px-3 py-2 text-left text-sm font-normal tracking-tight text-text antialiased hover:bg-slate-50 active:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => addSuggestion(s)}
                >
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {hint ? <p className="text-[11px] leading-snug text-text-light dark:text-zinc-500">{hint}</p> : null}
    </div>
  );
}
