import Section from '../../../../components/sheet/Section';
import SkillList from '../../../../components/sheet/SkillList';

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
        <p className="text-xs text-(--text-muted)">
          <span className="text-(--accent)">●</span> = Occupation skill &nbsp;·&nbsp;
          ½ and ⅕ update automatically
        </p>
        <input
          type="text"
          placeholder="🔍 Search skills..."
          value={skillSearch}
          onChange={e => onSearchChange(e.target.value)}
          className="ml-auto px-3 py-1 rounded text-xs outline-none! w-45 bg-(--bg-input) border border-(--border-input) text-(--text-primary)"
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      </div>
      <SkillList skills={filtered} editable onChangeSkill={onUpdateSkill} />
    </Section>
  );
}
