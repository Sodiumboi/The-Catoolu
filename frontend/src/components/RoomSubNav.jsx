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
        className="relative flex items-center gap-1 p-[3px] rounded-full bg-(--bg-section-hd) border border-(--border-main)"
      >
        {/* Single sliding pill — morphs behind the active segment */}
        {pillBounds && (
          <div
            // left/width are runtime-measured (offsetLeft/offsetWidth) — stay inline
            className="absolute top-[3px] bottom-[3px] rounded-full bg-(--accent-bg) border-[1.5px] border-(--color-primary) z-0 pointer-events-none [transition:left_0.3s_cubic-bezier(0.4,0,0.2,1),width_0.3s_cubic-bezier(0.4,0,0.2,1)]"
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
              className={`relative z-1 flex items-center gap-1.5 py-1.25 px-3.5 rounded-full bg-transparent border-[1.5px] border-transparent font-sans text-[13px] font-medium [transition:color_0.15s_ease-in-out] whitespace-nowrap ${tab.comingSoon ? 'text-(--text-faint) cursor-default opacity-55' : isActive ? 'text-(--accent) cursor-pointer' : 'text-(--text-muted) cursor-pointer'}`}
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
