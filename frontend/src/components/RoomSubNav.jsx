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
    <div className="flex items-center shrink-0 gap-2 py-2 px-2.5 bg-(--bg-card) border-b border-(--border-main)">
      {/* Segmented pill container */}
      <div
        ref={containerRef}
        className="pill-nav-container"
      >
        {/* Single sliding pill — morphs behind the active segment */}
        {pillBounds && (
          <div
            // left/width are runtime-measured (offsetLeft/offsetWidth) — stay inline
            className="pill-nav-indicator"
            style={{ left: pillBounds.left, width: pillBounds.width }}
          />
        )}

        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={el => { tabRefs.current[tab.id] = el; }}
              onClick={tab.comingSoon ? undefined : () => onTabChange(tab.id)}
              className={`pill-nav-tab flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'active' : ''} ${tab.comingSoon ? 'opacity-55' : ''}`}
              // 'soon' tabs override the shared class's muted colour + pointer
              // cursor (unlayered .pill-nav-tab wins over utilities, so inline)
              style={tab.comingSoon ? { color: 'var(--text-faint)', cursor: 'default' } : undefined}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-0.5 bg-[#3B6D11] text-[#EAF3DE] text-[9px] py-px px-1 rounded-[10px] leading-[1.4]">
                  {tab.badge}
                </span>
              )}
              {tab.comingSoon && (
                <span className="text-[10px] font-semibold tracking-[0.04em] bg-(--bg-section-hd) border border-(--border-main) rounded-sm py-px px-1.25 text-(--text-faint) leading-[1.4]">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {rightSlot && (
        <div className="ml-auto flex items-center pr-1">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
