import StatBox from './StatBox';

// ── StatGrid ─────────────────────────────────────────────────────────
// The 8 characteristics in the standard two-column layout (STR/CON/DEX/INT
// | SIZ/POW/APP/EDU) with a divider between the columns.
//
// Renders as a FRAGMENT (two stat columns + the divider between them) with
// no outer wrapper, so it drops straight into a parent flex row exactly like
// the loose columns it replaces — keeping divider self-stretch identical.

const LEFT_STATS  = [{ key: 'STR' }, { key: 'CON' }, { key: 'DEX' }, { key: 'INT', sub: 'IDEA' }];
const RIGHT_STATS = [{ key: 'SIZ' }, { key: 'POW' }, { key: 'APP' }, { key: 'EDU', sub: 'KNOW' }];

const Divider = () => (
  <div className="w-px self-stretch" style={{ background: 'var(--border-main)' }} />
);

function StatColumn({ stats, chars, editable, onChangeChar }) {
  return (
    <div className="flex flex-col gap-3">
      {stats.map(({ key, sub }) => (
        <StatBox
          key={key} label={key} sublabel={sub}
          value={chars[key]} editable={editable}
          onChange={editable && onChangeChar ? (v => onChangeChar(key, v)) : undefined}
        />
      ))}
    </div>
  );
}

export default function StatGrid({ chars = {}, editable = false, onChangeChar }) {
  return (
    <>
      <StatColumn stats={LEFT_STATS}  chars={chars} editable={editable} onChangeChar={onChangeChar} />
      <Divider />
      <StatColumn stats={RIGHT_STATS} chars={chars} editable={editable} onChangeChar={onChangeChar} />
    </>
  );
}
