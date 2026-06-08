import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ImageCropModal from '../components/ImageCropModal';

// ── Reusable field components ──────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display:       'block',
        fontSize:      '11px',
        fontWeight:    '500',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color:         'var(--text-muted)',
        marginBottom:  '6px',
      }}>
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
      style={{
        width:        '100%',
        padding:      '9px 12px',
        borderRadius: '8px',
        border:       '1px solid var(--border-input)',
        background:   'var(--bg-input)',
        color:        'var(--text-primary)',
        fontFamily:   'var(--font-sans)',
        fontSize:     '14px',
        outline:      'none',
        boxSizing:    'border-box',
        transition:   'border-color 0.15s ease',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
      onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
    />
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-main)',
      borderRadius: '12px',
      overflow:     'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        padding:      '14px 20px',
        borderBottom: '1px solid var(--border-main)',
        background:   'var(--bg-section-hd)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '17px',
          color:      'var(--text-primary)',
          margin:     0,
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '20px' }}>
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
      style={{
        padding:      '9px 20px',
        borderRadius: '8px',
        border:       'none',
        background:   saving ? 'var(--text-muted)' : 'var(--color-primary)',
        color:        '#ffffff',
        fontFamily:   'var(--font-sans)',
        fontSize:     '13px',
        fontWeight:   '500',
        cursor:       saving ? 'not-allowed' : 'pointer',
        transition:   'background 0.15s ease',
      }}
      onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
      onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary)'; }}
    >
      {saving ? 'Saving...' : label}
    </button>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div style={{
      padding:      '10px 14px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize:     '13px',
      background:   isSuccess ? 'var(--accent-bg)' : 'var(--danger-bg)',
      border:       `1px solid ${isSuccess ? 'var(--success)' : 'var(--danger)'}`,
      color:        isSuccess ? 'var(--success)' : 'var(--danger)',
    }}>
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
  const [cropSrc,      setCropSrc]      = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Password fields
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');

  // Status messages
  const [profileMsg,  setProfileMsg]  = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Load profile
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/profile');
        const u   = res.data.user;
        setUsername(u.username);
        setEmail(u.email);
        setAvatarUrl(u.avatar_url || null);
        setJoinedAt(new Date(u.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }));
      } catch {
        setProfileMsg({ text: 'Could not load profile.', type: 'error' });
      }
    };
    load();
  }, []);

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
      });

      setAvatarUrl(res.data.avatar_url);
      setCropSrc(null);
      setProfileMsg({ text: '✓ Profile picture updated!', type: 'success' });
      updateUser({ avatar_url: res.data.avatar_url });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.error || 'Upload failed.', type: 'error' });
    } finally {
      setSavingAvatar(false);
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

  return (
    <div style={{
      minHeight:     '100vh',
      background:    'var(--bg-page)',
      display:       'flex',
      flexDirection: 'column',
      fontFamily:    'var(--font-sans)',
    }}>
      <NavBar activeTab={null} />

      <main className="animate-fade-rise" style={{
        maxWidth: '1100px',
        margin:   '0 auto',
        padding:  '32px 24px',
        flex:     1,
        width:    '100%',
      }}>

        {/* Page title */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '28px',
          color:      'var(--text-primary)',
          margin:     '0 0 28px',
        }}>
          My Profile
        </h1>

        {/* ── Side by side layout ── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '260px 1fr',
          gap:                 '24px',
          alignItems:          'start',
        }}>

          {/* ── LEFT COLUMN: Account info + future portrait ── */}
          <div>
            <Card title="Account">
              {/* Avatar upload area */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    width:          '96px',
                    height:         '96px',
                    borderRadius:   '50%',
                    background:     'var(--color-primary-light)',
                    border:         '2px solid var(--border-main)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    margin:         '0 auto 8px',
                    cursor:         'pointer',
                    overflow:       'hidden',
                    transition:     'border-color 0.15s ease',
                    position:       'relative',
                  }}
                  title="Click to change profile picture"
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl.startsWith('http') ? avatarUrl : (import.meta.env.VITE_API_URL || '') + avatarUrl}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize:   '32px',
                      color:      'var(--color-primary-dark)',
                    }}>
                      {initials}
                    </span>
                  )}

                  {/* Hover overlay */}
                  <div style={{
                    position:       'absolute',
                    inset:          0,
                    background:     'rgba(0,0,0,0.4)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    opacity:        0,
                    transition:     'opacity 0.15s',
                    borderRadius:   '50%',
                    fontSize:       '20px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    📷
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>
                  Click to change · JPG PNG WebP · Max 2MB
                </p>
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
              <div style={{
                borderTop:  '1px solid var(--border-main)',
                paddingTop: '14px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize:   '17px',
                  color:      'var(--text-primary)',
                  margin:     '0 0 4px',
                }}>
                  {username}
                </p>
                <p style={{
                  fontSize: '12px',
                  color:    'var(--text-muted)',
                  margin:   '0 0 4px',
                  wordBreak:'break-all',
                }}>
                  {email}
                </p>
                <p style={{
                  fontSize: '11px',
                  color:    'var(--text-faint)',
                  margin:   0,
                }}>
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
                  <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '6px 0 0' }}>
                    Passwords don't match
                  </p>
                )}
              </FormField>
              <SaveButton onClick={handlePasswordSave} saving={savingPassword}
                          label="Change Password" />
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}