'use client';

import { createContext, useContext, useEffect } from 'react';

/** Light-only theme — enforces consistent bright UI */
const ThemeContext = createContext<{ theme: 'light' }>({ theme: 'light' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
