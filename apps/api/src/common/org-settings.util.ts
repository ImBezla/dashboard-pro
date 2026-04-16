import {
  ALL_MODULE_KEYS,
  type ModuleKey,
  type PackId,
  isPackId,
  modulesForPack,
} from './module-packs';
import type { OrganizationBillingStub } from '../commercial/commercial.types';

/** White-Label-Felder in `settings` (JSON). */
export interface OrganizationBrandingJson {
  /** Optionaler Kurzname in der Sidebar; leer/fehlend → Firmenname (`Organization.name`). */
  displayName?: string;
  /** Akzentfarbe Buttons/Navigation (#rrggbb). */
  primaryColor?: string;
  /** Optional: Farbe nur für den Markennamen oben links. */
  headingColor?: string;
  /** Optional: Logo in der Sidebar (https empfohlen). */
  logoUrl?: string;
}

export interface OrganizationSettingsJson {
  packId?: PackId | null;
  /** Explizit abgeschlossenes Modul-Onboarding (neue Orgs: false bis Auswahl). */
  onboardingComplete?: boolean;
  /** Optional: Override-Liste statt Pack. */
  enabledModules?: ModuleKey[];
  /** Platzhalter für spätere Abrechnung (Stripe etc.). */
  billing?: OrganizationBillingStub;
  branding?: OrganizationBrandingJson;
}

export function normalizeHex6(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  let t = input.trim();
  if (t === '') return undefined;
  if (!t.startsWith('#')) t = `#${t}`;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    t = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(t)) return undefined;
  return t.toLowerCase();
}

/** Nur http/https, max. Länge; keine data:/javascript:-URLs. */
export function normalizeLogoUrl(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const t = input.trim();
  if (!t || t.length > 2048) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return rgbToHex(r * f, g * f, b * f);
}

function parseBrandingRaw(raw: unknown): OrganizationBrandingJson | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = (raw as Record<string, unknown>).branding;
  if (!b || typeof b !== 'object') return undefined;
  const o = b as Record<string, unknown>;
  const out: OrganizationBrandingJson = {};
  if (typeof o.displayName === 'string') {
    const d = o.displayName.trim().slice(0, 80);
    if (d) out.displayName = d;
  }
  const pc = normalizeHex6(o.primaryColor);
  if (pc) out.primaryColor = pc;
  const hc = normalizeHex6(o.headingColor);
  if (hc) out.headingColor = hc;
  const logo = normalizeLogoUrl(o.logoUrl);
  if (logo) out.logoUrl = logo;
  return Object.keys(out).length ? out : undefined;
}

/** Für API & UI: effektiver Anzeigename + Farben. */
export interface ResolvedOrganizationBranding {
  displayName: string;
  primaryColor: string | null;
  primaryDark: string | null;
  headingColor: string | null;
  /** Gespeicherter Kurzname oder null (= Firmenname). */
  displayNameOverride: string | null;
  logoUrl: string | null;
}

export function resolveBrandingForUi(
  organizationName: string,
  rawSettings: string | null | undefined,
): ResolvedOrganizationBranding {
  const firm = organizationName.trim() || 'Arbeitsbereich';
  const s = parseOrganizationSettings(rawSettings);
  const override = s.branding?.displayName?.trim() || null;
  const displayName = override || firm;
  const primary = s.branding?.primaryColor
    ? normalizeHex6(s.branding.primaryColor)
    : undefined;
  const heading = s.branding?.headingColor
    ? normalizeHex6(s.branding.headingColor)
    : undefined;
  const logo =
    s.branding?.logoUrl != null
      ? normalizeLogoUrl(s.branding.logoUrl)
      : undefined;
  return {
    displayName,
    primaryColor: primary ?? null,
    primaryDark: primary ? darkenHex(primary, 0.12) : null,
    headingColor: heading ?? null,
    displayNameOverride: override,
    logoUrl: logo ?? null,
  };
}

export function parseOrganizationSettings(
  raw: string | null | undefined,
): OrganizationSettingsJson {
  if (raw == null || String(raw).trim() === '') {
    return {};
  }
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return {};
    const packId =
      typeof o.packId === 'string' && isPackId(o.packId) ? o.packId : undefined;
    const onboardingComplete =
      typeof o.onboardingComplete === 'boolean'
        ? o.onboardingComplete
        : undefined;
    let enabledModules: ModuleKey[] | undefined;
    if (Array.isArray(o.enabledModules)) {
      enabledModules = o.enabledModules.filter((k): k is ModuleKey =>
        ALL_MODULE_KEYS.includes(k as ModuleKey),
      );
    }
    const branding = parseBrandingRaw(o);

    return {
      packId: packId ?? null,
      onboardingComplete,
      enabledModules,
      billing:
        o.billing && typeof o.billing === 'object'
          ? (o.billing as OrganizationBillingStub)
          : undefined,
      branding,
    };
  } catch {
    return {};
  }
}

/** Solange OWNER das Modul-Onboarding nicht abgeschlossen hat (explizit `false` bei Neuanlage). */
export function organizationModuleSetupPending(
  raw: string | null | undefined,
): boolean {
  const s = parseOrganizationSettings(raw);
  return s.onboardingComplete === false;
}

export function serializeOrganizationSettings(
  base: OrganizationSettingsJson,
): string {
  return JSON.stringify(base);
}

/** Effektive Modul-Liste für API/UI. */
export function resolveEnabledModules(
  raw: string | null | undefined,
): ModuleKey[] {
  if (organizationModuleSetupPending(raw)) {
    return modulesForPack('core');
  }
  const s = parseOrganizationSettings(raw);
  if (s.enabledModules?.length) {
    return [...new Set(s.enabledModules)];
  }
  if (s.packId && isPackId(s.packId)) {
    return modulesForPack(s.packId);
  }
  return [...ALL_MODULE_KEYS];
}

/** OWNER muss Pack-Onboarding abschließen (nur neue Orgs mit Flag). */
export function needsPackOnboarding(
  orgRole: string | null | undefined,
  raw: string | null | undefined,
): boolean {
  if (orgRole !== 'OWNER') return false;
  const s = parseOrganizationSettings(raw);
  if (s.onboardingComplete === true) return false;
  if (s.packId && isPackId(s.packId)) return false;
  return s.onboardingComplete === false;
}
