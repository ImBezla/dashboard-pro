const STORAGE_KEY = 'dashboardpro_interactive_tour_v1_done';

/** Wird ausgelöst, wenn der Rundgang erneut gestartet werden soll (z. B. aus den Einstellungen). */
export const PRODUCT_TOUR_RESTART_EVENT = 'dashboardpro:product-tour-restart';

export function hasCompletedProductTour(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function markProductTourCompleted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, '1');
}

export function resetProductTour(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Rundgang-Status löschen und UI anstoßen (Schritt 0, ggf. sofort öffnen auf dem Dashboard). */
export function requestProductTourRestart(): void {
  resetProductTour();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRODUCT_TOUR_RESTART_EVENT));
}
