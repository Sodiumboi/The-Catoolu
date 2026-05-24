import { useEffect, useRef } from 'react';
import RollCard      from './RollCard';
import ChatBubble    from './ChatBubble';
import StatValueCard from './StatValueCard';

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

export default function RollFeed({ messages, currentUserId }) {
  const bottomRef     = useRef(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    prevLengthRef.current = messages.length;
  }, []);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const visible = messages;

  return (
    <div style={{
      flex:      1,
      overflowY: 'auto',
      padding:   '16px',
    }}>
      {visible.map((msg, i) => {
        const isOwn = msg.user_id === currentUserId;
        if (msg.type === 'system')    return <SystemMessage  key={msg.id || i} msg={msg} />;
        if (msg.type === 'roll')      return <RollCard       key={msg.id || i} msg={msg} isOwn={isOwn} />;
        if (msg.type === 'stat_change') return <StatValueCard key={msg.id || i} msg={msg} isOwn={isOwn} />;
        // Chat messages that carry stat-change JSON (stored as 'chat' due to DB constraint)
        if (msg.type === 'chat') {
          try {
            const d = JSON.parse(msg.content);
            if (d?.stat) return <StatValueCard key={msg.id || i} msg={msg} isOwn={isOwn} />;
          } catch {}
        }
        return <ChatBubble key={msg.id || i} msg={msg} isOwn={isOwn} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}