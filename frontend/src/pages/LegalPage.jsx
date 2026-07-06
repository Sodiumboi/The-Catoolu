import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { content } from './legalContent';

// ── Block renderers ───────────────────────────────────────────────────

const EmailLink = ({ address }) => (
  <a
    href={`mailto:${address}`}
    className="text-(--accent) no-underline font-medium"
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
        <p className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.75] m-0 mb-3">
          {block.text}
          {block.email && <EmailLink address={block.email} />}
        </p>
      );

    case 'emphasis':
      return (
        <p className="font-sans text-[0.95rem] text-(--text-primary) leading-[1.75] m-0 mb-3 font-semibold">
          {block.text}
        </p>
      );

    case 'disclaimer':
      return (
        <p className="font-sans text-[0.875rem] text-(--text-faint) leading-[1.75] m-0 mb-3 italic py-[0.65rem] px-4 bg-(--bg-section-hd) rounded-md border border-(--border-input)">
          {block.text}
        </p>
      );

    case 'ul':
      return (
        <ul className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.75] m-0 mb-3 pl-[1.4rem]">
          {block.items.map((item, i) =>
            typeof item === 'string'
              ? <li key={i} className="mb-[0.3rem]">{item}</li>
              : (
                <li key={i} className="mb-[0.3rem]">
                  <strong className="text-(--text-primary)">{item.label}</strong>
                  {' — '}{item.text}
                </li>
              )
          )}
        </ul>
      );

    case 'subgroup':
      return (
        <div className="mb-[0.85rem]">
          <p className="font-sans text-[0.95rem] text-(--text-primary) leading-[1.75] m-0 mb-[0.3rem] font-semibold">
            {block.heading}
          </p>
          <ul className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.75] m-0 pl-[1.4rem]">
            {block.items.map((item, i) => (
              <li key={i} className="mb-1">{item}</li>
            ))}
          </ul>
        </div>
      );

    case 'table':
      return (
        <div className="overflow-x-auto m-0 mb-3">
          <table className="w-full border-collapse font-sans text-[0.9rem] text-(--text-secondary)">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left py-2 px-3 bg-(--bg-section-hd) border border-(--border-input) font-semibold text-(--text-primary) whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`py-[0.45rem] px-3 border border-(--border-input) align-top ${i % 2 === 1 ? 'bg-(--row-hover)' : 'bg-transparent'}`}>
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
        <p className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.75] m-0 mb-3 font-medium">
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
      className={`seg-tab ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );
}

function LangPill({ lang, setLang }) {
  return (
    <div className="seg shrink-0">
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function LegalPage() {
  const [searchParams] = useSearchParams();
  const [doc,  setDoc]  = useState(searchParams.get('doc') === 'privacy' ? 'privacy' : 'tos');
  const [lang, setLang] = useState('en');

  const data = content[doc][lang];

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-page)">

      <NavBar />

      {/* ── Sticky controls bar ── */}
      <div className="sticky top-14 z-40 bg-(--bg-page) border-b border-(--border-main) py-2.5 px-6">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Document tabs */}
          <div className="seg">
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
      <main className="flex-1 max-w-[760px] w-full mx-auto pt-10 px-6 pb-16 box-border">

        {/* Document header */}
        <div className="mb-10">
          <h1 className="font-serif text-[2rem] text-(--color-primary-dark) m-0 mb-[0.4rem]">
            {data.title}
          </h1>
          <p className="font-sans text-[0.85rem] text-(--text-faint) m-0">
            {lang === 'en' ? 'Last updated:' : 'อัปเดตล่าสุด:'} {data.updated}
          </p>
        </div>

        {/* Sections */}
        {data.sections.map(section => (
          <section key={section.num} className="mb-9">
            <h2 className="font-serif text-[1.2rem] text-(--color-primary-dark) m-0 mb-[0.65rem] pb-[0.45rem] border-b border-(--border-main)">
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
