import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import useCharacterCreation from '../hooks/useCharacterCreation';
import CreationStepIndicator from '../components/creation/CreationStepIndicator';
import StepPersonalDetails from '../components/creation/StepPersonalDetails';
import StepGameEra from '../components/creation/StepGameEra';
import StepCharacteristics from '../components/creation/StepCharacteristics';
import StepAgeUpdates from '../components/creation/StepAgeUpdates';
import StepOccupationPicker from '../components/creation/StepOccupationPicker';
import StepOccupationSkills from '../components/creation/StepOccupationSkills';
import StepPersonalInterestSkills from '../components/creation/StepPersonalInterestSkills';
import StepReview from '../components/creation/StepReview';

const STEP_LABELS = {
  1: 'Personal Details',
  2: 'Game Era & Skills Cap',
  3: 'Characteristics',
  4: 'Age Updates',
  5: 'Choose Occupation',
  6: 'Occupation Skills',
  7: 'Personal Interests',
  8: 'Review & Create',
};

export default function CharacterCreationPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const {
    state,
    setField,
    setStat,
    initStep4,
    useEduRoll,
    applyAgeDeduction,
    setOccupation,
    setSpecialtyChoice,
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
  } = useCharacterCreation();

  const { currentStep } = state;

  function handleNext() {
    if (currentStep === 3) {
      const used    = Object.values(state.stats).reduce((s, v) => s + v, 0);
      const balance = 460 - used;
      if (balance > 0) {
        const ok = window.confirm(
          `You have ${balance} unspent points.\n\nUnused points will be lost. Continue anyway?`
        );
        if (!ok) return;
      }
    }
    nextStep();
  }

  async function handleCreate() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveCharacter();
      // Back to the investigators dashboard with a success banner
      navigate('/dashboard', { state: { created: true } });
    } catch (err) {
      setSaveError(err?.response?.data?.message ?? err.message ?? 'Something went wrong.');
      setSaving(false);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1: return <StepPersonalDetails state={state} setField={setField} />;
      case 2: return <StepGameEra state={state} setField={setField} />;
      case 3: return <StepCharacteristics state={state} setStat={setStat} />;
      case 4: return <StepAgeUpdates state={state} initStep4={initStep4} useEduRoll={useEduRoll} applyAgeDeduction={applyAgeDeduction} />;
      case 5: return <StepOccupationPicker state={state} setOccupation={setOccupation} />;
      case 6: return <StepOccupationSkills state={state} setSpecialtyChoice={setSpecialtyChoice} setOccupationSkillValue={setOccupationSkillValue} />;
      case 7: return <StepPersonalInterestSkills state={state} setPersonalSkillValue={setPersonalSkillValue} setPersonalSlot={setPersonalSlot} />;
      case 8: return <StepReview state={state} />;
      default: return null;
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <NavBar />

      <main style={{
        flex: 1,
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          fontSize: '1.9rem',
          marginBottom: '1.5rem',
        }}>
          Create Investigator
        </h1>

        {/* Resume banner — shown when a saved draft was restored on mount */}
        {resuming && (
          <div className="animate-fade-rise" style={{
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: '10px',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{ flex: 1, minWidth: '240px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
              <strong>Welcome back!</strong> You have an unfinished investigator. Continue where you left off or start fresh.
            </span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={dismissResume}
                style={{
                  padding: '0.5rem 1.1rem', borderRadius: '7px', border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Continue
              </button>
              <button
                onClick={startFresh}
                style={{
                  padding: '0.5rem 1.1rem', borderRadius: '7px',
                  border: '1px solid var(--border-input)', background: 'transparent',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        <CreationStepIndicator currentStep={currentStep} goToStep={goToStep} labels={STEP_LABELS} />

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.5rem',
        }}>
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '7px',
              border: '1px solid var(--border-input)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: currentStep === 1 || saving ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 || saving ? 0.4 : 1,
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
              Step {currentStep} of 8
            </span>
            {saveError && (
              <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                {saveError}
              </span>
            )}
          </div>

          {currentStep < 8 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '7px',
                border: 'none',
                background: canProceed() ? 'var(--color-primary)' : 'var(--border-main)',
                color: canProceed() ? '#fff' : 'var(--text-muted)',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '7px',
                border: 'none',
                background: saving ? 'var(--border-main)' : 'var(--color-primary)',
                color: saving ? 'var(--text-muted)' : '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving…' : 'Create Investigator ✓'}
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
