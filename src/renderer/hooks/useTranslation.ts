import { useAppStore } from '../store/app-store';
import { getTranslations } from '@shared/locales';
import type { Translations } from '@shared/locales/types';

export function useTranslation(): Translations {
  const language = useAppStore((s) => s.settings?.language ?? 'en');
  return getTranslations(language);
}
