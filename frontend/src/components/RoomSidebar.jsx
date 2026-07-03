import { useNavigate } from 'react-router-dom';
import FairnessTester from './FairnessTester';
import ConfirmDialog from './ConfirmDialog';
import CustomDropdown from './ui/CustomDropdown';
import ToggleRow from './ui/ToggleRow';
import Tooltip from './ui/Tooltip';
import useConfirm from '../hooks/useConfirm';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';

const TABS = [
  { id: 'players',  icon: 'group',    label: 'Players',  hasPanel: true },
  { id: 'settings', icon: 'settings', label: 'Settings', hasPanel: true },
];

export default function RoomSidebar({
  activeTab, onTabChange,
  members, onlineUsers, myRole,
  myCharacter, myCharacters,
  onChangeCharacter,
  campaignId,
  onLeave,
}) {
  const navigate = useNavigate();
  const { confirm, dialogProps } = useConfirm();

  const handleLeaveIconClick = async () => {
    const ok = await confirm({
      title: 'Disconnect from Room',
      message: "You'll stay on this page but leave the session. You can reconnect anytime.",
      confirmLabel: 'Disconnect',
      cancelLabel: 'Stay',
      variant: 'danger',
    });
    if (ok) onLeave();
  };

  const handleLeaveCampaign = async () => {
    const ok = await confirm({
      title: 'Quit Campaign',
      message: "You'll be removed from this campaign permanently. Your investigator will be unregistered. This cannot be undone.",
      confirmLabel: 'Quit Campaign',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/campaigns/${campaignId}/leave`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Leave campaign error:', err);
    }
  };

  return (
    <>
    <div className="flex flex-row border-l border-(--border-main)">

      {/* Icon tab strip */}
      <div className="flex flex-col items-center border-l border-(--border-main) py-2 px-0 gap-1 w-11 shrink-0 bg-(--bg-card)">
        {TABS.map(tab => (
          <Tooltip key={tab.id} content={tab.label} placement="left">
          <button
            onClick={() => onTabChange(tab.id)}
            className={`w-9 h-9 rounded-lg border-none cursor-pointer text-base flex items-center justify-center [transition:background_0.1s] ${activeTab === tab.id && tab.hasPanel ? 'bg-(--accent-bg) outline-[1.5px] outline-(--accent)' : 'bg-transparent outline-none'}`}
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
          </Tooltip>
        ))}

        {/* Leave + Help pinned to bottom */}
        <div className="mt-auto flex flex-col gap-1">
          <Tooltip content="Disconnect from Room" placement="left">
            <button
              onClick={handleLeaveIconClick}
              className="w-9 h-11.5 rounded-lg border-none bg-transparent text-(--danger) cursor-pointer flex flex-col items-center justify-center gap-0.5 [transition:background_0.12s]"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="icon icon-md">logout</span>
              <span className="text-[8px] font-sans font-semibold tracking-[0.04em] leading-none">EXIT</span>
            </button>
          </Tooltip>
          <Tooltip content="Help" placement="left">
          <button
            onClick={() => onTabChange('help')}
            className={`w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center ${activeTab === 'help' ? 'bg-(--accent-bg)' : 'bg-transparent'}`}
          >
            <span className="icon icon-md">help</span>
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Panel — slides in/out via width transition */}
      <div className={`shrink-0 overflow-x-hidden overscroll-contain bg-(--bg-card) [transition:width_0.22s_cubic-bezier(0.4,0,0.2,1)] ${activeTab ? 'w-59 overflow-y-auto border-l border-(--border-main)' : 'w-0 overflow-y-hidden border-l-0'}`}>
        <div className="w-59 p-3">
          {activeTab === 'players'  && (
            <PlayersPanel
              members={members}
              onlineUsers={onlineUsers}
              myRole={myRole}
              myCharacter={myCharacter}
              myCharacters={myCharacters}
              onChangeCharacter={onChangeCharacter}
              onLeaveCampaign={handleLeaveCampaign}
            />
          )}
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'help'     && <HelpPanel />}
        </div>
      </div>
    </div>

    <ConfirmDialog {...dialogProps} />
    </>
  );
}

// ── Players panel ─────────────────────────────────────────────
function PlayersPanel({ members, onlineUsers, myRole, myCharacter, myCharacters, onChangeCharacter, onLeaveCampaign }) {
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
      <div className="border-t border-(--border-main) pt-3 mt-3">
        <SectionLabel>Playing as</SectionLabel>
        <CustomDropdown
          value={myCharacter?.id ?? ''}
          onChange={val => {
            const found = myCharacters.find(c => c.id === val);
            onChangeCharacter(found || null);
          }}
          placeholder="— Decide later —"
          options={[
            { value: '', label: '— Decide later —' },
            ...myCharacters.map(c => {
              const name = c.name || 'Unnamed';
              return {
                value: c.id,
                label: name,
                sublabel: c.occupation || '',
                image: c.portrait_data ? `data:image/jpeg;base64,${c.portrait_data}` : undefined,
                imageFallback: name
                  .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
              };
            }),
          ]}
        />
      </div>

      {/* Quit campaign — permanent, removes you from the campaign.
          Hidden for the Keeper: they own the campaign and must delete it instead. */}
      {myRole !== 'keeper' && (
        <div className="border-t border-(--border-main) pt-3 mt-3">
          <button
            onClick={onLeaveCampaign}
            className="w-full py-2 px-3 rounded-lg border border-(--danger) bg-transparent text-(--danger) text-[13px] font-sans cursor-pointer flex items-center gap-2 [transition:background_0.12s]"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="icon icon-sm">exit_to_app</span>
            Quit Campaign
          </button>
        </div>
      )}
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────
function SettingsPanel() {
  const {
    memeEnabled, setMemeEnabled,
    feedBackground, setFeedBackground,
  } = useTheme();

  return (
    <div>
      <SectionLabel>Roll Feed</SectionLabel>

      <ToggleRow
        label="Crit memes"
        desc="Show the meme on a natural 01 or 100"
        checked={memeEnabled}
        onChange={() => setMemeEnabled(!memeEnabled)}
      />
      <ToggleRow
        label="Feed background"
        desc="Decorative backdrop behind the roll feed"
        checked={feedBackground}
        onChange={() => setFeedBackground(!feedBackground)}
      />

      <p className="text-[11px] text-(--text-faint) italic mt-3 font-sans">
        These settings are saved on this device only.
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

      <div className="border-t border-(--border-main) mt-4 mb-3" />

      <SectionLabel>How Rolls Work</SectionLabel>
      <p className="text-xs text-(--text-muted) mb-3 leading-[1.6]">
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
        <div key={row.label} className="flex gap-2 items-center py-1.25 px-0 border-b border-(--border-main) text-xs font-sans">
          <span>{row.emoji}</span>
          <span className="text-(--text-primary) font-medium min-w-16">
            {row.label}
          </span>
          <span className="text-(--text-muted)">{row.desc}</span>
        </div>
      ))}

      <SectionLabel style={{ marginTop: '12px' }}>Commands</SectionLabel>
      {rows.map(row => (
        <div key={row.notation} className="py-1.25 px-0 border-b border-(--border-main) text-xs">
          <code className="font-mono text-(--accent) text-[11px] bg-(--accent-bg) py-px px-1.25 rounded-sm">
            {row.notation}
          </code>
          <span className="text-(--text-muted) ml-2">
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
    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2 font-sans" style={style}>
      {children}
    </div>
  );
}

function MemberRow({ member, isOnline, status }) {
  const isAfk = status === 'afk';
  return (
    <div className="flex items-center gap-2 py-1 px-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${!isOnline ? 'bg-(--text-faint)' : isAfk ? 'bg-[#EAB308]' : 'bg-[#22c55e]'}`} />
      <span className={`text-[13px] font-sans ${isOnline ? 'text-(--text-primary)' : 'text-(--text-muted)'}`}>
        {member.username}
        {member.character_name && (
          <span className="text-[11px] text-(--accent) ml-1.5">
            {member.character_name.split(' ')[0]}
          </span>
        )}
      </span>
      {isAfk && (
        <span className="text-[10px] text-[#EAB308] ml-auto">
          AFK
        </span>
      )}
      {member.role === 'keeper' && (
        <span className="text-[10px] text-(--accent) ml-auto">
          Keeper
        </span>
      )}
    </div>
  );
}