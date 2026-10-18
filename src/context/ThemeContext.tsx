import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('threadly_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light'; // Default to light, or user preference
  });

  const [compactMode, setCompactModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('threadly_compact');
    return saved === 'true';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('threadly_theme');
    if (saved === 'dark') return true;
    if (saved === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateActualTheme = () => {
      const activeDark =
        theme === 'dark' ||
        (theme === 'system' && mediaQuery.matches);

      setIsDark(activeDark);

      if (activeDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    updateActualTheme();
    localStorage.setItem('threadly_theme', theme);

    const listener = () => {
      if (theme === 'system') {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Apply compact mode to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
      root.setAttribute('data-compact', 'true');
    } else {
      root.classList.remove('compact-mode');
      root.removeAttribute('data-compact');
    }
    localStorage.setItem('threadly_compact', String(compactMode));
  }, [compactMode]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact);
  };

  const toggleCompactMode = () => {
    setCompactModeState((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      isDark, 
      toggleTheme, 
      compactMode, 
      setCompactMode, 
      toggleCompactMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
