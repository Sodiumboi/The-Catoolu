import { useState, useEffect } from 'react';
import { content } from '../pages/legalContent';

// ── Block renderer (same logic as LegalPage) ──────────────

const pStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize:   '0.9rem',
  color:      'var(--text-secondary)',
  lineHeight: 1.75,
  margin:     '0 0 0.7rem',
};

function EmailLink({ address }) {
  return (
    <a
      href={`mailto:${address}`}
      style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
    >
      {address}
    </a>
  );
}

function Block({ block }) {
  switch (block.type) {
    case 'p':
      return (
        <p style={pStyle}>
          {block.text}
          {block.email && <EmailLink address={block.email} />}
        </p>
      );
    case 'emphasis':
      return <p style={{ ...pStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{block.text}</p>;
    case 'disclaimer':
      return (
        <p style={{
          ...pStyle,
          color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '0.85rem',
          padding: '0.6rem 0.85rem', background: 'var(--bg-section-hd)',
          borderRadius: '6px', border: '1px solid var(--border-input)', margin: '0 0 0.7rem',
        }}>
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul style={{ ...pStyle, paddingLeft: '1.35rem', margin: '0 0 0.7rem' }}>
          {block.items.map((item, i) =>
            typeof item === 'string'
              ? <li key={i} style={{ marginBottom: '0.28rem' }}>{item}</li>
              : <li key={i} style={{ marginBottom: '0.28rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.label}</strong>{' — '}{item.text}
                </li>
          )}
        </ul>
      );
    case 'subgroup':
      return (
        <div style={{ marginBottom: '0.8rem' }}>
          <p style={{ ...pStyle, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{block.heading}</p>
          <ul style={{ ...pStyle, paddingLeft: '1.35rem', margin: 0 }}>
            {block.items.map((item, i) => <li key={i} style={{ marginBottom: '0.22rem' }}>{item}</li>)}
          </ul>
        </div>
      );
    case 'table':
      return (
        <div style={{ overflowX: 'auto', margin: '0 0 0.7rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '0.4rem 0.65rem', background: 'var(--bg-section-hd)', border: '1px solid var(--border-input)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '0.4rem 0.65rem', border: '1px solid var(--border-input)', verticalAlign: 'top', background: i % 2 === 1 ? 'var(--row-hover)' : 'transparent' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'email':
      return <p style={{ ...pStyle, fontWeight: 500 }}><EmailLink address={block.address} /></p>;
    default:
      return null;
  }
}

// ── Modal ─────────────────────────────────────────────────

export default function LegalModal({ initialDoc = 'tos', onClose }) {
  const [doc,  setDoc]  = useState(initialDoc);
  const [lang, setLang] = useState('en');

  const data = content[doc][lang];

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          200,
        background:      'rgba(0,0,0,0.45)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '20px 16px',
        backdropFilter:  'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-main)',
          borderRadius: '16px',
          boxShadow:    'var(--shadow-dropdown)',
          width:        '100%',
          maxWidth:     '620px',
          maxHeight:    '82vh',
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
        }}
      >
        {/* ── Sticky header ── */}
        <div style={{
          padding:      '14px 18px 12px',
          borderBottom: '1px solid var(--border-main)',
          background:   'var(--bg-card)',
          flexShrink:   0,
        }}>
          {/* Top row: tabs + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
              {[
                { id: 'tos',     label: 'Terms of Service' },
                { id: 'privacy', label: 'Privacy Policy'   },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDoc(tab.id)}
                  style={{
                    padding:      '5px 13px',
                    borderRadius: '20px',
                    border:       doc === tab.id ? 'none' : '1px solid var(--border-input)',
                    background:   doc === tab.id ? 'var(--color-primary)' : 'transparent',
                    color:        doc === tab.id ? '#fff' : 'var(--text-muted)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '0.8rem',
                    fontWeight:   600,
                    cursor:       doc === tab.id ? 'default' : 'pointer',
                    transition:   'background 0.15s, color 0.15s',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width:        '28px',
                height:       '28px',
                borderRadius: '50%',
                border:       '1px solid var(--border-input)',
                background:   'transparent',
                color:        'var(--text-muted)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '16px',
                lineHeight:   1,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                flexShrink:   0,
                transition:   'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-section-hd)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ✕
            </button>
          </div>

          {/* Language switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              background: 'var(--bg-section-hd)', border: '1px solid var(--border-input)',
              borderRadius: '20px', padding: '2px',
            }}>
              {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'ภาษาไทย' }].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  style={{
                    padding: '2px 11px', borderRadius: '20px', border: 'none',
                    background: lang === l.id ? 'var(--color-primary)' : 'transparent',
                    color:      lang === l.id ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600,
                    cursor:     lang === l.id ? 'default' : 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {lang === 'en' ? 'Last updated:' : 'อัปเดตล่าสุด:'} {data.updated}
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ overflowY: 'auto', padding: '20px 22px 28px', flex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize:   '1.4rem',
            color:      'var(--color-primary-dark)',
            margin:     '0 0 1.5rem',
          }}>
            {data.title}
          </h2>

          {data.sections.map(section => (
            <section key={section.num} style={{ marginBottom: '1.75rem' }}>
              <h3 style={{
                fontFamily:    'var(--font-serif)',
                fontSize:      '1rem',
                color:         'var(--color-primary-dark)',
                margin:        '0 0 0.55rem',
                paddingBottom: '0.35rem',
                borderBottom:  '1px solid var(--border-main)',
              }}>
                {section.num}. {section.heading}
              </h3>
              {section.blocks.map((block, i) => <Block key={i} block={block} />)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
