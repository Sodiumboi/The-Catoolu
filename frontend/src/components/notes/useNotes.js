import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';

export function useNotes() {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotes = useCallback(async () => {
    try {
      const res = await apiClient.get('/notes');
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('Failed to fetch notes', err);
      toast.error("Couldn't load notes", 'Refresh to try again.', {
        details: { endpoint: 'GET /notes', status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async ({ tag_type, tag } = {}) => {
    try {
      const res  = await apiClient.post('/notes', { tag_type, tag });
      const note = res.data.note;
      setNotes(prev => [note, ...prev]);
      return note;
    } catch (err) {
      toast.error("Couldn't create note", 'Try again.', {
        details: { endpoint: 'POST /notes', status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
      throw err;
    }
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
      // 409 = edit conflict; the caller handles that UI, so don't toast over it.
      if (err.response?.status === 409) return { conflict: true };
      toast.error("Couldn't save note", "Your changes weren't saved. Try again.", {
        details: { endpoint: `PUT /notes/${uuid}`, status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
      throw err;
    }
  };

  const deleteNote = async (uuid) => {
    try {
      await apiClient.delete(`/notes/${uuid}`);
      setNotes(prev => prev.filter(n => n.uuid !== uuid));
    } catch (err) {
      toast.error("Couldn't delete note", 'The note was not deleted. Try again.', {
        details: { endpoint: `DELETE /notes/${uuid}`, status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
      throw err;
    }
  };

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchNotes };
}