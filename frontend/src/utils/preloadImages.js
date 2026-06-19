// Warm the browser cache for a set of image URLs so they render instantly
// when the page that uses them is later visited. De-duped per session.

const requested = new Set();

export function preloadImages(urls = []) {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    if (!url || requested.has(url)) continue;
    requested.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url; // kicks off the fetch; the browser caches the response
  }
}

// Run a preload when the browser is idle (falls back to a short timeout),
// so it never competes with the initial app render. Returns a cleanup fn.
export function preloadWhenIdle(urls = []) {
  const run = () => preloadImages(urls);
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback?.(id);
  }
  const t = setTimeout(run, 1500);
  return () => clearTimeout(t);
}
