import { createPortal } from 'react-dom';

function lookupValue(charData, rollType, rollName) {
  if (!charData?.sheet_data?.Investigator) return null;
  const inv = charData.sheet_data.Investigator;
  if (rollType === 'stat') {
    return parseInt(inv.Characteristics?.[rollName]) || null;
  }
  const skills = inv?.Skills?.Skill || [];
  for (const s of skills) {
    const display = s.subskill && s.subskill.toLowerCase() !== 'none'
      ? s.name + ' (' + s.subskill + ')'
      : s.name;
    if (display === rollName || s.name === rollName) {
      return parseInt(s.value) || null;
    }
  }
  return null;
}

export default function RollRequestPill({ requests, myCharFullData, onRoll, onDismiss }) {
  if (!requests.length) return null;

  return createPortal(
    <div style={{
      position:      'fixed',
      bottom:        '20px',
      right:         '20px',
      zIndex:        500,
      display:       'flex',
      flexDirection: 'column',
      gap:           '8px',
      alignItems:    'flex-end',
    }}>
      {requests.map(req => {
        const resolved = req.rollValue ?? lookupValue(myCharFullData, req.rollType, req.rollName);
        const canRoll  = resolved != null;

        return (
          <div
            key={req.requestId}
            style={{
              background:   'var(--bg-card)',
              border:       '1.5px solid var(--accent)',
              borderRadius: '12px',
              padding:      '14px 16px',
              boxShadow:    'var(--shadow-card)',
              minWidth:     '260px',
              maxWidth:     '320px',
              animation:    'popIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both, pulse-accent 2s 220ms infinite',
            }}
          >
            <div style={{
              fontSize:     '11px',
              color:        'var(--text-muted)',
              marginBottom: '4px',
              fontFamily:   'var(--font-sans)',
              display:      'flex',
              alignItems:   'center',
              gap:          '4px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>casino</span>
              Keeper requests:
            </div>
            <div style={{
              fontFamily:   'var(--font-serif)',
              fontSize:     '16px',
              color:        'var(--text-primary)',
              marginBottom: '12px',
            }}>
              {req.rollName}
              {resolved != null && (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({resolved})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onRoll(req.rollName, resolved, req.requestId)}
                disabled={!canRoll}
                style={{
                  flex:         1,
                  padding:      '6px 12px',
                  background:   canRoll ? 'var(--accent)' : 'var(--bg-section-hd)',
                  color:        canRoll ? '#fff' : 'var(--text-faint)',
                  border:       'none',
                  borderRadius: '6px',
                  cursor:       canRoll ? 'pointer' : 'not-allowed',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                  fontWeight:   '500',
                  transition:   'opacity 0.1s',
                }}
              >
                Roll
              </button>
              <button
                onClick={() => onDismiss(req.requestId)}
                style={{
                  padding:      '6px 12px',
                  background:   'none',
                  color:        'var(--text-muted)',
                  border:       '1px solid var(--border-main)',
                  borderRadius: '6px',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
