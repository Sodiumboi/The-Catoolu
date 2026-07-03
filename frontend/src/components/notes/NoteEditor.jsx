import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import apiClient from '../../api/client';
import CustomDropdown from '../ui/CustomDropdown';
import Tooltip from '../ui/Tooltip';

const FONT_OPTIONS = [
  { label: 'Default',          value: '' },
  { label: 'DM Sans',          value: 'DM Sans, sans-serif' },
  { label: 'DM Serif',         value: 'DM Serif Display, serif' },
  { label: 'Georgia',          value: 'Georgia, serif' },
  { label: 'Arial',            value: 'Arial, sans-serif' },
  { label: 'Courier',          value: '"Courier New", monospace' },
];

const SIZE_OPTIONS = ['10','11','12','13','14','16','18','20','24'];
const SIZE_NUMS    = SIZE_OPTIONS.map(s => parseInt(s, 10));
const DEFAULT_SIZE = 13; // matches EditorContent's base font-size below

// Step to the next/previous preset size. If the current value isn't an exact
// preset (e.g. a custom size from elsewhere), snaps to the nearest neighbor
// in the requested direction instead of jumping to an arbitrary index.
function stepFontSize(current, dir) {
  const idx = SIZE_NUMS.indexOf(current);
  if (idx !== -1) {
    return SIZE_NUMS[Math.max(0, Math.min(SIZE_NUMS.length - 1, idx + dir))];
  }
  if (dir > 0) return SIZE_NUMS.find(n => n > current) ?? SIZE_NUMS[SIZE_NUMS.length - 1];
  return [...SIZE_NUMS].reverse().find(n => n < current) ?? SIZE_NUMS[0];
}

