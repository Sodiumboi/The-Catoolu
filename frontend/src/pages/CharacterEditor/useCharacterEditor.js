import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  recalculateAll,
  calcHalf,
  calcFifth,
  calcDodge,
} from '../../utils/cocCalculations';

export default function useCharacterEditor(id) {
  const navigate = useNavigate();

  // ── Core sheet state ──────────────────────────────────────
  const [sheet,     setSheet]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [currentId, setCurrentId] = useState(id);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');

  // ── UI state ──────────────────────────────────────────────
  const [skillSearch,    setSkillSearch]    = useState('');
  const [showPresets,    setShowPresets]    = useState(false);
  const [presetCategory, setPresetCategory] = useState('All');
  const [presetSearch,   setPresetSearch]   = useState('');

  // ── Dirty / save-warning state ────────────────────────────
  const [isDirty,        setIsDirty]        = useState(false);
  const [showWarning,    setShowWarning]    = useState(false);
  const [pendingNav,     setPendingNav]     = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [warnSaving,     setWarnSaving]     = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const originalSheetRef = useRef(null);
  const portraitInputRef = useRef(null);

  // ── Load character ────────────────────────────────────────
  useEffect(() => {
    const fetchChar = async () => {
      setCurrentId(id);
      setSheet(null);
      setError('');
      setLoading(true);
      setSaved(false);
      setIsDirty(false);
      originalSheetRef.current = null;

      try {
        const res  = await apiClient.get(`/characters/${id}`);
        const data = res.data.character.sheet_data;

        if (!data || !data.Investigator) {
          setError('Character data is missing or in an unsupported format.');
          return;
        }

        // Normalise Dhole's House single-item quirks
        const w = data.Investigator?.Weapons?.weapon;
        if (w && !Array.isArray(w)) data.Investigator.Weapons.weapon = [w];
        const it = data.Investigator?.Possessions?.item;
        if (it && !Array.isArray(it)) data.Investigator.Possessions.item = [it];

        setSheet(data);
        originalSheetRef.current = data;
      } catch (err) {
        if (err.response?.status === 403) {
          navigate('/', { state: { error: 'You do not have permission to view that character.' } });
          return;
        }
        setError(
          err.response?.status === 404
            ? 'Character not found.'
            : 'Could not load character. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchChar();
  }, [id]);

  // ── Browser back button interception ─────────────────────
  useEffect(() => {
    window.history.pushState({ catooluEditor: true }, '');
    const handlePopState = () => {
      if (isDirty) {
        window.history.pushState({ catooluEditor: true }, '');
        setPendingNav('back');
        setPendingChanges(getChangedSections());
        setShowWarning(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  // ── Section change detector ───────────────────────────────
  function getChangedSections() {
    if (!originalSheetRef.current || !sheet) return [];
    const orig = originalSheetRef.current.Investigator;
    const curr = sheet?.Investigator;
    if (!orig || !curr) return [];
    const changed = [];
    const differs = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
    if (differs(orig.PersonalDetails, curr.PersonalDetails)) changed.push('Personal Details');
    if (differs(orig.Characteristics, curr.Characteristics)) changed.push('Characteristics');
    if (differs(orig.Skills,          curr.Skills))          changed.push('Skills');
    if (differs(orig.Weapons,         curr.Weapons))         changed.push('Weapons');
    if (differs(orig.Backstory,       curr.Backstory))       changed.push('Backstory');
    if (differs(orig.Possessions,     curr.Possessions))     changed.push('Possessions');
    if (differs(orig.Cash,            curr.Cash))            changed.push('Financial Status');
    return changed;
  }

  // ── Generic deep updater ──────────────────────────────────
  const updateSheet = (updater) => {
    setSheet(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
    setIsDirty(true);
  };

  // ── Navigation guard ──────────────────────────────────────
  const guardedNavigate = (destination) => {
    if (isDirty) {
      setPendingNav(destination);
      setPendingChanges(getChangedSections());
      setShowWarning(true);
    } else {
      navigate(destination);
    }
  };

  // ── Warning modal handlers ────────────────────────────────
  const handleWarnCancel = () => {
    setShowWarning(false);
    setPendingNav(null);
  };

  const handleWarnDiscard = () => {
    setIsDirty(false);
    setShowWarning(false);
    const dest = pendingNav;
    setPendingNav(null);
    if (dest === 'back') window.history.back();
    else navigate(dest);
  };

  const handleWarnSave = async () => {
    setWarnSaving(true);
    try {
      await apiClient.put(`/characters/${id}`, { sheet_data: sheet });
      setIsDirty(false);
      originalSheetRef.current = sheet;
      setShowWarning(false);
      const dest = pendingNav;
      setPendingNav(null);
      if (dest === 'back') window.history.back();
      else navigate(dest);
    } catch {
      setError('Failed to save. Please try again.');
      setShowWarning(false);
    } finally {
      setWarnSaving(false);
    }
  };

  // ── Field updaters ────────────────────────────────────────
  const updateDetail = (field, value) =>
    updateSheet(s => { s.Investigator.PersonalDetails[field] = value; });

  const updateChar = (field, value) => {
    updateSheet(s => {
      s.Investigator.Characteristics[field] = value;
      const updated = recalculateAll(
        { ...s.Investigator.Characteristics, [field]: value },
        s.Investigator.Skills?.Skill
      );
      s.Investigator.Characteristics = updated;
      if (!s.Investigator.Characteristics.HitPts)
        s.Investigator.Characteristics.HitPts = updated.HitPtsMax;
      if (!s.Investigator.Characteristics.MagicPts)
        s.Investigator.Characteristics.MagicPts = updated.MagicPtsMax;
      if (!s.Investigator.Characteristics.Sanity)
        s.Investigator.Characteristics.Sanity = updated.SanityStart;
      if (!s.Investigator.Characteristics.Luck)
        s.Investigator.Characteristics.Luck = updated.LuckMax;
      if (!s.Investigator.Combat) s.Investigator.Combat = {};
      s.Investigator.Combat.Dodge = {
        value: String(calcDodge(updated.DEX)),
        half:  String(calcHalf(calcDodge(updated.DEX))),
        fifth: String(calcFifth(calcDodge(updated.DEX))),
      };
    });
  };

  const updateSkill = (index, updatedSkill) => {
    updateSheet(s => {
      s.Investigator.Skills.Skill[index] = {
        ...updatedSkill,
        half:  String(calcHalf(parseInt(updatedSkill.value) || 0)),
        fifth: String(calcFifth(parseInt(updatedSkill.value) || 0)),
      };
      if (updatedSkill.name === 'Cthulhu Mythos')
        s.Investigator.Characteristics.SanityMax =
          String(99 - (parseInt(updatedSkill.value) || 0));
    });
  };

  const updateBack = (field, value) =>
    updateSheet(s => { s.Investigator.Backstory[field] = value; });

  const updateWeapon     = (i, u) =>
    updateSheet(s => { s.Investigator.Weapons.weapon[i] = u; });
  const deleteWeapon     = (i) =>
    updateSheet(s => { s.Investigator.Weapons.weapon.splice(i, 1); });
  const addWeapon        = () =>
    updateSheet(s => {
      if (!s.Investigator.Weapons) s.Investigator.Weapons = { weapon: [] };
      s.Investigator.Weapons.weapon.push({
        name: 'New Weapon', skillname: 'Brawl',
        regular: '—', hard: '—', extreme: '—',
        damage: '1D4', range: 'Touch', attacks: '1', ammo: '—', malf: '—',
      });
    });

  const updatePossession = (i, v) =>
    updateSheet(s => { s.Investigator.Possessions.item[i].description = v; });
  const deletePossession = (i) =>
    updateSheet(s => { s.Investigator.Possessions.item.splice(i, 1); });
  const addPossession    = () =>
    updateSheet(s => {
      if (!s.Investigator.Possessions) s.Investigator.Possessions = { item: [] };
      s.Investigator.Possessions.item.push({ description: 'New Item' });
    });

  const updateCash = (field, value) =>
    updateSheet(s => { s.Investigator.Cash[field] = value; });

  // ── Portrait upload ───────────────────────────────────────
  const handlePortraitUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result.split(',')[1];
      updateSheet(s => { s.Investigator.PersonalDetails.Portrait = base64; });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient.put(`/characters/${id}`, { sheet_data: sheet });
      setIsDirty(false);
      originalSheetRef.current = sheet;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Export JSON ───────────────────────────────────────────
  const handleExport = () => {
    const inv      = sheet?.Investigator;
    const details_ = inv?.PersonalDetails || {};
    const hasNotes = inv?.Notes && inv.Notes.trim() !== '' && inv.Notes !== '<br>';
    if (hasNotes) {
      if (!window.confirm(
        '⚠ Session Notes are not included in the JSON export.\n\n' +
        'Your notes are saved in the database and will still be here ' +
        'when you return.\n\nContinue with export?'
      )) return;
    }
    const exportData = JSON.parse(JSON.stringify(inv));
    delete exportData.Notes;
    const output = JSON.stringify({ Investigator: exportData }, null, 2);
    const blob   = new Blob([output], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `${details_.Name || 'character'}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Derived shortcuts ─────────────────────────────────────
  const inv      = sheet?.Investigator;
  const details  = inv?.PersonalDetails   || {};
  const chars    = inv?.Characteristics   || {};
  const skills   = inv?.Skills?.Skill     || [];
  const weapons  = inv?.Weapons?.weapon   || [];
  const back     = inv?.Backstory         || {};
  const items    = inv?.Possessions?.item || [];
  const cash     = inv?.Cash              || {};
  const portrait = details?.Portrait;

  return {
    // Raw state
    sheet, loading, saving, saved, error, currentId,
    isDirty, showWarning, pendingChanges, warnSaving,
    skillSearch, showPresets, presetCategory, presetSearch,
    // Refs
    portraitInputRef, originalSheetRef,
    // UI setters
    setSkillSearch, setShowPresets, setPresetCategory, setPresetSearch,
    // Derived data
    inv, details, chars, skills, weapons, back, items, cash, portrait,
    // Handlers
    updateSheet, updateDetail, updateChar, updateSkill, updateBack,
    updateWeapon, deleteWeapon, addWeapon,
    updatePossession, deletePossession, addPossession,
    updateCash, handlePortraitUpload, handleSave, handleExport,
    guardedNavigate, handleWarnCancel, handleWarnDiscard, handleWarnSave,
  };
}
