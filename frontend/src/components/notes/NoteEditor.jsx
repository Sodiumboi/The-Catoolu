import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import apiClient from '../../api/client';
import CustomDropdown from '../ui/CustomDropdown';

const FONT_OPTIONS = [
  { label: 'Default',          value: '' },
  { label: 'DM Sans',          value: 'DM Sans, sans-serif' },
  { label: 'DM Serif',         value: 'DM Serif Display, serif' },
  { label: 'Georgia',          value: 'Georgia, serif' },
  { label: 'Arial',            value: 'Arial, sans-serif' },
  { label: 'Courier',          value: '"Courier New", monospace' },
];

const SIZE_OPTIONS = ['10','11','12','13','14','16','18','20','24'];

function ToolbarBtn({ onClick, active, children, title }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ borderBottom: '1px solid var(--notes-border)', flexShrink: 0 }}>

        {/* Row 1: navigation + formatting + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}>
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
              <ToolbarBtn title="Bold"          active={editor.isActive('bold')}        onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarBtn>
              <ToolbarBtn title="Italic"         active={editor.isActive('italic')}      onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarBtn>
              <ToolbarBtn title="Strikethrough"  active={editor.isActive('strike')}      onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolbarBtn>
              <ToolbarBtn title="Bullet list"    active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarBtn>
              <ToolbarBtn title="Numbered list"  active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarBtn>
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
            <button
              onClick={() => setConfirmDel(true)}
              title="Delete note"
              style={{ padding: '3px 6px', borderRadius: '5px', border: 'none', background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', display: 'block' }}>delete</span>
            </button>
          )}
        </div>

        {/* Row 2: font family + font size */}
        {editor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px 5px', borderTop: '1px solid var(--notes-border)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Font</span>
            <span onMouseDown={keepSelection} style={{ width: 140, flexShrink: 0 }}>
              <CustomDropdown
                value={editor.getAttributes('textStyle')?.fontFamily || ''}
                onChange={v => {
                  if (!v) editor.chain().focus().unsetFontFamily().run();
                  else editor.chain().focus().setFontFamily(v).run();
                }}
                options={FONT_OPTIONS}
                searchable={false}
                placeholder="Font"
              />
            </span>

            <span onMouseDown={keepSelection} style={{ width: 84, flexShrink: 0 }}>
              <CustomDropdown
                value={(editor.getAttributes('textStyle')?.fontSize || '').replace('px', '')}
                onChange={v => {
                  if (!v) editor.chain().focus().unsetFontSize().run();
                  else editor.chain().focus().setFontSize(`${v}px`).run();
                }}
                options={[{ value: '', label: 'Size' }, ...SIZE_OPTIONS.map(s => ({ value: s, label: s }))]}
                searchable={false}
                placeholder="Size"
              />
            </span>
          </div>
        )}
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
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent
          editor={editor}
          style={{ minHeight: '100%', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  );
}