// Preset list popover for the size number — plain absolutely-positioned
// panel (not portaled), so it stays within the Notes window's own stacking
// context instead of needing a z-index war with sibling fixed elements.
function SizeMenu({ current, onSelect, onClose }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onMouseDown={e => e.preventDefault()} onClick={onClose} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-popup)', border: '1px solid var(--border-main)', borderRadius: '8px',
        boxShadow: 'var(--shadow-dropdown)', zIndex: 50, padding: '4px', minWidth: '52px',
        display: 'flex', flexDirection: 'column', gap: '1px', maxHeight: '220px', overflowY: 'auto',
      }}>
        {SIZE_OPTIONS.map(s => {
          const isActive = parseInt(s, 10) === current;
          return (
            <button
              key={s}
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(parseInt(s, 10))}
              style={{
                padding: '4px 8px', borderRadius: '5px', border: 'none',
                background:  isActive ? 'var(--accent-bg)' : 'transparent',
                color:       isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', textAlign: 'center',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--row-hover)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </>
  );
}

// Aa⁻ [size] Aa⁺ stepper — replaces a plain size <select> so the current
// value and quick increment/decrement are visible without opening anything.
function FontSizeControl({ editor }) {
  const [open, setOpen] = useState(false);
  const current = parseInt((editor.getAttributes('textStyle')?.fontSize || '').replace('px', ''), 10) || DEFAULT_SIZE;

  const applySize = (v) => {
    const pos = editor.isEmpty ? 'start' : undefined;
    // scrollIntoView:false — the editor is always on-screen when these toolbar
    // buttons are clickable, so no auto-scroll is ever wanted here. The wrapper
    // containers use overflow:clip (see below) so a stray focus/selection scroll
    // can't shift the toolbar under the title bar even if a browser ignores this.
    editor.chain().focus(pos, { scrollIntoView: false }).setFontSize(`${v}px`).run();
  };

  const stepBtnStyle = {
    padding: '3px 5px', borderRadius: '4px', border: 'none', background: 'transparent',
    color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', lineHeight: 1,
  };

  return (
    <div
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0, position: 'relative',
        border: '1px solid var(--notes-border)', borderRadius: '6px', padding: '2px',
      }}
    >
      <Tooltip content="Decrease text size">
        <button
          onClick={() => applySize(stepFontSize(current, -1))}
          style={stepBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '12px' }}>Aa</span><span style={{ fontSize: '9px', verticalAlign: 'super' }}>−</span>
        </button>
      </Tooltip>

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          minWidth: '22px', padding: '3px 4px', borderRadius: '4px', border: 'none',
          background: open ? 'var(--accent-bg)' : 'transparent',
          color:      open ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', textAlign: 'center',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--row-hover)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {current}
      </button>

      <Tooltip content="Increase text size">
        <button
          onClick={() => applySize(stepFontSize(current, 1))}
          style={stepBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '12px' }}>Aa</span><span style={{ fontSize: '9px', verticalAlign: 'super' }}>+</span>
        </button>
      </Tooltip>

      {open && (
        <SizeMenu
          current={current}
          onSelect={v => { applySize(v); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ToolbarBtn({ onClick, active, children, title }) {
  return (
    <Tooltip content={title}>
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      style={{
        padding:      '3px 7px',
        borderRadius: '4px',
        border:       'none',
        background:   active ? 'var(--accent-bg)' : 'transparent',
        color:        active ? 'var(--accent)' : 'var(--text-muted)',
        fontFamily:   'var(--font-sans)',
        fontSize:     '13px',
        fontWeight:   700,
        cursor:       'pointer',
        lineHeight:   1.4,
        transition:   'background 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--row-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
    </Tooltip>
  );
}

export default function NoteEditor({ noteUuid, onBack, onNoteUpdated, onNoteDeleted, updateNote, deleteNote }) {
  const [note,        setNote]       = useState(null);
  const [title,       setTitle]      = useState('');
  const [editTitle,   setEditTitle]  = useState(false);
  const [saveStatus,  setSaveStatus] = useState('');  // '' | 'saving' | 'saved' | 'conflict'
  const [confirmDel,  setConfirmDel] = useState(false);

  const clientUpdatedAtRef = useRef(null);
  const debounceRef        = useRef(null);
  const titleInputRef      = useRef(null);

  // Load note on mount / uuid change
  useEffect(() => {
    setNote(null);
    setSaveStatus('');
    if (!noteUuid) return;
    apiClient.get(`/notes/${noteUuid}`).then(res => {
      const n = res.data.note;
      setNote(n);
      setTitle(n.title);
      clientUpdatedAtRef.current = n.updated_at;
    }).catch(() => { onBack?.(); }); // note gone — return to collection
  }, [noteUuid]);

  const debouncedSave = useCallback((newBody) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await updateNote(noteUuid, {
        body:              newBody,
        title,
        client_updated_at: clientUpdatedAtRef.current,
      });
      if (result.conflict) {
        setSaveStatus('conflict');
      } else {
        clientUpdatedAtRef.current = result.note?.updated_at ?? clientUpdatedAtRef.current;
        setSaveStatus('saved');
        onNoteUpdated?.({ uuid: noteUuid, title, updated_at: result.note?.updated_at });
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }, 1500);
  }, [noteUuid, title, updateNote, onNoteUpdated]);

  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit],
    content: '',
    onUpdate: ({ editor: ed }) => {
      debouncedSave(ed.getHTML());
    },
  });

  // Force a re-render on every transaction (mark toggles, selection moves, etc).
  // Without this, values read directly off `editor` during render — Bold/Italic
  // active state, the font-family value, the size-stepper number — only refresh
  // whenever something ELSE happens to re-render this component. The only wired-up
  // trigger was onUpdate -> debouncedSave, which only calls setState 1500ms later,
  // so e.g. clicking Aa+ visually did nothing for up to 1.5s (looked "slow", but
  // was actually just waiting on the unrelated save-debounce timer).
  const [, forceRerender] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const onTransaction = () => forceRerender(n => n + 1);
    editor.on('transaction', onTransaction);
    return () => editor.off('transaction', onTransaction);
  }, [editor]);

  // Sync content once note loads
  useEffect(() => {
    if (editor && note) {
      editor.commands.setContent(note.body || '');
    }
  }, [editor, note]);

  // Save title on blur
  const handleTitleBlur = async () => {
    setEditTitle(false);
    if (!title.trim()) setTitle(note?.title || 'Untitled Note');
    const trimmed = title.trim() || 'Untitled Note';
    if (trimmed === note?.title) return;
    await updateNote(noteUuid, { title: trimmed, client_updated_at: clientUpdatedAtRef.current });
    onNoteUpdated?.({ uuid: noteUuid, title: trimmed });
  };

  const handleDelete = async () => {
    await deleteNote(noteUuid);
    onNoteDeleted?.(noteUuid);
  };

  if (!note) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
        Loading…
      </div>
    );
  }

  // Keep the editor selection alive while the font/size pickers are used:
  // preventDefault on mousedown stops the editor from blurring (same trick as
  // ToolbarBtn), and the .focus() in each chain restores the ProseMirror range.
  const keepSelection = e => { e.preventDefault(); e.stopPropagation(); };

  return (
    // overflow:clip (not hidden) — clips content identically but is NOT a scroll
    // container, so a stray focus/selection scrollIntoView can't shift the whole
    // editor (toolbar included) up under the title bar. Only the Body div below
    // is a real scroll container.
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'clip' }}>
      {/* Toolbar */}
      <div style={{ borderBottom: '1px solid var(--notes-border)', flexShrink: 0 }}>

        {/* Toolbar row: navigation + formatting + font/size + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 10px' }}>
          {/* Back */}
          <button
            onClick={onBack}
            style={{
              display:    'flex', alignItems: 'center', gap: '2px',
              padding:    '3px 8px', borderRadius: '5px',
              border:     'none', background: 'transparent',
              color:      'var(--text-muted)', fontFamily: 'var(--font-sans)',
              fontSize:   '12px', cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
            Back
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--notes-border)', margin: '0 2px', flexShrink: 0 }} />

          {/* Formatting */}
          {editor && (
            <>
              <ToolbarBtn title="Bold"          active={editor.isActive('bold')}        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBold().run()}>B</ToolbarBtn>
              <ToolbarBtn title="Italic"         active={editor.isActive('italic')}      onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleItalic().run()}><em>I</em></ToolbarBtn>
              <ToolbarBtn title="Strikethrough"  active={editor.isActive('strike')}      onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleStrike().run()}><s>S</s></ToolbarBtn>
              <ToolbarBtn title="Bullet list"    active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBulletList().run()}>•</ToolbarBtn>
              <ToolbarBtn title="Numbered list"  active={editor.isActive('orderedList')} onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleOrderedList().run()}>1.</ToolbarBtn>

              <div style={{ width: '1px', height: '16px', background: 'var(--notes-border)', margin: '0 2px', flexShrink: 0 }} />

              {/* Font family + font size */}
              <span onMouseDown={keepSelection} style={{ width: 110, flexShrink: 0 }}>
                <CustomDropdown
                  value={editor.getAttributes('textStyle')?.fontFamily || ''}
                  onChange={v => {
                    // On an empty, never-focused doc there's no prior selection to restore —
                    // focus() with no position can silently fail to show a caret. Force 'start'
                    // only in that case; a non-empty doc keeps its existing selection.
                    const pos = editor.isEmpty ? 'start' : undefined;
                    if (!v) editor.chain().focus(pos, { scrollIntoView: false }).unsetFontFamily().run();
                    else editor.chain().focus(pos, { scrollIntoView: false }).setFontFamily(v).run();
                  }}
                  options={FONT_OPTIONS}
                  searchable={false}
                  placeholder="Font"
                />
              </span>

              <FontSizeControl editor={editor} />
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* Save status */}
          {saveStatus === 'saving'   && <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Saving…</span>}
          {saveStatus === 'saved'    && <span style={{ fontSize: '11px', color: 'var(--success)',    fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Saved</span>}
          {saveStatus === 'conflict' && <span style={{ fontSize: '11px', color: 'var(--danger)',     fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Conflict — reload</span>}

          {/* Delete */}
          {confirmDel ? (
            <>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Delete?</span>
              <button onClick={handleDelete} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Yes</button>
              <button onClick={() => setConfirmDel(false)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>No</button>
            </>
          ) : (
            <Tooltip content="Delete note">
            <button
              onClick={() => setConfirmDel(true)}
              style={{ padding: '3px 6px', borderRadius: '5px', border: 'none', background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', display: 'block' }}>delete</span>
            </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '10px 12px 6px', flexShrink: 0 }}>
        {editTitle ? (
          <input
            ref={titleInputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') titleInputRef.current?.blur(); }}
            style={{
              width:       '100%',
              fontFamily:  'var(--font-serif)',
              fontSize:    '16px',
              color:       'var(--text-primary)',
              background:  'transparent',
              border:      'none',
              borderBottom:'1px solid var(--border-focus)',
              outline:     'none',
              padding:     '0 0 2px 0',
              boxSizing:   'border-box',
            }}
          />
        ) : (
          <button
            onClick={() => { setEditTitle(true); setTimeout(() => titleInputRef.current?.select(), 20); }}
            style={{
              background:  'transparent', border: 'none', padding: 0, cursor: 'text',
              fontFamily:  'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)',
              textAlign:   'left', width: '100%', lineHeight: 1.3, wordBreak: 'break-word',
            }}
          >
            {title || 'Untitled Note'}
          </button>
        )}
        {note.tag && (
          <span style={{
            display:      'inline-block', marginTop: '4px',
            fontSize:     '10px', padding: '2px 7px', borderRadius: '20px',
            fontFamily:   'var(--font-sans)', fontWeight: 600,
            background:   note.tag_type === 'character' ? 'var(--accent-bg)' : 'rgba(139,90,20,0.10)',
            color:        note.tag_type === 'character' ? 'var(--accent)' : 'var(--warning)',
          }}>
            {note.tag}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 12px 12px' }}
        onClick={() => editor?.commands.focus(editor.isEmpty ? 'start' : undefined, { scrollIntoView: false })}
      >
        <EditorContent
          editor={editor}
          style={{ minHeight: '100%', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  );
}
