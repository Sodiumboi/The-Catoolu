// ── App version + release source ───────────────────────────
// Single source of truth for the running app version.
// Footer and About page import APP_VERSION from here.
// useVersionCheck compares APP_VERSION against the latest
// GitHub release tag for GITHUB_REPO.

export const APP_VERSION = '1.6b';

// Per-release codename. Edit this here on each release, alongside APP_VERSION.
export const APP_CODENAME = 'Atlach-Nacha - High Moor';

// owner/repo slug used for the GitHub Releases API.
// Verified against `git remote -v` — origin = Sodiumboi/The-Catoolu.
export const GITHUB_REPO = 'Sodiumboi/The-Catoolu';
