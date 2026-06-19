import { useEffect, useRef, useState } from 'react';
import { useTheme }      from '../context/ThemeContext';
import RollCard          from './RollCard';
import ChatBubble        from './ChatBubble';
import StatValueCard     from './StatValueCard';
import HandoutShareCard  from './handouts/HandoutShareCard';

function SystemMessage({ msg }) {
  return (
    <div style={{
      textAlign:  'center',
      padding:    '6px 0',
      fontSize:   '12px',
      color:      'var(--text-faint)',
      fontStyle:  'italic',
      fontFamily: 'var(--font-sans)',
    }}>
      — {msg.content} —
    </div>
  );
}

export default function RollFeed({ messages, currentUserId, myRole, onDeleteMessage }) {
  const { feedBackground } = useTheme();
  const containerRef   = useRef(null);
  const innerRef       = useRef(null);
  const atBottomRef    = useRef(true);
  const initialDoneRef = useRef(false);
  const prevLengthRef  = useRef(0);
  const pinUntilRef    = useRef(0);   // force-pin to bottom through card reveals / image loads
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  };

  const handleJump = () => {
    atBottomRef.current = true;
    pinUntilRef.current = Date.now() + 600;
    setShowJump(false);
    scrollToBottom();
  };

  // Initial load + new messages
  useEffect(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;

    if (!initialDoneRef.current) {
      // First batch of messages: wait for the browser to finish flex layout
      // before measuring scrollHeight (useLayoutEffect is too early here).
      // Double rAF ensures the scroll runs after layout is committed.
      initialDoneRef.current = true;
      atBottomRef.current    = true;
      prevLengthRef.current  = messages.length;
      pinUntilRef.current    = Date.now() + 1500;  // cover staggered reveals + image loads
      requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
      return;
    }

    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      if (atBottomRef.current) {
        pinUntilRef.current = Date.now() + 800;   // cover the new card's reveal
        scrollToBottom();
      }
    }
  }, [messages.length]);

  // Re-scroll when content height grows (skeleton→reveal, images loading).
  // The pin window keeps us glued to the bottom even if a stray scroll event
  // (e.g. from a card revealing above the fold) briefly flips atBottom.
  useEffect(() => {
    const inner = innerRef.current;
    const el    = containerRef.current;
    if (!inner || !el) return;
    const ro = new ResizeObserver(() => {
      if (atBottomRef.current || Date.now() < pinUntilRef.current) scrollToBottom();
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const isKeeper = myRole === 'keeper';

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className={feedBackground ? 'roll-feed-bg' : undefined}
        style={{ flex: 1, overflowY: 'auto', overflowAnchor: 'none', padding: '16px' }}
      >
        <div ref={innerRef}>
        {messages.map((msg, i) => {
          const isOwn     = msg.user_id === currentUserId;
          const canDelete = isOwn || isKeeper;
          if (msg.type === 'system')        return <SystemMessage key={msg.id || i} msg={msg} />;
          if (msg.type === 'roll')          return <RollCard      key={msg.id || i} msg={msg} isOwn={isOwn} />;
          if (msg.type === 'stat_change')   return <StatValueCard key={msg.id || i} msg={msg} isOwn={isOwn} />;
          if (msg.type === 'handout_share') return (
            <HandoutShareCard
              key={msg.id || i}
              msg={msg}
              isOwn={isOwn}
              canDelete={isKeeper}
              onDelete={onDeleteMessage}
            />
          );
          if (msg.type === 'chat') {
            try {
              const d = JSON.parse(msg.content);
              if (d?.stat) return <StatValueCard key={msg.id || i} msg={msg} isOwn={isOwn} />;
            } catch {}
          }
          return (
            <ChatBubble
              key={msg.id || i}
              msg={msg}
              isOwn={isOwn}
              canDelete={canDelete}
              onDelete={onDeleteMessage}
            />
          );
        })}
        </div>
      </div>

      {showJump && (
        <button
          onClick={handleJump}
          className="animate-pop"
          style={{
            position:     'absolute',
            bottom:       '14px',
            left:         '50%',
            transform:    'translateX(-50%)',
            display:      'flex',
            alignItems:   'center',
            gap:          '5px',
            padding:      '6px 14px',
            borderRadius: '20px',
            border:       'none',
            background:   'var(--accent)',
            color:        '#fff',
            fontFamily:   'var(--font-sans)',
            fontSize:     '12px',
            fontWeight:   600,
            cursor:       'pointer',
            boxShadow:    'var(--shadow-dropdown)',
            zIndex:       5,
          }}
        >
          <span className="icon icon-sm">arrow_downward</span>
          Jump to present
        </button>
      )}
    </div>
  );
}
