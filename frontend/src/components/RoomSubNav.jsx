import { useEffect, useRef, useState } from 'react';

export default function RoomSubNav({ tabs, activeTab, onTabChange, rightSlot }) {
  const containerRef = useRef(null);
  const tabRefs      = useRef({});
  const [pillBounds, setPillBounds] = useState(null);

  // Measure the active tab vs the container so the single pill can slide/morph
  // between segments. Uses offsetLeft/offsetWidth (relative to the
  // position:relative container's padding box) so the pill aligns with the
  // padding box rather than the bordered border box — avoids edge clipping.
  // Re-runs on active tab change and whenever the tab set changes (the array
  // can differ by role).
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (!el) {
      setPillBounds(null);
      return;
    }
    setPillBounds({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab, tabs]);

  // Re-measure on container resize so the pill stays aligned when layout
  // changes. The observer also fires once on initial layout, covering
  // mount/font-load timing.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const el = tabRefs.current[activeTab];
      if (!el) return;
      setPillBounds({ left: el.offsetLeft, width: el.offsetWidth });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      flexShrink:    0,
      gap:           '8px',
      padding:       '8px 10px',
      background:    'var(--bg-card)',
      borderBottom:  '1px solid var(--border-main)',
    }}>
      {/* Segmented pill container */}
      <div
        ref={containerRef}
        style={{
          position:     'relative',
          display:      'flex',
          alignItems:   'center',
          gap:          '4px',
          padding:      '3px',
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

        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={el => { tabRefs.current[tab.id] = el; }}
              onClick={tab.comingSoon ? undefined : () => onTabChange(tab.id)}
              style={{
                position:       'relative',
                zIndex:         1,
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '5px 14px',
                borderRadius:   '999px',
                background:     'transparent',
                border:         '1.5px solid transparent',
                color:          tab.comingSoon
                  ? 'var(--text-faint)'
                  : isActive
                    ? 'var(--accent)'
                    : 'var(--text-muted)',
                fontFamily:     'var(--font-sans)',
                fontSize:       '13px',
                fontWeight:     isActive ? '600' : '400',
                cursor:         tab.comingSoon ? 'default' : 'pointer',
                opacity:        tab.comingSoon ? 0.55 : 1,
                transition:     'color 0.15s ease-in-out',
                whiteSpace:     'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive && !tab.comingSoon)
                  e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={e => {
                if (!isActive && !tab.comingSoon)
                  e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  marginLeft: 2, background: '#3B6D11', color: '#EAF3DE',
                  fontSize: 9, padding: '1px 4px', borderRadius: 10, lineHeight: '1.4',
                }}>
                  {tab.badge}
                </span>
              )}
              {tab.comingSoon && (
                <span style={{
                  fontSize:       '10px',
                  fontWeight:     '600',
                  letterSpacing:  '0.04em',
                  background:     'var(--bg-section-hd)',
                  border:         '1px solid var(--border-main)',
                  borderRadius:   '4px',
                  padding:        '1px 5px',
                  color:          'var(--text-faint)',
                  lineHeight:     '1.4',
                }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {rightSlot && (
        <div style={{
          marginLeft:  'auto',
          display:     'flex',
          alignItems:  'center',
          paddingRight:'4px',
        }}>
          {rightSlot}
        </div>
      )}
    </div>
  );
}
