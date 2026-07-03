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
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-4 bg-(--bg-page)">
      {/* Accent ring spinner — continuous mechanical rotation */}
      <div className="w-9 h-9 rounded-full border-[3px] border-(--border-main) [border-top-color:var(--accent)] [animation:spin_0.8s_linear_infinite]" />

      {/* Rotating flavour text — keyed to remount and replay the fade on change */}
      <div
        key={msgIndex}
        className="animate-fade text-sm text-(--text-muted) italic font-serif"
      >
        {LOADING_MESSAGES[msgIndex]}
      </div>

      {/* Footer */}
      <div className="text-[11px] text-(--text-faint) font-sans">
        catoolu.quest
      </div>
    </div>
  );
}
