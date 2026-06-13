const KEY = 'notes-window-state';

const DEFAULTS = {
  x:               120,
  y:               80,
  width:           480,
  height:          560,
  windowState:     'closed',  // 'closed' | 'bubble' | 'full'
  bubbleX:         null,
  bubbleY:         null,
  activeNoteUuid:  null,
  viewMode:        'grid',
};

export function loadWindowState() {
  try {
    const saved  = JSON.parse(localStorage.getItem(KEY) || '{}');
    const merged = { ...DEFAULTS, ...saved };
    // Migration from old boolean isOpen field
    if (merged.windowState === 'closed' && saved.isOpen === true) {
      merged.windowState = 'full';
    }
    return merged;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveWindowState(patch) {
  const current = loadWindowState();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}
