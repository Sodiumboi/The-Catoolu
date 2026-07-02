import { useState } from 'react';
import apiClient from '../api/client';

export default function CreateCampaignModal({ onClose, onSuccess }) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/campaigns', {
        name:        name.trim(),
        description: description.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) p-7 w-full max-w-[440px]">
        <h2 className="font-serif text-[22px] text-(--text-primary) m-0 mb-1">
          Create Campaign
        </h2>
        <p className="text-[13px] text-(--text-muted) m-0 mb-6">
          You'll be the Keeper. Share the invite code with your players.
        </p>

        <Field label="Campaign Name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="The Masks of Nyarlathotep"
            maxLength={100}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full py-[9px] px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none! box-border [transition:border-color_0.15s_ease]"
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A globe-trotting horror campaign..."
            rows={3}
            className="w-full py-[9px] px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none! box-border [transition:border-color_0.15s_ease] resize-y"
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div className="flex gap-2.5 justify-end mt-2">
          <CancelBtn onClick={onClose} />
          <SubmitBtn onClick={handleCreate} loading={loading} label="Create Campaign" />
        </div>
      </div>
    </Backdrop>
  );
}

// ── Shared modal primitives ────────────────────────────────────
export function Backdrop({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[200] p-6 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-medium uppercase tracking-[0.07em] text-(--text-muted) mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ErrorMsg({ children }) {
  return (
    <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-2.5 px-3.5 mb-4 text-[13px] text-(--danger)">
      <span className="icon icon-sm">warning</span>{' '}{children}
    </div>
  );
}

export function CancelBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="py-[9px] px-5 rounded-lg border border-(--border-main) bg-transparent text-(--text-secondary) font-sans text-[13px] cursor-pointer"
    >
      Cancel
    </button>
  );
}

export function SubmitBtn({ onClick, loading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`py-[9px] px-5 rounded-lg border-none text-white font-sans text-[13px] font-medium [transition:background_0.15s_ease] ${loading ? 'bg-(--text-muted) cursor-not-allowed' : 'bg-(--color-primary) cursor-pointer'}`}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? 'var(--text-muted)' : 'var(--color-primary)'; }}
    >
      {loading ? 'Saving...' : label}
    </button>
  );
}