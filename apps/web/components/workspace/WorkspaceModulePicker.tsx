'use client';

import type { NavModuleKey } from '@/lib/module-nav';
import { NAV_MODULE_LABEL_KEYS } from '@/lib/module-nav';
import { useTranslation } from '@/lib/i18n/context';
import { MODULE_GROUPS, PACK_PRESET_MODULES } from '@/lib/workspace-modules-ui';

type Props = {
  selected: NavModuleKey[];
  onChange: (next: NavModuleKey[]) => void;
  disabled?: boolean;
  showPresets?: boolean;
};

export function WorkspaceModulePicker({
  selected,
  onChange,
  disabled,
  showPresets = true,
}: Props) {
  const { t } = useTranslation();
  const set = new Set(selected);

  const toggle = (key: NavModuleKey) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next) as NavModuleKey[]);
  };

  const applyPreset = (id: keyof typeof PACK_PRESET_MODULES) => {
    onChange([...PACK_PRESET_MODULES[id]]);
  };

  return (
    <div className="space-y-6">
      {showPresets && (
        <div>
          <p className="text-sm font-semibold text-dark mb-2">
            {t('settings.modulesPicker.presetsTitle')}
          </p>
          <p className="text-xs text-text-light mb-3">
            {t('settings.modulesPicker.presetsIntro')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyPreset('core')}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-white hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {t('settings.modulesPicker.presetCore')}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyPreset('sales')}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-white hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {t('settings.modulesPicker.presetSales')}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyPreset('full')}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-white hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {t('settings.modulesPicker.presetFull')}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-text-light">{t('settings.modulesPicker.requiredHint')}</p>

      {MODULE_GROUPS.map((group) => (
        <div key={group.titleKey}>
          <h4 className="text-sm font-bold text-dark mb-2">{t(group.titleKey)}</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.keys.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  set.has(key)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white hover:border-border'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={set.has(key)}
                  disabled={disabled}
                  onChange={() => toggle(key)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-dark">
                  {t(NAV_MODULE_LABEL_KEYS[key])}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
