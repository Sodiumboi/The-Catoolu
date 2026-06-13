import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import apiClient from '../api/client';

// ── Tab button ─────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '7px 18px',
        borderRadius: '8px',
        border:       'none',
        cursor:       'pointer',
        fontFamily:   'var(--font-sans)',
        fontSize:     '13px',
        fontWeight:   500,
        background:   active ? 'var(--color-primary)' : 'transparent',
        color:        active ? '#fff' : 'var(--text-secondary)',
        transition:   'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-main)',
      borderRadius: '12px',
      padding:      '20px 24px',
      minWidth:     '140px',
      flex:         1,
    }}>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize:   '32px',
        color:      accent || 'var(--color-primary)',
        lineHeight: 1,
      }}>{value ?? '—'}</div>
      <div style={{
        marginTop:  '6px',
        fontSize:   '12px',
        color:      'var(--text-faint)',
        fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>{label}</div>
    </div>
  );
}

// ── Bug Report row ─────────────────────────────────────────────
function BugRow({ bug, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function markResolved() {
    setLoading(true);
    try {
      await apiClient.patch(`/admin/bugs/${bug.id}`, { status: 'resolved' });
      onStatusChange(bug.id, 'resolved');
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete this bug report?')) return;
    setLoading(true);
    try {
      await apiClient.delete(`/admin/bugs/${bug.id}`);
      onDelete(bug.id);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  const date = new Date(bug.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div style={{
      border:       '1px solid var(--border-main)',
      borderRadius: '10px',
      background:   'var(--bg-card)',
      overflow:     'hidden',
      marginBottom: '8px',
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width:      '100%',
          display:    'flex',
          alignItems: 'center',
          gap:        '12px',
          padding:    '12px 16px',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          textAlign:  'left',
        }}
      >
        <span style={{
          fontSize:     '11px',
          padding:      '2px 8px',
          borderRadius: '20px',
          fontFamily:   'var(--font-sans)',
          fontWeight:   500,
          background:   bug.status === 'resolved' ? 'var(--accent-bg)' : 'rgba(239,159,39,0.15)',
          color:        bug.status === 'resolved' ? 'var(--color-primary)' : '#b36d00',
          whiteSpace:   'nowrap',
        }}>{bug.status}</span>

        <span style={{
          flex:       1,
          fontFamily: 'var(--font-sans)',
          fontSize:   '14px',
          color:      'var(--text-primary)',
          fontWeight: 500,
        }}>{bug.title}</span>

        <span style={{ fontSize: '12px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          {bug.username || 'deleted'} · {date}
        </span>

        <span className="icon icon-sm" style={{ color: 'var(--text-faint)' }}>
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border-main)',
          padding:   '16px',
        }}>
          <p style={{
            margin:     '0 0 12px',
            fontFamily: 'var(--font-sans)',
            fontSize:   '14px',
            color:      'var(--text-secondary)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>{bug.description}</p>

          {bug.image_url && (
            <img
              src={bug.image_url}
              alt="screenshot"
              style={{
                maxWidth:     '100%',
                maxHeight:    '320px',
                borderRadius: '8px',
                border:       '1px solid var(--border-main)',
                display:      'block',
                marginBottom: '12px',
              }}
            />
          )}

          <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>
            {bug.page_url && <div>Page: <code>{bug.page_url}</code></div>}
            {bug.user_agent && <div style={{ marginTop: '2px', wordBreak: 'break-all' }}>UA: {bug.user_agent}</div>}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {bug.status === 'open' && (
              <button
                disabled={loading}
                onClick={markResolved}
                style={{
                  padding:      '6px 16px',
                  background:   'var(--color-primary)',
                  color:        '#fff',
                  border:       'none',
                  borderRadius: '7px',
                  cursor:       loading ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '12px',
                  fontWeight:   500,
                }}
              >Mark Resolved</button>
            )}
            <button
              disabled={loading}
              onClick={handleDelete}
              style={{
                padding:      '6px 16px',
                background:   'transparent',
                color:        'var(--danger)',
                border:       '1px solid var(--danger)',
                borderRadius: '7px',
                cursor:       loading ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font-sans)',
                fontSize:     '12px',
              }}
            >Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team Asset Uploader ────────────────────────────────────────
function TeamAssets() {
  const fileRef            = useRef(null);
  const [file, setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl]      = useState('');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]  = useState('');

  function onPick(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setUrl('');
    setError('');
    setCopied(false);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await apiClient.post('/admin/team-upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUrl(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: '440px' }}>
      <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text-primary)' }}>
        Team Asset Upload
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
        Upload a team member avatar to R2. Copy the URL and paste it into the <code>avatar</code> field of <code>TEAM_MEMBERS</code> in <code>AboutPage.jsx</code>.
      </p>

      {/* Drop zone / picker */}
      <div
        onClick={() => fileRef.current.click()}
        style={{
          border:        '2px dashed var(--border-input)',
          borderRadius:  '10px',
          padding:       '24px',
          textAlign:     'center',
          cursor:        'pointer',
          background:    'var(--bg-card)',
          marginBottom:  '14px',
          transition:    'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-faint)' }}>
            Click to choose an image (JPG, PNG, WEBP · max 4 MB)
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPick} style={{ display: 'none' }} />
      </div>

      {file && (
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      )}

      {error && (
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--danger)', fontFamily: 'var(--font-sans)' }}>{error}</p>
      )}

      <button
        onClick={upload}
        disabled={!file || uploading}
        style={{
          padding:      '8px 20px',
          background:   (!file || uploading) ? 'var(--border-main)' : 'var(--color-primary)',
          color:        (!file || uploading) ? 'var(--text-faint)' : '#fff',
          border:       'none',
          borderRadius: '8px',
          cursor:       (!file || uploading) ? 'not-allowed' : 'pointer',
          fontFamily:   'var(--font-sans)',
          fontSize:     '13px',
          fontWeight:   500,
          marginBottom: url ? '16px' : 0,
        }}
      >
        {uploading ? 'Uploading…' : 'Upload to R2'}
      </button>

      {url && (
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>
            Public URL
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              readOnly
              value={url}
              style={{
                flex:         1,
                padding:      '8px 10px',
                background:   'var(--bg-input)',
                border:       '1.5px solid var(--border-input)',
                borderRadius: '7px',
                fontFamily:   'var(--font-sans)',
                fontSize:     '12px',
                color:        'var(--text-primary)',
                outline:      'none',
              }}
              onClick={e => e.target.select()}
            />
            <button
              onClick={copy}
              style={{
                padding:      '8px 14px',
                background:   copied ? 'var(--accent-bg)' : 'var(--bg-card)',
                border:       '1.5px solid var(--border-input)',
                borderRadius: '7px',
                cursor:       'pointer',
                fontFamily:   'var(--font-sans)',
                fontSize:     '12px',
                fontWeight:   500,
                color:        copied ? 'var(--color-primary)' : 'var(--text-secondary)',
                whiteSpace:   'nowrap',
                transition:   'all 0.15s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab]       = useState('bugs');
  const [bugs, setBugs]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [maintenance,    setMaintenance]    = useState(false);
  const [maintMessage,   setMaintMessage]   = useState('');
  const [toggling,       setToggling]       = useState(false);
  const [loading,        setLoading]        = useState(true);

  // Guard
  useEffect(() => {
    if (!user?.is_admin) navigate('/dashboard', { replace: true });
  }, [user]);

  // Load all data on mount
  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([
      apiClient.get('/admin/bugs'),
      apiClient.get('/admin/stats'),
      apiClient.get('/admin/maintenance'),
    ]).then(([b, s, m]) => {
      setBugs(b.data.bugs);
      setStats(s.data);
      setMaintenance(m.data.maintenance);
      setMaintMessage(m.data.message || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  async function toggleMaintenance() {
    setToggling(true);
    try {
      const res = await apiClient.post('/admin/maintenance', {
        enabled: !maintenance,
        message: maintMessage,
      });
      setMaintenance(res.data.maintenance);
      setMaintMessage(res.data.message || maintMessage);
    } catch { /* ignore */ } finally { setToggling(false); }
  }

  if (!user?.is_admin) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <NavBar />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            margin:     0,
            fontFamily: 'var(--font-serif)',
            fontSize:   '26px',
            color:      'var(--text-primary)',
          }}>Admin Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-faint)' }}>
            Internal tools — visible to admins only.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display:      'flex',
          gap:          '4px',
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-main)',
          borderRadius: '10px',
          padding:      '4px',
          marginBottom: '24px',
          width:        'fit-content',
        }}>
          <Tab label="Bug Reports" active={tab === 'bugs'}        onClick={() => setTab('bugs')} />
          <Tab label="Maintenance" active={tab === 'maintenance'} onClick={() => setTab('maintenance')} />
          <Tab label="Stats"       active={tab === 'stats'}       onClick={() => setTab('stats')} />
          <Tab label="Team Assets" active={tab === 'team'}        onClick={() => setTab('team')} />
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>Loading…</p>
        ) : (
          <>
            {/* ── Bug Reports tab ─────────────────────────── */}
            {tab === 'bugs' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Bug Reports
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                    {bugs.filter(b => b.status === 'open').length} open · {bugs.filter(b => b.status === 'resolved').length} resolved
                  </span>
                </div>

                {bugs.length === 0 ? (
                  <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                    No bug reports yet.
                  </p>
                ) : (
                  bugs.map(bug => (
                    <BugRow
                      key={bug.id}
                      bug={bug}
                      onStatusChange={(id, status) =>
                        setBugs(prev => prev.map(b => b.id === id ? { ...b, status } : b))
                      }
                      onDelete={id => setBugs(prev => prev.filter(b => b.id !== id))}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Maintenance tab ─────────────────────────── */}
            {tab === 'maintenance' && (
              <div style={{
                background:   'var(--bg-card)',
                border:       '1px solid var(--border-main)',
                borderRadius: '12px',
                padding:      '28px',
                maxWidth:     '440px',
              }}>
                <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text-primary)' }}>
                  Maintenance Mode
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                  When enabled, all connected users see a warning pill in the NavBar and new visitors see a maintenance page.
                </p>

                {/* Message field */}
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Warning message
                </label>
                <textarea
                  value={maintMessage}
                  onChange={e => setMaintMessage(e.target.value)}
                  rows={3}
                  style={{
                    width:        '100%',
                    padding:      '9px 12px',
                    background:   'var(--bg-input)',
                    border:       '1.5px solid var(--border-input)',
                    borderRadius: '8px',
                    color:        'var(--text-primary)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    resize:       'vertical',
                    marginBottom: '20px',
                    boxSizing:    'border-box',
                    outline:      'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Toggle — inner span must not capture pointer events */}
                  <button
                    type="button"
                    onClick={toggleMaintenance}
                    disabled={toggling}
                    style={{
                      width:         '52px',
                      height:        '28px',
                      borderRadius:  '14px',
                      border:        'none',
                      cursor:        toggling ? 'not-allowed' : 'pointer',
                      background:    maintenance ? 'var(--color-primary)' : 'var(--border-main)',
                      position:      'relative',
                      transition:    'background 0.2s',
                      flexShrink:    0,
                      padding:       0,
                      outline:       'none',
                    }}
                  >
                    <span style={{
                      position:      'absolute',
                      top:           '3px',
                      left:          maintenance ? '27px' : '3px',
                      width:         '22px',
                      height:        '22px',
                      borderRadius:  '50%',
                      background:    '#fff',
                      transition:    'left 0.2s',
                      boxShadow:     '0 1px 4px rgba(0,0,0,0.2)',
                      pointerEvents: 'none',
                    }} />
                  </button>

                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize:   '14px',
                    fontWeight: 500,
                    color:      maintenance ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}>
                    {maintenance ? 'Maintenance ON' : 'Maintenance OFF'}
                  </span>
                </div>
              </div>
            )}

            {/* ── Team Assets tab ─────────────────────────── */}
            {tab === 'team' && <TeamAssets />}

            {/* ── Stats tab ───────────────────────────────── */}
            {tab === 'stats' && (
              <div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <StatCard label="Users"      value={stats?.total_users} />
                  <StatCard label="Characters" value={stats?.total_characters} />
                  <StatCard label="Campaigns"  value={stats?.total_campaigns} />
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <StatCard label="Open Bugs"     value={stats?.bugs_open}     accent="var(--danger)" />
                  <StatCard label="Resolved Bugs" value={stats?.bugs_resolved} accent="var(--color-primary)" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
