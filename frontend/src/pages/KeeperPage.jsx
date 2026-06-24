import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar    from '../components/NavBar';
import Footer    from '../components/Footer';
import apiClient from '../api/client';
import KeeperCampaignDetail  from '../components/KeeperCampaignDetail';
import CreateCampaignModal   from '../components/CreateCampaignModal';

export default function KeeperPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnToRef = useRef(null);
  const [campaigns,    setCampaigns]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [selected,     setSelected]    = useState(null); // campaign object
  const [initialTab,   setInitialTab]  = useState(null);
  const [showCreate,   setShowCreate]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await apiClient.get('/campaigns');
      const kept = res.data.campaigns.filter(c => c.role === 'keeper');
      setCampaigns(kept);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Open campaign+tab from navigation state (e.g. from KeeperHandoutPanel)
  useEffect(() => {
    const { openCampaignUuid, openTab, returnTo: openReturnTo } = location.state || {};
    if (!openCampaignUuid || loading || campaigns.length === 0) return;
    const target = campaigns.find(c => c.uuid === openCampaignUuid);
    if (target) {
      setInitialTab(openTab ?? null);
      setSelected(target);
      returnToRef.current = openReturnTo ?? null;
      // Clear state so back-navigation doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [loading, campaigns]);

  // If a campaign is selected, show the detail view
  if (selected) {
    return (
      <div style={{
        minHeight:'100vh', background:'var(--bg-page)',
        display:'flex', flexDirection:'column',
      }}>
        <NavBar activeTab="keeper" />
        <KeeperCampaignDetail
          campaign={selected}
          initialTab={initialTab}
          onBack={() => {
            if (returnToRef.current) {
              const dest = returnToRef.current;
              returnToRef.current = null;
              navigate(dest);
            } else {
              setSelected(null);
              setInitialTab(null);
              load();
            }
          }}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-page)',
      display:'flex', flexDirection:'column',
      fontFamily:'var(--font-sans)',
    }}>
      <NavBar activeTab="keeper" />

      <main className="animate-fade-rise" style={{
        maxWidth:'1200px', margin:'0 auto',
        padding:'32px 24px', flex:1, width:'100%',
      }}>
        <div style={{
          marginBottom:'28px', display:'flex',
          justifyContent:'space-between', alignItems:'flex-end',
        }}>
          <div>
            <h1 style={{
              fontFamily:'var(--font-serif)', fontSize:'28px',
              color:'var(--text-primary)', margin:'0 0 4px',
            }}>
              Keeper
            </h1>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>
              {loading ? 'Loading...' :
               campaigns.length === 0
                 ? 'No campaigns yet — create one below'
                 : campaigns.length + ' campaign' + (campaigns.length !== 1 ? 's' : '')}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding:'8px 18px', borderRadius:'8px',
              border:'none', background:'var(--color-primary)',
              color:'#ffffff', fontFamily:'var(--font-sans)',
              fontSize:'13px', fontWeight:'500', cursor:'pointer',
            }}
          >
            + Create Campaign
          </button>
        </div>

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ marginBottom:'12px', opacity:0.3 }}>
              <span className="icon" style={{ fontSize:'48px' }}>theater_comedy</span>
            </div>
            <p style={{
              fontFamily:'var(--font-serif)', fontSize:'18px',
              color:'var(--text-primary)', margin:'0 0 8px',
            }}>
              No campaigns to keep
            </p>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>
              Create a campaign using the button above.
            </p>
          </div>
        )}

        {/* Campaign grid */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',
            gap:'16px',
          }}>
            {campaigns.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  background:'var(--bg-card)',
                  border:'1px solid var(--border-main)',
                  borderRadius:'12px', padding:'20px',
                  cursor:'pointer', transition:'all 0.15s ease',
                  boxShadow:'var(--shadow-card)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  background:'var(--accent-bg)',
                  color:'var(--accent)', borderRadius:'20px',
                  fontSize:'11px', fontWeight:'500',
                  padding:'3px 10px', marginBottom:'10px',
                }}>
                  <span className="icon icon-sm">theater_comedy</span>{' '}Keeper
                </div>
                <h3 style={{
                  fontFamily:'var(--font-serif)', fontSize:'18px',
                  color:'var(--text-primary)', margin:'0 0 6px',
                }}>
                  {c.name}
                </h3>
                {c.description && (
                  <p style={{
                    fontSize:'13px', color:'var(--text-muted)',
                    margin:'0 0 12px', lineHeight:'1.5',
                    display:'-webkit-box',
                    WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                    overflow:'hidden',
                  }}>
                    {c.description}
                  </p>
                )}
                <div style={{
                  fontSize:'12px', color:'var(--text-faint)',
                  borderTop:'1px solid var(--border-main)',
                  paddingTop:'10px', marginTop:'auto',
                }}>
                  {c.member_count} member{c.member_count !== '1' ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}