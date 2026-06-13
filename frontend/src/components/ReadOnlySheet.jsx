// Keeper's read-only investigator sheet.
//
// Composes the same shared sheet/ modules as the OG editor, with read-only
// props — same layout and visual language, nothing editable. (Editor-only
// affordances — the skill search, weapon presets, "add" buttons, the rich
// Notes editor and the save bar — are intentionally absent.)

import Section from './sheet/Section';
import PersonalDetails from './sheet/PersonalDetails';
import StatGrid from './sheet/StatGrid';
import { TrackedStats, DerivedBadges } from './sheet/DerivedStats';
import SkillList from './sheet/SkillList';
import WeaponTable from './sheet/WeaponTable';
import Backstory from './sheet/Backstory';

const stripDollar = v => String(v || '').replace(/^\$+/, '').trim();

const toArray = (x) => Array.isArray(x) ? x : x ? [x] : [];

export default function ReadOnlySheet({ charData }) {
  const inv      = charData?.sheet_data?.Investigator;
  const details  = inv?.PersonalDetails || {};
  const chars    = inv?.Characteristics || {};
  const skills   = inv?.Skills?.Skill || [];
  const weapons  = toArray(inv?.Weapons?.weapon);
  const items    = toArray(inv?.Possessions?.item);
  const cash     = inv?.Cash || {};
  const back     = inv?.Backstory || {};
  const portrait = details.Portrait;

  return (
    <div className="p-4" style={{ background: 'var(--bg-page)' }}>

      {/* ── Personal Details ── */}
      <Section title="Personal Details">
        <PersonalDetails details={details} portrait={portrait} />
      </Section>

      {/* ── Characteristics ── */}
      <Section title="Characteristics">
        <TrackedStats chars={chars} horizontal compact />
        <div style={{ borderTop: '1px solid var(--border-main)', margin: '14px 0 12px' }} />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          <StatGrid chars={chars} compact />
        </div>
        <div style={{ borderTop: '1px solid var(--border-main)', margin: '12px 0 0', paddingTop: '10px' }}>
          <DerivedBadges chars={chars} inv={inv} compact />
        </div>
      </Section>

      {/* ── Skills ── */}
      <Section title="Skills">
        <div className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>●</span> = Occupation skill
        </div>
        <SkillList skills={skills} />
      </Section>

      {/* ── Weapons ── */}
      {weapons.length > 0 && (
        <Section title="Weapons & Combat">
          <WeaponTable weapons={weapons} />
        </Section>
      )}

      {/* ── Backstory ── */}
      <Section title="Backstory & Psychology">
        <Backstory back={back} />
      </Section>

      {/* ── Possessions ── */}
      {items.length > 0 && (
        <Section title="Possessions & Equipment">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}>◆</span>
                <div
                  className="flex-1 px-2 py-1 rounded text-sm"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    minHeight: 'calc(1.25rem + 8px)',
                  }}
                >
                  {item.description || ''}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Financial Status ── */}
      {(cash.spending || cash.cash || cash.assets) && (
        <Section title="Financial Status">
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Spending Limit', field: 'spending' },
              { label: 'Cash on Hand',   field: 'cash'     },
              { label: 'Assets',         field: 'assets'   },
            ].map(({ label, field }) => (
              <div key={field} className="flex flex-col items-center">
                <label className="text-xs uppercase tracking-widest mb-1"
                       style={{ color: 'var(--accent)' }}>
                  {label}
                </label>
                <div
                  className="text-center px-3 py-2 rounded text-base font-bold"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-input)',
                    color: 'var(--success)',
                    width: '140px',
                  }}
                >
                  {stripDollar(cash[field])}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
