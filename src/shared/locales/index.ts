import type { Language } from '../types';
import type { Translations } from './types';
import { de } from './de';
import { en } from './en';

const translations: Record<Language, Translations> = { de, en };

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

export type { Translations };
