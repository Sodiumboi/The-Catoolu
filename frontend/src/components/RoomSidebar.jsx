import { useState } from 'react';
import FairnessTester from './FairnessTester';

const TABS = [
  { id: 'chat',     icon: 'chat',     label: 'Chat',     hasPanel: false },
  { id: 'players',  icon: 'group',    label: 'Players',  hasPanel: true  },
  { id: 'settings', icon: 'settings', label: 'Settings', hasPanel: true  },
];

export default function RoomSidebar({
  activeTab, onTabChange,
  members, onlineUsers, myRole,
  myCharacter, myCharacters,
  onChangeCharacter,
  campaignId,
}) {
  return (
    <div style={{
      display:      'flex',
      flexDirection:'row',
      borderLeft:   '1px solid var(--border-main)',
    }}>

      {/* Icon tab strip */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        borderLeft:     '1px solid var(--border-main)',
        padding:        '8px 0',
        gap:            '4px',
        width:          '44px',
        flexShrink:     0,
        background:     'var(--bg-card)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            style={{
              width:        '36px',
              height:       '36px',
              borderRadius: '8px',
              border:       'none',
              background:   activeTab === tab.id && tab.hasPanel
                ? 'var(--accent-bg)'
                : 'transparent',
              cursor:       'pointer',
              fontSize:     '16px',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              transition:   'background 0.1s ease',
              outline:      activeTab === tab.id && tab.hasPanel
                ? '1.5px solid var(--accent)'
                : 'none',
            }}
            onMouseEnter={e => {
              if (!(activeTab === tab.id && tab.hasPanel))
                e.currentTarget.style.background = 'var(--row-hover)';
            }}
            onMouseLeave={e => {
              if (!(activeTab === tab.id && tab.hasPanel))
                e.currentTarget.style.background = 'transparent';
            }}
          >
            <span className="icon icon-md">{tab.icon}</span>
          </button>
        ))}

        {/* Help at bottom */}
        <button
          onClick={() => onTabChange('help')}
          title="Help"
          style={{
            width:        '36px',
            height:       '36px',
            borderRadius: '8px',
            border:       'none',
            background:   activeTab === 'help' ? 'var(--accent-bg)' : 'transparent',
            cursor:       'pointer',
            fontSize:     '14px',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            marginTop:    'auto',
          }}
        >
          <span className="icon icon-md">help</span>
        </button>
      </div>

      {/* Panel — only rendered when a panel tab is active */}
      {activeTab !== 'chat' && (
        <div style={{
          width:     '236px',
          flexShrink:0,
          overflowY: 'auto',
          padding:   '12px',
          borderLeft:'1px solid var(--border-main)',
          background:'var(--bg-card)',
        }}>
          {activeTab === 'players'  && (
            <PlayersPanel
              members={members}
              onlineUsers={onlineUsers}
              myRole={myRole}
              myCharacter={myCharacter}
              myCharacters={myCharacters}
              onChangeCharacter={onChangeCharacter}
            />
          )}
          {activeTab === 'settings' && <SettingsPanel campaignId={campaignId} />}
          {activeTab === 'help'     && <HelpPanel />}
        </div>
      )}
    </div>
  );
}

