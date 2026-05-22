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

export default function RollFeed({ messages, currentUserId, chatFilter }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visible = chatFilter === 'text'
    ? messages.filter(m => m.type !== 'roll')
    : messages;

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
        if (msg.type === 'stat_change') return <StatValueCard key={msg.id || i} msg={msg} />;
        return <ChatBubble key={msg.id || i} msg={msg} isOwn={isOwn} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}