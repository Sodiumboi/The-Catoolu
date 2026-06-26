import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Asset paths ───────────────────────────────────────────────
// Files live in frontend/public/assets/bg/Gr.a/ (Thai filenames).
// Pre-encoded so the browser/Nginx never has to guess the encoding.
const BG_BASE = '/assets/bg/Gr.a/';
const ASSET_STATIC = BG_BASE + '%E0%B8%A3%E0%B8%A7%E0%B8%A1.png'; // รวม (combined)
const ASSET_FRONT  = BG_BASE + '%E0%B8%AB%E0%B8%99%E0%B9%89%E0%B8%B2.png'; // หน้า (front)
const ASSET_MID    = BG_BASE + '%E0%B8%81%E0%B8%A5%E0%B8%B2%E0%B8%87.png'; // กลาง (mid)
const ASSET_BACK   = BG_BASE + '%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87.png'; // หลัง (back)

// ── Parallax tuning constants ─────────────────────────────────
// BASE_SCALE: static oversize applied to every layer as an edge-reveal buffer.
// transformOrigin is 'center' (symmetric), so scale(BASE_SCALE) puts ~3% overflow
// on ALL four sides (1.06 = 6% total).
// Worst-case at intensity=2.0: peak |tx|=|ty|=0.5*18*2=18px.
// At 600px tall viewport: vertical buffer = (1.06-1)/2*600 = 18px — borderline at
// MAX intensity on short screens; at default intensity=1.0 peak is 9px — safe.
// ZOOM only adds to scale (never subtracts); binding worst case is at corners
// (centerProximity≈0, scale≈BASE_SCALE). Nudge to 1.08–1.10 if an edge peeks.
const BASE_SCALE = 1.00;

// DIRECTION:
//   -1 = layers move OPPOSITE the cursor → "look-around / peer-behind" feel (default)
//   +1 = layers move WITH the cursor    → "push" feel
const DIRECTION = -1;

// Per-layer shift magnitudes (back → front), so the FRONT layer moves the MOST.
//   [back, mid, front] in pixels (at intensity = 1.0)
const SHIFT_X = [5, 11, 18];
const SHIFT_Y = [5, 11, 18];

// CHANGE 2: per-layer zoom magnitude added on top of BASE_SCALE when the
// cursor is near the viewport centre. [back, mid, front]
const ZOOM = [0.015, 0.025, 0.04];

// true  = zoom IN  when cursor is near centre (camera "leans in")
// false = zoom OUT near centre
const ZOOM_INTO_CENTER = true;

// Layers render back-to-front (index 0 = furthest back).
const LAYERS = [
  { src: ASSET_BACK  },
  { src: ASSET_MID   },
  { src: ASSET_FRONT },
];

// CHANGE 4: warehouse-lights stagger delays. Layers reveal FRONT → BACK.
// Index order matches LAYERS array ([back, mid, front]).
// Front (i=2) → 0ms delay, mid (i=1) → 150ms, back (i=0) → 300ms.
const LAYER_OPACITY_DELAY = ['300ms', '150ms', '0ms'];

// Per-theme visual treatment.
const THEME_STYLE = {
  light:  { filter: 'sepia(0.4) brightness(0.85)',                          mixBlendMode: 'multiply', opacity: 0.35 },
  dark:   { filter: 'brightness(0.5) contrast(1.1)',                        mixBlendMode: 'screen',   opacity: 0.25 },
  mud:    { filter: 'sepia(0.6) brightness(0.45)',                          mixBlendMode: 'screen',   opacity: 0.3  },
  marsh:  { filter: 'hue-rotate(100deg) brightness(0.45) saturate(0.8)',    mixBlendMode: 'screen',   opacity: 0.25 },
  sienna: { filter: 'sepia(0.5) brightness(0.9) hue-rotate(5deg)',          mixBlendMode: 'multiply', opacity: 0.3  },
  arcane: { filter: 'brightness(0.4) saturate(1.5) hue-rotate(250deg)',     mixBlendMode: 'screen',   opacity: 0.2  },
};

// Stable across a session — does not change once the page is loaded.
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LERP_FACTOR = 0.08;

// Base style shared by every animated layer image.
// Full-width / proportional-height / bottom-anchored rendering:
//   - width:100% + height:auto makes the image span the full viewport width with
//     no side-cropping; height scales proportionally to the intrinsic aspect ratio.
//   - bottom:0 pins the forest base to the viewport bottom edge.
//   - The wrapper's overflow:hidden clips any proportional height that exceeds the
//     viewport from the top (sky/treetops) — acceptable for this bottom-heavy art.
//   - No objectFit/objectPosition needed: the <img> is sized by its own dimensions.
// transformOrigin 'center bottom' so scale() grows upward from the forest base,
// keeping the bottom edge pinned during parallax zoom.
//
// CRITICAL — transition covers ONLY opacity (Change 4 warehouse cross-fade).
// transform is driven by rAF every frame and must NEVER be CSS-transitioned —
// including via 'all' shorthand — or it will stutter/lag.
const layerImgBaseStyle = {
  position:        'absolute',
  left:            0,
  right:           0,
  bottom:          0,
  width:           '100%',
  height:          'auto',
  transformOrigin: 'center bottom',
  willChange:      'transform',
  pointerEvents:   'none',
  userSelect:      'none',
};

