import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('coc_theme') || 'light'
  );
  const [sheetFontScale, setSheetFontScaleState] = useState(
    () => parseFloat(localStorage.getItem('sheet-font-scale')) || 1
  );
  const [roomFontScale, setRoomFontScaleState] = useState(
    () => parseFloat(localStorage.getItem('room-font-scale')) || 1
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coc_theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const setSheetFontScale = (v) => {
    setSheetFontScaleState(v);
    localStorage.setItem('sheet-font-scale', v);
  };

  const setRoomFontScale = (v) => {
    setRoomFontScaleState(v);
    localStorage.setItem('room-font-scale', v);
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme,
      sheetFontScale, setSheetFontScale,
      roomFontScale,  setRoomFontScale,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
