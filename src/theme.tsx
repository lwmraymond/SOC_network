import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EuiProvider } from '@elastic/eui';

export type ThemeMode = 'light' | 'dark';

type PlatformThemeContextValue = {
  mode: ThemeMode;
  toggleMode(): void;
};

const PlatformThemeContext = createContext<PlatformThemeContextValue | undefined>(undefined);

export function PlatformThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('theme');
    return requested === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo<PlatformThemeContextValue>(() => ({
    mode,
    toggleMode: () => setMode((current) => current === 'light' ? 'dark' : 'light'),
  }), [mode]);

  return (
    <PlatformThemeContext.Provider value={value}>
      <EuiProvider colorMode={mode}>{children}</EuiProvider>
    </PlatformThemeContext.Provider>
  );
}

export function usePlatformTheme() {
  const context = useContext(PlatformThemeContext);
  if (!context) throw new Error('usePlatformTheme must be used inside PlatformThemeProvider.');
  return context;
}
