import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';
import Footer from '../components/Footer';

const HOME_LABELS = {
  '/dashboard': 'Go to your Investigators',
  '/keeper':    'Go to Keeper Panel',
  '/campaign':  'Go to Campaigns',
};

const HOW_TO_SECTIONS = [
  {
    num: '01',
    label: 'Create your Investigator',
    description:
      'Build your investigator from scratch with the character creation wizard. Choose your occupation, allocate skill points, and write your backstory.',
    video: '/assets/howto/howto-create.mp4',
  },
  {
    num: '02',
    label: 'Join a Campaign',
    description:
      'Your Keeper creates a campaign and shares an invite code. Enter the code to join and bring your investigator to the table.',
    video: '/assets/howto/howto-campaign.mp4',
  },
  {
    num: '03',
    label: 'Roll & Track',
    description:
      'Click any stat or skill to roll live during a session. Track HP, Sanity, Magic Points, and Luck in real time as the story unfolds.',
    video: '/assets/howto/howto-roll.mp4',
  },
  {
    num: '04',
    label: "Import from Dhole's House",
    description:
      "Already have a character on Dhole's House? Import them directly with a single JSON file — all stats, skills, and backstory intact.",
    video: '/assets/howto/howto-import.mp4',
  },
];

function VideoBlock({ src }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--bg-section-hd)',
      border: '1px solid var(--border-main)',
    }}>
      {!broken ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setBroken(true)}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '0.75rem',
        }}>
          <span className="icon" style={{ fontSize: '42px', color: 'var(--text-faint)' }}>videocam</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>
            Screen recording coming soon
          </span>
        </div>
      )}
    </div>
  );
}

const LANDING_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'howto',    label: 'How to Use' },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [tab, setTab] = useState('overview');

  const homePref  = localStorage.getItem('coc_home_page') || '/dashboard';
  const homeLabel = HOME_LABELS[homePref] ?? 'Go to your Investigators';
  const homePath  = HOME_LABELS[homePref] ? homePref : '/dashboard';
  const containerRef = useRef(null);
  const tabRefs      = useRef({});
  const [pillBounds, setPillBounds] = useState(null);

  useEffect(() => {
    const el        = tabRefs.current[tab];
    const container = containerRef.current;
    if (!el || !container) return;
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setPillBounds({ left: r.left - c.left, width: r.width });
  }, [tab]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* ── Hero header ── */}
      <header style={{ textAlign: 'center', padding: '3.5rem 1.5rem 1.75rem' }}>
        <img
          src={logo}
          alt="The Catoolu"
          style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }}
        />
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--color-primary-dark)',
          margin: '0 0 0.4rem',
          letterSpacing: '0.02em',
        }}>
          The Catoolu
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
          Call of Cthulhu Character Manager
        </p>
      </header>

      {/* ── Tab switcher — sliding pill, same mechanism as NavBar ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 1.5rem 2rem' }}>
        {/* Outer track: just the border + padding — keeps pill math clean */}
        <div style={{
          border:       '1.5px solid var(--border-input)',
          borderRadius: '24px',
          padding:      '3px',
        }}>
        <div
          ref={containerRef}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            position:   'relative',
          }}
        >
          {/* The pill that slides */}
          {pillBounds && (
            <div style={{
              position:      'absolute',
              top:           0,
              bottom:        0,
              left:          pillBounds.left,
              width:         pillBounds.width,
              borderRadius:  '20px',
              background:    'var(--accent-bg)',
              border:        '1.5px solid var(--color-primary)',
              zIndex:        0,
              pointerEvents: 'none',
              transition:    'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          )}

          {LANDING_TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                ref={el => { tabRefs.current[t.id] = el; }}
                onClick={() => setTab(t.id)}
                style={{
                  padding:      '5px 20px',
                  borderRadius: '20px',
                  border:       '1.5px solid transparent',
                  background:   'transparent',
                  color:        active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                  fontWeight:   active ? 500 : 400,
                  cursor:       active ? 'default' : 'pointer',
                  whiteSpace:   'nowrap',
                  transition:   'color 0.15s ease',
                  position:     'relative',
                  zIndex:       1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>

        {tab === 'overview' && (
          <div className="animate-fade-rise">
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: '620px',
              margin: '0 auto 2rem',
              textAlign: 'center',
            }}>
              The Catoolu is an online character manager for Call of Cthulhu tabletop RPG sessions.
              Create your investigator, join your Keeper's campaign, and roll dice — all in one place.
              Built for players and Keepers who want to focus on the horror, not the paperwork.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {user ? (
                <button
                  onClick={() => navigate(homePath)}
                  style={{
                    padding: '0.7rem 1.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
                >
                  {homeLabel}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    style={{
                      padding: '0.7rem 1.8rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      padding: '0.7rem 1.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-input)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>

            <VideoBlock src="/assets/demo.mp4" />
          </div>
        )}

        {tab === 'howto' && (
          <div className="animate-fade-rise" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {HOW_TO_SECTIONS.map(s => (
              <section key={s.num}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}>
                    {s.num}
                  </span>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                    color: 'var(--text-primary)',
                    margin: '0 0 0.6rem',
                  }}>
                    {s.label}
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: '560px',
                  }}>
                    {s.description}
                  </p>
                </div>
                <VideoBlock src={s.video} />
              </section>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
