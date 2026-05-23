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
      <div style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '16px',
        boxShadow:    'var(--shadow-dropdown)',
        padding:      '28px',
        width:        '100%',
        maxWidth:     '440px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '22px',
          color:      'var(--text-primary)',
          margin:     '0 0 4px',
        }}>
          Create Campaign
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
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
            style={inputStyle}
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
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.5)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         200,
        padding:        '24px',
        backdropFilter: 'blur(4px)',
      }}
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
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display:       'block',
        fontSize:      '11px',
        fontWeight:    '500',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color:         'var(--text-muted)',
        marginBottom:  '6px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width:        '100%',
  padding:      '9px 12px',
  borderRadius: '8px',
  border:       '1px solid var(--border-input)',
  background:   'var(--bg-input)',
  color:        'var(--text-primary)',
  fontFamily:   'var(--font-sans)',
  fontSize:     '14px',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s ease',
};

export function ErrorMsg({ children }) {
  return (
    <div style={{
      background:   'var(--danger-bg)',
      border:       '1px solid var(--danger)',
      borderRadius: '8px',
      padding:      '10px 14px',
      marginBottom: '16px',
      fontSize:     '13px',
      color:        'var(--danger)',
    }}>
      <span className="icon icon-sm">warning</span>{' '}{children}
    </div>
  );
}

export function CancelBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '9px 20px',
        borderRadius: '8px',
        border:       '1px solid var(--border-main)',
        background:   'transparent',
        color:        'var(--text-secondary)',
        fontFamily:   'var(--font-sans)',
        fontSize:     '13px',
        cursor:       'pointer',
      }}
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
      style={{
        padding:      '9px 20px',
        borderRadius: '8px',
        border:       'none',
        background:   loading ? 'var(--text-muted)' : 'var(--color-primary)',
        color:        '#ffffff',
        fontFamily:   'var(--font-sans)',
        fontSize:     '13px',
        fontWeight:   '500',
        cursor:       loading ? 'not-allowed' : 'pointer',
        transition:   'background 0.15s ease',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? 'var(--text-muted)' : 'var(--color-primary)'; }}
    >
      {loading ? 'Saving...' : label}
    </button>
  );
}