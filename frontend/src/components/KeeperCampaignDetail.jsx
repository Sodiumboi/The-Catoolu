import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ReadOnlySheet from './ReadOnlySheet';
import HandoutLibrary from './handouts/HandoutLibrary';
import ConfirmDialog from './ConfirmDialog';
import useConfirm from '../hooks/useConfirm';

const TABS = [
  { id: 'info',        label: 'Info'        },
  { id: 'handouts',    label: 'Handouts'    },
  { id: 'danger-zone', label: 'Danger Zone', icon: 'warning' },
];

export default function KeeperCampaignDetail({ campaign, onBack, initialTab }) {
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState(initialTab ?? 'info');
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showInvite,   setShowInvite]   = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  const load = async () => {
    try {
      const res = await apiClient.get('/campaigns/' + campaign.uuid);
      setMembers(res.data.campaign.members || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [campaign.uuid]);

  const handleRemoveMember = async (userId) => {
    const member = members.find(m => m.id === userId);
    const username = member?.username || 'This player';
    const ok = await confirm({
      title: 'Remove player?',
      message: `${username} will be removed from this campaign.`,
      variant: 'warning',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await apiClient.delete('/campaigns/' + campaign.uuid + '/members/' + userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch { /* silent */ }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(campaign.invite_code);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  return (
    <div style={{
      display:'flex', flex:1, overflow:'hidden',
      fontFamily:'var(--font-sans)',
    }}>
      {/* Left nav */}
      <div style={{
        width:'200px', flexShrink:0,
        borderRight:'1px solid var(--border-main)',
        background:'var(--bg-card)',
        display:'flex', flexDirection:'column',
        padding:'20px 0',
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display:'flex', alignItems:'center', gap:'6px',
            padding:'8px 20px', marginBottom:'12px',
            background:'none', border:'none', cursor:'pointer',
            fontSize:'13px', color:'var(--text-muted)',
            fontFamily:'var(--font-sans)',
          }}
        >
          <span className="icon icon-sm">arrow_back</span>{' '}Back
        </button>

        {/* Campaign name */}
        <div style={{
          padding:'0 20px 16px',
          borderBottom:'1px solid var(--border-main)',
          marginBottom:'8px',
        }}>
          <div style={{
            fontFamily:'var(--font-serif)', fontSize:'15px',
            color:'var(--text-primary)', lineHeight:'1.3',
          }}>
            {campaign.name}
          </div>
        </div>

        {/* Tab nav */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding:'9px 20px', textAlign:'left',
              background:   activeTab === tab.id
                ? 'var(--accent-bg)' : 'transparent',
              borderLeft:   '3px solid ' + (activeTab === tab.id
                ? 'var(--accent)' : 'transparent'),
              border:       'none',
              borderLeft:   '3px solid ' + (activeTab === tab.id
                ? 'var(--color-primary)' : 'transparent'),
              color:        activeTab === tab.id
                ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              fontWeight:   activeTab === tab.id ? '500' : '400',
              cursor:       'pointer',
              transition:   'all 0.1s ease',
            }}
          >
            {tab.icon && <span className="icon icon-sm" style={{ marginRight: '4px' }}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}

        {/* Enter Room button at bottom */}
        <div style={{ marginTop:'auto', padding:'16px 20px' }}>
          <button
            onClick={() => navigate('/campaign/' + campaign.uuid)}
            style={{
              width:'100%', padding:'8px 0',
              borderRadius:'8px', border:'none',
              background:'var(--color-primary)', color:'#ffffff',
              fontFamily:'var(--font-sans)', fontSize:'13px',
              fontWeight:'500', cursor:'pointer',
            }}
          >
            Enter Room →
          </button>
        </div>
      </div>

      {/* Right content */}
      <div style={{
        flex:1, overflowY:'auto', overscrollBehavior:'contain',
        padding:'28px 32px',
        background:'var(--bg-page)',
      }}>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <InfoTab
            campaign={campaign}
            members={members}
            loading={loading}
            showInvite={showInvite}
            inviteCopied={inviteCopied}
            onShowInvite={() => setShowInvite(p => !p)}
            onCopyCode={handleCopyCode}
            onRemoveMember={handleRemoveMember}
          />
        )}

        {/* ── HANDOUTS TAB ── */}
        {activeTab === 'handouts' && (
          <HandoutLibrary campaignUuid={campaign.uuid} />
        )}

        {/* ── DANGER ZONE TAB ── */}
        {activeTab === 'danger-zone' && (
          <DangerZoneTab campaign={campaign} onDeleted={onBack} />
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────
const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:'8px',
  border:'1px solid var(--border-input)',
  background:'var(--bg-input)', color:'var(--text-primary)',
  fontFamily:'var(--font-sans)', fontSize:'14px',
  outline:'none', boxSizing:'border-box',
  transition:'border-color 0.15s ease',
  display:'block',
};

// ── Info Tab ──────────────────────────────────────────────────
function InfoTab({
  campaign, members, loading,
  showInvite, inviteCopied,
  onShowInvite, onCopyCode, onRemoveMember,
}) {
  const [editing,     setEditing]     = useState(false);
  const [name,        setName]        = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || '');
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');
  const [selectedSheet, setSelectedSheet] = useState(null);

  // ── Resizable side-by-side sheet panel (mirrors the in-room panel) ──
  const [sheetWidth, setSheetWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem('keeper-sheet-panel-width'));
    return saved && saved >= 480 && saved <= 1280 ? saved : 820;
  });
  const draggingRef   = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWRef = useRef(820);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      // Panel sits on the right, so dragging the divider left widens it
      const next = Math.max(480, Math.min(1280, dragStartWRef.current - (e.clientX - dragStartXRef.current)));
      setSheetWidth(next);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      setSheetWidth(w => { localStorage.setItem('keeper-sheet-panel-width', w); return w; });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const handleDragStart = (e) => {
    draggingRef.current   = true;
    dragStartXRef.current = e.clientX;
    dragStartWRef.current = sheetWidth;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const handleOpenSheet = async (member) => {
    try {
      const res = await apiClient.get('/characters/' + member.character_uuid);
      setSelectedSheet({
        name:        member.character_name,
        occupation:  member.character_occupation,
        characterId: member.character_uuid,
        charData:    res.data.character,
      });
    } catch {
      setSelectedSheet({
        name:        member.character_name,
        occupation:  member.character_occupation,
        characterId: member.character_uuid,
        charData:    null,
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.put('/campaigns/' + campaign.uuid, {
        name: name.trim(), description: description.trim(),
      });
      setSaveMsg('✓ Saved');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Failed.');
    } finally { setSaving(false); }
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';
  const players  = members.filter(m => m.role === 'player');

  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'0', width:'100%' }}>

      {/* LEFT — campaign info + players.
          When the sheet is open the left column fills the remaining space so
          the panel sits flush against the right edge (pinned right). */}
      <div style={{
        flex: selectedSheet ? '1 1 0' : '1 1 100%',
        minWidth:'300px',
        maxWidth: selectedSheet ? 'none' : '600px',
        overflow:'hidden',
      }}>

      {/* Campaign name + description — editable */}
      <div style={{ marginBottom:'28px' }}>
        {editing ? (
          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ ...inputStyle, fontSize:'18px', fontFamily:'var(--font-serif)', marginBottom:'10px' }}
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
              <button
                onClick={handleSave} disabled={saving}
                style={{
                  padding:'6px 16px', borderRadius:'7px',
                  border:'none', background:'var(--color-primary)',
                  color:'#ffffff', fontSize:'12px',
                  cursor:'pointer', fontFamily:'var(--font-sans)',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding:'6px 16px', borderRadius:'7px',
                  border:'1px solid var(--border-main)',
                  background:'transparent', color:'var(--text-muted)',
                  fontSize:'12px', cursor:'pointer',
                  fontFamily:'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              {saveMsg && (
                <span style={{
                  fontSize:'12px', alignSelf:'center',
                  color: saveMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
                }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
              <h2 style={{
                fontFamily:'var(--font-serif)', fontSize:'22px',
                color:'var(--text-primary)', margin:'0 0 6px',
              }}>
                {name}
              </h2>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding:'4px 10px', borderRadius:'6px',
                  border:'1px solid var(--border-main)',
                  background:'transparent', color:'var(--text-muted)',
                  fontSize:'11px', cursor:'pointer', flexShrink:0,
                  fontFamily:'var(--font-sans)',
                }}
              >
                <span className="icon icon-sm">edit</span>{' '}Edit
              </button>
            </div>
            {description && (
              <p style={{
                fontSize:'14px', color:'var(--text-secondary)',
                margin:0, lineHeight:'1.6',
              }}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Campaign meta */}
      <div style={{
        display:'flex', flexDirection:'column', gap:'6px',
        marginBottom:'24px',
        padding:'10px 12px', borderRadius:'8px',
        background:'var(--bg-section-hd)',
        border:'1px solid var(--border-main)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{
            fontSize:'11px', fontWeight:'600',
            textTransform:'uppercase', letterSpacing:'0.07em',
            color:'var(--text-muted)', flexShrink:0, width:'90px',
          }}>
            Campaign ID
          </span>
          <span style={{
            fontFamily:'monospace', fontSize:'12px',
            color:'var(--text-faint)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {campaign.uuid}
          </span>
        </div>
        {campaign.created_at && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{
              fontSize:'11px', fontWeight:'600',
              textTransform:'uppercase', letterSpacing:'0.07em',
              color:'var(--text-muted)', flexShrink:0, width:'90px',
            }}>
              Created
            </span>
            <span style={{ fontSize:'12px', color:'var(--text-faint)' }}>
              {new Date(campaign.created_at).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Players section */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{
          display:'flex', alignItems:'center',
          justifyContent:'space-between', marginBottom:'12px',
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'600',
            textTransform:'uppercase', letterSpacing:'0.08em',
            color:'var(--text-muted)',
          }}>
            Players ({players.length})
          </div>
          <button
            onClick={onShowInvite}
            style={{
              padding:'5px 12px', borderRadius:'7px',
              border:'1px solid var(--color-primary)',
              background:'transparent', color:'var(--color-primary)',
              fontFamily:'var(--font-sans)', fontSize:'12px',
              cursor:'pointer',
            }}
          >
            + Invite Player
          </button>
        </div>

        {/* Invite popup */}
        {showInvite && (
          <div style={{
            background:'var(--bg-card)',
            border:'1px solid var(--border-main)',
            borderRadius:'10px', padding:'16px',
            marginBottom:'16px',
          }}>
            <div style={{
              fontSize:'12px', color:'var(--text-muted)',
              marginBottom:'10px',
            }}>
              Share this invite code with your players:
            </div>
            <div
              onClick={onCopyCode}
              style={{
                display:'flex', alignItems:'center',
                justifyContent:'space-between',
                padding:'10px 14px', borderRadius:'8px',
                background: inviteCopied ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
                border:'1px solid ' + (inviteCopied ? 'var(--accent)' : 'var(--border-main)'),
                cursor:'pointer', transition:'all 0.15s ease',
              }}
            >
              <span style={{
                fontFamily:'monospace', fontSize:'18px',
                fontWeight:'700', color:'var(--accent)',
                letterSpacing:'0.15em',
              }}>
                {campaign.invite_code}
              </span>
              <span style={{ fontSize:'13px', color:'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                {inviteCopied
                  ? <><span className="icon icon-sm">check</span>Copied!</>
                  : <><span className="icon icon-sm">content_copy</span>Click to copy</>
                }
              </span>
            </div>
          </div>
        )}

        {/* Player list */}
        {loading ? (
          <div style={{ fontSize:'13px', color:'var(--text-faint)' }}>
            Loading members...
          </div>
        ) : players.length === 0 ? (
          <div style={{
            padding:'20px', borderRadius:'10px',
            border:'1px dashed var(--border-main)',
            textAlign:'center', fontSize:'13px',
            color:'var(--text-faint)', fontStyle:'italic',
          }}>
            No players yet — share the invite code
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {players.map(m => (
              <div key={m.id} style={{
                display:'flex', alignItems:'center',
                justifyContent:'space-between',
                padding:'10px 14px', borderRadius:'10px',
                background: selectedSheet?.characterId === m.character_uuid ? 'var(--accent-bg)' : 'var(--bg-card)',
                border:'1px solid ' + (selectedSheet?.characterId === m.character_uuid ? 'var(--accent)' : 'var(--border-main)'),
                transition:'background 0.12s ease, border-color 0.12s ease',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{
                    width:'32px', height:'32px', borderRadius:'50%',
                    background:'var(--color-primary-light)',
                    display:'flex', alignItems:'center',
                    justifyContent:'center', flexShrink:0,
                    overflow:'hidden',
                    border:'1px solid var(--border-main)',
                  }}>
                    {m.avatar_url ? (
                      <img
                        src={API_BASE + m.avatar_url}
                        alt={m.username}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      />
                    ) : (
                      <span style={{
                        fontSize:'12px', fontWeight:'600',
                        color:'var(--color-primary-dark)',
                        fontFamily:'var(--font-sans)',
                      }}>
                        {(m.username || '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', color:'var(--text-primary)', fontWeight:'500' }}>
                      {m.username}
                    </div>
                    {/* Character name — opens placeholder modal */}
                    {m.character_name ? (
                      <div
                        onClick={() => handleOpenSheet(m)}
                        style={{
                          fontSize:'11px', color:'var(--accent)',
                          cursor:'pointer', textDecoration:'underline dotted',
                        }}
                      >
                        {m.character_name}
                        {m.character_occupation && ' · ' + m.character_occupation}
                      </div>
                    ) : (
                      <div style={{ fontSize:'11px', color:'var(--text-faint)', fontStyle:'italic' }}>
                        No investigator registered
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveMember(m.id)}
                  style={{
                    padding:'4px 10px', borderRadius:'6px',
                    border:'1px solid var(--danger)',
                    background:'transparent', color:'var(--danger)',
                    fontFamily:'var(--font-sans)', fontSize:'11px',
                    cursor:'pointer', transition:'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end LEFT column */}

      {/* RIGHT — resizable side-by-side sheet panel (replaces the popup) */}
      {selectedSheet && (
        <div
          key={selectedSheet.characterId}
          className="animate-slide-in-panel"
          style={{
            position:'sticky', top:'0', alignSelf:'flex-start',
            display:'flex', flexShrink:0,
            maxWidth:'calc(100% - 300px)',  // keep ≥300px for the left column → never overflow
            maxHeight:'calc(100vh - 150px)',
          }}>
          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            title="Drag to resize"
            style={{
              width:'5px', flexShrink:0, cursor:'col-resize',
              background:'var(--border-main)', borderRadius:'3px',
              margin:'0 8px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border-main)'}
          />

          {/* Sheet panel — width is the drag target; shrinks within the
              capped wrapper on narrow screens so nothing overflows */}
          <div style={{
            width: sheetWidth + 'px', minWidth:0, flexShrink:1,
            display:'flex', flexDirection:'column',
            border:'1px solid var(--border-main)', borderRadius:'12px',
            overflow:'hidden', background:'var(--bg-card)',
            boxShadow:'var(--shadow-dropdown)',
            maxHeight:'calc(100vh - 150px)',
          }}>
            {/* Header */}
            <div style={{
              display:'flex', alignItems:'flex-start',
              justifyContent:'space-between', gap:'12px',
              padding:'14px 16px', flexShrink:0,
              borderBottom:'1px solid var(--border-main)',
            }}>
              <div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:'18px', color:'var(--text-primary)' }}>
                  {selectedSheet.name}
                </div>
                {selectedSheet.occupation && (
                  <div style={{ fontSize:'12px', color:'var(--accent)' }}>
                    {selectedSheet.occupation}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedSheet(null)}
                title="Close"
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'var(--text-muted)', padding:'2px', flexShrink:0,
                }}
              >
                <span className="icon icon-md">close</span>
              </button>
            </div>

            {/* Sheet or error */}
            {selectedSheet.charData ? (
              <div style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain', background:'var(--bg-page)' }}>
                <ReadOnlySheet charData={selectedSheet.charData} />
              </div>
            ) : (
              <div style={{
                margin:'16px', padding:'20px', borderRadius:'10px',
                border:'1px dashed var(--border-main)',
                background:'var(--bg-section-hd)',
                fontSize:'13px', color:'var(--text-faint)',
                fontStyle:'italic', textAlign:'center',
              }}>
                Could not load character sheet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Danger Zone Tab ───────────────────────────────────────────
function DangerZoneTab({ campaign, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [typedName,  setTypedName]  = useState('');
  const [deleting,   setDeleting]   = useState(false);

  const nameMatches = typedName.trim() === campaign.name.trim();

  const handleDelete = async () => {
    if (!nameMatches) return;
    setDeleting(true);
    try {
      await apiClient.delete('/campaigns/' + campaign.uuid);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setTypedName('');
  };

  return (
    <div style={{ maxWidth:'520px' }}>
      <div style={{
        background:'var(--danger-bg)',
        border:'1px solid var(--danger)',
        borderRadius:'12px', padding:'20px',
      }}>
        <h3 style={{
          fontFamily:'var(--font-serif)', fontSize:'17px',
          color:'var(--danger)', margin:'0 0 8px',
        }}>
          Delete Campaign
        </h3>
        <p style={{
          fontSize:'13px', color:'var(--text-secondary)',
          margin:'0 0 16px', lineHeight:'1.6',
        }}>
          Permanently deletes the campaign, all messages, and all
          member data. This action cannot be undone.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{
              padding:'8px 20px', borderRadius:'8px',
              border:'1px solid var(--danger)',
              background:'transparent', color:'var(--danger)',
              fontFamily:'var(--font-sans)', fontSize:'13px',
              fontWeight:'500', cursor:'pointer',
            }}
          >
            Delete Campaign
          </button>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{
              fontSize:'12px', color:'var(--danger)',
              margin:0, fontFamily:'var(--font-sans)',
            }}>
              Type <strong>{campaign.name}</strong> to confirm:
            </p>
            <input
              autoFocus
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleDelete(); if (e.key === 'Escape') handleCancel(); }}
              placeholder={campaign.name}
              style={{
                padding:'8px 12px', borderRadius:'8px',
                border:'1px solid var(--danger)',
                background:'var(--bg-input)',
                color:'var(--text-primary)',
                fontFamily:'var(--font-sans)', fontSize:'13px',
                outline:'none', width:'100%', boxSizing:'border-box',
              }}
            />
            <div style={{ display:'flex', gap:'8px' }}>
              <button
                onClick={handleDelete}
                disabled={!nameMatches || deleting}
                style={{
                  padding:'7px 18px', borderRadius:'8px',
                  border:'none',
                  background: nameMatches ? 'var(--danger)' : 'var(--border-main)',
                  color: nameMatches ? '#ffffff' : 'var(--text-faint)',
                  fontFamily:'var(--font-sans)', fontSize:'13px',
                  fontWeight:'500',
                  cursor: nameMatches && !deleting ? 'pointer' : 'not-allowed',
                  transition:'all 0.15s ease',
                }}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button
                onClick={handleCancel}
                disabled={deleting}
                style={{
                  padding:'7px 18px', borderRadius:'8px',
                  border:'1px solid var(--border-main)',
                  background:'transparent', color:'var(--text-secondary)',
                  fontFamily:'var(--font-sans)', fontSize:'13px',
                  cursor:'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}