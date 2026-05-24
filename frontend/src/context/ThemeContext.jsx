import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const SHEET_SCALE = { sm: 0.9, md: 1.0, lg: 1.1 };

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('coc_theme') || 'light'
  );
  const [sheetSize, setSheetSizeState] = useState(
    () => localStorage.getItem('coc_sheet_size') || 'md'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coc_theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const setSheetSize = (size) => {
    setSheetSizeState(size);
    localStorage.setItem('coc_sheet_size', size);
  };

  const sheetFontScale = SHEET_SCALE[sheetSize] ?? 1.0;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, sheetSize, setSheetSize, sheetFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}