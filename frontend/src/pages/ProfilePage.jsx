import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ImageCropModal from '../components/ImageCropModal';
import UploadProgressBar from '../components/UploadProgressBar';
import Tooltip from '../components/ui/Tooltip';

// ── Reusable field components ──────────────────────────────
function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-medium uppercase tracking-[0.07em] text-(--text-muted) mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function FormInput({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full py-2.25 px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none! box-border [transition:border-color_0.15s_ease]"
      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
      onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
    />
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-(--bg-card) border border-(--border-main) rounded-xl overflow-hidden mb-5">
      <div className="py-3.5 px-5 border-b border-(--border-main) bg-(--bg-section-hd)">
        <h2 className="font-serif text-[17px] text-(--text-primary) m-0">
          {title}
        </h2>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Save Changes' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {saving ? 'Saving...' : label}
    </button>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div className={`py-2.5 px-3.5 rounded-lg mb-4 text-[13px] border ${isSuccess ? 'bg-(--accent-bg) border-(--success) text-(--success)' : 'bg-(--danger-bg) border-(--danger) text-(--danger)'}`}>
      {msg.text}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate          = useNavigate();
  const avatarInputRef    = useRef(null);

  // Profile fields
  const [username,     setUsername]     = useState('');
  const [email,        setEmail]        = useState('');
  const [joinedAt,     setJoinedAt]     = useState('');
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [avatarError,  setAvatarError]  = useState(false);
  const [cropSrc,      setCropSrc]      = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(null);

  // Password fields
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');

  // Status messages
  const [profileMsg,  setProfileMsg]  = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // OAuth / connected accounts
  const [discordId,   setDiscordId]   = useState(null);
  const [googleId,    setGoogleId]    = useState(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [oauthMsg,    setOauthMsg]    = useState(null);
  const [newPwSet,    setNewPwSet]    = useState('');
  const [settingPw,   setSettingPw]   = useState(false);

  // Load profile
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/profile');
        const u   = res.data.user;
        setUsername(u.username);
        setEmail(u.email);
        setAvatarUrl(u.avatar_url || null);
        setDiscordId(u.discord_id || null);
        setGoogleId(u.google_id   || null);
        setHasPassword(u.has_password ?? true);
        setJoinedAt(new Date(u.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }));
      } catch {
        setProfileMsg({ text: 'Could not load profile.', type: 'error' });
      }
    };
    load();
  }, []);

  useEffect(() => { setAvatarError(false); }, [avatarUrl]);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCropSrc(evt.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropSave = async (blob) => {
    setSavingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      const res = await apiClient.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setAvatarProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setAvatarUrl(res.data.avatar_url);
      setCropSrc(null);
      setProfileMsg({ text: '✓ Profile picture updated!', type: 'success' });
      updateUser({ avatar_url: res.data.avatar_url });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.error || 'Upload failed.', type: 'error' });
    } finally {
      setSavingAvatar(false);
      setAvatarProgress(null);
    }
  };

  // Save profile
  const handleProfileSave = async () => {
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await apiClient.put('/profile', { username, email });
      updateUser({ username: res.data.user.username, email: res.data.user.email });
      setProfileMsg({ text: '✓ Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handlePasswordSave = async () => {
    setPasswordMsg(null);
    if (newPw !== confirmPw) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPw.length < 8) {
      setPasswordMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.put('/profile/password', { currentPassword: currentPw, newPassword: newPw });
      setPasswordMsg({ text: '✓ Password changed successfully!', type: 'success' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.error || 'Password change failed.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = username?.slice(0, 2).toUpperCase() || '??';

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
    setOauthMsg(null);
    if (!newPwSet || newPwSet.length < 8) {
      setOauthMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    setSettingPw(true);
    try {
      await apiClient.post('/auth/set-password', { password: newPwSet });
      setHasPassword(true);
      setNewPwSet('');
      setOauthMsg({ text: '✓ Password set! You can now sign in with email + password.', type: 'success' });
    } catch (err) {
      setOauthMsg({ text: err.response?.data?.error || 'Failed to set password.', type: 'error' });
    } finally {
      setSettingPw(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-page) flex flex-col font-sans">
      <NavBar activeTab={null} />

      <main className="animate-fade-rise max-w-275 mx-auto py-8 px-6 flex-1 w-full">

        {/* Page title */}
        <h1 className="font-serif text-[28px] text-(--text-primary) mt-0 mb-4">
          My Profile
        </h1>

        {/* No-password warning — shown for OAuth-only accounts */}
        {hasPassword === false && (
          <div className="animate-fade-rise flex items-center gap-2.5 py-3 px-4 mb-6 rounded-[10px] bg-(--danger-bg) border border-(--danger)">
            <span className="icon text-(--danger) shrink-0">warning</span>
            <p className="m-0 font-sans text-[13px] text-(--danger) leading-[1.5]">
              <strong>No password set.</strong> Your account uses OAuth login only.
              Set a password in <em>Connected Accounts</em> below if you also want to sign in with email.
            </p>
          </div>
        )}

        {/* ── Side by side layout ── */}
        <div className="grid grid-cols-[260px_1fr] gap-6 items-start">

          {/* ── LEFT COLUMN: Account info + future portrait ── */}
          <div>
            <Card title="Account">
              {/* Avatar upload area */}
              <div className="text-center mb-4">
                <Tooltip content="Click to change profile picture">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-(--color-primary-light) border-2 border-(--border-main) flex items-center justify-center mx-auto mb-2 cursor-pointer overflow-hidden [transition:border-color_0.15s_ease] relative"
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
                >
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl.startsWith('http') ? avatarUrl : (import.meta.env.VITE_API_URL || '') + avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="font-serif text-[32px] text-(--color-primary-dark)">
                      {initials}
                    </span>
                  )}

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 [transition:opacity_0.15s] rounded-full text-xl"
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    📷
                  </div>
                </div>
                </Tooltip>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <p className="text-[11px] text-(--text-faint) m-0">
                  Click to change · JPG PNG WebP · Max 2MB
                </p>
                {avatarProgress !== null && (
                  <div className="w-30 mt-2">
                    <UploadProgressBar progress={avatarProgress} />
                  </div>
                )}
              </div>

              {/* Crop modal */}
              {cropSrc && (
                <ImageCropModal
                  imageSrc={cropSrc}
                  onSave={handleCropSave}
                  onClose={() => setCropSrc(null)}
                  saving={savingAvatar}
                />
              )}

              {/* Account details */}
              <div className="border-t border-(--border-main) pt-3.5">
                <p className="font-serif text-[17px] text-(--text-primary) mt-0 mb-1">
                  {username}
                </p>
                <p className="text-xs text-(--text-muted) mt-0 mb-1 break-all">
                  {email}
                </p>
                <p className="text-[11px] text-(--text-faint) m-0">
                  Member since {joinedAt}
                </p>
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN: Edit profile + change password ── */}
          <div>
            {/* Edit Profile */}
            <Card title="Edit Profile">
              <StatusMsg msg={profileMsg} />
              <FormField label="Username">
                <FormInput value={username} onChange={setUsername} placeholder="Your username" />
              </FormField>
              <FormField label="Email Address">
                <FormInput type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
              </FormField>
              <SaveButton onClick={handleProfileSave} saving={savingProfile} />
            </Card>

            {/* Change Password */}
            <Card title="Change Password">
              <StatusMsg msg={passwordMsg} />
              <FormField label="Current Password">
                <FormInput type="password" value={currentPw} onChange={setCurrentPw}
                           placeholder="Your current password" />
              </FormField>
              <FormField label="New Password">
                <FormInput type="password" value={newPw} onChange={setNewPw}
                           placeholder="At least 8 characters" />
              </FormField>
              <FormField label="Confirm New Password">
                <FormInput type="password" value={confirmPw} onChange={setConfirmPw}
                           placeholder="Same password again" />
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-xs text-(--danger) mt-1.5 mr-0 mb-0">
                    Passwords don't match
                  </p>
                )}
              </FormField>
              <SaveButton onClick={handlePasswordSave} saving={savingPassword}
                          label="Change Password" />
            </Card>

            {/* Connected Accounts */}
            <Card title="Connected Accounts">
              <StatusMsg msg={oauthMsg} />

              {/* Discord */}
              <ConnectedRow
                icon={<DiscordIcon />}
                label="Discord"
                connected={!!discordId}
                connectHref="/api/auth/discord"
                onDisconnect={() => handleDisconnect('discord')}
              />

              {/* Google */}
              <ConnectedRow
                icon={<GoogleIcon />}
                label="Google"
                connected={!!googleId}
                connectHref="/api/auth/google"
                onDisconnect={() => handleDisconnect('google')}
              />

              {/* Password login row — "Set password" for OAuth-only accounts */}
              <div className="flex items-center gap-2.5 pt-2.5 border-t border-(--border-main) mt-2.5 flex-wrap">
                <span className={`icon icon-sm ${hasPassword ? 'text-(--success)' : 'text-(--text-faint)'}`}>
                  {hasPassword ? 'lock' : 'lock_open'}
                </span>
                <span className="flex-1 font-sans text-[13px] text-(--text-secondary)">
                  Password login {hasPassword ? <span className="text-(--success) text-[11px]">✓ set</span> : <span className="text-(--text-faint) text-[11px]">not set</span>}
                </span>
                {!hasPassword && (
                  <div className="flex gap-2 items-center w-full mt-2">
                    <input
                      type="password"
                      value={newPwSet}
                      onChange={e => setNewPwSet(e.target.value)}
                      placeholder="Set a password (8+ chars)"
                      className="flex-1 py-2 px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[13px] outline-none! box-border"
                      onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; }}
                      onBlur={e  => { e.target.style.borderColor = 'var(--border-input)'; }}
                    />
                    <SaveButton onClick={handleSetPassword} saving={settingPw} label="Set" />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Connected account row ──────────────────────────────────
function ConnectedRow({ icon, label, connected, connectHref, onDisconnect }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-(--border-main)">
      <span className="flex items-center shrink-0">{icon}</span>
      <span className="flex-1 font-sans text-[13px] text-(--text-secondary)">
        {label}{' '}
        {connected
          ? <span className="text-(--success) text-[11px]">✓ connected</span>
          : <span className="text-(--text-faint) text-[11px]">not connected</span>
        }
      </span>
      {connected ? (
        <button
          onClick={onDisconnect}
          className="py-1 px-2.5 rounded-md border border-(--border-input) bg-transparent text-(--text-muted) font-sans text-[11px] cursor-pointer [transition:border-color_0.15s,color_0.15s]"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          Disconnect
        </button>
      ) : (
        <a
          href={connectHref}
          className="py-1 px-2.5 rounded-md border border-(--border-input) bg-transparent text-(--color-primary) font-sans text-[11px] no-underline font-medium [transition:border-color_0.15s,background_0.15s]"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.background = 'transparent'; }}
        >
          Connect
        </a>
      )}
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.036.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}