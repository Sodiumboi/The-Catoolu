import { useState } from 'react';
import apiClient from '../api/client';
import {
  Backdrop, Field, ErrorMsg,
  CancelBtn, SubmitBtn, inputStyle,
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
      <div style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '16px',
        boxShadow:    'var(--shadow-dropdown)',
        padding:      '28px',
        width:        '100%',
        maxWidth:     '380px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '22px',
          color:      'var(--text-primary)',
          margin:     '0 0 4px',
        }}>
          Join Campaign
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
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
            style={{
              ...inputStyle,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize:      '18px',
              fontWeight:    '600',
              textAlign:     'center',
              fontFamily:    'monospace',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <CancelBtn onClick={onClose} />
          <SubmitBtn onClick={handleJoin} loading={loading} label="Join Campaign" />
        </div>
      </div>
    </Backdrop>
  );
}