import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Available themes. `swatch` is [background, accent, surface] — used by the
// NavBar preferences picker. `id` matches the [data-theme="…"] block in index.css.
export const THEMES = [
  { id: 'light',  label: 'Parchment',    swatch: ['#f0e8d8', '#3B6D11', '#fffdf8'] },
  { id: 'dark',   label: 'Shale',        swatch: ['#1C1C1A', '#639922', '#2A2A27'] },
  { id: 'mud',    label: 'Farmilia Dark', swatch: ['#1B1814', '#C6A549', '#28241D'] },
  { id: 'marsh',  label: 'Marsh',        swatch: ['#192017', '#75B875', '#202A1F'] },
  { id: 'sienna', label: 'Archive',      swatch: ['#F2ECD7', '#A84B1D', '#E7DEC2'] },
  { id: 'arcane', label: 'Cosmic Void',  swatch: ['#141125', '#7A58F3', '#1B1835'] },
];

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
  // Show the crit/fumble meme on nat 1 / nat 100 d100 rolls (default on)
  const [memeEnabled, setMemeEnabledState] = useState(
    () => localStorage.getItem('coc_meme_enabled') !== 'false'
  );
  // Decorative background behind the roll feed (default off)
  const [feedBackground, setFeedBackgroundState] = useState(
    () => localStorage.getItem('coc_feed_bg') === 'true'
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

  const setMemeEnabled = (v) => {
    setMemeEnabledState(v);
    localStorage.setItem('coc_meme_enabled', String(v));
  };

  const setFeedBackground = (v) => {
    setFeedBackgroundState(v);
    localStorage.setItem('coc_feed_bg', String(v));
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, setTheme,
      sheetFontScale, setSheetFontScale,
      roomFontScale,  setRoomFontScale,
      memeEnabled,    setMemeEnabled,
      feedBackground, setFeedBackground,
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
