import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar  from '../components/NavBar';
import Footer  from '../components/Footer';
import apiClient from '../api/client';
import JoinCampaignModal from '../components/JoinCampaignModal';
import CustomDropdown from '../components/ui/CustomDropdown';
import logo from '../assets/vault-logo.png';
import Tooltip from '../components/ui/Tooltip';

export default function CampaignPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [modal,     setModal]     = useState(null); // 'join' | null
  const [sortBy,    setSortBy]    = useState(
    () => localStorage.getItem('player-campaign-sort') || 'last-joined-desc'
  );

  const sortedCampaigns = useMemo(() => {
    const copy = [...campaigns];
    switch (sortBy) {
      case 'created-desc': copy.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)); break;
      case 'name-asc':     copy.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':    copy.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'members-desc': copy.sort((a, b) => parseInt(b.member_count) - parseInt(a.member_count)); break;
      case 'last-joined-desc':
        copy.sort((a, b) =>
          new Date(b.last_joined_at ?? 0) - new Date(a.last_joined_at ?? 0)
        );
        break;
      default:             copy.sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1)); break;
    }
    return copy;
  }, [campaigns, sortBy]);

  const handleSortChange = (val) => {
    setSortBy(val);
    localStorage.setItem('player-campaign-sort', val);
  };

  // ── Load campaigns ──────────────────────────────────────────
  const loadCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const [res] = await Promise.all([
        apiClient.get('/campaigns'),
        new Promise(r => setTimeout(r, 400)),
      ]);
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
    <div className="min-h-screen flex flex-col font-sans">
      <NavBar activeTab="campaign" />

      <main className="animate-fade-rise max-w-[1200px] mx-auto py-8 px-6 flex-1 w-full">

        {/* Page header */}
        <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[28px] text-(--text-primary) m-0 mb-1">
              Campaigns
            </h1>
            <p className="text-[13px] text-(--text-muted) m-0">
              {loading ? 'Loading...' :
               campaigns.length === 0 ? 'No campaigns yet — join one with an invite code' :
               campaigns.length + ' campaign' + (campaigns.length !== 1 ? 's' : '')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {!loading && campaigns.length > 0 && (
              <div className="w-[185px] shrink-0">
                <CustomDropdown
                  value={sortBy}
                  onChange={handleSortChange}
                  searchable={false}
                  options={[
                    { value: 'last-joined-desc', label: 'Last visited' },
                    { value: 'updated-desc', label: 'Last updated: newest' },
                    { value: 'created-desc', label: 'Date created: newest' },
                    { value: 'name-asc', label: 'Name A–Z' },
                    { value: 'name-desc', label: 'Name Z–A' },
                    { value: 'members-desc', label: 'Most players' },
                  ]}
                />
              </div>
            )}
            <button
              onClick={() => setModal('join')}
              className="btn-primary"
            >
              <span className="icon icon-sm">key</span>{' '}Join
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-3 px-4 mb-5 text-[13px] text-(--danger)">
            <span className="icon icon-sm">warning</span>{' '}{error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <img src={logo} alt="Loading"
                   className="object-contain animate-pulse mx-auto mb-4 w-14 h-14" />
              <p className="text-(--text-muted)">Loading campaigns...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div className="text-center py-20 px-5">
            <div className="mb-4 opacity-30">
              <span className="icon text-[56px] text-(--text-muted)">swords</span>
            </div>
            <h2 className="font-serif text-[22px] text-(--text-primary) m-0 mb-2">
              No Investigations Yet
            </h2>
            <p className="text-sm text-(--text-muted) m-0 mb-7">
              Join a campaign with an invite code, or create one from the Keeper tab.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setModal('join')}
                className="py-2.5 px-6 rounded-lg border border-(--border-main) bg-transparent text-(--text-secondary) font-sans text-sm cursor-pointer"
              >
                <span className="icon icon-sm">key</span>{' '}Join with Code
              </button>
            </div>
          </div>
        )}

        {/* Campaign grid */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {sortedCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEnter={() => navigate('/campaign/' + campaign.uuid)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
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
      className="bg-(--bg-card) border border-(--border-main) rounded-xl p-5 flex flex-col gap-3 shadow-(--shadow-card) [transition:box-shadow_0.15s_ease,transform_0.15s_ease] cursor-pointer"
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
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-[5px] border border-(--border-main) rounded-[20px] text-[11px] font-medium py-[3px] px-2.5 ${isKeeper ? 'bg-(--accent-bg) text-(--accent)' : 'bg-(--bg-section-hd) text-(--text-muted)'}`}>
          {isKeeper
            ? <><span className="icon icon-sm">theater_comedy</span>{' '}Keeper</>
            : <><span className="icon icon-sm">swords</span>{' '}Player</>
          }
        </span>
        <span className="text-[11px] text-(--text-faint)">
          {campaign.member_count} member{campaign.member_count !== '1' ? 's' : ''}
        </span>
      </div>

      {/* Campaign name */}
      <div>
        <h3 className="font-serif text-lg text-(--text-primary) m-0 mb-1 leading-[1.3]">
          {campaign.name}
        </h3>
        {campaign.description && (
          <p className="text-[13px] text-(--text-muted) m-0 leading-normal line-clamp-2">
            {campaign.description}
          </p>
        )}
      </div>

      {/* Keeper name + enter button */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-(--border-main)">
        <span className="text-xs text-(--text-faint)">
          Keeper: {campaign.keeper_name}
        </span>
        <div className="flex items-center gap-2">
          {isKeeper && (
            <Tooltip content="Manage in Keeper tab">
            <button
              onClick={e => { e.stopPropagation(); navigate('/keeper', { state: { openCampaignUuid: campaign.uuid } }); }}
              aria-label="Manage in Keeper tab"
              className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[7px] border border-(--border-main) bg-transparent text-(--accent) cursor-pointer [transition:all_0.15s_ease]"
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'color-mix(in srgb, var(--accent) 12%, transparent)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-main)';
              }}
            >
              <span className="icon icon-sm">settings</span>
            </button>
            </Tooltip>
          )}
          <button
            onClick={e => { e.stopPropagation(); onEnter(); }}
            className="py-[5px] px-3.5 rounded-[7px] border border-(--color-primary) bg-transparent text-(--color-primary) font-sans text-xs font-medium cursor-pointer [transition:all_0.15s_ease]"
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
      </div>
    </div>
  );
}