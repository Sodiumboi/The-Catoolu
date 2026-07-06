import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/vault-logo.png';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import useCharacterEditor from './useCharacterEditor';
import { useTheme } from '../../context/ThemeContext';
import ConfirmDialog from '../../components/ConfirmDialog';
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
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <img src={logo} alt="The Catoolu"
               className="object-contain animate-pulse mx-auto mb-4 w-14 h-14" />
          <p className="text-(--text-muted)">Loading investigator file...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Error state ───────────────────────────────────────────
  if (error && !editor.sheet) return (
    <>
      <NavBar activeTab="investigators" />
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-(--danger)">{error}</p>
          <button onClick={() => guardedNavigate('/dashboard')}
                  className="btn-primary mt-4">
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
    // --sheet-font-scale stays inline — sheetFontScale is a live theme setting, not static styling
    <div className="min-h-screen flex flex-col" style={{ '--sheet-font-scale': sheetFontScale }}>

      {/* Unsaved changes modal */}
      <ConfirmDialog
        open={showWarning}
        variant="danger"
        title="Unsaved Changes"
        message={`You have unsaved changes${pendingChanges.length ? ' to: ' + pendingChanges.join(', ') : ''}. What would you like to do?`}
        cancelLabel="Cancel"
        confirmLabel="Discard Changes"
        onCancel={handleWarnCancel}
        onConfirm={handleWarnDiscard}
        tertiaryLabel={warnSaving ? 'Saving…' : 'Save & Leave'}
        onTertiary={handleWarnSave}
        tertiaryDisabled={warnSaving}
      />

      {/* Shared nav */}
      <NavBar activeTab="investigators" />

      {/* Editor toolbar */}
      <div className="sticky top-14 z-40 border-b border-(--border-main) py-2 px-6 flex items-center justify-between bg-(--bg-nav) [backdrop-filter:blur(8px)]">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={() => guardedNavigate('/dashboard')}
                  className="btn-back">
            <span className="icon icon-sm">arrow_back</span>
            Dashboard
          </button>
          <div>
            <h1 className="font-serif text-base text-(--text-primary) m-0">
              {details.Name || 'Investigator'}
            </h1>
            <p className="text-[11px] text-(--accent) m-0">
              {details.Occupation} · {inv?.Header?.GameType}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-(--danger) inline-flex items-center gap-0.75"><span className="icon icon-sm">warning</span>{error}</span>}
          {saved && <span className="text-xs text-(--success) inline-flex items-center gap-0.75"><span className="icon icon-sm">check</span>Saved!</span>}
          <Tooltip content="Toggle notes">
          <button
            onClick={handleNotesButton}
            className={`flex items-center gap-1.25 py-[5px] px-3.5 rounded-full font-sans text-xs font-medium cursor-pointer [transition:all_0.15s] whitespace-nowrap ${notesState !== 'closed' ? 'border-[1.5px] border-(--accent) bg-(--accent-bg) text-(--accent)' : 'border-[1.5px] border-(--border-main) bg-transparent text-(--text-muted)'}`}
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
          <Tooltip content="Export JSON">
          <button onClick={handleExport}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-(--success) bg-transparent text-(--success) cursor-pointer [transition:background_0.15s]"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span className="icon icon-sm">download</span>
          </button>
          </Tooltip>
          <Tooltip content={saving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}>
          <button onClick={handleSave} disabled={saving}
                  className={`inline-flex items-center justify-center p-1.5 rounded-lg [transition:all_0.2s] border-2 ${isDirty ? 'border-(--color-primary-dark)' : 'border-transparent'} ${saving ? 'bg-(--text-muted) text-white cursor-not-allowed' : isDirty ? 'bg-(--color-primary) text-white cursor-pointer' : 'bg-(--accent-bg) text-(--accent) cursor-pointer'}`}>
            <span className="icon icon-sm">{saving ? 'progress_activity' : isDirty ? 'save' : 'check'}</span>
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Page content */}
      <div className="animate-fade-rise max-w-6xl mx-auto px-6 py-8 flex-1">

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
        <div className="fixed bottom-7 right-7 z-200 bg-(--bg-card) border border-(--border-main) rounded-[10px] py-3 px-4 shadow-(--shadow-dropdown) flex flex-col gap-1.5 max-w-85 min-w-65">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-(--text-muted) uppercase tracking-[0.08em] font-semibold">
              Character UUID
            </span>
            <button onClick={() => setShowUuid(false)}
                    className="bg-transparent border-none text-(--text-faint) cursor-pointer leading-none py-0 px-0.5">
              <span className="icon icon-sm">close</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-[11px] text-(--text-primary) font-mono flex-1 break-all leading-normal">
              {editor.inv?.Header?.UUID ?? <span className="text-(--text-faint)">No UUID — re-import to assign one</span>}
            </code>
            {editor.inv?.Header?.UUID && (
              <button onClick={handleCopyUuid}
                      className={`text-[11px] py-0.75 px-2.5 rounded-md border border-(--border-main) cursor-pointer whitespace-nowrap [transition:all_0.15s] ${uuidCopied ? 'bg-(--accent-bg) text-(--accent)' : 'bg-transparent text-(--text-secondary)'}`}>
                {uuidCopied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
