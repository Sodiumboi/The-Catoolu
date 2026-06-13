import { useState } from 'react';
import { useNotes } from './useNotes';
import { loadWindowState, saveWindowState } from './notesWindowState';
import NoteCollection from './NoteCollection';
import NoteEditor from './NoteEditor';

// NotesPane — shared view-router used by both NotesWindow (floating) and Keeper panel (embedded)
export default function NotesPane({ contextTagType, contextTag, initialNoteUuid }) {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const [activeNoteUuid, setActiveNoteUuid] = useState(
    initialNoteUuid ?? loadWindowState().activeNoteUuid ?? null
  );

  const handleSelectNote = (uuid) => {
    setActiveNoteUuid(uuid);
    saveWindowState({ activeNoteUuid: uuid });
  };

  const handleBack = () => {
    setActiveNoteUuid(null);
    saveWindowState({ activeNoteUuid: null });
  };

  const handleNewNote = async () => {
    const note = await createNote({ tag_type: contextTagType, tag: contextTag });
    handleSelectNote(note.uuid);
  };

  const handleNoteUpdated = ({ uuid, title, updated_at }) => {
    // useNotes already updates the list — nothing extra needed
  };

  const handleNoteDeleted = (uuid) => {
    handleBack();
  };

  return (
    <div className="notes-window" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {activeNoteUuid ? (
        <NoteEditor
          noteUuid={activeNoteUuid}
          onBack={handleBack}
          onNoteUpdated={handleNoteUpdated}
          onNoteDeleted={handleNoteDeleted}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      ) : (
        <NoteCollection
          notes={notes}
          loading={loading}
          contextTagType={contextTagType}
          contextTag={contextTag}
          onSelectNote={handleSelectNote}
          onNewNote={handleNewNote}
        />
      )}
    </div>
  );
}
