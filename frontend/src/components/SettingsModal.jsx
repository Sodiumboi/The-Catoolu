import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import apiClient from '../api/client';
import ImageCropModal from './ImageCropModal';
import UploadProgressBar from './UploadProgressBar';
import Tooltip from './ui/Tooltip';
import ToggleRow from './ui/ToggleRow';
import Slider from './ui/Slider';
import { DiscordIcon, GoogleIcon } from './ui/ProviderIcons';

// ── Nav structure ──────────────────────────────────────────────
// Sections are purely visual grouping; `id` selects the right-hand panel.
const NAV = [
  {
    section: 'Account',
    items: [
      { id: 'profile',  label: 'Profile',  icon: 'person' },
      { id: 'security', label: 'Security', icon: 'lock'   },
    ],
  },
  {
    section: 'Appearance',
    items: [
      { id: 'theme',      label: 'Theme',      icon: 'palette'     },
      { id: 'display',    label: 'Display',    icon: 'format_size' },
      { id: 'background', label: 'Background', icon: 'wallpaper'   },
    ],
  },
  {
    section: 'App',
    items: [
      { id: 'language',      label: 'Language',      icon: 'language'      },
      { id: 'startup',       label: 'Startup',       icon: 'home'          },
      { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    ],
  },
];

// Font-scale steps. Kept as the original 7-step ladder (not S/M/L) so no
// existing user's saved scale is orphaned by the migration.
const SCALE_OPTIONS = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15];

const HOME_OPTIONS = [
  { value: '/',          label: 'Landing Page',  desc: 'The public front page' },
  { value: '/dashboard', label: 'Investigators', desc: 'Your character list'   },
  { value: '/keeper',    label: 'Keeper Panel',  desc: 'Campaigns you run'     },
  { value: '/campaign',  label: 'Campaigns',     desc: 'Campaigns you play in' },
];

// Avatar paths come back either absolute (R2 CDN) or app-relative (legacy).
const resolveAvatar = (url) =>
  url?.startsWith('http') ? url : (import.meta.env.VITE_API_URL || '') + url;

// ── Shared panel bits ──────────────────────────────────────────
// ── Type scale ─────────────────────────────────────────────────
// Four deliberately distinct levels so the eye always knows where a panel
// starts and where one group ends:
//   1. panel title      serif 20px, primary          ← the entry point
//   2. panel desc       sans 12px, muted
//   3. section heading  sans 11px caps + rule, secondary
//   4. field label      sans 12px sentence case, muted
// The section heading carries a rule precisely so it can never be mistaken
// for a field label sitting directly beneath it.