export default function BackgroundArt() {
  const { theme, bgArtEnabled, parallaxEnabled, parallaxIntensity } = useTheme();

  // One ref per layer image. Per-frame transforms are written directly to the
  // DOM (not React state) so the rAF loop never triggers reconciliation.
  const layerRefs = useRef(LAYERS.map(() => null));

  // Keep intensity readable inside the rAF tick without re-subscribing the
  // listener on every slider move.
  const intensityRef = useRef(parallaxIntensity);
  useEffect(() => {
    intensityRef.current = parallaxIntensity;
  }, [parallaxIntensity]);

  // parallaxActive drives both the rAF loop and the warehouse-lights opacity.
  const parallaxActive = bgArtEnabled && parallaxEnabled && !reducedMotion;

  // ── rAF parallax loop (Changes 1 + 2) ────────────────────────────────────
  useEffect(() => {
    if (!parallaxActive) {
      // Reset layers to a sane rest position when parallax turns off so the
      // opacity cross-fade (Change 4) doesn't reveal a stale jumped transform.
      layerRefs.current.forEach((img) => {
        if (img) img.style.transform = `translate3d(0,0,0) scale(${BASE_SCALE})`;
      });
      return undefined;
    }

    const target  = { nx: 0, ny: 0 };
    const current = { nx: 0, ny: 0 };

    const onMouseMove = (e) => {
      target.nx = e.clientX / window.innerWidth  - 0.5;
      target.ny = e.clientY / window.innerHeight - 0.5;
    };

    let rafId = 0;

    const tick = () => {
      current.nx += (target.nx - current.nx) * LERP_FACTOR;
      current.ny += (target.ny - current.ny) * LERP_FACTOR;

      const intensity = intensityRef.current;

      // CHANGE 2: center-proximity zoom.
      // d = normalised distance from viewport centre (max ≈ 0.707 at corners).
      // centerProximity = 1 at centre, 0 at corners.
      const d = Math.hypot(current.nx, current.ny);
      const centerProximity = Math.max(0, 1 - d / 0.707);

      LAYERS.forEach((_, i) => {
        const img = layerRefs.current[i];
        if (!img) return;

        const tx = DIRECTION * current.nx * SHIFT_X[i] * intensity;
        const ty = DIRECTION * current.ny * SHIFT_Y[i] * intensity;

        // zoomDelta always ADDS to BASE_SCALE (positive), so scale never drops
        // below BASE_SCALE and the edge-buffer guarantee from Change 1 holds.
        // Binding worst case is corners where centerProximity≈0 → scale=BASE_SCALE.
        const zoomDelta = (ZOOM_INTO_CENTER ? 1 : -1) * centerProximity * ZOOM[i] * intensity;
        const scale = BASE_SCALE + zoomDelta;

        img.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${scale})`;
      });

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
    };
    // parallaxActive encodes bgArtEnabled + parallaxEnabled + reducedMotion.
    // intensityRef is excluded intentionally — read live inside tick.
  }, [parallaxActive]);

  // ── Render ────────────────────────────────────────────────────────────────
  const themeStyle = THEME_STYLE[theme] || THEME_STYLE.light;

  // CHANGE 3: smooth fade when toggling Background on/off.
  // The wrapper is ALWAYS mounted (never returns null) so toggling bgArtEnabled
  // fades opacity smoothly instead of hard-popping the element in/out.
  // Opacity is derived directly from bgArtEnabled — no duplicate state needed.
  //
  // No-flash guarantee: opacity is computed from bgArtEnabled at FIRST PAINT
  // (not from 0), so a page that loads with bgArtEnabled=true renders at the
  // correct opacity immediately with no CSS transition triggered.
  // The CSS transition only fires on SUBSEQUENT changes (user toggle).
  const wrapperStyle = {
    position:      'fixed',
    inset:         0,
    zIndex:        0,
    pointerEvents: 'none',
    overflow:      'hidden',
    filter:        themeStyle.filter,
    mixBlendMode:  themeStyle.mixBlendMode,
    opacity:       bgArtEnabled ? themeStyle.opacity : 0,
    transition:    'opacity 0.45s ease',
  };

  // CHANGE 4: warehouse-lights cross-fade between combined and depth layers.
  // Both images are always mounted. Their opacities swap based on parallaxActive.
  // Reduced-motion hard override: combined stays visible, layers stay at 0.
  const staticOpacity = parallaxActive ? 0 : 1;
  const layerOpacity  = parallaxActive ? 1 : 0;

  return (
    <div style={wrapperStyle} aria-hidden="true">
      {/* Combined static image — visible when parallax is off */}
      <img
        src={ASSET_STATIC}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position:        'absolute',
          left:            0,
          right:           0,
          bottom:          0,
          width:           '100%',
          height:          'auto',
          transformOrigin: 'center bottom',
          transform:       `scale(${BASE_SCALE})`,
          pointerEvents:   'none',
          userSelect:      'none',
          opacity:         staticOpacity,
          transition:      'opacity 0.5s ease',
        }}
      />

      {/* Depth layers — warehouse-lights stagger reveal front→back on enable */}
      {LAYERS.map((layer, i) => (
        <img
          key={layer.src}
          ref={(el) => { layerRefs.current[i] = el; }}
          src={layer.src}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            ...layerImgBaseStyle,
            // Seed transform at rest position; rAF will overwrite each frame.
            transform:  `translate3d(0,0,0) scale(${BASE_SCALE})`,
            opacity:    layerOpacity,
            // CRITICAL: transition covers ONLY opacity + the per-layer delay.
            // 'transform' must NEVER appear here — rAF drives it every frame.
            transition: `opacity 0.5s ease ${LAYER_OPACITY_DELAY[i]}`,
          }}
        />
      ))}
    </div>
  );
}
