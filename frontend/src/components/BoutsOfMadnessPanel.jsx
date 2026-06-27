import { useState, useEffect, useRef } from 'react';
import { TEMPORARY_BOUTS, INDEFINITE_BOUTS } from '../data/boutsOfMadness';
import { SAMPLE_PHOBIAS, SAMPLE_MANIAS } from '../data/samplePhobiasManias';

const VIEWS = ['temporary', 'indefinite', 'phobias', 'manias'];

export default function BoutsOfMadnessPanel() {
  const [view, setView]         = useState('temporary');
  const [expanded, setExpanded] = useState(null);

  const segRefs       = useRef({});
  const segContainerRef = useRef(null);
  const [pillBounds, setPillBounds] = useState(null);

  // Measure the active segment vs the container so the single pill can
  // slide/morph between the 4 views. Uses offsetLeft/offsetWidth (relative to
  // the position:relative container's padding box) so the pill aligns with the
  // padding box rather than the bordered border box — avoids edge clipping.
  useEffect(() => {
    const el = segRefs.current[view];
    if (!el) {
      setPillBounds(null);
      return;
    }
    setPillBounds({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view]);

  // Re-measure on container resize. The 4 segments are flex:1, so their widths
  // depend on the (user-resizable) panel width; without this the pill bounds go
  // stale and the pill/track overflow. The observer also fires once on initial
  // layout, covering mount/font-load timing.
  useEffect(() => {
    const container = segContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const el = segRefs.current[view];
      if (!el) return;
      setPillBounds({ left: el.offsetLeft, width: el.offsetWidth });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [view]);

  const rows = view === 'temporary'  ? TEMPORARY_BOUTS
             : view === 'indefinite' ? INDEFINITE_BOUTS
             : view === 'phobias'    ? SAMPLE_PHOBIAS
             :                         SAMPLE_MANIAS;

  return (
    <div style={{ padding: '12px' }}>
      {/* Panel title */}
      <div style={{
        fontSize:      '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color:         'var(--text-muted)',
        fontFamily:    'var(--font-sans)',
        marginBottom:  '8px',
      }}>
        Madness Reference
      </div>

      {/* 4-way segmented pill control — matches RoomSubNav pill treatment */}
      <div
        ref={segContainerRef}
        style={{
          position:     'relative',
          display:      'flex',
          alignItems:   'center',
          gap:          '4px',
          padding:      '3px',
          marginBottom: '12px',
          borderRadius: '999px',
          background:   'var(--bg-section-hd)',
          border:       '1px solid var(--border-main)',
        }}
      >
        {/* Single sliding pill — morphs behind the active segment */}
        {pillBounds && (
          <div
            style={{
              position:      'absolute',
              top:           '3px',
              bottom:        '3px',
              left:          pillBounds.left,
              width:         pillBounds.width,
              borderRadius:  '999px',
              background:    'var(--accent-bg)',
              border:        '1.5px solid var(--color-primary)',
              zIndex:        0,
              pointerEvents: 'none',
              transition:    'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {VIEWS.map(v => {
          const isActive = view === v;
          return (
            <button
              key={v}
              ref={el => { segRefs.current[v] = el; }}
              onClick={() => { setView(v); setExpanded(null); }}
              style={{
                position:       'relative',
                zIndex:         1,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '5px 14px',
                borderRadius:   '999px',
                background:     'transparent',
                border:         '1.5px solid transparent',
                color:          isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily:     'var(--font-sans)',
                fontSize:       '12px',
                fontWeight:     isActive ? '600' : '400',
                cursor:         'pointer',
                transition:     'color 0.15s ease-in-out',
                whiteSpace:     'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {v === 'temporary' ? 'Temp' : v === 'indefinite' ? 'Indef' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Sub-label for roll range */}
      <div style={{
        fontSize:     '10px',
        color:        'var(--text-faint)',
        marginBottom: '8px',
        fontFamily:   'var(--font-sans)',
      }}>
        {view === 'phobias' || view === 'manias' ? 'Roll 1D100' : 'Roll 1D10'}
      </div>

      {/* Accordion rows */}
      {rows.map(entry => {
        const isOpen = expanded === entry.roll;
        return (
          <div
            key={entry.roll}
            style={{ borderBottom: '1px solid var(--border-main)' }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : entry.roll)}
              style={{
                width:      '100%',
                display:    'flex',
                alignItems: 'center',
                gap:        '8px',
                padding:    '6px 0',
                background: 'transparent',
                border:     'none',
                cursor:     'pointer',
                textAlign:  'left',
              }}
            >
              {/* Roll number badge — wide enough for two digits, never clipped */}
              <span style={{
                fontSize:    '13px',
                fontWeight:  '700',
                color:       'var(--accent)',
                minWidth:    '30px',
                flexShrink:  0,
                textAlign:   'left',
                lineHeight:  '1.4',
                whiteSpace:  'nowrap',
                fontFamily:  'var(--font-sans)',
              }}>
                {entry.roll}
              </span>

              {/* Name */}
              <span style={{
                flex:       1,
                fontSize:   '13px',
                color:      'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                lineHeight: '1.4',
              }}>
                {entry.name}
              </span>

              {/* Chevron — rotates 180deg when open */}
              <span className="icon" style={{
                fontSize:   '14px',
                color:      'var(--text-muted)',
                transition: 'transform 0.15s ease-in-out',
                transform:  isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                expand_more
              </span>
            </button>

            {/* Description — only when expanded */}
            {isOpen && (
              <div
                className="animate-fade"
                style={{
                  padding:    '0 0 8px 38px',
                  fontSize:   '12px',
                  color:      'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {entry.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
