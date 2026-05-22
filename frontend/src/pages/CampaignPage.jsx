import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar  from '../components/NavBar';
import Footer  from '../components/Footer';
import apiClient from '../api/client';
import CreateCampaignModal from '../components/CreateCampaignModal';
import JoinCampaignModal   from '../components/JoinCampaignModal';

export default function CampaignPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [modal,     setModal]     = useState(null); // 'create' | 'join' | null

  // ── Load campaigns ──────────────────────────────────────────
  const loadCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/campaigns');
      setCampaigns(res.data.campaigns);
    } catch {
      setError('Could not load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);

  // ── After create or join — reload the list ──────────────────
  const handleSuccess = () => {
    setModal(null);
    loadCampaigns();
  };

  return (
    <div style={{
      minHeight:     '100vh',
      background:    'var(--bg-page)',
      display:       'flex',
      flexDirection: 'column',
      fontFamily:    'var(--font-sans)',
    }}>
      <NavBar activeTab="campaign" />

      <main style={{
        maxWidth: '1200px',
        margin:   '0 auto',
        padding:  '32px 24px',
        flex:     1,
        width:    '100%',
      }}>

        {/* Page header */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          marginBottom:   '28px',
          flexWrap:       'wrap',
          gap:            '12px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '28px',
              color:      'var(--text-primary)',
              margin:     '0 0 4px',
            }}>
              Campaigns
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {loading ? 'Loading...' :
               campaigns.length === 0 ? 'No campaigns yet — create one or join with a code' :
               campaigns.length + ' campaign' + (campaigns.length !== 1 ? 's' : '')}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setModal('join')}
              style={{
                padding:      '8px 18px',
                borderRadius: '8px',
                border:       '1px solid var(--border-main)',
                background:   'transparent',
                color:        'var(--text-secondary)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '13px',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color       = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-main)';
                e.currentTarget.style.color       = 'var(--text-secondary)';
              }}
            >
              🔑 Join
            </button>
            <button
              onClick={() => setModal('create')}
              style={{
                padding:      '8px 18px',
                borderRadius: '8px',
                border:       'none',
                background:   'var(--color-primary)',
                color:        '#ffffff',
                fontFamily:   'var(--font-sans)',
                fontSize:     '13px',
                fontWeight:   '500',
                cursor:       'pointer',
                transition:   'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
            >
              + Create
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   'var(--danger-bg)',
            border:       '1px solid var(--danger)',
            borderRadius: '8px',
            padding:      '12px 16px',
            marginBottom: '20px',
            fontSize:     '13px',
            color:        'var(--danger)',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height:       '160px',
                borderRadius: '12px',
                background:   'var(--bg-card)',
                border:       '1px solid var(--border-main)',
                opacity:      0.5,
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.3 }}>⚔️</div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '22px',
              color:      'var(--text-primary)',
              margin:     '0 0 8px',
            }}>
              No Investigations Yet
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 28px' }}>
              Create a campaign as Keeper, or join one with an invite code.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setModal('join')}
                style={{
                  padding:      '10px 24px',
                  borderRadius: '8px',
                  border:       '1px solid var(--border-main)',
                  background:   'transparent',
                  color:        'var(--text-secondary)',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '14px',
                  cursor:       'pointer',
                }}
              >
                🔑 Join with Code
              </button>
              <button
                onClick={() => setModal('create')}
                style={{
                  padding:      '10px 24px',
                  borderRadius: '8px',
                  border:       'none',
                  background:   'var(--color-primary)',
                  color:        '#ffffff',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '14px',
                  fontWeight:   '500',
                  cursor:       'pointer',
                }}
              >
                + Create Campaign
              </button>
            </div>
          </div>
        )}

        {/* Campaign grid */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap:                 '16px',
          }}>
            {campaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEnter={() => navigate('/campaign/' + campaign.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {modal === 'create' && (
        <CreateCampaignModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
      {modal === 'join' && (
        <JoinCampaignModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}


// ── Campaign Card ──────────────────────────────────────────────
function CampaignCard({ campaign, onEnter }) {
  const navigate = useNavigate();
  const isKeeper = campaign.role === 'keeper';

  return (
    <div
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '12px',
        padding:      '20px',
        display:      'flex',
        flexDirection:'column',
        gap:          '12px',
        boxShadow:    'var(--shadow-card)',
        transition:   'box-shadow 0.15s ease, transform 0.15s ease',
        cursor:       'pointer',
      }}
      onClick={onEnter}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '5px',
          background:   isKeeper ? 'var(--accent-bg)'   : 'var(--bg-section-hd)',
          color:        isKeeper ? 'var(--accent)'       : 'var(--text-muted)',
          border:       '1px solid ' + (isKeeper ? 'var(--border-main)' : 'var(--border-main)'),
          borderRadius: '20px',
          fontSize:     '11px',
          fontWeight:   '500',
          padding:      '3px 10px',
        }}>
          {isKeeper ? '🎭 Keeper' : '⚔️ Player'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          {campaign.member_count} member{campaign.member_count !== '1' ? 's' : ''}
        </span>
      </div>

      {/* Campaign name */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '18px',
          color:      'var(--text-primary)',
          margin:     '0 0 4px',
          lineHeight: '1.3',
        }}>
          {campaign.name}
        </h3>
        {campaign.description && (
          <p style={{
            fontSize:   '13px',
            color:      'var(--text-muted)',
            margin:     0,
            lineHeight: '1.5',
            // Clamp to 2 lines
            display:          '-webkit-box',
            WebkitLineClamp:  2,
            WebkitBoxOrient:  'vertical',
            overflow:         'hidden',
          }}>
            {campaign.description}
          </p>
        )}
      </div>

      {/* Keeper name + enter button */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginTop:      'auto',
        paddingTop:     '8px',
        borderTop:      '1px solid var(--border-main)',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          Keeper: {campaign.keeper_name}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onEnter(); }}
          style={{
            padding:      '5px 14px',
            borderRadius: '7px',
            border:       '1px solid var(--color-primary)',
            background:   'transparent',
            color:        'var(--color-primary)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '12px',
            fontWeight:   '500',
            cursor:       'pointer',
            transition:   'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-primary)';
            e.currentTarget.style.color      = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color      = 'var(--color-primary)';
          }}
        >
          Enter Room →
        </button>
      </div>

      {/* Keeper management link */}
      {isKeeper && (
        <div
          onClick={e => { e.stopPropagation(); navigate('/keeper'); }}
          style={{
            fontSize:  '11px',
            color:     'var(--accent)',
            cursor:    'pointer',
            textAlign: 'right',
            marginTop: '4px',
          }}
        >
          Manage in Keeper tab →
        </div>
      )}
    </div>
  );
}