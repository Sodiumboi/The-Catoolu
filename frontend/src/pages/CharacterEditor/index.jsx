import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/vault-logo.png';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import useCharacterEditor from './useCharacterEditor';
import { useTheme } from '../../context/ThemeContext';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import PersonalDetails     from './components/sections/PersonalDetails';
import Characteristics     from './components/sections/Characteristics';
import Skills              from './components/sections/Skills';
import Weapons             from './components/sections/Weapons';
import Backstory           from './components/sections/Backstory';
import Possessions         from './components/sections/Possessions';
import NotesWindow         from '../../components/NotesWindow';
import Tooltip             from '../../components/ui/Tooltip';
import { loadWindowState, saveWindowState } from '../../components/notes/notesWindowState';
import { useParams } from 'react-router-dom';

export default function CharacterEditorPage() {
  const { uuid } = useParams();
  const editor = useCharacterEditor(uuid);
  const { sheetFontScale } = useTheme();

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

  // ── Notes window ──────────────────────────────────────────
  const [notesState, setNotesState] = useState(() => {
    const s = loadWindowState();
    // Migration from old isOpen boolean
    return s.windowState !== 'closed' ? s.windowState : s.isOpen ? 'full' : 'closed';
  });

  const handleNotesStateChange = (newState) => {
    setNotesState(newState);
    saveWindowState({ windowState: newState });
  };

  const handleNotesButton = () => {
    if (notesState === 'closed') handleNotesStateChange('full');
    else if (notesState === 'bubble') handleNotesStateChange('full');
    else handleNotesStateChange('closed');
  };

  // ── UUID reveal (press U five times while not in an input) ─
  const [showUuid,  setShowUuid]  = useState(false);
  const [uuidCopied, setUuidCopied] = useState(false);
  const uKeyRef = useRef({ count: 0, timer: null });

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== 'u' && e.key !== 'U') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      const state = uKeyRef.current;
      state.count += 1;
      clearTimeout(state.timer);
      if (state.count >= 5) {
        state.count = 0;
        setShowUuid(v => !v);
        setUuidCopied(false);
      } else {
        state.timer = setTimeout(() => { state.count = 0; }, 1500);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCopyUuid = () => {
    const uuid = editor.inv?.Header?.UUID;
    if (!uuid) return;
    navigator.clipboard.writeText(uuid).then(() => {
      setUuidCopied(true);
      setTimeout(() => setUuidCopied(false), 2000);
    });
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading || (!editor.sheet && !error) || currentId !== uuid) return (
    <>
      <NavBar activeTab="investigators" />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center">
          <img src={logo} alt="The Catoolu"
               className="object-contain animate-pulse mx-auto mb-4"
               style={{ width: '56px', height: '56px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading investigator file...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Error state ───────────────────────────────────────────
  if (error && !editor.sheet) return (
    <>
      <NavBar activeTab="investigators" />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button onClick={() => guardedNavigate('/dashboard')}
                  className="mt-4 px-4 py-2 rounded text-sm"
                  style={{ background: 'var(--accent)', color: 'var(--bg-page)' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
      <Footer />
    </>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', '--sheet-font-scale': sheetFontScale }}>

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
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          '5px',
                    padding:      '4px 12px',
                    borderRadius: '999px',
                    border:       '1px solid var(--border-main)',
                    background:   'transparent',
                    color:        'var(--text-muted)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '12px',
                    fontWeight:   500,
                    cursor:       'pointer',
                    transition:   'all 0.15s ease',
                    whiteSpace:   'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-main)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}>
            <span className="icon icon-sm">arrow_back</span>
            Dashboard
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
          {error && <span style={{ fontSize: '12px', color: 'var(--danger)', display:'inline-flex', alignItems:'center', gap:'3px' }}><span className="icon icon-sm">warning</span>{error}</span>}
          {saved && <span style={{ fontSize: '12px', color: 'var(--success)', display:'inline-flex', alignItems:'center', gap:'3px' }}><span className="icon icon-sm">check</span>Saved!</span>}
          <Tooltip content="Toggle notes">
          <button
            onClick={handleNotesButton}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '5px',
              padding:      '4px 12px',
              borderRadius: '999px',
              border:       notesState !== 'closed' ? '1px solid var(--accent)' : '1px solid var(--border-main)',
              background:   notesState !== 'closed' ? 'var(--accent-bg)' : 'transparent',
              color:        notesState !== 'closed' ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '12px',
              fontWeight:   500,
              cursor:       'pointer',
              transition:   'all 0.15s ease',
              whiteSpace:   'nowrap',
            }}
            onMouseEnter={e => {
              if (notesState === 'closed') {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }
            }}
            onMouseLeave={e => {
              if (notesState === 'closed') {
                e.currentTarget.style.borderColor = 'var(--border-main)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            Notes
            <span className="icon icon-sm">open_in_new</span>
          </button>
          </Tooltip>
          <button onClick={handleExport}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--success)', background: 'transparent', color: 'var(--success)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span className="icon icon-sm">download</span>
            Export JSON
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
            {saving ? 'Saving...' : isDirty
              ? <><span className="icon icon-sm">save</span>{' '}Save*</>
              : <><span className="icon icon-sm">check</span>{' '}Saved</>
            }
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="animate-fade-rise max-w-6xl mx-auto px-6 py-8" style={{ flex: 1 }}>

        <PersonalDetails
          details={details} portrait={portrait}
          portraitInputRef={portraitInputRef}
          onPortraitUpload={handlePortraitUpload}
          onUpdateDetail={updateDetail}
        />

        <Characteristics
          chars={chars} inv={inv}
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

      </div>

      <Footer />

      {/* Floating notes window */}
      <NotesWindow
        windowState={notesState}
        onWindowStateChange={handleNotesStateChange}
        contextTagType="character"
        contextTag={details?.Name || 'Investigator'}
      />

      {/* UUID reveal toast — press U five times to toggle */}
      {showUuid && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border-main)',
          borderRadius: '10px', padding: '12px 16px',
          boxShadow: 'var(--shadow-dropdown)',
          display: 'flex', flexDirection: 'column', gap: '6px',
          maxWidth: '340px', minWidth: '260px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Character UUID
            </span>
            <button onClick={() => setShowUuid(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>
              <span className="icon icon-sm">close</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {editor.inv?.Header?.UUID ?? <span style={{ color: 'var(--text-faint)' }}>No UUID — re-import to assign one</span>}
            </code>
            {editor.inv?.Header?.UUID && (
              <button onClick={handleCopyUuid}
                      style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                        border: '1px solid var(--border-main)', background: uuidCopied ? 'var(--accent-bg)' : 'transparent',
                        color: uuidCopied ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}>
                {uuidCopied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
