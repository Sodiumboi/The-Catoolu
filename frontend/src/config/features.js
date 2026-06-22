// Frontend feature flags.
//
// These mirror backend env flags but live separately because the frontend
// bundle cannot read backend environment variables. Flipping a flag here
// requires a frontend rebuild/redeploy.
//
// CREATION_ENGINE_ENABLED — when false, the character creation wizard is
// taken offline (route blocked + dashboard "Create New" grayed out). Dhole's
// House import is unaffected.
//
// Driven by VITE_CREATION_ENGINE_ENABLED so it can be flipped per-environment
// without editing source:
//   • local dev → set VITE_CREATION_ENGINE_ENABLED=true in frontend/.env.local
//     (gitignored) to access /create
//   • production → CI leaves the var unset, so it stays false (disabled)
// Full end-to-end creation also needs CREATION_ENGINE_ENABLED in the backend
// env to not be "false" (see characters.js).
export const CREATION_ENGINE_ENABLED =
  import.meta.env.VITE_CREATION_ENGINE_ENABLED === 'true';
