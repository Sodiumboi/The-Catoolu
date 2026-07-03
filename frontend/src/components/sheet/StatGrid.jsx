import StatBox from './StatBox';

// ── StatGrid ─────────────────────────────────────────────────────────
// 8 characteristics as two horizontal groups of four, with a vertical
// divider between them: [STR CON DEX INT] | [SIZ POW APP EDU].
// Returns a fragment so it drops straight into any parent flex row.

const LEFT_STATS  = [{ key: 'STR' }, { key: 'CON' }, { key: 'DEX' }, { key: 'INT', sub: 'IDEA' }];
const RIGHT_STATS = [{ key: 'SIZ' }, { key: 'POW' }, { key: 'APP' }, { key: 'EDU', sub: 'KNOW' }];

function StatRow({ stats, chars, editable, onChangeChar, compact }) {
  return (
    <div className={`flex ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {stats.map(({ key, sub }) => (
        <StatBox
          key={key} label={key} sublabel={sub}
          value={chars[key]} editable={editable} compact={compact}
          onChange={editable && onChangeChar ? (v => onChangeChar(key, v)) : undefined}
        />
      ))}
    </div>
  );
}

export default function StatGrid({ chars = {}, editable = false, onChangeChar, compact = false }) {
  return (
    <>
      <StatRow stats={LEFT_STATS}  chars={chars} editable={editable} onChangeChar={onChangeChar} compact={compact} />
      <div className="w-px self-stretch bg-(--border-main) shrink-0 mx-1" />
      <StatRow stats={RIGHT_STATS} chars={chars} editable={editable} onChangeChar={onChangeChar} compact={compact} />
    </>
  );
}
