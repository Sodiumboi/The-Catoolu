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
import ConfirmDialog from '../components/ConfirmDialog';
import useConfirm from '../hooks/useConfirm';

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
  const { confirm, dialogProps } = useConfirm();

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

  async function handleNext() {
    if (currentStep === 3) {
      const used    = Object.values(state.stats).reduce((s, v) => s + v, 0);
      const balance = 460 - used;
      if (balance > 0) {
        const ok = await confirm({
          title: 'Continue?',
          message: `You have ${balance} unspent points. Unused points will be lost.`,
          variant: 'warning',
          confirmLabel: 'Continue anyway',
        });
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
    <div className="min-h-screen bg-(--bg-page) flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[860px] w-full mx-auto py-8 px-6">
        <h1 className="font-serif text-(--text-primary) text-[1.9rem] mb-6">
          Create Investigator
        </h1>

        {/* Resume banner — shown when a saved draft was restored on mount */}
        {resuming && (
          <div className="animate-fade-rise flex items-center gap-4 flex-wrap bg-(--accent-bg) border border-(--accent) rounded-[10px] py-[0.9rem] px-[1.1rem] mb-6">
            <span className="flex-1 min-w-[240px] font-sans text-[0.9rem] text-(--color-primary-dark)">
              <strong>Welcome back!</strong> You have an unfinished investigator. Continue where you left off or start fresh.
            </span>
            <div className="flex gap-[0.6rem]">
              <button
                onClick={dismissResume}
                className="btn-primary"
              >
                Continue
              </button>
              <button
                onClick={startFresh}
                className="btn-secondary"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        <CreationStepIndicator currentStep={currentStep} goToStep={goToStep} labels={STEP_LABELS} />

        <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] p-8 shadow-(--shadow-card) mb-6">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            className={`py-[0.6rem] px-[1.4rem] rounded-[7px] border border-(--border-input) bg-transparent text-(--text-secondary) font-sans text-[0.9rem] ${currentStep === 1 || saving ? 'cursor-not-allowed opacity-40' : 'cursor-pointer opacity-100'}`}
          >
            ← Back
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[0.78rem] text-(--text-faint) font-sans">
              Step {currentStep} of 8
            </span>
            {saveError && (
              <span className="text-[0.78rem] text-(--danger) font-sans font-semibold">
                {saveError}
              </span>
            )}
          </div>

          {currentStep < 8 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`btn-primary ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving…' : 'Create Investigator ✓'}
            </button>
          )}
        </div>
      </main>

      <ConfirmDialog {...dialogProps} />

      <Footer />
    </div>
  );
}