function PanelHeader({ title, desc }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl text-(--text-primary) m-0 leading-tight">{title}</h2>
      {desc && (
        <p className="font-sans text-xs text-(--text-muted) mt-1 mb-0 leading-[1.5]">{desc}</p>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-(--text-secondary) shrink-0">
        {children}
      </span>
      <span className="flex-1 h-px bg-(--border-main)" />
    </div>
  );
}

// label on the left, control on the right — mirrors the ToggleRow rhythm
function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-(--border-main)">
      <div className="min-w-0">
        <div className="font-sans text-[13px] font-medium text-(--text-primary)">{label}</div>
        {desc && (
          <div className="font-sans text-[11px] text-(--text-muted) leading-[1.4]">{desc}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div className={`py-2 px-3 rounded-lg mb-3 font-sans text-xs border ${isSuccess ? 'bg-(--accent-bg) border-(--success) text-(--success)' : 'bg-(--danger-bg) border-(--danger) text-(--danger)'}`}>
      {msg.text}
    </div>
  );
}

// Sentence case, no tracking — the opposite treatment to SectionLabel above,
// so a form label never reads as the start of a new section.
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block font-sans text-xs font-medium text-(--text-muted) mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// `name` + `autoComplete` are required, not optional: an input the browser
// can't identify becomes a target for whatever it decides to autofill.
function Input({ type = 'text', name, autoComplete, value, onChange, onBlur, placeholder, disabled }) {
  return (
    <input
      type={type}
      name={name}
      autoComplete={autoComplete}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="input-focus-glow w-full py-2 px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[13px] outline-none! box-border focus:border-(--border-focus) disabled:opacity-50"
    />
  );
}

// ── Vertical slide ─────────────────────────────────────────────
// grid-template-rows 0fr → 1fr animates to the content's intrinsic height with
// no JS measuring. The wrapper must stay clipped during the slide, but a
// permanently clipped box would also cut the focus glow off the inputs inside
// — so the clip is released once the panel has finished opening.
const SLIDE_MS = 220;

function Collapse({ open, children }) {
  const [clip, setClip] = useState(!open);

  useEffect(() => {
    // Always via a timer, never a synchronous setState in the effect body:
    // opening waits out the slide, closing re-clips on the next tick so the
    // content is hidden for the whole way down.
    const t = setTimeout(() => setClip(!open), open ? SLIDE_MS : 0);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      className={`grid [transition:grid-template-rows_220ms_ease-in-out,opacity_180ms_ease-in-out] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      aria-hidden={!open}
      // aria-hidden alone still leaves the collapsed inputs in the tab order.
      // `inert` (React 19) takes them out of it entirely, so you can't tab into
      // fields you can't see.
      inert={!open}
    >
      <div className={`min-h-0 ${clip ? 'overflow-hidden' : ''}`}>{children}</div>
    </div>
  );
}

// ── Password policy ────────────────────────────────────────────
// Mirrors backend/src/utils/passwordPolicy.js. Both lists must move together:
// a rule shown here but missing there is decorative, and a rule enforced there
// but missing here is a save that fails for no visible reason.
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'number', label: 'Contains a number',     test: (pw) => /[0-9]/.test(pw) },
];

const meetsPolicy = (pw) => PASSWORD_RULES.every(r => r.test(pw));

// Silent until you start typing, neutral while you do, red only once a save
// has actually been attempted and rejected.
function PasswordChecklist({ password, showErrors }) {
  if (!password) return null;
  return (
    <ul className="list-none p-0 mt-2 mb-0 flex flex-col gap-1">
      {PASSWORD_RULES.map(rule => {
        const met = rule.test(password);
        const tone = met ? 'text-(--success)' : showErrors ? 'text-(--danger)' : 'text-(--text-muted)';
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 font-sans text-[11px] ${tone}`}>
            <span className="icon icon-sm">
              {met ? 'check_circle' : showErrors ? 'error' : 'radio_button_unchecked'}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

// Static fact (member since) — same label treatment as Field so a value the
// user cannot change doesn't masquerade as an editable one.
function ReadOnlyRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-(--border-main)">
      <span className="font-sans text-xs font-medium text-(--text-muted) shrink-0">
        {label}
      </span>
      <span className="font-sans text-[13px] text-(--text-primary) truncate">{value || '—'}</span>
    </div>
  );
}

// Exit duration. Tailwind can't read a runtime constant, so the same number is
// mirrored literally into the animation strings below — keep them in step.
const EXIT_MS = 180;

// ══════════════════════════════════════════════════════════════
// Mounted only while open (the caller gates it), so every open starts on the
// Profile panel with no reset effect, and the panels refetch naturally.
export default function SettingsModal({ onClose }) {
  const [active,  setActive]  = useState('profile');
  const [closing, setClosing] = useState(false);
  // Ref guard as well as state: a second dismiss (Escape during a backdrop
  // click's exit) must not stack a second unmount timer.
  const closingRef = useRef(false);
  const closeTimer = useRef(null);

  // Dismissal is deferred so the exit animation actually gets to play — the
  // parent unmounts us only once it has finished.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = setTimeout(() => onClose?.(), EXIT_MS);
  }, [onClose]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Escape dismisses (matches ConfirmDialog)
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [requestClose]);

  // Body scroll lock while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const modal = (
    <div
      // Sits above every portal layer including Toast (10001) — a settings
      // modal is a deliberate full-attention surface. Its own feedback is
      // inline (StatusMsg), so nothing it reports can be occluded by this.
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[10002] ${closing ? 'animate-[confirm-fade-out_180ms_ease-in-out_both]' : 'animate-[confirm-fade-in_150ms_ease-in-out_both]'}`}
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={e => e.stopPropagation()}
        // Fixed height, not min/max: the window must stay put while you move
        // between panels. Overflow is the right panel's problem, not the
        // frame's. 85vh only kicks in on viewports too short for 560px.
        className="relative flex w-full max-w-[720px] h-[560px] max-h-[85vh] overflow-hidden bg-(--bg-card) border border-(--border-main) rounded-(--radius-card) shadow-(--shadow-dropdown) z-[10003]"
        // cubic-bezier commas don't survive Tailwind's arbitrary-value parser
        // for `animate-*`, so this one stays inline (same as ConfirmDialog).
        // 200ms + spring in / 180ms ease-in-out out, per the ui_standards
        // modal band (180–220ms, scale + opacity). `both` holds the opening
        // frame so there's no flash of the settled state before it runs.
        style={{
          animation: closing
            ? `confirm-pop-out ${EXIT_MS}ms ease-in-out both`
            : 'confirm-pop-in 200ms cubic-bezier(0.34, 1.4, 0.64, 1) both',
        }}
      >
        {/* ── Left sidebar ── */}
        <nav className="w-45 shrink-0 border-r border-(--border-main) bg-(--bg-section-hd) py-3.5 px-2.5 overflow-y-auto overscroll-contain">
          <h1 id="settings-title" className="font-serif text-[15px] text-(--text-primary) mt-0 mb-3 px-1.5">
            Settings
          </h1>
          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-3">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-faint) mb-1 px-1.5">
                {section}
              </div>
              {items.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    // Hover is a Tailwind variant, not a JS style swap: an
                    // inline background written on hover would outrank the
                    // active class and survive the item becoming selected.
                    className={`flex items-center gap-2 w-full py-1.5 px-2 mb-0.5 rounded-lg border-none cursor-pointer font-sans text-[13px] text-left [transition:background_0.15s_ease,color_0.15s_ease] ${isActive ? 'bg-(--accent-bg) text-(--accent) font-semibold' : 'bg-transparent text-(--text-secondary) font-normal hover:bg-(--row-hover) hover:text-(--text-primary)'}`}
                  >
                    <span className="icon icon-sm">{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Right panel ── */}
        <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain py-5 px-6">
          {active === 'profile'       && <ProfilePanel onClose={requestClose} />}
          {active === 'security'      && <SecurityPanel />}
          {active === 'theme'         && <ThemePanel />}
          {active === 'display'       && <DisplayPanel />}
          {active === 'background'    && <BackgroundPanel />}
          {active === 'language'      && <LanguagePanel />}
          {active === 'startup'       && <StartupPanel />}
          {active === 'notifications' && <NotificationsPanel />}
        </div>

        {/* ── Close ── */}
        <button
          onClick={requestClose}
          aria-label="Close settings"
          className="btn-icon-ghost absolute top-2.5 right-2.5"
        >
          <span className="icon icon-sm">close</span>
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Account → Profile ──────────────────────────────────────────
function ProfilePanel({ onClose }) {
  const { user, updateUser } = useAuth();
  const fileRef              = useRef(null);

  const [joinedAt,  setJoinedAt]  = useState('');
  const [username,  setUsername]  = useState(user?.username ?? '');
  const [email,     setEmail]     = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  // Tracks WHICH url failed rather than a bare flag, so uploading a new avatar
  // clears the fallback on its own — no reset effect needed.
  const [brokenUrl, setBrokenUrl] = useState(null);
  const [cropSrc,   setCropSrc]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [savingId,  setSavingId]  = useState(false);
  const [progress,  setProgress]  = useState(null);
  const [msg,       setMsg]       = useState(null);
  const [editing,   setEditing]   = useState(false);
  // The values as last confirmed by the server — what Cancel restores to and
  // what the read-only rows display. State, not a ref: it is read during render.
  const [saved, setSaved] = useState({ username: user?.username ?? '', email: user?.email ?? '' });

  useEffect(() => {
    apiClient.get('/profile')
      .then(r => {
        const u = r.data.user;
        setSaved({ username: u.username, email: u.email });
        setUsername(u.username);
        setEmail(u.email);
        setAvatarUrl(u.avatar_url || null);
        setJoinedAt(new Date(u.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }));
      })
      .catch(() => setMsg({ text: 'Could not load profile.', type: 'error' }));
  }, []);

  const handleIdentitySave = async () => {
    setMsg(null);
    setSavingId(true);
    try {
      const res = await apiClient.put('/profile', { username, email });
      const u = res.data.user;
      setSaved({ username: u.username, email: u.email });
      updateUser({ username: u.username, email: u.email });
      setMsg({ text: '✓ Profile updated successfully!', type: 'success' });
      setEditing(false);   // collapse back to the read-only view
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setSavingId(false);
    }
  };

  const handleIdentityCancel = () => {
    setUsername(saved.username);
    setEmail(saved.email);
    setMsg(null);
    setEditing(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => setCropSrc(evt.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropSave = async (blob) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const res = await apiClient.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setAvatarUrl(res.data.avatar_url);
      setCropSrc(null);
      setMsg({ text: '✓ Profile picture updated!', type: 'success' });
      updateUser({ avatar_url: res.data.avatar_url });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Upload failed.', type: 'error' });
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const initials = (saved.username || username).slice(0, 2).toUpperCase() || '??';
  const identityDirty = username !== saved.username || email !== saved.email;

  return (
    <>
      <PanelHeader title="Profile" desc="Your account identity and storage usage." />
      <StatusMsg msg={msg} />

      {/* Avatar + identity */}
      <div className="flex items-center gap-4 mb-4">
        <Tooltip content="Click to change profile picture">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 shrink-0 rounded-full bg-(--color-primary-light) border-2 border-(--border-main) flex items-center justify-center cursor-pointer overflow-hidden [transition:border-color_0.15s_ease] hover:border-(--color-primary)"
          >
            {avatarUrl && brokenUrl !== avatarUrl ? (
              <img
                src={resolveAvatar(avatarUrl)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setBrokenUrl(avatarUrl)}
              />
            ) : (
              <span className="font-serif text-[26px] text-(--color-primary-dark)">{initials}</span>
            )}
          </div>
        </Tooltip>

        <div className="min-w-0">
          <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-secondary-sm">
            <span className="icon icon-sm">photo_camera</span>
            Change avatar
          </button>
          <p className="font-sans text-[11px] text-(--text-faint) mt-1.5 mb-0">
            JPG PNG WebP · Max 2MB
          </p>
          {progress !== null && (
            <div className="w-30 mt-2"><UploadProgressBar progress={progress} /></div>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onClose={() => setCropSrc(null)}
          saving={saving}
        />
      )}

      <div className="mb-6">
        <SectionLabel>Account Details</SectionLabel>

        {/* Read-only by default; the inputs replace these only once the user
            asks to edit, so the panel reads as information first. */}
        {editing ? (
          <>
            <Field label="Username">
              <Input name="username" autoComplete="username"
                     value={username} onChange={setUsername} placeholder="Your username" />
            </Field>
            <Field label="Email address">
              <Input type="email" name="email" autoComplete="email"
                     value={email} onChange={setEmail} placeholder="your@email.com" />
            </Field>
          </>
        ) : (
          <>
            <ReadOnlyRow label="Username"      value={saved.username} />
            <ReadOnlyRow label="Email address" value={saved.email} />
          </>
        )}

        {joinedAt && <ReadOnlyRow label="Member since" value={joinedAt} />}

        {/* Mounted always so it can slide from 0 rather than appear at full
            height on first render. */}
        <Collapse open={editing}>
          <div className="flex items-center gap-2 pt-3.5">
            {/* Disabled until something actually changed — saving an untouched
                form round-trips the API for nothing and reads as a no-op. */}
            <button onClick={handleIdentitySave} disabled={savingId || !identityDirty} className="btn-primary">
              {savingId ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleIdentityCancel} disabled={savingId} className="btn-ghost">
              Cancel
            </button>
          </div>
        </Collapse>

        {!editing && (
          <button
            onClick={() => { setMsg(null); setEditing(true); }}
            className="bg-transparent border-none p-0 mt-3 font-sans text-xs text-(--accent) cursor-pointer [transition:opacity_0.15s_ease] hover:opacity-75"
          >
            Edit username or email →
          </button>
        )}
      </div>

      <QuotaSection onClose={onClose} />
    </>
  );
}

// ── Upload quota bars (migrated from the NavBar quota panel) ────
const fmtMb = (b) => {
  const m = b / (1024 * 1024);
  return m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
};
const barColor = (pct) => pct >= 90 ? 'var(--danger)' : pct >= 60 ? '#d97706' : 'var(--color-primary)';

function QuotaBar({ label, used, limit }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-sans text-[13px] text-(--text-secondary)">{label}</span>
        {/* colour is threshold-derived from live data — stays inline */}
        <span className="font-sans text-[13px] font-semibold" style={{ color: barColor(pct) }}>
          {fmtMb(used)} <span className="text-(--text-faint) font-normal">/ {fmtMb(limit)} MB</span>
        </span>
      </div>
      <div className="h-2 rounded bg-(--border-main) overflow-hidden mb-3.5">
        {/* width + background are runtime values — stay inline */}
        <div
          className="h-full rounded [transition:width_0.4s_ease,background_0.3s_ease]"
          style={{ width: `${pct}%`, background: barColor(pct) }}
        />
      </div>
    </>
  );
}

function QuotaSection({ onClose }) {
  const navigate          = useNavigate();
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    const load = () => apiClient.get('/profile/upload-quota')
      .then(r => setQuota(r.data))
      .catch(() => {});
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-t border-(--border-main) pt-3.5">
      <SectionLabel>Upload Quota</SectionLabel>
      <QuotaBar
        label="Storage used"
        used={quota?.totalUsed ?? 0}
        limit={quota?.totalLimit ?? 200 * 1024 * 1024}
      />
      <QuotaBar
        label="Uploaded · last 5 min"
        used={quota?.windowUsed ?? 0}
        limit={quota?.windowLimit ?? 50 * 1024 * 1024}
      />
      <div className="font-sans text-[11px] text-(--text-faint) leading-normal mb-3">
        200&nbsp;MB total &middot; 50&nbsp;MB per 5 minutes.
      </div>
      <button onClick={() => { navigate('/files'); onClose?.(); }} className="btn-secondary btn-secondary-sm">
        <span className="icon icon-sm">folder_open</span>
        Manage files
      </button>
    </div>
  );
}

// ── Account → Security ─────────────────────────────────────────
function SecurityPanel() {
  const { user, updateUser } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg,     setPwMsg]     = useState(null);
  const [savingPw,  setSavingPw]  = useState(false);
  // The new-password fields stay sealed until the server confirms the current
  // one. `attempted` gates every red state: warnings appear on a rejected save,
  // never while the user is still typing.
  const [verified,  setVerified]  = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [attempted, setAttempted] = useState(false);
  // Guards against an out-of-order verify response overwriting a newer one.
  const verifySeq = useRef(0);

  const [discordId,   setDiscordId]   = useState(null);
  const [googleId,    setGoogleId]    = useState(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [oauthMsg,    setOauthMsg]    = useState(null);
  const [newPwSet,    setNewPwSet]    = useState('');
  const [settingPw,   setSettingPw]   = useState(false);
  const [setTried,    setSetTried]    = useState(false);
  // Only ever read by the hidden autocomplete="username" anchor below.
  const [accountEmail, setAccountEmail] = useState('');

  useEffect(() => {
    apiClient.get('/profile')
      .then(r => {
        const u = r.data.user;
        setDiscordId(u.discord_id || null);
        setGoogleId(u.google_id   || null);
        setHasPassword(u.has_password ?? true);
        setAccountEmail(u.email || '');
      })
      .catch(() => setOauthMsg({ text: 'Could not load account details.', type: 'error' }));
  }, []);

  // Editing the current password invalidates any prior check — reseal the
  // new-password fields so they can never be filled against a stale verdict.
  const handleCurrentPwChange = (v) => {
    setCurrentPw(v);
    if (verified) setVerified(false);
    if (pwMsg)    setPwMsg(null);
  };

  // Verified on blur rather than per keystroke: one request per attempt, and
  // the rate limiter stays a backstop instead of the thing you fight.
  const handleVerifyCurrent = async () => {
    if (!currentPw || verified || verifying) return;
    const seq = ++verifySeq.current;
    setVerifying(true);
    setPwMsg(null);
    try {
      const res = await apiClient.post('/profile/verify-password', { password: currentPw });
      if (seq !== verifySeq.current) return;      // superseded by a newer check
      if (res.data.valid) {
        setVerified(true);
      } else {
        setPwMsg({ text: 'Current password is incorrect.', type: 'error' });
      }
    } catch (err) {
      if (seq !== verifySeq.current) return;
      // 429 from the attempt limiter lands here with its own message.
      setPwMsg({ text: err.response?.data?.error || 'Could not verify password.', type: 'error' });
    } finally {
      if (seq === verifySeq.current) setVerifying(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e?.preventDefault();
    // Enter in the current-password box submits the form even while the rest
    // of it is still sealed — there is nothing to save yet.
    if (!verified) return handleVerifyCurrent();
    setAttempted(true);       // from here on, unmet rules may show red
    setPwMsg(null);
    // The checklist is the message for a policy failure — no banner on top.
    if (!meetsPolicy(newPw)) return;
    if (newPw !== confirmPw) return setPwMsg({ text: 'New passwords do not match.', type: 'error' });

    setSavingPw(true);
    try {
      await apiClient.put('/profile/password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ text: '✓ Password changed successfully!', type: 'success' });
      // Reset all the way back: the section reseals and the fields slide away.
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setVerified(false); setAttempted(false);
      // The new password satisfies the policy by definition, so retire any
      // outstanding "time to update this" suggestion.
      if (user?.password_needs_update) updateUser({ password_needs_update: false });
    } catch (err) {
      setPwMsg({ text: err.response?.data?.error || 'Password change failed.', type: 'error' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleDisconnect = async (provider) => {
    setOauthMsg(null);
    try {
      await apiClient.delete(`/auth/${provider}`);
      if (provider === 'discord') setDiscordId(null);
      else                        setGoogleId(null);
      setOauthMsg({ text: `✓ ${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected.`, type: 'success' });
    } catch (err) {
      setOauthMsg({ text: err.response?.data?.error || 'Failed to disconnect.', type: 'error' });
    }
  };

  const handleSetPassword = async () => {
    setSetTried(true);        // from here on, unmet rules may show red
    setOauthMsg(null);
    // The checklist carries the reason — no banner duplicating it.
    if (!meetsPolicy(newPwSet)) return;
    setSettingPw(true);
    try {
      await apiClient.post('/auth/set-password', { password: newPwSet });
      setHasPassword(true);
      setNewPwSet('');
      setSetTried(false);
      setOauthMsg({ text: '✓ Password set! You can now sign in with email + password.', type: 'success' });
    } catch (err) {
      setOauthMsg({ text: err.response?.data?.error || 'Failed to set password.', type: 'error' });
    } finally {
      setSettingPw(false);
    }
  };

  return (
    <>
      <PanelHeader title="Security" desc="Your password and connected sign-in providers." />

      {/* Advisory only — a password predating the current rules still signs in
          perfectly well. This suggests an update, it never demands one. */}
      {user?.password_needs_update && (
        <div className="flex items-start gap-2.5 py-3 px-3.5 mb-4 rounded-lg bg-(--bg-section-hd) border border-(--border-main)">
          <span className="icon icon-sm text-(--text-muted) shrink-0 mt-px">info</span>
          <p className="m-0 font-sans text-xs text-(--text-secondary) leading-[1.5]">
            Your password predates our current guidelines. It still works — but when
            you have a moment, consider updating it below.
          </p>
        </div>
      )}

      {/* ── Change password ── */}
      <div className="mb-5">
        <SectionLabel>{hasPassword ? 'Change Password' : 'Set a Password'}</SectionLabel>
        <StatusMsg msg={pwMsg} />

        {hasPassword ? (
          // A real <form> with an in-scope username anchor. Without it the
          // browser pairs an autofilled password with whatever text input it
          // can find in the document — which was landing the account email in
          // an unrelated dropdown search box behind the modal.
          <form onSubmit={handlePasswordSave}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={accountEmail}
              readOnly
              hidden
              aria-hidden="true"
              tabIndex={-1}
            />
            <Field label="Current Password">
              <Input type="password" name="current-password" autoComplete="current-password"
                     value={currentPw} onChange={handleCurrentPwChange} onBlur={handleVerifyCurrent}
                     placeholder="Your current password" />
              <p className="font-sans text-[11px] text-(--text-muted) mt-1.5 mb-0 flex items-center gap-1.5 min-h-4">
                {verifying ? (
                  <>
                    <span className="icon icon-sm animate-[spin_0.8s_linear_infinite]">progress_activity</span>
                    Checking…
                  </>
                ) : verified ? (
                  <span className="flex items-center gap-1.5 text-(--success)">
                    <span className="icon icon-sm">check_circle</span>
                    Confirmed
                  </span>
                ) : 'Enter your current password to continue.'}
              </p>
            </Field>

            {/* Sealed until the server confirms the current password. */}
            <Collapse open={verified}>
              <Field label="New Password">
                <Input type="password" name="new-password" autoComplete="new-password"
                       value={newPw} onChange={setNewPw} placeholder="At least 8 characters" />
                <PasswordChecklist password={newPw} showErrors={attempted} />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" name="confirm-password" autoComplete="new-password"
                       value={confirmPw} onChange={setConfirmPw} placeholder="Same password again" />
                {/* Only after a rejected save — never while still typing. */}
                {attempted && confirmPw !== newPw && (
                  <p className="font-sans text-xs text-(--danger) mt-1.5 mb-0">Passwords don't match</p>
                )}
              </Field>
              <button type="submit" disabled={savingPw} className="btn-primary">
                {savingPw ? 'Saving...' : 'Change Password'}
              </button>
            </Collapse>
          </form>
        ) : (
          <div className="flex items-center gap-2.5 py-3 px-3.5 rounded-lg bg-(--danger-bg) border border-(--danger) mb-3">
            <span className="icon text-(--danger) shrink-0">warning</span>
            <p className="m-0 font-sans text-xs text-(--danger) leading-[1.5]">
              <strong>No password set.</strong> Your account signs in through OAuth only.
              Set one below to also sign in with email.
            </p>
          </div>
        )}
      </div>

      {/* ── Connected accounts ── */}
      <div className="border-t border-(--border-main) pt-3.5">
        <SectionLabel>Connected Accounts</SectionLabel>
        <StatusMsg msg={oauthMsg} />

        <ConnectedRow
          icon={<DiscordIcon />}
          label="Discord"
          connected={!!discordId}
          connectHref="/api/auth/discord"
          onDisconnect={() => handleDisconnect('discord')}
        />
        <ConnectedRow
          icon={<GoogleIcon />}
          label="Google"
          connected={!!googleId}
          connectHref="/api/auth/google"
          onDisconnect={() => handleDisconnect('google')}
        />

        <div className="flex items-center gap-2.5 pt-2.5 mt-2.5 border-t border-(--border-main) flex-wrap">
          <span className={`icon icon-sm ${hasPassword ? 'text-(--success)' : 'text-(--text-faint)'}`}>
            {hasPassword ? 'lock' : 'lock_open'}
          </span>
          <span className="flex-1 font-sans text-[13px] text-(--text-secondary)">
            Password login{' '}
            {hasPassword
              ? <span className="text-(--success) text-[11px]">✓ set</span>
              : <span className="text-(--text-faint) text-[11px]">not set</span>}
          </span>
          {!hasPassword && (
            <div className="flex gap-2 items-center w-full mt-2">
              <div className="flex-1">
                <Input type="password" name="set-password" autoComplete="new-password"
                       value={newPwSet} onChange={setNewPwSet} placeholder="Set a password (8+ chars)" />
              </div>
              <button onClick={handleSetPassword} disabled={settingPw} className="btn-primary">
                {settingPw ? 'Saving...' : 'Set'}
              </button>
              <div className="w-full">
                <PasswordChecklist password={newPwSet} showErrors={setTried} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConnectedRow({ icon, label, connected, connectHref, onDisconnect }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-(--border-main)">
      <span className="flex items-center shrink-0">{icon}</span>
      <span className="flex-1 font-sans text-[13px] text-(--text-secondary)">
        {label}{' '}
        {connected
          ? <span className="text-(--success) text-[11px]">✓ connected</span>
          : <span className="text-(--text-faint) text-[11px]">not connected</span>}
      </span>
      {connected ? (
        <button onClick={onDisconnect} className="btn-danger-soft btn-danger-sm">Disconnect</button>
      ) : (
        <a href={connectHref} className="btn-secondary btn-secondary-sm no-underline">Connect</a>
      )}
    </div>
  );
}

// ── Appearance → Theme ─────────────────────────────────────────
function ThemePanel() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PanelHeader title="Theme" desc="Applies instantly across the whole app." />
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map(opt => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg [transition:border-color_0.15s_ease,background_0.15s_ease] ${isActive ? 'border-2 border-(--accent) bg-(--accent-bg) cursor-default' : 'border-[1.5px] border-(--border-main) bg-(--bg-input) cursor-pointer'}`}
            >
              {/* Three-colour swatch: [background, accent, surface] */}
              <div className="flex gap-0.5 rounded-[3px] overflow-hidden">
                {opt.swatch.map((color, i) => (
                  // swatch colour is per-theme data — stays inline
                  <div key={i} className="w-4.5 h-4.5" style={{ background: color }} />
                ))}
              </div>
              <span className={`font-sans text-[11px] leading-[1.2] text-center truncate max-w-full ${isActive ? 'text-(--accent) font-medium' : 'text-(--text-muted) font-normal'}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Appearance → Display ───────────────────────────────────────
// Segmented control across the full 7-step scale ladder. Kept at 7 steps
// (rather than S/M/L) so nobody's existing saved scale is orphaned.
function ScaleSeg({ value, onChange }) {
  return (
    <div className="seg">
      {SCALE_OPTIONS.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`seg-tab !px-2.5 ${value === opt ? 'active' : ''}`}
        >
          {Math.round(opt * 100)}%
        </button>
      ))}
    </div>
  );
}

function DisplayPanel() {
  const { sheetFontScale, setSheetFontScale, roomFontScale, setRoomFontScale } = useTheme();

  return (
    <>
      <PanelHeader title="Display" desc="Text sizing for the character sheet and session panels." />

      <div className="mb-5">
        <SectionLabel>Sheet text</SectionLabel>
        <p className="font-sans text-[11px] text-(--text-muted) mt-0 mb-2">Character sheet size</p>
        <ScaleSeg value={sheetFontScale} onChange={setSheetFontScale} />
      </div>

      <div>
        <SectionLabel>Display text</SectionLabel>
        <p className="font-sans text-[11px] text-(--text-muted) mt-0 mb-2">Room / session panels</p>
        <ScaleSeg value={roomFontScale} onChange={setRoomFontScale} />
      </div>
    </>
  );
}

// ── Appearance → Background ────────────────────────────────────
function BackgroundPanel() {
  const {
    bgArtEnabled,      setBgArtEnabled,
    parallaxEnabled,   setParallaxEnabled,
    parallaxIntensity, setParallaxIntensity,
  } = useTheme();

  return (
    <>
      <PanelHeader title="Background" desc="Atmospheric art behind the main pages." />

      <ToggleRow
        label="Background art"
        desc="Atmospheric art behind pages"
        checked={bgArtEnabled}
        onChange={() => setBgArtEnabled(!bgArtEnabled)}
      />

      {/* Parallax is meaningless with the art off — hidden rather than shown disabled */}
      {bgArtEnabled && (
        <>
          <ToggleRow
            label="Parallax effect"
            desc="Art moves with your cursor"
            checked={parallaxEnabled}
            onChange={() => setParallaxEnabled(!parallaxEnabled)}
          />
          {parallaxEnabled && (
            <SettingRow label="Amount" desc="Parallax strength">
              <div className="w-30">
                <Slider
                  value={parallaxIntensity}
                  min={0.25}
                  max={2}
                  step={0.05}
                  onChange={setParallaxIntensity}
                  ariaLabel="Parallax amount"
                />
              </div>
            </SettingRow>
          )}
        </>
      )}
    </>
  );
}

// ── App → Language ─────────────────────────────────────────────
function LanguagePanel() {
  const { i18n } = useTranslation();

  // i18next holds the active language; localStorage only seeds it on next boot.
  const change = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('catoolu_lang', lang);
  };

  return (
    <>
      <PanelHeader title="Language" desc="Interface language. Applies immediately." />
      <div className="seg">
        {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'ภาษาไทย' }].map(l => (
          <button
            key={l.id}
            onClick={() => change(l.id)}
            className={`seg-tab ${i18n.language === l.id ? 'active' : ''}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── App → Startup ──────────────────────────────────────────────
function StartupPanel() {
  const [homePage, setHomePage] = useState(() => localStorage.getItem('coc_home_page') || '/');

  const pick = (value) => {
    setHomePage(value);
    localStorage.setItem('coc_home_page', value);
  };

  return (
    <>
      <PanelHeader title="Startup" desc="Where the app takes you when you open it signed in." />
      <div className="flex flex-col gap-1.5">
        {HOME_OPTIONS.map(opt => {
          const isActive = homePage === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => pick(opt.value)}
              className={`flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-left [transition:border-color_0.15s_ease,background_0.15s_ease] ${isActive ? 'border-[1.5px] border-(--accent) bg-(--accent-bg) cursor-default' : 'border-[1.5px] border-(--border-main) bg-(--bg-input) cursor-pointer'}`}
            >
              <span className={`icon icon-sm ${isActive ? 'text-(--accent)' : 'text-(--text-faint)'}`}>
                {isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
              <span className="min-w-0">
                <span className={`block font-sans text-[13px] ${isActive ? 'text-(--accent) font-medium' : 'text-(--text-primary) font-normal'}`}>
                  {opt.label}
                </span>
                <span className="block font-sans text-[11px] text-(--text-muted) leading-[1.4]">
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── App → Notifications ────────────────────────────────────────
export const WHATS_NEW_KEY = 'catoolu_whats_new_enabled';

function NotificationsPanel() {
  const [whatsNew, setWhatsNew] = useState(
    () => localStorage.getItem(WHATS_NEW_KEY) !== 'false'
  );

  const toggle = () => {
    const next = !whatsNew;
    setWhatsNew(next);
    localStorage.setItem(WHATS_NEW_KEY, String(next));
  };

  return (
    <>
      <PanelHeader title="Notifications" desc="What the app shows you without being asked." />
      <ToggleRow
        label="What's New"
        desc="Show the release notes popup after an update"
        checked={whatsNew}
        onChange={toggle}
      />
      <p className="font-sans text-[11px] text-(--text-faint) mt-2.5 mb-0 leading-[1.5]">
        You can always open the release notes from the "What's New" link in the footer.
      </p>
    </>
  );
}
