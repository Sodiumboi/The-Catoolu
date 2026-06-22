// ── useVersionCheck ─────────────────────────────────────────
// On mount, checks the GitHub Releases API for the latest release
// tag, then re-checks once per hour. If newer than APP_VERSION,
// exposes update info so the NavBar/Footer can show an "update" pill.
//
// Silent-fail by design: any network/parse error is swallowed and
// simply leaves updateAvailable = false. At ~24 calls/day this stays
// well under GitHub's 60/hr unauthenticated limit, so no auth header.

import { useState, useEffect } from 'react';
import { APP_VERSION, GITHUB_REPO } from '../config/version';

// 1 hour between checks.
const CHECK_INTERVAL = 60 * 60 * 1000;
// Initial delay so the first check doesn't compete with auth/initial load.
const INITIAL_DELAY = 3000;

// Strip a leading "v" (e.g. "v1.6a" → "1.6a") and trim.
function parseVersion(tag) {
  return String(tag || '').trim().replace(/^v/i, '');
}

// Normalized string inequality — true when remote differs from local.
function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  return a !== '' && a !== b;
}

export default function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion,   setLatestVersion]   = useState(null);
  const [releaseUrl,      setReleaseUrl]      = useState(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { Accept: 'application/vnd.github+json' } }
        );
        if (!res.ok) return; // silent-fail

        const data = await res.json();
        if (cancelled) return;

        const tag = data?.tag_name;
        if (tag && isNewer(tag, APP_VERSION)) {
          setLatestVersion(parseVersion(tag));
          setReleaseUrl(data?.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`);
          setUpdateAvailable(true);
        }
      } catch {
        // Silent-fail: leave updateAvailable = false.
      }
    };

    // First check shortly after mount, then hourly.
    const timer = setTimeout(check, INITIAL_DELAY);
    const interval = setInterval(check, CHECK_INTERVAL);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return { updateAvailable, latestVersion, releaseUrl };
}
