import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { getSkillBase } from '../utils/skillBases';
import { calcDamageBonusAndBuild, calcMove } from '../utils/cocCalculations';
import ALL_SKILLS, { SKILL_ERAS } from '../utils/allSkills';
import OCCUPATIONS from '../utils/occupations';
import { resolveCompulsoryChoices, isCompulsoryChoiceEntryResolved } from '../utils/compulsoryChoices';

const INITIAL_STATE = {
  currentStep: 1,

  // Step 1 — Personal Details
  name: '',
  age: 25,
  residence: '',
  birthplace: '',
  portrait: null,

  // Step 2 — Game Era + Skills Cap
  gameEra: 'classic_1920s',
  skillsCap: 75,

  // Step 3 — Characteristics
  stats: {
    STR: 15, DEX: 15, INT: 40,
    CON: 15, APP: 15, POW: 15,
    SIZ: 40, EDU: 40,
  },
  luck: null,
  luckInitialized: false,

  // Step 4 — Age Updates
  step4Initialized: false,
  eduRollsUsed: 0,
  ageDeductionSpent: 0,

  // Step 7 — Personal Interest Skills
  personalSkills: {},
  personalSkillSlots: {},  // { [group]: [{ name, above }, ...] }
};

// ── Age rules helper (exported so step component can use it) ──
export function getAgeUpdates(age) {
  if (age <= 19) return { eduRolls: 0, deductionTotal: 5,  eligibleStats: ['STR', 'SIZ'],        eduPenalty: 5, appReduction: 0,  movePenalty: 0 };
  if (age <= 39) return { eduRolls: 1, deductionTotal: 0,  eligibleStats: [],                     eduPenalty: 0, appReduction: 0,  movePenalty: 0 };
  if (age <= 49) return { eduRolls: 2, deductionTotal: 5,  eligibleStats: ['STR', 'CON', 'DEX'],  eduPenalty: 0, appReduction: 5,  movePenalty: 1 };
  if (age <= 59) return { eduRolls: 3, deductionTotal: 10, eligibleStats: ['STR', 'CON', 'DEX'],  eduPenalty: 0, appReduction: 10, movePenalty: 2 };
  if (age <= 69) return { eduRolls: 4, deductionTotal: 20, eligibleStats: ['STR', 'CON', 'DEX'],  eduPenalty: 0, appReduction: 15, movePenalty: 3 };
  if (age <= 79) return { eduRolls: 4, deductionTotal: 40, eligibleStats: ['STR', 'CON', 'DEX'],  eduPenalty: 0, appReduction: 20, movePenalty: 4 };
  return              { eduRolls: 4, deductionTotal: 80, eligibleStats: ['STR', 'CON', 'DEX'],  eduPenalty: 0, appReduction: 25, movePenalty: 5 };
}

// ── Validation per step ────────────────────────────────────
function canProceedFromStep(step, state) {
  switch (step) {
    case 1:
      return state.name.trim().length > 0 && state.age >= 15 && state.age <= 90;
    case 2:
      return true;
    case 3: {
      const used = Object.values(state.stats).reduce((sum, v) => sum + v, 0);
      return used <= 460;
    }
    case 4: {
      const { deductionTotal } = getAgeUpdates(state.age);
      return state.ageDeductionSpent >= deductionTotal;
    }
    case 5:
      return state.selectedOccupation !== null;
    case 6: {
      if (!state.selectedOccupation) return false;
      const occ = state.selectedOccupation;
      // All specialty groups must have a selection (vacuously true if none exist)
      const allSpecialtiesPicked = occ.specialtyChoices.every((group, i) => {
        const sel = state.specialtyChoices?.[i];
        const count = Array.isArray(sel) ? sel.length : (sel ? 1 : 0);
        return count >= group.pick;
      });
      if (!allSpecialtiesPicked) return false;
      // All compulsory-choice entries must be fully resolved (vacuously true if none exist)
      const allChoicesResolved = (occ.compulsoryChoices ?? []).every((entry, i) =>
        isCompulsoryChoiceEntryResolved(entry, state.chosenCompulsoryChoices?.[i])
      );
      if (!allChoicesResolved) return false;
      const totalPts = occ.skillPointsCalc(state.stats);
      const spent = Object.values(state.occupationSkills ?? {}).reduce((s, v) => s + v, 0);
      return spent <= totalPts;
    }
    case 7:
      return true;
    case 8:
      return true;
    default:
      return false;
  }
}

