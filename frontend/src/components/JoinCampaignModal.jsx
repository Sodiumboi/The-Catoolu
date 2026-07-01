import { useState } from 'react';
import apiClient from '../api/client';
import {
  Backdrop, Field, ErrorMsg,
  CancelBtn, SubmitBtn,
} from './CreateCampaignModal';

export default function JoinCampaignModal({ onClose, onSuccess }) {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/campaigns/join', {
        invite_code: code.trim().toUpperCase(),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) p-7 w-full max-w-[380px]">
        <h2 className="font-serif text-[22px] text-(--text-primary) m-0 mb-1">
          Join Campaign
        </h2>
        <p className="text-[13px] text-(--text-muted) m-0 mb-6">
          Enter the invite code your Keeper shared with you.
        </p>

        <Field label="Invite Code">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ARKHAM42"
            maxLength={10}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full py-[9px] px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) outline-none box-border [transition:border-color_0.15s_ease] uppercase tracking-[0.15em] text-[18px] font-semibold text-center font-mono"
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div className="flex gap-2.5 justify-end">
          <CancelBtn onClick={onClose} />
          <SubmitBtn onClick={handleJoin} loading={loading} label="Join Campaign" />
        </div>
      </div>
    </Backdrop>
  );
}