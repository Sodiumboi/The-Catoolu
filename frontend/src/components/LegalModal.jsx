import { useState, useEffect } from 'react';
import { content } from '../pages/legalContent';

// ── Block renderer (same logic as LegalPage) ──────────────

const pClass = "font-sans text-[0.9rem] text-(--text-secondary) leading-[1.75] mt-0 mb-[0.7rem]";

function EmailLink({ address }) {
  return (
    <a
      href={`mailto:${address}`}
      className="text-(--accent) no-underline font-medium"
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
        <p className={pClass}>
          {block.text}
          {block.email && <EmailLink address={block.email} />}
        </p>
      );
    case 'emphasis':
      return <p className={`${pClass} font-semibold text-(--text-primary)`}>{block.text}</p>;
    case 'disclaimer':
      return (
        <p className={`${pClass} text-(--text-faint) italic text-[0.85rem] py-[0.6rem] px-[0.85rem] bg-(--bg-section-hd) rounded-md border border-(--border-input)`}>
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul className={`${pClass} pl-[1.35rem]`}>
          {block.items.map((item, i) =>
            typeof item === 'string'
              ? <li key={i} className="mb-[0.28rem]">{item}</li>
              : <li key={i} className="mb-[0.28rem]">
                  <strong className="text-(--text-primary)">{item.label}</strong>{' — '}{item.text}
                </li>
          )}
        </ul>
      );
    case 'subgroup':
      return (
        <div className="mb-[0.8rem]">
          <p className={`${pClass} font-semibold text-(--text-primary) mb-1`}>{block.heading}</p>
          <ul className={`${pClass} pl-[1.35rem] m-0`}>
            {block.items.map((item, i) => <li key={i} className="mb-[0.22rem]">{item}</li>)}
          </ul>
        </div>
      );
    case 'table':
      return (
        <div className="overflow-x-auto mt-0 mb-[0.7rem]">
          <table className="w-full border-collapse font-sans text-[0.85rem] text-(--text-secondary)">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left py-[0.4rem] px-[0.65rem] bg-(--bg-section-hd) border border-(--border-input) font-semibold text-(--text-primary) whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`py-[0.4rem] px-[0.65rem] border border-(--border-input) align-top ${i % 2 === 1 ? 'bg-(--row-hover)' : 'bg-transparent'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'email':
      return <p className={`${pClass} font-medium`}><EmailLink address={block.address} /></p>;
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
      className="fixed inset-0 z-[200] bg-black/45 flex items-center justify-center py-5 px-4 backdrop-blur-[2px]"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) w-full max-w-[620px] max-h-[82vh] flex flex-col overflow-hidden"
      >
        {/* ── Sticky header ── */}
        <div className="pt-3.5 px-4.5 pb-3 border-b border-(--border-main) bg-(--bg-card) shrink-0">
          {/* Top row: tabs + close */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="seg flex-1">
              {[
                { id: 'tos',     label: 'Terms of Service' },
                { id: 'privacy', label: 'Privacy Policy'   },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDoc(tab.id)}
                  className={`seg-tab flex-1 ${doc === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-(--border-input) bg-transparent text-(--text-muted) font-sans text-base leading-none cursor-pointer flex items-center justify-center shrink-0 [transition:background_0.15s,color_0.15s]"
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-section-hd)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ✕
            </button>
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-2">
            <div className="seg">
              {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'ภาษาไทย' }].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`seg-tab ${lang === l.id ? 'active' : ''}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span className="font-sans text-[0.72rem] text-(--text-faint)">
              {lang === 'en' ? 'Last updated:' : 'อัปเดตล่าสุด:'} {data.updated}
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto overscroll-contain pt-5 px-5.5 pb-7 flex-1">
          <h2 className="font-serif text-[1.4rem] text-(--color-primary-dark) mt-0 mb-6">
            {data.title}
          </h2>

          {data.sections.map(section => (
            <section key={section.num} className="mb-7">
              <h3 className="font-serif text-base text-(--color-primary-dark) mt-0 mb-[0.55rem] pb-[0.35rem] border-b border-(--border-main)">
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
