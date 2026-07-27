import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NavBar from '../components/NavBar';
import apiClient, { armDevFailure } from '../api/client';

// ── Tab button ─────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-1.75 px-4.5 rounded-lg border-none cursor-pointer font-sans text-[13px] font-medium [transition:background_0.15s,color_0.15s] ${active ? 'bg-(--color-primary) text-white' : 'bg-transparent text-(--text-secondary)'}`}
    >
      {label}
    </button>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="bg-(--bg-card) border border-(--border-main) rounded-xl py-5 px-6 min-w-35 flex-1">
      {/* accent is a per-call-site CSS-color prop — stays inline, not a fixed set of classes */}
      <div className="font-serif text-[32px] leading-none" style={{ color: accent || 'var(--color-primary)' }}>{value ?? '—'}</div>
      <div className="mt-1.5 text-xs text-(--text-faint) font-sans uppercase tracking-[0.06em]">{label}</div>
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
    <div className="border border-(--border-main) rounded-[10px] bg-(--bg-card) overflow-hidden mb-2">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 py-3 px-4 bg-transparent border-none cursor-pointer text-left"
      >
        {/* status badge — 'open' color is a bespoke literal pair, not backed by any token */}
        <span
          className="text-[11px] py-0.5 px-2 rounded-full font-sans font-medium whitespace-nowrap"
          style={bug.status === 'resolved'
            ? { background: 'var(--accent-bg)', color: 'var(--color-primary)' }
            : { background: 'rgba(239,159,39,0.15)', color: '#b36d00' }}
        >{bug.status}</span>

        <span className="flex-1 font-sans text-sm text-(--text-primary) font-medium">{bug.title}</span>

        <span className="text-xs text-(--text-faint) whitespace-nowrap">
          {bug.username || 'deleted'} · {date}
        </span>

        <span className="icon icon-sm text-(--text-faint)">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-(--border-main) p-4">
          <p className="mt-0 mb-3 font-sans text-sm text-(--text-secondary) leading-[1.6] whitespace-pre-wrap">{bug.description}</p>

          {bug.image_url && (
            <img
              src={bug.image_url}
              alt="screenshot"
              className="max-w-full max-h-80 rounded-lg border border-(--border-main) block mb-3"
            />
          )}

          <div className="text-[11px] text-(--text-faint) font-sans mb-3.5">
            {bug.page_url && <div>Page: <code>{bug.page_url}</code></div>}
            {bug.user_agent && <div className="mt-0.5 break-all">UA: {bug.user_agent}</div>}
          </div>

          <div className="flex gap-2">
            {bug.status === 'open' && (
              <button
                disabled={loading}
                onClick={markResolved}
                className={`py-1.5 px-4 bg-(--color-primary) text-white border-none rounded-[7px] font-sans text-xs font-medium ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >Mark Resolved</button>
            )}
            <button
              disabled={loading}
              onClick={handleDelete}
              className={`py-1.5 px-4 bg-transparent text-(--danger) border border-(--danger) rounded-[7px] font-sans text-xs ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
    <div className="max-w-110">
      <h2 className="mt-0 mb-1.5 font-serif text-lg text-(--text-primary)">
        Team Asset Upload
      </h2>
      <p className="mt-0 mb-5 text-[13px] text-(--text-faint) font-sans leading-[1.5]">
        Upload a team member avatar to R2. Copy the URL and paste it into the <code>avatar</code> field of <code>TEAM_MEMBERS</code> in <code>AboutPage.jsx</code>.
      </p>

      {/* Drop zone / picker */}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-(--border-input) rounded-[10px] p-6 text-center cursor-pointer bg-(--bg-card) mb-3.5 [transition:border-color_0.15s]"
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-30 max-w-full rounded-lg object-contain" />
        ) : (
          <span className="font-sans text-[13px] text-(--text-faint)">
            Click to choose an image (JPG, PNG, WEBP · max 4 MB)
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPick} className="hidden" />
      </div>

      {file && (
        <p className="mt-0 mb-3.5 text-xs text-(--text-muted) font-sans">
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      )}

      {error && (
        <p className="mt-0 mb-3 text-[13px] text-(--danger) font-sans">{error}</p>
      )}

      <button
        onClick={upload}
        disabled={!file || uploading}
        className={`py-2 px-5 border-none rounded-lg font-sans text-[13px] font-medium ${(!file || uploading) ? 'bg-(--border-main) text-(--text-faint) cursor-not-allowed' : 'bg-(--color-primary) text-white cursor-pointer'} ${url ? 'mb-4' : 'mb-0'}`}
      >
        {uploading ? 'Uploading…' : 'Upload to R2'}
      </button>

      {url && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.07em] text-(--text-faint) font-sans mb-1.5">
            Public URL
          </label>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              value={url}
              className="flex-1 py-2 px-2.5 bg-(--bg-input) border-[1.5px] border-(--border-input) rounded-[7px] font-sans text-xs text-(--text-primary) outline-none! focus:border-(--border-focus) input-focus-glow"
              onClick={e => e.target.select()}
            />
            <button
              onClick={copy}
              className={`py-2 px-3.5 border-[1.5px] border-(--border-input) rounded-[7px] cursor-pointer font-sans text-xs font-medium whitespace-nowrap [transition:all_0.15s] ${copied ? 'bg-(--accent-bg) text-(--color-primary)' : 'bg-(--bg-card) text-(--text-secondary)'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toast Test Panel (DEV ONLY) ────────────────────────────────
// Dev-only harness for eyeballing every toast variant in context. The call site
// is guarded by import.meta.env.DEV, which Vite statically replaces with `false`
// in production — so Rollup prunes this whole component (and its "Toast System"
// strings) out of the prod bundle.
function ToastTestPanel() {
  const toast = useToast();
  const [shouldThrow, setShouldThrow] = useState(false);
  const [failMode, setFailMode] = useState('off');
  const [sticky, setSticky]     = useState(false);

  // Throw during render (NOT in the onClick handler) — a throw inside a React
  // synthetic event handler is swallowed and never reaches the ErrorBoundary.
  if (shouldThrow) throw new Error('Test: ErrorBoundary triggered from admin panel');

  // Arm real apiClient requests to fail so the app's actual error toasts fire.
  const applyFail = (mode) => { setFailMode(mode); armDevFailure({ mode, once: !sticky }); };
  const toggleSticky = () => {
    const next = !sticky;
    setSticky(next);
    armDevFailure({ once: !next }); // keep the current mode, flip one-shot ↔ sticky
  };
  const FAIL_MODES = [
    { id: 'off',     label: 'Off' },
    { id: '500',     label: 'HTTP 500' },
    { id: '503',     label: 'HTTP 503' },
    { id: '429',     label: 'HTTP 429' },
    { id: 'network', label: 'Network' },
    { id: 'timeout', label: 'Timeout' },
  ];

  const groups = [
    {
      label: 'Basic types',
      buttons: [
        { label: 'Success toast', onClick: () =>
          toast.success('Character saved', 'All changes have been saved to your investigator sheet.') },
        { label: 'Info toast', onClick: () =>
          toast.info('New version available', 'v1.8 Glaaki is available. Refresh to update.',
            { action: { label: 'Refresh', onClick: () => window.location.reload() } }) },
        { label: 'Warning toast', onClick: () =>
          toast.warning('Disconnected from room', 'Trying to reconnect automatically. Your session is still active.') },
        { label: 'Error toast', onClick: () =>
          toast.error("Couldn't save character", "Your changes weren't saved. Try again or refresh the page.", {
            action: { label: 'Try again', onClick: () => {} },
            details: { endpoint: 'PUT /api/characters/550e8400-e29b', status: 503, raw: 'Service temporarily unavailable' },
          }) },
        { label: 'Critical toast', onClick: () =>
          toast.critical('Session expired', "You've been signed out. Please log in again to continue.",
            { action: { label: 'Log in', onClick: () => {} } }) },
      ],
    },
    {
      label: 'Edge cases',
      buttons: [
        { label: 'Details only (no action)', onClick: () =>
          toast.error('Upload failed', "The file couldn't be uploaded to storage.",
            { details: { endpoint: 'POST /api/uploads', status: 413, raw: 'Payload too large' } }) },
        { label: 'Action only (no details)', onClick: () =>
          toast.warning('Unsaved changes', 'You have unsaved changes that will be lost.',
            { action: { label: 'Save now', onClick: () => {} } }) },
        { label: 'No extras (title + message)', onClick: () =>
          toast.info('Maintenance mode enabled', 'Players will see the maintenance page until you disable it.') },
      ],
    },
    {
      label: 'Stress test',
      buttons: [
        { label: 'Spam 5 toasts', onClick: () => {
          // Fired back-to-back: first 3 become visible, the last 2 queue and
          // promote as the earlier ones dismiss.
          toast.success('Saved', 'Draft saved.');
          toast.info('Synced', 'Data synced with server.');
          toast.warning('Slow connection', 'Response times are high.');
          toast.error('Upload failed', 'Try again.');
          toast.critical('Session expired', 'Please log in again.');
        } },
      ],
    },
    {
      label: 'Timer behavior',
      buttons: [
        { label: 'Hover to pause test', onClick: () =>
          toast.error('Hover over me to pause', 'The timer bar should stop while your mouse is over this toast.',
            { details: { raw: 'Timer pauses on mouseenter, resumes on mouseleave' } }) },
      ],
    },
  ];

  return (
    <div className="mt-8 bg-(--bg-card) border-2 border-dashed border-(--border-input) rounded-xl p-7">
      <div className="flex items-center gap-2.5 mb-1.5">
        <h2 className="m-0 font-serif text-lg text-(--text-primary)">Toast System — Test Panel</h2>
        <span className="text-[10px] py-0.5 px-2 rounded-full font-sans font-semibold uppercase tracking-[0.06em] bg-(--accent-bg) text-(--color-primary)">
          Dev
        </span>
      </div>
      <p className="mt-0 mb-5 text-[13px] text-(--text-faint) font-sans leading-[1.5]">
        Only visible in development (<code>import.meta.env.DEV</code>).
      </p>

      <div className="flex flex-col gap-5">
        {groups.map(group => (
          <div key={group.label}>
            <div className="font-sans text-xs font-semibold text-(--text-secondary) uppercase tracking-[0.08em] mb-2.5">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.buttons.map(btn => (
                <button key={btn.label} type="button" className="btn-secondary-sm" onClick={btn.onClick}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Real-path failure injection — arm a mode, then use any real feature. */}
      <div className="mt-6 pt-5 border-t border-(--border-input)">
        <div className="font-sans text-xs font-semibold text-(--text-secondary) uppercase tracking-[0.08em] mb-1.5">
          Real-path failure injection
        </div>
        <p className="mt-0 mb-3 text-[12px] text-(--text-faint) font-sans leading-[1.5]">
          Arm a mode, then use any real feature (upload a handout, save/delete a note,
          delete a file, switch character in a room). The app's real error toasts fire
          with real status/details/retry — no need to stop the backend.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="seg">
            {FAIL_MODES.map(m => (
              <button
                key={m.id}
                type="button"
                className={`seg-tab${m.id === failMode ? ' active' : ''}`}
                onClick={() => applyFail(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-(--text-muted) font-sans cursor-pointer">
            <input type="checkbox" checked={sticky} onChange={toggleSticky} />
            sticky (all requests)
          </label>
        </div>
        {failMode !== 'off' && (
          <p className="mt-2 mb-0 text-[12px] text-(--warning) font-sans">
            ⚠ Armed: {failMode} — {sticky ? 'every request fails until Off' : 'fails the next request only'}.
          </p>
        )}
      </div>

      {/* Destructive test — separated so it isn't clicked casually. */}
      <div className="mt-6 pt-5 border-t border-(--border-input)">
        <p className="mt-0 mb-3 text-[12px] text-(--warning) font-sans leading-[1.5]">
          ⚠ This will crash the current render subtree and show the ErrorBoundary panel. Reload the page to recover.
        </p>
        <button
          type="button"
          className="btn-danger-soft btn-danger-sm"
          onClick={() => setShouldThrow(true)}>
          💥 Trigger ErrorBoundary (throws)
        </button>
      </div>
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
    <div className="min-h-screen bg-(--bg-page)">
      <NavBar />

      <div className="max-w-215 mx-auto py-8 px-6">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="m-0 font-serif text-[26px] text-(--text-primary)">Admin Dashboard</h1>
          <p className="mt-1 mr-0 mb-0 text-[13px] text-(--text-faint)">
            Internal tools — visible to admins only.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-(--bg-card) border border-(--border-main) rounded-[10px] p-1 mb-6 w-fit">
          <Tab label="Bug Reports" active={tab === 'bugs'}        onClick={() => setTab('bugs')} />
          <Tab label="Maintenance" active={tab === 'maintenance'} onClick={() => setTab('maintenance')} />
          <Tab label="Stats"       active={tab === 'stats'}       onClick={() => setTab('stats')} />
          <Tab label="Team Assets" active={tab === 'team'}        onClick={() => setTab('team')} />
        </div>

        {loading ? (
          <p className="text-(--text-faint) font-sans">Loading…</p>
        ) : (
          <>
            {/* ── Bug Reports tab ─────────────────────────── */}
            {tab === 'bugs' && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <h2 className="m-0 font-sans text-sm font-semibold text-(--text-secondary) uppercase tracking-[0.08em]">
                    Bug Reports
                  </h2>
                  <span className="text-xs text-(--text-faint)">
                    {bugs.filter(b => b.status === 'open').length} open · {bugs.filter(b => b.status === 'resolved').length} resolved
                  </span>
                </div>

                {bugs.length === 0 ? (
                  <p className="text-(--text-faint) font-sans text-sm">
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
              <div className="bg-(--bg-card) border border-(--border-main) rounded-xl p-7 max-w-110">
                <h2 className="mt-0 mb-1.5 font-serif text-lg text-(--text-primary)">
                  Maintenance Mode
                </h2>
                <p className="mt-0 mb-5 text-[13px] text-(--text-faint) font-sans leading-[1.5]">
                  When enabled, all connected users see a warning pill in the NavBar and new visitors see a maintenance page.
                </p>

                {/* Message field */}
                <label className="block text-xs font-medium text-(--text-secondary) mb-1.5 font-sans uppercase tracking-[0.06em]">
                  Warning message
                </label>
                <textarea
                  value={maintMessage}
                  onChange={e => setMaintMessage(e.target.value)}
                  rows={3}
                  className="w-full py-2.25 px-3 bg-(--bg-input) border-[1.5px] border-(--border-input) rounded-lg text-(--text-primary) font-sans text-[13px] resize-y mb-5 box-border outline-none! focus:border-(--border-focus) input-focus-glow"
                />

                <div className="flex items-center gap-4">
                  {/* Toggle — inner span must not capture pointer events */}
                  <button
                    type="button"
                    onClick={toggleMaintenance}
                    disabled={toggling}
                    className={`w-13 h-7 rounded-full border-none relative [transition:background_0.2s] shrink-0 p-0 outline-none! ${toggling ? 'cursor-not-allowed' : 'cursor-pointer'} ${maintenance ? 'bg-(--color-primary)' : 'bg-(--border-main)'}`}
                  >
                    <span className={`absolute top-0.75 w-5.5 h-5.5 rounded-full bg-white [transition:left_0.2s] shadow-[0_1px_4px_rgba(0,0,0,0.2)] pointer-events-none ${maintenance ? 'left-6.75' : 'left-0.75'}`} />
                  </button>

                  <span className={`font-sans text-sm font-medium ${maintenance ? 'text-(--color-primary)' : 'text-(--text-secondary)'}`}>
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
                <div className="flex gap-3 flex-wrap mb-3">
                  <StatCard label="Users"      value={stats?.total_users} />
                  <StatCard label="Characters" value={stats?.total_characters} />
                  <StatCard label="Campaigns"  value={stats?.total_campaigns} />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <StatCard label="Open Bugs"     value={stats?.bugs_open}     accent="var(--danger)" />
                  <StatCard label="Resolved Bugs" value={stats?.bugs_resolved} accent="var(--color-primary)" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Dev-only toast test harness — pruned from production builds. */}
        {import.meta.env.DEV && <ToastTestPanel />}
      </div>
    </div>
  );
}
