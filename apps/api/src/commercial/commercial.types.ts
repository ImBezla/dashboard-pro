/**
 * Platzhalter für den späteren Commercial-Milestone (Stripe, Limits, Pläne).
 * In Organization.settings unter Schlüssel "billing" ablegbar.
 */
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface OrganizationBillingStub {
  planTier?: PlanTier;
  /** z. B. Stripe Customer ID, sobald angebunden */
  stripeCustomerId?: string | null;
  /** Soft-Limits für UI-Hinweise (noch nicht durchgesetzt) */
  seatLimit?: number | null;
  storageMbLimit?: number | null;
}

/** No-op bis Billing implementiert ist – zentraler Hook für spätere Limits. */
export function assertOrgWithinCommercialLimits(orgId: string): void {
  void orgId;
}
