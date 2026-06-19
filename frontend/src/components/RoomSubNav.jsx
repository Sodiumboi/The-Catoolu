export default function RoomSubNav({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display:       'flex',
      flexShrink:    0,
      background:    'var(--bg-card)',
      borderBottom:  '1px solid var(--border-main)',
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={tab.comingSoon ? undefined : () => onTabChange(tab.id)}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '8px 14px',
              background:     'none',
              border:         'none',
              borderBottom:   isActive
                ? '2px solid var(--accent)'
                : '2px solid transparent',
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
              transition:     'color 0.15s ease, border-color 0.15s ease',
              whiteSpace:     'nowrap',
              marginBottom:   '-1px',
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
  );
}
