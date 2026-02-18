'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('pentoolkit-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
      setThemeState(saved);
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
  }

  function setTheme(t: Theme) {
    applyTheme(t);
    setThemeState(t);
    localStorage.setItem('pentoolkit-theme', t);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}