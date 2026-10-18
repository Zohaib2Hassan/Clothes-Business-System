import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/api';
import type { LanguageCode } from '../../constants/translations';
import clsx from 'clsx';

interface LanguageToggleProps {
  className?: string;
}

const LANGUAGES: { label: string; native: string; code: LanguageCode }[] = [
  { label: 'English', native: 'English', code: 'English' },
  { label: 'Urdu', native: 'اردو', code: 'Urdu' },
];

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = async (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);

    if (user) {
      try {
        updateUser({ language: code });
        await authFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ language: code }),
        });
      } catch (err) {
        console.error('Failed to save language preference', err);
      }
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className={clsx("relative inline-block", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        title="Select Language / زبان تبدیل کریں"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="truncate max-w-[70px] sm:max-w-none">{currentLang.native}</span>
        <ChevronDown className={clsx("w-3 h-3 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={clsx(
                  "w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer",
                  isSelected
                    ? "bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                )}
              >
                <span>{lang.native}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
