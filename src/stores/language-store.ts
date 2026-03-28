import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type TranslationKey } from '@/lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => translations[get().language][key] || key,
    }),
    { name: 'luriva-language' }
  )
);
