import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Gathering the investigators…',
  'Consulting the Necronomicon…',
  'Rolling for sanity…',
  'The stars are almost right…',
  'Checking for tentacles…',
  'Bribing the dice gods…',
  'The Keeper is watching…',
  'Shuffling the encounter deck…',
  'Waking the sleeper…',
  "Ph'nglui mglw'nafh…",
];

export default function RoomLoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(
    () => Math.floor(Math.random() * LOADING_MESSAGES.length)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '16px',
      background:     'var(--bg-page)',
    }}>
      {/* Accent ring spinner — continuous mechanical rotation */}
      <div style={{
        width:         '36px',
        height:        '36px',
        borderRadius:  '50%',
        border:        '3px solid var(--border-main)',
        borderTopColor:'var(--accent)',
        animation:     'spin 0.8s linear infinite',
      }} />

      {/* Rotating flavour text — keyed to remount and replay the fade on change */}
      <div
        key={msgIndex}
        className="animate-fade"
        style={{
          fontSize:   '14px',
          color:      'var(--text-muted)',
          fontStyle:  'italic',
          fontFamily: 'var(--font-serif)',
        }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </div>

      {/* Footer */}
      <div style={{
        fontSize:   '11px',
        color:      'var(--text-faint)',
        fontFamily: 'var(--font-sans)',
      }}>
        catoolu.quest
      </div>
    </div>
  );
}
