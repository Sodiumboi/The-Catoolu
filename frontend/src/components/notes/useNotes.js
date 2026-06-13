import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';

export function useNotes() {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await apiClient.get('/notes');
      setNotes(res.data.notes || []);
    } catch (e) {
      console.error('Failed to fetch notes', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async ({ tag_type, tag } = {}) => {
    const res  = await apiClient.post('/notes', { tag_type, tag });
    const note = res.data.note;
    setNotes(prev => [note, ...prev]);
    return note;
  };

  const updateNote = async (uuid, payload) => {
    try {
      const res = await apiClient.put(`/notes/${uuid}`, payload);
      const updated = res.data.note;
      setNotes(prev => prev.map(n => n.uuid === uuid
        ? { ...n, title: updated.title, updated_at: updated.updated_at }
        : n
      ));
      return { conflict: false, note: updated };
    } catch (err) {
      if (err.response?.status === 409) return { conflict: true };
      throw err;
    }
  };

  const deleteNote = async (uuid) => {
    await apiClient.delete(`/notes/${uuid}`);
    setNotes(prev => prev.filter(n => n.uuid !== uuid));
  };

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchNotes };
}
