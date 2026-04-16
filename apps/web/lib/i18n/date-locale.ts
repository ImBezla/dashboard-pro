import type { Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import type { AppLocale } from './types';

export function getDateFnsLocale(locale: AppLocale): Locale {
  return locale === 'en' ? enUS : de;
}
