import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import wojak from '../assets/wojak-pointing.png';
// ⚠ Add a wojak-pointing.png to src/assets/ before this step

export default function CelebrationOverlay({ type, onDone }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Fire confetti from both sides
    const fire = (origin) => confetti({
      particleCount: 120,
      spread:        80,
      origin,
      colors: type === 'fumble'
        ? ['#7f0000', '#ff6b6b', '#1a0000']
        : ['#3B6D11', '#C0DD97', '#F59E0B', '#9333EA'],
    });

    fire({ x: 0.2, y: 0.6 });
    fire({ x: 0.8, y: 0.6 });

    // Auto dismiss after 4 seconds
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, []);

  const isCritical = type === 'critical';

  return (
    <div
      onClick={onDone}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         1000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '16px',
        cursor:         'pointer',
        background:     isCritical
          ? 'rgba(245,158,11,0.15)'
          : 'rgba(127,0,0,0.15)',
        backdropFilter: 'blur(2px)',
        animation:      'fadeIn 0.3s ease',
      }}
    >
      <img
        src={wojak}
        alt={isCritical ? 'Critical Success!' : 'Fumble!'}
        style={{
          maxWidth:  '320px',
          maxHeight: '320px',
          objectFit: 'contain',
          filter:    'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
          animation: 'popIn 0.3s ease',
        }}
      />
      <div style={{
        fontFamily:  'var(--font-serif)',
        fontSize:    '48px',
        color:       isCritical ? '#F59E0B' : '#ff6b6b',
        fontWeight:  '700',
        textShadow:  '0 2px 16px rgba(0,0,0,0.5)',
        animation:   'popIn 0.4s ease',
      }}>
        {isCritical ? '⭐ NAT ONE! ⭐' : '💀 FUMBLE! 💀'}
      </div>
      <div style={{
        fontSize:  '13px',
        color:     'rgba(255,255,255,0.6)',
        fontStyle: 'italic',
      }}>
        Click to dismiss
      </div>
    </div>
  );
}
