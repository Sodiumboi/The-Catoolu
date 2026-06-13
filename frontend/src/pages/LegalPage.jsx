import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { content } from './legalContent';

// ── Block renderers ───────────────────────────────────────────────────

const pStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize:   '0.95rem',
  color:      'var(--text-secondary)',
  lineHeight: 1.75,
  margin:     '0 0 0.75rem',
};

const EmailLink = ({ address }) => (
  <a
    href={`mailto:${address}`}
    style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
  >
    {address}
  </a>
);

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
      return (
        <p style={{ ...pStyle, fontWeight: 600, color: 'var(--text-primary)' }}>
          {block.text}
        </p>
      );

    case 'disclaimer':
      return (
        <p style={{
          ...pStyle,
          color:        'var(--text-faint)',
          fontStyle:    'italic',
          fontSize:     '0.875rem',
          padding:      '0.65rem 1rem',
          background:   'var(--bg-section-hd)',
          borderRadius: '6px',
          border:       '1px solid var(--border-input)',
          margin:       '0 0 0.75rem',
        }}>
          {block.text}
        </p>
      );

    case 'ul':
      return (
        <ul style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    '0.95rem',
          color:       'var(--text-secondary)',
          lineHeight:  1.75,
          margin:      '0 0 0.75rem',
          paddingLeft: '1.4rem',
        }}>
          {block.items.map((item, i) =>
            typeof item === 'string'
              ? <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>
              : (
                <li key={i} style={{ marginBottom: '0.3rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.label}</strong>
                  {' — '}{item.text}
                </li>
              )
          )}
        </ul>
      );

    case 'subgroup':
      return (
        <div style={{ marginBottom: '0.85rem' }}>
          <p style={{ ...pStyle, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {block.heading}
          </p>
          <ul style={{
            fontFamily:  'var(--font-sans)',
            fontSize:    '0.95rem',
            color:       'var(--text-secondary)',
            lineHeight:  1.75,
            margin:      '0',
            paddingLeft: '1.4rem',
          }}>
            {block.items.map((item, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case 'table':
      return (
        <div style={{ overflowX: 'auto', margin: '0 0 0.75rem' }}>
          <table style={{
            width:           '100%',
            borderCollapse:  'collapse',
            fontFamily:      'var(--font-sans)',
            fontSize:        '0.9rem',
            color:           'var(--text-secondary)',
          }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{
                    textAlign:   'left',
                    padding:     '0.5rem 0.75rem',
                    background:  'var(--bg-section-hd)',
                    border:      '1px solid var(--border-input)',
                    fontWeight:  600,
                    color:       'var(--text-primary)',
                    whiteSpace:  'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding:       '0.45rem 0.75rem',
                      border:        '1px solid var(--border-input)',
                      verticalAlign: 'top',
                      background:    i % 2 === 1 ? 'var(--row-hover)' : 'transparent',
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'email':
      return (
        <p style={{ ...pStyle, fontWeight: 500 }}>
          <EmailLink address={block.address} />
        </p>
      );

    default:
      return null;
  }
}

// ── Controls bar ──────────────────────────────────────────────────────

function DocTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:       '6px 16px',
        borderRadius:  '20px',
        border:        active ? 'none' : '1px solid var(--border-input)',
        background:    active ? 'var(--color-primary)' : 'transparent',
        color:         active ? '#fff' : 'var(--text-muted)',
        fontFamily:    'var(--font-sans)',
        fontSize:      '0.85rem',
        fontWeight:    600,
        cursor:        active ? 'default' : 'pointer',
        transition:    'background 0.15s, color 0.15s',
        whiteSpace:    'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function LangPill({ lang, setLang }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '2px',
      background:   'var(--bg-section-hd)',
      border:       '1px solid var(--border-input)',
      borderRadius: '20px',
      padding:      '2px',
      flexShrink:   0,
    }}>
      {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'ภาษาไทย' }].map(l => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          style={{
            padding:      '3px 12px',
            borderRadius: '20px',
            border:       'none',
            background:   lang === l.id ? 'var(--color-primary)' : 'transparent',
            color:        lang === l.id ? '#fff' : 'var(--text-muted)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '0.75rem',
            fontWeight:   600,
            cursor:       lang === l.id ? 'default' : 'pointer',
            transition:   'background 0.15s, color 0.15s',
            whiteSpace:   'nowrap',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function LegalPage() {
  const [searchParams] = useSearchParams();
  const [doc,  setDoc]  = useState(searchParams.get('doc') === 'privacy' ? 'privacy' : 'tos');
  const [lang, setLang] = useState('en');

  const data = content[doc][lang];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      <NavBar />

      {/* ── Sticky controls bar ── */}
      <div style={{
        position:     'sticky',
        top:          '56px',
        zIndex:       40,
        background:   'var(--bg-page)',
        borderBottom: '1px solid var(--border-main)',
        padding:      '10px 24px',
      }}>
        <div style={{
          maxWidth:       '760px',
          margin:         '0 auto',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '12px',
          flexWrap:       'wrap',
        }}>
          {/* Document tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <DocTab
              label="Terms of Service"
              active={doc === 'tos'}
              onClick={() => setDoc('tos')}
            />
            <DocTab
              label="Privacy Policy"
              active={doc === 'privacy'}
              onClick={() => setDoc('privacy')}
            />
          </div>

          {/* Language switcher */}
          <LangPill lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* ── Document content ── */}
      <main style={{
        flex:       1,
        maxWidth:   '760px',
        width:      '100%',
        margin:     '0 auto',
        padding:    '2.5rem 1.5rem 4rem',
        boxSizing:  'border-box',
      }}>

        {/* Document header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize:   '2rem',
            color:      'var(--color-primary-dark)',
            margin:     '0 0 0.4rem',
          }}>
            {data.title}
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   '0.85rem',
            color:      'var(--text-faint)',
            margin:     0,
          }}>
            {lang === 'en' ? 'Last updated:' : 'อัปเดตล่าสุด:'} {data.updated}
          </p>
        </div>

        {/* Sections */}
        {data.sections.map(section => (
          <section key={section.num} style={{ marginBottom: '2.25rem' }}>
            <h2 style={{
              fontFamily:    'var(--font-serif)',
              fontSize:      '1.2rem',
              color:         'var(--color-primary-dark)',
              margin:        '0 0 0.65rem',
              paddingBottom: '0.45rem',
              borderBottom:  '1px solid var(--border-main)',
            }}>
              {section.num}. {section.heading}
            </h2>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}

      </main>

      <Footer />
    </div>
  );
}
