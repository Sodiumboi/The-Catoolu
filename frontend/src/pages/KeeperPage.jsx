import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar    from '../components/NavBar';
import Footer    from '../components/Footer';
import CustomDropdown from '../components/ui/CustomDropdown';
import apiClient from '../api/client';
import KeeperCampaignDetail  from '../components/KeeperCampaignDetail';
import CreateCampaignModal   from '../components/CreateCampaignModal';
import logo from '../assets/vault-logo.png';

export default function KeeperPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnToRef = useRef(null);
  const [campaigns,    setCampaigns]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [selected,     setSelected]    = useState(null); // campaign object
  const [initialTab,   setInitialTab]  = useState(null);
  const [showCreate,   setShowCreate]  = useState(false);
  const [sortBy,       setSortBy]      = useState(
    () => localStorage.getItem('campaign-list-sort') || 'updated-desc'
  );

  const sortedCampaigns = useMemo(() => {
    const copy = [...campaigns];
    switch (sortBy) {
      case 'created-desc': copy.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)); break;
      case 'name-asc':     copy.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':    copy.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'members-desc': copy.sort((a, b) => parseInt(b.member_count) - parseInt(a.member_count)); break;
      default:             copy.sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1)); break;
    }
    return copy;
  }, [campaigns, sortBy]);

  const handleSortChange = (val) => {
    setSortBy(val);
    localStorage.setItem('campaign-list-sort', val);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        apiClient.get('/campaigns'),
        new Promise(r => setTimeout(r, 400)),
      ]);
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
      <div className="min-h-screen flex flex-col">
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
    <div className="min-h-screen flex flex-col font-sans">
      <NavBar activeTab="keeper" />

      <main className="animate-fade-rise max-w-[1200px] mx-auto py-8 px-6 flex-1 w-full">
        <div className="mb-7 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-[28px] text-(--text-primary) m-0 mb-1">
              Keeper
            </h1>
            <p className="text-[13px] text-(--text-muted) m-0">
              {loading ? 'Loading...' :
               campaigns.length === 0
                 ? 'No campaigns yet — create one below'
                 : campaigns.length + ' campaign' + (campaigns.length !== 1 ? 's' : '')}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!loading && campaigns.length > 0 && (
              <div className="w-[190px] shrink-0">
                <CustomDropdown
                  value={sortBy}
                  onChange={handleSortChange}
                  searchable={false}
                  options={[
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
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              + Create Campaign
            </button>
          </div>
        </div>

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
            <div className="mb-3 opacity-30">
              <span className="icon text-[48px]">theater_comedy</span>
            </div>
            <p className="font-serif text-lg text-(--text-primary) m-0 mb-2">
              No campaigns to keep
            </p>
            <p className="text-[13px] text-(--text-muted) m-0">
              Create a campaign using the button above.
            </p>
          </div>
        )}

        {/* Campaign grid */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {sortedCampaigns.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className="bg-(--bg-card) border border-(--border-main) rounded-xl p-5 cursor-pointer transition-all duration-150 ease-[ease] shadow-(--shadow-card)"
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="inline-flex items-center gap-[5px] bg-(--accent-bg) text-(--accent) rounded-[20px] text-[11px] font-medium py-[3px] px-2.5 mb-2.5">
                  <span className="icon icon-sm">theater_comedy</span>{' '}Keeper
                </div>
                <h3 className="font-serif text-lg text-(--text-primary) m-0 mb-1.5">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-[13px] text-(--text-muted) m-0 mb-3 leading-normal line-clamp-2">
                    {c.description}
                  </p>
                )}
                <div className="text-xs text-(--text-faint) border-t border-(--border-main) pt-2.5 mt-auto">
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