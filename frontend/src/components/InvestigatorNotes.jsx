import { useState, useRef, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const MAX_SAVED_COLORS = 8;
const STORAGE_KEY      = 'coc_note_colors';

// ── Load / save swatches from localStorage ─────────────────
function loadSavedColors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : ['var(--danger)', '#1a6b20', '#1a3a8b', 'var(--accent)'];
  } catch { return ['var(--danger)', '#1a6b20', '#1a3a8b', 'var(--accent)']; }
}
function persistColors(colors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

// ── Toolbar button ─────────────────────────────────────────
function ToolBtn({ title, onClick, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="px-2 py-1 rounded text-xs font-bold transition-all duration-150"
      style={{
        background: active ? 'var(--accent)' : 'var(--accent-bg)',
        color:      active ? 'var(--bg-page)' : 'var(--accent)',
        border:     '1px solid var(--border-main)',
        minWidth:   '28px',
        cursor:     'pointer',
        boxShadow:  active ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--accent-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'var(--accent-bg)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────
export default function InvestigatorNotes({ characterId, initialNotes, onSave }) {
  const editorRef       = useRef(null);
  const colorInputRef   = useRef(null);
  const savedRangeRef   = useRef(null); // ← stores selection before picker opens

  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');
  const [savedColors,  setSavedColors]  = useState(loadSavedColors);
  const [pickerColor,  setPickerColor]  = useState('var(--danger)');
  const [showSwatches, setShowSwatches] = useState(false);

  // Populate editor on load
  useEffect(() => {
    if (editorRef.current && initialNotes) {
      editorRef.current.innerHTML = initialNotes;
    }
  }, [initialNotes]);

  // ── Save the current text selection ───────────────────────
  // Called just before any action that might steal focus
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // ── Restore the saved selection ───────────────────────────
  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // ── Apply a colour to the current / restored selection ────
  const applyColor = useCallback((color) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('foreColor', false, color);
  }, [restoreSelection]);

  // ── execCommand wrapper for other formatting ───────────────
  const exec = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // ── Open color picker ──────────────────────────────────────
  // Save selection first, THEN open the native picker
  const openColorPicker = () => {
    saveSelection();                   // capture selection NOW
    colorInputRef.current?.click();    // open OS picker
  };

  // ── Color picker confirmed ─────────────────────────────────
  const handleColorChange = (e) => {
    const color = e.target.value;
    setPickerColor(color);
    applyColor(color);                 // restores selection, then colours it
  };

  // ── Save a swatch ──────────────────────────────────────────
  const saveColorSwatch = () => {
    if (savedColors.includes(pickerColor)) return;
    const updated = [pickerColor, ...savedColors].slice(0, MAX_SAVED_COLORS);
    setSavedColors(updated);
    persistColors(updated);
  };

  // ── Remove a swatch ───────────────────────────────────────
  const removeSwatch = (color) => {
    const updated = savedColors.filter(c => c !== color);
    setSavedColors(updated);
    persistColors(updated);
  };

  // ── Save notes to backend ──────────────────────────────────
  const handleSave = async () => {
    const html = editorRef.current?.innerHTML || '';
    setSaving(true);
    setError('');
    try {
      onSave(html);
      await apiClient.put(`/characters/${characterId}/notes`, { notes: html });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}>
          Session Notes
        </span>
        <span className="text-xs italic" style={{ color: 'var(--text-faint)' }}>
          Not exported to JSON
        </span>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex gap-1 flex-wrap p-1.5 rounded"
           style={{ background: 'var(--bg-section-hd)', border: '1px solid var(--border-main)' }}>

        {/* Text formatting */}
        <ToolBtn title="Bold"          onClick={() => exec('bold')}          active={isActive('bold')}>          <b>B</b>   </ToolBtn>
        <ToolBtn title="Italic"        onClick={() => exec('italic')}        active={isActive('italic')}>        <i>I</i>   </ToolBtn>
        <ToolBtn title="Underline"     onClick={() => exec('underline')}     active={isActive('underline')}>     <u>U</u>   </ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => exec('strikeThrough')} active={isActive('strikeThrough')}> <s>S</s>   </ToolBtn>

        <div className="w-px mx-0.5 self-stretch" style={{ background: 'var(--border-main)' }} />

        {/* Lists */}
        <ToolBtn title="Bullet list"   onClick={() => exec('insertUnorderedList')}>≡</ToolBtn>
        <ToolBtn title="Numbered list" onClick={() => exec('insertOrderedList')}>1.</ToolBtn>

        <div className="w-px mx-0.5 self-stretch" style={{ background: 'var(--border-main)' }} />

        {/* ── Colour section ── */}
        {/* Saved swatches — click to apply */}
        {savedColors.map(color => (
          <button
            key={color}
            type="button"
            title={`Apply ${color} — right-click to remove`}
            onMouseDown={e => {
              e.preventDefault();
              saveSelection();
              // Apply immediately on mousedown (selection still active)
              editorRef.current?.focus();
              // tiny delay to let focus settle
              setTimeout(() => {
                restoreSelection();
                document.execCommand('foreColor', false, color);
              }, 10);
            }}
            onContextMenu={e => {
              e.preventDefault();
              removeSwatch(color);
            }}
            className="rounded transition-all duration-150"
            style={{
              width: '22px', height: '22px',
              background: color,
              border: '2px solid var(--border-main)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform  = 'translateY(-1px) scale(1.15)';
              e.currentTarget.style.boxShadow  = '0 2px 6px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ))}

        {/* ── Color picker button ── */}
        <div className="relative flex items-center">
          <button
            type="button"
            title="Choose custom colour"
            onMouseDown={e => {
              e.preventDefault();
              saveSelection();        // save BEFORE picker steals focus
              setTimeout(() => colorInputRef.current?.click(), 10);
            }}
            className="px-1.5 py-1 rounded text-xs font-bold transition-all duration-150
                       flex items-center gap-1"
            style={{
              background: 'var(--accent-bg)',
              border:     '1px solid var(--border-main)',
              cursor:     'pointer',
              color:      'var(--accent)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.transform  = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent-bg)';
              e.currentTarget.style.transform  = 'translateY(0)';
            }}
          >
            {/* Show currently selected colour */}
            <span style={{
              display: 'inline-block', width: '12px', height: '12px',
              background: pickerColor, borderRadius: '2px',
              border: '1px solid var(--border-main)',
            }} />
            <span>A</span>
          </button>

          {/* Hidden native color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={pickerColor}
            onChange={handleColorChange}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          />
        </div>

        {/* Save swatch button */}
        <button
          type="button"
          title={`Save ${pickerColor} as a swatch`}
          onMouseDown={e => { e.preventDefault(); saveColorSwatch(); }}
          className="px-1.5 py-1 rounded text-xs transition-all duration-150"
          style={{
            background: 'var(--accent-bg)',
            border:     '1px solid var(--border-main)',
            color:      'var(--accent)',
            cursor:     'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--accent-hover)';
            e.currentTarget.style.transform  = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-bg)';
            e.currentTarget.style.transform  = 'translateY(0)';
          }}
        >
          +🎨
        </button>

        <div className="w-px mx-0.5 self-stretch" style={{ background: 'var(--border-main)' }} />

        {/* Clear formatting */}
        <ToolBtn title="Clear formatting" onClick={() => exec('removeFormat')}><span className="icon icon-sm">close</span></ToolBtn>
      </div>

      {/* Swatch tip */}
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        Click swatch to apply · Right-click swatch to remove · +🎨 saves current colour
      </p>

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="flex-1 rounded p-3 outline-none overflow-y-auto"
        style={{
          background: 'var(--bg-input)',
          border:     '1px solid var(--border-input)',
          color:      'var(--text-primary)',
          minHeight:  '180px',
          maxHeight:  '280px',
          fontSize:   '0.8rem',
          lineHeight: '1.6',
          fontFamily: 'Georgia, serif',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
        onBlur={e  => e.currentTarget.style.borderColor = 'var(--border-input)'}
        onMouseUp={saveSelection}    /* save selection on mouse release */
        onKeyUp={saveSelection}      /* save selection on keyboard navigation */
      />

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded text-xs font-bold transition-all"
          style={{
            background: saving ? 'var(--text-muted)' : 'var(--accent)',
            color:      'var(--bg-page)',
            cursor:     saving ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Saving...' : <><span className="icon icon-sm">save</span>{' '}Save Notes</>}
        </button>
        {saved && <span className="text-xs" style={{ color: 'var(--success)', display:'inline-flex', alignItems:'center', gap:'3px' }}><span className="icon icon-sm">check</span>Notes saved!</span>}
        {error && <span className="text-xs" style={{ color: 'var(--danger)', display:'inline-flex', alignItems:'center', gap:'3px' }}><span className="icon icon-sm">warning</span>{error}</span>}
      </div>

      <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>
        <span className="icon icon-sm">warning</span>{' '}Notes are saved to the database only — not in exported JSON files.
      </p>
    </div>
  );
}