// ── Players panel ─────────────────────────────────────────────
function PlayersPanel({ members, onlineUsers, myRole, myCharacter, myCharacters, onChangeCharacter }) {
  const onlineIds = new Set(onlineUsers.map(u => u.id));

  return (
    <div>
      <SectionLabel>Online ({onlineUsers.length})</SectionLabel>
      {onlineUsers.map(u => (
        <MemberRow
          key={u.id}
          member={u}
          isOnline={true}
          status={u.afk ? 'afk' : 'online'}
        />
      ))}

      <SectionLabel style={{ marginTop: '12px' }}>
        All Members ({members.length})
      </SectionLabel>
      {members.map(m => (
        <MemberRow
          key={m.id}
          member={m}
          isOnline={onlineIds.has(m.id)}
          status={onlineUsers.find(u => u.id === m.id)?.afk ? 'afk' : 'online'}
        />
      ))}

      {/* Change my character */}
      <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '12px', marginTop: '12px' }}>
        <SectionLabel>Playing as</SectionLabel>
        <select
          value={myCharacter?.id || ''}
          onChange={e => {
            const found = myCharacters.find(c => c.id === parseInt(e.target.value));
            onChangeCharacter(found || null);
          }}
          style={{
            width:        '100%',
            padding:      '7px 10px',
            borderRadius: '8px',
            border:       '1px solid var(--border-input)',
            background:   'var(--bg-input)',
            color:        'var(--text-primary)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '13px',
            outline:      'none',
            cursor:       'pointer',
          }}
        >
          <option value="">— Decide later —</option>
          {myCharacters.map(c => {
            const name = c.name || 'Unnamed';
            const occ  = c.occupation || '';
            return (
              <option key={c.id} value={c.id}>
                {name}{occ ? ' — ' + occ : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────
function SettingsPanel({ campaignId }) {
  return (
    <div>
      <SectionLabel>Campaign Settings</SectionLabel>
      <p style={{
        fontSize:  '13px',
        color:     'var(--text-faint)',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingTop:'20px',
      }}>
        More settings coming soon.
      </p>
    </div>
  );
}

// ── Help panel ────────────────────────────────────────────────
function HelpPanel() {
  const rows = [
    { notation: '/roll 1d100',    desc: 'Roll percentile dice' },
    { notation: '/roll 1d100adv', desc: 'Roll with advantage (take lower)' },
    { notation: '/roll 1d100dis', desc: 'Roll with disadvantage (take higher)' },
    { notation: '/roll 2d6+3',    desc: 'Roll 2d6 and add 3' },
    { notation: 'Click a stat',   desc: 'Roll against that stat value' },
    { notation: 'Click a skill',  desc: 'Roll against that skill value' },
    { notation: 'Shift + Send',   desc: '🎉 Easter egg' },
  ];

  return (
    <div>
      <FairnessTester />

      <div style={{ borderTop: '1px solid var(--border-main)', margin: '16px 0 12px' }} />

      <SectionLabel>How Rolls Work</SectionLabel>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.6' }}>
        In Call of Cthulhu 7e, lower rolls are better. You want to roll
        under your skill value. Advantage means rolling twice and taking
        the lower result.
      </p>

      <SectionLabel>Success Levels</SectionLabel>
      {[
        { label: 'Critical',  emoji: '⭐', desc: 'Roll of 01' },
        { label: 'Extreme',   emoji: '🟣', desc: 'Roll ≤ skill ÷ 5' },
        { label: 'Hard',      emoji: '🔵', desc: 'Roll ≤ skill ÷ 2' },
        { label: 'Regular',   emoji: '🟢', desc: 'Roll ≤ skill value' },
        { label: 'Failure',   emoji: '❌', desc: 'Roll > skill value' },
        { label: 'Fumble',    emoji: '💀', desc: 'Roll 00 (skill ≥50: only 00)' },
      ].map(row => (
        <div key={row.label} style={{
          display:       'flex',
          gap:           '8px',
          alignItems:    'center',
          padding:       '5px 0',
          borderBottom:  '1px solid var(--border-main)',
          fontSize:      '12px',
          fontFamily:    'var(--font-sans)',
        }}>
          <span>{row.emoji}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '500', minWidth: '64px' }}>
            {row.label}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{row.desc}</span>
        </div>
      ))}

      <SectionLabel style={{ marginTop: '12px' }}>Commands</SectionLabel>
      {rows.map(row => (
        <div key={row.notation} style={{
          padding:    '5px 0',
          borderBottom:'1px solid var(--border-main)',
          fontSize:   '12px',
        }}>
          <code style={{
            fontFamily:   'monospace',
            color:        'var(--accent)',
            fontSize:     '11px',
            background:   'var(--accent-bg)',
            padding:      '1px 5px',
            borderRadius: '4px',
          }}>
            {row.notation}
          </code>
          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
            {row.desc}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────
function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize:      '10px',
      fontWeight:    '600',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color:         'var(--text-muted)',
      marginBottom:  '8px',
      fontFamily:    'var(--font-sans)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function MemberRow({ member, isOnline, status }) {
  const isAfk = status === 'afk';
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '8px',
      padding:    '4px 0',
    }}>
      <span style={{
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   !isOnline ? 'var(--text-faint)'
                    : isAfk    ? '#EAB308'
                    : '#22c55e',
        flexShrink:   0,
      }} />
      <span style={{
        fontSize:  '13px',
        color:     isOnline ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily:'var(--font-sans)',
      }}>
        {member.username}
        {member.character_name && (
          <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: '6px' }}>
            {member.character_name.split(' ')[0]}
          </span>
        )}
      </span>
      {isAfk && (
        <span style={{ fontSize: '10px', color: '#EAB308', marginLeft: 'auto' }}>
          AFK
        </span>
      )}
      {member.role === 'keeper' && (
        <span style={{ fontSize: '10px', color: 'var(--accent)', marginLeft: 'auto' }}>
          Keeper
        </span>
      )}
    </div>
  );
}