import { useAuth } from '../context/AuthContext';

export interface LocalizedText {
  uz: string;
  en: string;
  ru: string;
}

export function pickText(language: 'uz' | 'en' | 'ru', text: LocalizedText) {
  return text[language] || text.uz;
}

export function useTranslateText() {
  const { settings } = useAuth();

  return (text: LocalizedText) => pickText(settings.language, text);
}
