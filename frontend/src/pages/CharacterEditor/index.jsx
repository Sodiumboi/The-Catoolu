import logo from '../../assets/vault-logo.png';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import useCharacterEditor from './useCharacterEditor';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import PersonalDetails     from './components/sections/PersonalDetails';
import Characteristics     from './components/sections/Characteristics';
import Skills              from './components/sections/Skills';
import Weapons             from './components/sections/Weapons';
import Backstory           from './components/sections/Backstory';
import Possessions         from './components/sections/Possessions';
import { useParams } from 'react-router-dom';

export default function CharacterEditorPage() {
  const { id } = useParams();
  const editor = useCharacterEditor(id);

  const {
    // State
    loading, saving, saved, error, currentId,
    isDirty, showWarning, pendingChanges, warnSaving,
    skillSearch, showPresets, presetCategory, presetSearch,
    // Refs
    portraitInputRef,
    // Setters
    setSkillSearch, setShowPresets, setPresetCategory, setPresetSearch,
    // Derived data
    inv, details, chars, skills, weapons, back, items, cash, portrait,
    // Handlers
    updateSheet, updateDetail, updateChar, updateSkill, updateBack,
    updateWeapon, deleteWeapon, addWeapon,
    updatePossession, deletePossession, addPossession,
    updateCash, handlePortraitUpload, handleSave, handleExport,
    guardedNavigate, handleWarnCancel, handleWarnDiscard, handleWarnSave,
  } = editor;

  // ── Loading state ─────────────────────────────────────────
  if (loading || (!editor.sheet && !error) || currentId !== id) return (
    <div className="flex items-center justify-center min-h-screen"
         style={{ background: 'var(--bg-page)' }}>
      <div className="text-center">
        <img src={logo} alt="The Catoolu"
             className="object-contain animate-pulse mx-auto mb-4"
             style={{ width: '56px', height: '56px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading investigator file...</p>
      </div>
    </div>
  );

  // ── Error state ───────────────────────────────────────────
  if (error && !editor.sheet) return (
    <div className="flex items-center justify-center min-h-screen"
         style={{ background: 'var(--bg-page)' }}>
      <div className="text-center">
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button onClick={() => guardedNavigate('/dashboard')}
                className="mt-4 px-4 py-2 rounded text-sm"
                style={{ background: 'var(--accent)', color: 'var(--bg-page)' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // ── Weapon preset handler (needs skills list) ─────────────
  const handleAddPreset = (preset, skillsList) => {
    const match   = skillsList.find(s =>
      s.name.toLowerCase().includes(preset.skillname.toLowerCase().split('(')[0].trim())
    );
    const baseVal = match?.value || '—';
    const hard    = match ? String(Math.floor(parseInt(match.value) / 2)) : '—';
    const extreme = match ? String(Math.floor(parseInt(match.value) / 5)) : '—';
    updateSheet(s => {
      s.Investigator.Weapons.weapon.push({
        name: preset.name, skillname: preset.skillname,
        regular: baseVal, hard, extreme,
        damage: preset.damage, range: preset.range,
        attacks: preset.attacks, ammo: preset.ammo, malf: preset.malf,
      });
    });
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column' }}>

      {/* Unsaved changes modal */}
      {showWarning && (
        <UnsavedChangesModal
          changedSections={pendingChanges}
          onCancel={handleWarnCancel}
          onDiscard={handleWarnDiscard}
          onSave={handleWarnSave}
          saving={warnSaving}
        />
      )}

      {/* Shared nav */}
      <NavBar activeTab="investigators" />

      {/* Editor toolbar */}
      <div style={{
        position: 'sticky', top: '56px', zIndex: 40,
        borderBottom: '1px solid var(--border-main)',
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-nav)', backdropFilter: 'blur(8px)',
      }}>
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={() => guardedNavigate('/dashboard')}
                  style={{ fontSize: '13px', padding: '5px 12px', borderRadius: '7px', border: '1px solid var(--border-main)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            ← Dashboard
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
              {details.Name || 'Investigator'}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--accent)', margin: 0 }}>
              {details.Occupation} · {inv?.Header?.GameType}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>⚠ {error}</span>}
          {saved && <span style={{ fontSize: '12px', color: 'var(--success)' }}>✓ Saved!</span>}
          <button onClick={handleExport}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--success)', background: 'transparent', color: 'var(--success)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            ↓ Export JSON
          </button>
          <button onClick={handleSave} disabled={saving}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                    border:      isDirty ? '2px solid var(--color-primary-dark)' : '2px solid transparent',
                    background:  saving ? 'var(--text-muted)' : isDirty ? 'var(--color-primary)' : 'var(--accent-bg)',
                    color:       saving || isDirty ? '#ffffff' : 'var(--accent)',
                    cursor:      saving ? 'not-allowed' : 'pointer',
                    transition:  'all 0.2s ease',
                  }}>
            {saving ? 'Saving...' : isDirty ? '💾 Save*' : '✓ Saved'}
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-6 py-8" style={{ flex: 1 }}>

        <PersonalDetails
          details={details} portrait={portrait}
          portraitInputRef={portraitInputRef}
          onPortraitUpload={handlePortraitUpload}
          onUpdateDetail={updateDetail}
        />

        <Characteristics
          chars={chars} inv={inv} characterId={id}
          onUpdateChar={updateChar}
          onUpdateSheet={updateSheet}
        />

        <Skills
          skills={skills} skillSearch={skillSearch}
          onSearchChange={setSkillSearch}
          onUpdateSkill={updateSkill}
        />

        <Weapons
          weapons={weapons} skills={skills}
          showPresets={showPresets} presetSearch={presetSearch} presetCategory={presetCategory}
          onAddWeapon={addWeapon}
          onUpdateWeapon={updateWeapon}
          onDeleteWeapon={deleteWeapon}
          onTogglePresets={() => setShowPresets(p => !p)}
          onPresetSearch={setPresetSearch}
          onPresetCategory={setPresetCategory}
          onAddPreset={handleAddPreset}
        />

        <Backstory back={back} onUpdateBack={updateBack} />

        <Possessions
          items={items} cash={cash}
          onUpdatePossession={updatePossession}
          onDeletePossession={deletePossession}
          onAddPossession={addPossession}
          onUpdateCash={updateCash}
        />

        {/* Bottom action bar */}
        <div className="flex justify-end gap-3 mt-2 pb-8">
          <button onClick={handleExport}
                  className="px-6 py-3 rounded text-sm font-medium transition-all"
                  style={{ background: '#1a3a1a', color: 'var(--success)', border: '1px solid var(--success)33' }}>
            ↓ Export JSON
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="px-6 py-3 rounded text-sm font-bold"
                  style={{ background: saving ? '#6b5000' : 'var(--accent)', color: 'var(--bg-input)' }}>
            {saving ? 'Saving...' : '💾 Save Character'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