export default function useCharacterCreation() {
  const [state, setState] = useState(INITIAL_STATE);

  // ── Draft resume ───────────────────────────────────────────
  const [resuming, setResuming] = useState(false);
  // Auto-save stays off until the initial draft load finishes, so the
  // empty mount state can never clobber an existing saved draft.
  const draftReadyRef = useRef(false);

  // On mount: load any saved draft and restore it
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/characters/draft');
        if (!cancelled && res.data && res.data.wizard_state) {
          const restored = { ...res.data.wizard_state };
          // Occupation methods (skillPointsCalc, cashAndAssets) don't survive
          // JSON — rehydrate the full object from canonical data by id.
          if (restored.selectedOccupation?.id) {
            const occ = OCCUPATIONS.find(o => o.id === restored.selectedOccupation.id);
            if (occ) restored.selectedOccupation = occ;
          }
          restored.currentStep = res.data.current_step ?? restored.currentStep ?? 1;
          setState(restored);
          setResuming(true);
        }
      } catch { /* no draft / endpoint missing — start fresh silently */ }
      finally { if (!cancelled) draftReadyRef.current = true; }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-save whenever the user moves to a different step. The
  // `state === INITIAL_STATE` reference check skips untouched/just-reset
  // state, so "Start Fresh" doesn't immediately recreate the draft.
  useEffect(() => {
    if (!draftReadyRef.current) return;
    if (state === INITIAL_STATE) return;
    apiClient.put('/characters/draft', {
      wizard_state: state,
      current_step: state.currentStep,
    }).catch(() => {});
  }, [state.currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Continue → keep the restored state, just hide the banner
  const dismissResume = useCallback(() => setResuming(false), []);

  // Start Fresh → wipe state + clear the saved draft
  const startFresh = useCallback(() => {
    setState(INITIAL_STATE);
    setResuming(false);
    apiClient.delete('/characters/draft').catch(() => {});
  }, []);

  const setField = useCallback((field, value) => {
    setState(s => ({ ...s, [field]: value }));
  }, []);

  const setStat = useCallback((stat, value) => {
    setState(s => ({ ...s, stats: { ...s.stats, [stat]: value } }));
  }, []);

  // Called once when step 4 mounts — applies auto EDU penalty for young investigators
  const initStep4 = useCallback(() => {
    setState(s => {
      if (s.step4Initialized) return s;
      const { eduPenalty, appReduction } = getAgeUpdates(s.age);
      const newEDU = eduPenalty   > 0 ? Math.max(1, s.stats.EDU - eduPenalty)   : s.stats.EDU;
      const newAPP = appReduction > 0 ? Math.max(0, s.stats.APP - appReduction) : s.stats.APP;
      return {
        ...s,
        step4Initialized: true,
        stats: { ...s.stats, EDU: newEDU, APP: newAPP },
      };
    });
  }, []);

  // Called once when step 3 mounts — rolls Luck (3d6×5), independent of Sanity
  const initLuck = useCallback(() => {
    setState(s => {
      if (s.luckInitialized) return s;
      const roll3d6 = () => Math.floor(Math.random() * 6) + 1;
      const luck = (roll3d6() + roll3d6() + roll3d6()) * 5;
      return { ...s, luckInitialized: true, luck };
    });
  }, []);

  // Apply one EDU improvement roll (adds pts to EDU, max 99)
  const useEduRoll = useCallback((points) => {
    setState(s => {
      const { eduRolls } = getAgeUpdates(s.age);
      if (s.eduRollsUsed >= eduRolls) return s;
      return {
        ...s,
        stats: { ...s.stats, EDU: Math.min(99, s.stats.EDU + points) },
        eduRollsUsed: s.eduRollsUsed + 1,
      };
    });
  }, []);

  // Deduct pts from a stat (age penalty), floor at 1
  const applyAgeDeduction = useCallback((stat, amount) => {
    setState(s => {
      const { deductionTotal } = getAgeUpdates(s.age);
      const remaining = deductionTotal - s.ageDeductionSpent;
      const clamped = Math.min(amount, remaining, s.stats[stat] - 1);
      if (clamped <= 0) return s;
      return {
        ...s,
        stats: { ...s.stats, [stat]: s.stats[stat] - clamped },
        ageDeductionSpent: s.ageDeductionSpent + clamped,
      };
    });
  }, []);

  const setOccupation = useCallback((occupation) => {
    setState(s => ({ ...s, selectedOccupation: occupation, specialtyChoices: {}, chosenCompulsoryChoices: {}, occupationSkills: {} }));
  }, []);

  const setSpecialtyChoice = useCallback((groupIndex, skillId) => {
    setState(s => ({
      ...s,
      specialtyChoices: { ...s.specialtyChoices, [groupIndex]: skillId },
    }));
  }, []);

  const setCompulsoryChoice = useCallback((entryIndex, value) => {
    setState(s => ({
      ...s,
      chosenCompulsoryChoices: { ...s.chosenCompulsoryChoices, [entryIndex]: value },
    }));
  }, []);

  const setOccupationSkillValue = useCallback((skillId, value) => {
    setState(s => ({
      ...s,
      occupationSkills: { ...s.occupationSkills, [skillId]: value },
    }));
  }, []);

  const setPersonalSkillValue = useCallback((skillId, value) => {
    setState(s => ({
      ...s,
      personalSkills: { ...s.personalSkills, [skillId]: value },
    }));
  }, []);

  const setPersonalSlot = useCallback((group, index, updates) => {
    setState(s => {
      const existing = s.personalSkillSlots?.[group] ?? [];
      const slots = [...existing];
      while (slots.length <= index) slots.push({ name: '', above: 0 });
      slots[index] = { ...slots[index], ...updates };
      return { ...s, personalSkillSlots: { ...s.personalSkillSlots, [group]: slots } };
    });
  }, []);

  const nextStep = useCallback(() => {
    setState(s => {
      if (!canProceedFromStep(s.currentStep, s)) return s;
      return { ...s, currentStep: Math.min(s.currentStep + 1, 8) };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(s => ({ ...s, currentStep: Math.max(s.currentStep - 1, 1) }));
  }, []);

  const goToStep = useCallback((n) => {
    setState(s => {
      if (n >= s.currentStep) return s;
      return { ...s, currentStep: n };
    });
  }, []);

  const canProceed = useCallback(() => {
    return canProceedFromStep(state.currentStep, state);
  }, [state]);

  const saveCharacter = useCallback(async () => {
    const { stats, selectedOccupation, occupationSkills, specialtyChoices, chosenCompulsoryChoices, personalSkills, personalSkillSlots } = state;
    const edu = stats.EDU;

    // ── Build occupation skill name sets ──────────────────────
    const chosenSpecialties = selectedOccupation
      ? selectedOccupation.specialtyChoices.flatMap((_, i) => {
          const sel = (specialtyChoices ?? {})[i];
          if (!sel) return [];
          return Array.isArray(sel) ? sel : [sel];
        })
      : [];
    const resolvedChoiceSkills = selectedOccupation
      ? resolveCompulsoryChoices(selectedOccupation.compulsoryChoices ?? [], chosenCompulsoryChoices)
      : [];
    const allOccSkills = selectedOccupation
      ? [...new Set([...selectedOccupation.compulsorySkills, ...resolvedChoiceSkills, ...chosenSpecialties])]
      : [];
    const occSkillNames = new Set(allOccSkills);
    if (selectedOccupation) occSkillNames.add('Credit Rating');

    // ── Build a flat totals map (name → total value) ─────────
    const totals = {};

    if (selectedOccupation) {
      const crAbove = occupationSkills?.['Credit Rating'] ?? 0;
      totals['Credit Rating'] = selectedOccupation.creditRating.min + crAbove;
      allOccSkills.forEach(skill => {
        totals[skill] = getSkillBase(skill, edu, stats.DEX) + (occupationSkills?.[skill] ?? 0);
        // Defensive floor: Cthulhu Mythos must always start at its base (0%) and can never be
        // raised during creation — Sanity = 99 − Cthulhu Mythos depends on this invariant.
        // Ignore any occupation points that may have been spent on it, regardless of source.
        if (skill === 'Cthulhu Mythos') totals[skill] = getSkillBase('Cthulhu Mythos', edu, stats.DEX);
      });
    }
    Object.entries(personalSkills ?? {}).forEach(([k, v]) => {
      const total = getSkillBase(k, edu, stats.DEX) + v;
      totals[k] = Math.max(totals[k] ?? 0, total);
    });
    Object.entries(personalSkillSlots ?? {}).forEach(([group, slots]) => {
      slots.forEach(slot => {
        if (!slot.name.trim() || slot.above <= 0) return;
        const key  = group === 'Misc' ? slot.name.trim() : `${group} (${slot.name.trim()})`;
        const base = group === 'Language (Own)' ? edu : getSkillBase(key, edu);
        totals[key] = Math.max(totals[key] ?? 0, base + slot.above);
      });
    });

    // ── Convert totals → Skills.Skill array (exact Dhole's House format) ─
    // Group skills use {name: "Fighting", subskill: "Brawl"}.
    // Simple skills have no subskill field.
    // Occupation flag is occupation: "true" (string).
    // Empty group slots use subskill: "None", value: "1".
    const GROUP_NAMES = ['Art/Craft', 'Fighting', 'Firearms', 'Language (Other)', 'Language (Own)', 'Pilot', 'Science', 'Survival'];
    const simpleSkillSet = new Set(ALL_SKILLS.filter(e => typeof e === 'string'));

    const skillRows = [];
    const addedKeys = new Set();

    const mkRow = (name, subskill, v, isOcc) => {
      const row = {
        name,
        value: String(v),
        half:  String(Math.floor(v / 2)),
        fifth: String(Math.floor(v / 5)),
      };
      if (subskill !== undefined) row.subskill = subskill;
      if (isOcc) row.occupation = 'true';
      return row;
    };

    // Credit Rating first (occupation only)
    if (selectedOccupation) {
      const cr = totals['Credit Rating'] ?? selectedOccupation.creditRating.min;
      skillRows.push(mkRow('Credit Rating', undefined, cr, true));
      addedKeys.add('Credit Rating');
    }

    ALL_SKILLS.forEach(entry => {
      if (typeof entry === 'string') {
        if (SKILL_ERAS[entry] && !SKILL_ERAS[entry].includes(state.gameEra) && !occSkillNames.has(entry)) return;
        const v = totals[entry] ?? getSkillBase(entry, edu, stats.DEX);
        skillRows.push(mkRow(entry, undefined, v, occSkillNames.has(entry)));
        addedKeys.add(entry);
      } else {
        const groupName = entry.group;
        const maxSlots  = entry.slots;
        const named     = [];

        if (groupName === 'Misc') {
          // Misc totals are stored by bare name — anything not a simple skill or known group prefix
          Object.keys(totals).forEach(k => {
            if (addedKeys.has(k) || simpleSkillSet.has(k) || k === 'Credit Rating') return;
            if (GROUP_NAMES.some(g => k.startsWith(g + ' ('))) return;
            named.push({ key: k, subskill: k });
            addedKeys.add(k);
          });
        } else {
          const prefix = groupName + ' (';
          const occGrantsOwnLanguage = groupName === 'Language (Own)'
            && (occSkillNames.has('Own Language') || occSkillNames.has('Language Own'));

          if (occGrantsOwnLanguage) {
            // The occupation grants the investigator's native language. Collapse the
            // occupation grant, the player-typed name, and any spent points into
            // exactly ONE row. The name lives in the group's single editable slot
            // (personalSkillSlots); fall back to the group's defaultName when the
            // player left it untouched. Base is EDU per CoC 7e.
            const slot          = personalSkillSlots?.['Language (Own)']?.[0];
            const ownName       = slot?.name?.trim() || entry.defaultName || 'Own Language';
            const occAbove      = occupationSkills?.['Own Language'] ?? occupationSkills?.['Language Own'] ?? 0;
            const personalAbove = slot?.above ?? 0;
            named.push({ subskill: ownName, value: edu + occAbove + personalAbove, isOcc: true });
            // Retire the sentinel token(s) and any `Language (Own) (X)` totals key so
            // the loop below can't emit a duplicate second row for this one slot.
            Object.keys(totals).forEach(k => {
              if (k === 'Own Language' || k === 'Language Own' || (k.startsWith(prefix) && k.endsWith(')'))) {
                addedKeys.add(k);
              }
            });
          } else {
            Object.keys(totals).forEach(k => {
              if (addedKeys.has(k)) return;
              if (k.startsWith(prefix) && k.endsWith(')')) {
                named.push({ key: k, subskill: k.slice(prefix.length, -1) });
                addedKeys.add(k);
              }
            });
          }
        }

        named.forEach(({ key, subskill, value, isOcc }) => {
          const v   = value !== undefined ? value : (totals[key] ?? 1);
          const occ = isOcc  !== undefined ? isOcc : occSkillNames.has(key);
          skillRows.push(mkRow(groupName, subskill, v, occ));
        });

        // Pad to the group's slot count with empty entries
        for (let i = named.length; i < maxSlots; i++) {
          skillRows.push({ name: groupName, subskill: 'None', value: '1', half: '0', fifth: '0' });
        }
      }
    });

    // ── Derived values ───────────────────────────────────────
    const hp    = Math.floor((stats.CON + stats.SIZ) / 10);
    const mp    = Math.floor(stats.POW / 5);
    const san   = stats.POW;
    const dodge = Math.floor(stats.DEX / 2);
    const { damageBonus: db, build } = calcDamageBonusAndBuild(stats.STR, stats.SIZ);
    const { movePenalty } = getAgeUpdates(state.age);
    const move  = Math.max(1, calcMove(stats.STR, stats.DEX, stats.SIZ) - movePenalty);
    const occPts  = selectedOccupation?.skillPointsCalc(stats) ?? 0;
    const persPts = 2 * stats.INT;

    // Cash from credit rating
    const crTotal  = selectedOccupation
      ? selectedOccupation.creditRating.min + (occupationSkills?.['Credit Rating'] ?? 0)
      : 0;
    const cashInfo = selectedOccupation ? selectedOccupation.cashAndAssets(crTotal) : { cash: 0, assets: 0, spendingLimit: 0 };

    const ERA_GAMETYPE = {
      classic_1920s: "Classic (1920's)",
      modern:        'Modern',
      gaslight:      'Cthulhu by Gaslight',
      old_west:      'Old West',
      regency:       'Regency Cthulhu',
      dark_ages:     'Dark Ages',
    };

    // ── Build sheet_data in full Dhole's House format ────────
    const sheet_data = {
      Investigator: {
        Header: {
          GameType: ERA_GAMETYPE[state.gameEra] ?? state.gameEra,
        },
        PersonalDetails: {
          Name:       state.name,
          Occupation: selectedOccupation?.name ?? '',
          Gender:     '',
          Age:        String(state.age),
          Birthplace: state.birthplace,
          Residence:  state.residence,
          Portrait:   state.portrait || null,
        },
        Characteristics: {
          STR: String(stats.STR), DEX: String(stats.DEX), INT: String(stats.INT),
          CON: String(stats.CON), APP: String(stats.APP), POW: String(stats.POW),
          SIZ: String(stats.SIZ), EDU: String(stats.EDU),
          Move:                       String(move),
          Luck:                       String(state.luck),
          LuckMax:                    String(state.luck),
          Sanity:                     String(san),
          SanityStart:                String(san),
          SanityMax:                  '99',
          MagicPts:                   String(mp),
          MagicPtsMax:                String(mp),
          HitPts:                     String(hp),
          HitPtsMax:                  String(hp),
          DamageBonus:                db,
          Build:                      String(build),
          OccupationSkillPoints:      String(occPts),
          PersonalInterestSkillPoints: String(persPts),
        },
        Skills:  { Skill: skillRows },
        Weapons: { weapon: [] },
        Combat:  {
          DamageBonus: db,
          Build:       String(build),
          Dodge:       { value: String(dodge), half: String(Math.floor(dodge / 2)), fifth: String(Math.floor(dodge / 5)) },
        },
        Backstory:   { description: '', traits: '', ideology: '', injurues: null, people: '', phobias: '', locations: '', tomes: '', possessions: '', encounters: null },
        Possessions: { item: [] },
        Cash:        {
          spending: `$${cashInfo.spendingLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          cash:     `$${cashInfo.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          assets:   `$${cashInfo.assets.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    };

    // `source` tags this as a creation-wizard submission so the backend can
    // reject it when the creation engine is disabled, without affecting
    // Dhole's House import (which posts the same shape without `source`).
    const response = await apiClient.post('/characters', { sheet_data, source: 'creation-wizard' });
    // Character created — clear the saved draft so it won't resume next time
    await apiClient.delete('/characters/draft').catch(() => {});
    return response.data;
  }, [state]);

  return {
    state,
    setField,
    setStat,
    initStep4,
    initLuck,
    useEduRoll,
    applyAgeDeduction,
    setOccupation,
    setSpecialtyChoice,
    setCompulsoryChoice,
    setOccupationSkillValue,
    setPersonalSkillValue,
    setPersonalSlot,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    saveCharacter,
    resuming,
    dismissResume,
    startFresh,
  };
}
