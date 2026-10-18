import React, { createContext, useContext, useEffect } from 'react';
import { TRANSLATIONS, type LanguageCode } from '../constants/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: LanguageCode = 'English';
  const isRTL = false;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', 'ltr');
    root.setAttribute('lang', 'en');
    localStorage.setItem('threadly_language', 'English');
  }, []);

  const setLanguage = (_newLang: LanguageCode) => {
    // Application is fixed to English
  };

  const t = (key: string, fallback?: string): string => {
    const item = TRANSLATIONS[key];
    if (!item) return fallback || key;
    return item['English'] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
