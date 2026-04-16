import {
  organizationModuleSetupPending,
  parseOrganizationSettings,
  resolveEnabledModules,
  needsPackOnboarding,
  normalizeHex6,
  normalizeLogoUrl,
  resolveBrandingForUi,
} from './org-settings.util';
import { modulesForPack } from './module-packs';

describe('org-settings.util', () => {
  describe('organizationModuleSetupPending', () => {
    it('ist true nur wenn onboardingComplete explizit false', () => {
      expect(
        organizationModuleSetupPending(
          JSON.stringify({ onboardingComplete: false }),
        ),
      ).toBe(true);
      expect(organizationModuleSetupPending(null)).toBe(false);
      expect(organizationModuleSetupPending('')).toBe(false);
      expect(
        organizationModuleSetupPending(
          JSON.stringify({ onboardingComplete: true }),
        ),
      ).toBe(false);
      expect(organizationModuleSetupPending('{}')).toBe(false);
    });
  });

  describe('resolveEnabledModules', () => {
    it('liefert Core-Pack solange Onboarding aussteht', () => {
      const raw = JSON.stringify({
        onboardingComplete: false,
        packId: 'full',
      });
      expect(resolveEnabledModules(raw)).toEqual(modulesForPack('core'));
    });

    it('nach Abschluss: enabledModules hat Vorrang', () => {
      const raw = JSON.stringify({
        onboardingComplete: true,
        enabledModules: ['overview', 'team', 'tasks'],
      });
      expect(resolveEnabledModules(raw)).toEqual(['overview', 'team', 'tasks']);
    });

    it('nach Abschluss ohne Override: packId', () => {
      const raw = JSON.stringify({
        onboardingComplete: true,
        packId: 'sales',
      });
      expect(resolveEnabledModules(raw)).toEqual(modulesForPack('sales'));
    });
  });

  describe('needsPackOnboarding', () => {
    it('nur OWNER mit pending und ohne gültiges packId', () => {
      const pending = JSON.stringify({ onboardingComplete: false });
      expect(needsPackOnboarding('OWNER', pending)).toBe(true);
      expect(needsPackOnboarding('ADMIN', pending)).toBe(false);
      expect(
        needsPackOnboarding(
          'OWNER',
          JSON.stringify({ onboardingComplete: false, packId: 'core' }),
        ),
      ).toBe(false);
      expect(
        needsPackOnboarding(
          'OWNER',
          JSON.stringify({ onboardingComplete: true }),
        ),
      ).toBe(false);
    });
  });

  describe('parseOrganizationSettings', () => {
    it('filtert unbekannte Modul-Keys', () => {
      const s = parseOrganizationSettings(
        JSON.stringify({
          enabledModules: ['overview', 'invalid', 'team'],
        }),
      );
      expect(s.enabledModules).toEqual(['overview', 'team']);
    });
  });

  describe('normalizeHex6', () => {
    it('akzeptiert #RGB und #RRGGBB', () => {
      expect(normalizeHex6('#f00')).toBe('#ff0000');
      expect(normalizeHex6('0ea5e9')).toBe('#0ea5e9');
      expect(normalizeHex6('nope')).toBeUndefined();
    });
  });

  describe('resolveBrandingForUi', () => {
    it('nutzt Firmennamen und optionales Branding', () => {
      const r = resolveBrandingForUi('Acme GmbH', '{}');
      expect(r.displayName).toBe('Acme GmbH');
      expect(r.primaryColor).toBeNull();
      expect(r.displayNameOverride).toBeNull();
    });

    it('Kurzname aus settings', () => {
      const r = resolveBrandingForUi(
        'Acme GmbH',
        JSON.stringify({
          branding: { displayName: 'Acme', primaryColor: '#00aa00' },
        }),
      );
      expect(r.displayName).toBe('Acme');
      expect(r.displayNameOverride).toBe('Acme');
      expect(r.primaryColor).toBe('#00aa00');
    });

    it('logoUrl aus settings', () => {
      const r = resolveBrandingForUi(
        'X',
        JSON.stringify({
          branding: { logoUrl: 'https://cdn.example.com/logo.png' },
        }),
      );
      expect(r.logoUrl).toBe('https://cdn.example.com/logo.png');
    });
  });

  describe('normalizeLogoUrl', () => {
    it('nur http/https', () => {
      expect(normalizeLogoUrl('https://a.com/x.png')).toBe(
        'https://a.com/x.png',
      );
      expect(normalizeLogoUrl('javascript:alert(1)')).toBeUndefined();
      expect(normalizeLogoUrl('data:image/png;base64,xx')).toBeUndefined();
    });
  });
});
