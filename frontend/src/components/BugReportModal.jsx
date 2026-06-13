import { useState, useRef } from 'react';
import apiClient from '../api/client';

export default function BugReportModal({ onClose }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [image,       setImage]       = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);
  const fileRef = useRef(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim())       { setError('Please add a title.'); return; }
    if (!description.trim()) { setError('Please describe the issue.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       title.trim());
      fd.append('description', description.trim());
      fd.append('page_url',    window.location.pathname);
      fd.append('user_agent',  navigator.userAgent);
      if (image) fd.append('image', image);

      await apiClient.post('/bugs', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex:     200,
        }}
      />

      {/* Modal */}
      <div style={{
        position:     'fixed',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%,-50%)',
        zIndex:       201,
        width:        '100%',
        maxWidth:     '480px',
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '16px',
        boxShadow:    'var(--shadow-dropdown)',
        padding:      '28px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span className="icon" style={{ color: 'var(--text-faint)', fontSize: '20px' }}>bug_report</span>
          <h2 style={{
            margin: 0, flex: 1,
            fontFamily: 'var(--font-serif)',
            fontSize:   '18px',
            color:      'var(--text-primary)',
          }}>Report a Bug</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', fontSize: '20px', lineHeight: 1, padding: '2px',
            }}
          >✕</button>
        </div>

        {done ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <span className="icon" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>check_circle</span>
            <p style={{
              margin:     '12px 0 4px',
              fontFamily: 'var(--font-serif)',
              fontSize:   '16px',
              color:      'var(--text-primary)',
            }}>Thanks for the report!</p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-faint)' }}>
              We'll look into it.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop:    '20px',
                padding:      '8px 28px',
                background:   'var(--color-primary)',
                color:        '#fff',
                border:       'none',
                borderRadius: '8px',
                cursor:       'pointer',
                fontFamily:   'var(--font-sans)',
                fontSize:     '13px',
                fontWeight:   500,
              }}
            >Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Title */}
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short summary of the issue"
              maxLength={200}
              style={inputStyle}
            />

            {/* Description */}
            <label style={{ ...labelStyle, marginTop: '14px' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened? What did you expect to happen?"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
            />

            {/* Screenshot */}
            <label style={{ ...labelStyle, marginTop: '14px' }}>
              Screenshot <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional, max 2 MB)</span>
            </label>

            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    maxWidth:     '100%',
                    maxHeight:    '160px',
                    borderRadius: '8px',
                    border:       '1px solid var(--border-main)',
                    display:      'block',
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position:     'absolute',
                    top:          '6px',
                    right:        '6px',
                    background:   'rgba(0,0,0,0.55)',
                    color:        '#fff',
                    border:       'none',
                    borderRadius: '50%',
                    width:        '22px',
                    height:       '22px',
                    cursor:       'pointer',
                    fontSize:     '12px',
                    lineHeight:   '22px',
                    textAlign:    'center',
                    padding:      0,
                  }}
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '8px 14px',
                  background:   'var(--bg-input)',
                  border:       '1.5px dashed var(--border-input)',
                  borderRadius: '8px',
                  cursor:       'pointer',
                  color:        'var(--text-faint)',
                  fontSize:     '13px',
                  fontFamily:   'var(--font-sans)',
                  marginBottom: '4px',
                }}
              >
                <span className="icon icon-sm">attach_file</span>
                Attach screenshot
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: 'none' }}
            />

            {/* Auto-filled info note */}
            <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
              Current page and browser info will be sent automatically.
            </p>

            {error && (
              <p style={{
                margin:     '10px 0 0',
                fontSize:   '13px',
                color:      'var(--danger)',
                fontFamily: 'var(--font-sans)',
              }}>{error}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding:      '8px 20px',
                  background:   'transparent',
                  border:       '1px solid var(--border-main)',
                  borderRadius: '8px',
                  cursor:       'pointer',
                  color:        'var(--text-secondary)',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                }}
              >Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding:      '8px 24px',
                  background:   submitting ? 'var(--text-faint)' : 'var(--color-primary)',
                  color:        '#fff',
                  border:       'none',
                  borderRadius: '8px',
                  cursor:       submitting ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                  fontWeight:   500,
                }}
              >{submitting ? 'Sending…' : 'Submit Report'}</button>
            </div>

          </form>
        )}
      </div>
    </>
  );
}

const labelStyle = {
  display:    'block',
  fontSize:   '12px',
  fontWeight: 500,
  color:      'var(--text-secondary)',
  marginBottom: '6px',
  fontFamily: 'var(--font-sans)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle = {
  width:        '100%',
  padding:      '9px 12px',
  background:   'var(--bg-input)',
  border:       '1.5px solid var(--border-input)',
  borderRadius: '8px',
  color:        'var(--text-primary)',
  fontFamily:   'var(--font-sans)',
  fontSize:     '14px',
  outline:      'none',
  boxSizing:    'border-box',
};
