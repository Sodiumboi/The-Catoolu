import SkillGroup from '../../components/SkillGroup';
import { Section } from '../primitives';

export default function Skills({ skills, skillSearch, onSearchChange, onUpdateSkill }) {
  const filtered = skillSearch.trim()
    ? skills.filter(s => {
        const q = skillSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
               (s.subskill || '').toLowerCase().includes(q);
      })
    : skills;

  return (
    <Section title="Skills">
      <div className="mb-3 flex items-center gap-4 flex-wrap">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>●</span> = Occupation skill &nbsp;·&nbsp;
          ½ and ⅕ update automatically
        </p>
        <input
          type="text"
          placeholder="🔍 Search skills..."
          value={skillSearch}
          onChange={e => onSearchChange(e.target.value)}
          className="ml-auto px-3 py-1 rounded text-xs outline-none"
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--border-input)',
            color: 'var(--text-primary)', width: '180px',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      </div>
      <SkillGroup skills={filtered} onChangeSkill={onUpdateSkill} />
    </Section>
  );
}
