// Frontend feature flags.
//
// These mirror backend env flags but live separately because the frontend
// bundle cannot read backend environment variables. Flipping a flag here
// requires a frontend rebuild/redeploy.
//
// CREATION_ENGINE_ENABLED — when false, the character creation wizard is
// taken offline (route blocked + dashboard "Create New" hidden). Dhole's
// House import is unaffected. Re-enabling requires setting this back to true
// AND setting CREATION_ENGINE_ENABLED in the backend env (see characters.js).
export const CREATION_ENGINE_ENABLED = false;
