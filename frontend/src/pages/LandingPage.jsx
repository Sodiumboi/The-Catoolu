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
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-(--bg-section-hd) border border-(--border-main)">
      {!broken ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover block"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <span className="icon text-[42px] text-(--text-faint)">videocam</span>
          <span className="font-sans text-[0.8rem] text-(--text-faint) italic">
            Screen recording coming soon
          </span>
        </div>
      )}
    </div>
  );
}

const LANDING_TABS = [
  { id: 'overview', label: 'Overview' },
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
    <div className="min-h-screen flex flex-col bg-(--bg-page)">

      {/* ── Hero header ── */}
      <header className="text-center pt-14 px-6 pb-7">
        <img
          src={logo}
          alt="The Catoolu"
          className="block w-[72px] h-[72px] object-contain mx-auto mt-0 mb-4"
        />
        <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] text-(--color-primary-dark) m-0 mb-[0.4rem] tracking-[0.02em]">
          The Catoolu
        </h1>
        <p className="font-sans text-base text-(--text-muted) m-0">
          Call of Cthulhu Character Manager
        </p>
      </header>

      {/* ── Tab switcher — sliding pill, same mechanism as NavBar ── */}
      <div className="flex justify-center pt-0 px-6 pb-8">
        {/* Outer track: just the border + padding — keeps pill math clean */}
        <div className="border-[1.5px] border-(--border-input) rounded-3xl p-[3px]">
        <div
          ref={containerRef}
          className="flex items-center gap-1 relative"
        >
          {/* The pill that slides */}
          {pillBounds && (
            <div
              className="absolute top-0 bottom-0 rounded-[20px] bg-(--accent-bg) border-[1.5px] border-(--color-primary) z-0 pointer-events-none [transition:left_0.3s_cubic-bezier(0.4,0,0.2,1),width_0.3s_cubic-bezier(0.4,0,0.2,1)]"
              /* runtime geometry from getBoundingClientRect — stays inline */
              style={{ left: pillBounds.left, width: pillBounds.width }}
            />
          )}

          {LANDING_TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                ref={el => { tabRefs.current[t.id] = el; }}
                onClick={() => setTab(t.id)}
                className={`py-[5px] px-5 rounded-[20px] border-[1.5px] border-transparent bg-transparent font-sans text-[13px] whitespace-nowrap [transition:color_0.15s_ease] relative z-[1] ${active ? 'text-(--color-primary) font-medium cursor-default' : 'text-(--text-secondary) font-normal cursor-pointer'}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 w-full max-w-[900px] mx-auto pt-0 px-6 pb-16">

        {tab === 'overview' && (
          <div className="animate-fade-rise">
            <p className="font-sans text-[1.05rem] text-(--text-secondary) leading-[1.7] max-w-[620px] mx-auto mt-0 mb-8 text-center">
              The Catoolu is an online character manager for Call of Cthulhu tabletop RPG sessions.
              Create your investigator, join your Keeper's campaign, and roll dice — all in one place.
              Built for players and Keepers who want to focus on the horror, not the paperwork.
            </p>

            <div className="flex justify-center gap-3 flex-wrap mb-10">
              {user ? (
                <button
                  onClick={() => navigate(homePath)}
                  className="btn-primary"
                >
                  {homeLabel}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-secondary"
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
          <div className="animate-fade-rise flex flex-col gap-14">
            {HOW_TO_SECTIONS.map(s => (
              <section key={s.num}>
                <div className="mb-4">
                  <span className="font-sans text-[0.7rem] font-bold tracking-[0.1em] uppercase text-(--accent) block mb-[0.3rem]">
                    {s.num}
                  </span>
                  <h2 className="font-serif text-[clamp(1.3rem,3vw,1.8rem)] text-(--text-primary) m-0 mb-[0.6rem]">
                    {s.label}
                  </h2>
                  <p className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.65] m-0 max-w-[560px]">
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
