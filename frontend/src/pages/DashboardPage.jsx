import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import CharacterCard from '../components/CharacterCard';
import CreateOrImportModal from '../components/CreateOrImportModal';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';
import ConfirmDialog from '../components/ConfirmDialog';
import BetaBadge from '../components/ui/BetaBadge';
import useConfirm from '../hooks/useConfirm';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [characters, setCharacters]   = useState([]);
  const [loading, setLoading]         = useState(true); // true = load on mount
  const [importing, setImporting]     = useState(false);
  const { confirm, dialogProps } = useConfirm();
  const toast = useToast();
  const [showCreateImport, setShowCreateImport] = useState(false);
  const [createdBanner, setCreatedBanner] = useState(!!location.state?.created);
  const fileInputRef = useRef(null);

  // ── Create / Import chooser ────────────────────────────
  const openCreateImport  = () => setShowCreateImport(true);
  const handleChooseCreate = () => { setShowCreateImport(false); navigate('/create'); };
  const handleChooseImport = () => { setShowCreateImport(false); fileInputRef.current?.click(); };

  // Auto-dismiss the "investigator ready" success banner
  useEffect(() => {
    if (!createdBanner) return;
    const t = setTimeout(() => setCreatedBanner(false), 5000);
    return () => clearTimeout(t);
  }, [createdBanner]);

  // Surface an error passed via navigation (e.g. a failed redirect) once on mount.
  useEffect(() => {
    if (location.state?.error) toast.error('Something went wrong', location.state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const [response] = await Promise.all([
        apiClient.get('/characters'),
        new Promise(r => setTimeout(r, 400)),
      ]);
      setCharacters(response.data.characters);
    } catch (err) {
      toast.error("Couldn't load your investigators", 'Refresh to try again.', {
        action: { label: 'Try again', onClick: fetchCharacters },
        details: { endpoint: 'GET /characters', status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await fetchCharacters(); };
    load();
  }, []);

  // ── Import JSON file ───────────────────────────────────
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so the same file can be re-imported if needed
    e.target.value = '';

    if (!file.name.endsWith('.json')) {
      toast.warning('Wrong file type', "Please choose a .json file exported from Dhole's House.");
      return;
    }

    setImporting(true);

    try {
      // Read the file as text
      const text = await file.text();
      const sheet_data = JSON.parse(text);

      // Send to backend
      await apiClient.post('/characters', { sheet_data });

      // Refresh the list
      await fetchCharacters();
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("Couldn't import — invalid JSON", 'The file is not valid JSON. Check the file and try again.', {
          details: { raw: err.message },
        });
      } else {
        toast.error("Couldn't import investigator", 'Try again.', {
          details: { endpoint: 'POST /characters', status: err.response?.status, raw: err.response?.data?.error || err.message },
        });
      }
    } finally {
      setImporting(false);
    }
  };

  // ── Delete character ───────────────────────────────────
  const handleDelete = async (character) => {
    const ok = await confirm({
      title: 'Delete Investigator?',
      message: `${character.name} will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Forever',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/characters/${character.uuid}`);
      setCharacters(prev => prev.filter(c => c.uuid !== character.uuid));
    } catch (err) {
      toast.error("Couldn't delete investigator", 'The investigator was not deleted. Try again.', {
        action: { label: 'Try again', onClick: () => handleDelete(character) },
        details: { endpoint: 'DELETE /characters', status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
    }
  };

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter characters by name or occupation
  const filteredCharacters = characters.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.occupation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hidden file input — triggered by "Import Another" card */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* ── Top Navigation Bar ── */}
      <NavBar
        activeTab="investigators"
        onImport={handleFileImport}
      />

      {/* ── Main Content ── */}
      <main className="animate-fade-rise max-w-[1200px] mx-auto py-8 px-6 flex-1 w-full">

        {/* Page header + search */}
        <div className="mb-6">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="font-serif text-[28px] text-(--text-primary) m-0 mb-1 leading-[1.2]">
                Investigators
              </h2>
              <p className="font-sans text-[13px] text-(--text-muted) m-0">
                {characters.length === 0
                  ? 'No investigators yet — import a JSON file to begin'
                  : `${characters.length} investigator${characters.length !== 1 ? 's' : ''} in the vault`}
              </p>
            </div>

            {/* Search input — only show when there are characters */}
            {characters.length > 0 && (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 [transform:translateY(-50%)] pointer-events-none">
                  <span className="icon icon-sm">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Search investigators..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="font-sans text-[13px] py-[7px] pr-3 pl-8 rounded-lg border border-(--border-input) bg-(--bg-card) text-(--text-primary) w-[220px] outline-none! [transition:border-color_0.15s_ease]"
                  onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 [transform:translateY(-50%)] bg-transparent border-none cursor-pointer text-(--text-muted) p-0.5 leading-none"
                  >
                    <span className="icon icon-sm">close</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Success banner — shown after creating an investigator */}
        {createdBanner && (
          <div className="mb-6 px-4 py-3 rounded text-sm flex items-center justify-between animate-fade-rise bg-(--accent-bg) text-(--color-primary-dark) border border-(--accent)">
            <span className="inline-flex items-center gap-1.5">
              <span className="icon icon-sm">check_circle</span>Your investigator is ready.
            </span>
            <button onClick={() => setCreatedBanner(false)} className="text-(--color-primary-dark) opacity-70">
              <span className="icon icon-sm">close</span>
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <img src={logo} alt="Loading"
                   className="object-contain animate-pulse mx-auto mb-4 w-14 h-14" />
              <p className="text-(--text-muted)">Summoning investigators...</p>
            </div>
          </div>

        /* Empty state */
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 opacity-30"><span className="icon text-[56px]">history_edu</span></div>
            <h3 className="text-lg font-medium mb-2 text-(--text-primary)">
              The vault is empty
            </h3>
            <p className="text-sm mb-6 text-(--text-muted)">
              Build one from scratch with the creation wizard, or import a Dhole's House JSON file
            </p>
            <button
              onClick={openCreateImport}
              className="btn-primary">
              <span className="icon icon-sm">add</span>{' '}{t('dashboard.create_or_import')}<BetaBadge className="ml-[0.4rem]" />
            </button>
          </div>

        /* No search results */
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-[60px] px-5">
            <div className="mb-3 opacity-30"><span className="icon text-[40px]">search</span></div>
            <p className="font-sans text-[15px] text-(--text-muted) m-0 mb-2">
              No investigators match "{search}"
            </p>
            <button
              onClick={() => setSearch('')}
              className="font-sans text-[13px] text-(--accent) bg-transparent border-none cursor-pointer underline"
            >
              Clear search
            </button>
          </div>

        /* Character grid */
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map(character => (
              <CharacterCard
                key={character.uuid}
                character={character}
                onOpen={(uuid) => navigate(`/character/${uuid}`)}
                onDelete={(uuid, name) => handleDelete({ uuid, name })}
              />
            ))}

            {/* Persistent "Create or Import" card */}
            <button
              onClick={openCreateImport}
              className="p-5 border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-48 transition-all duration-200 border-(--border-main) text-(--text-muted) rounded-(--radius-squircle)"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-main)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <span className="text-3xl">+</span>
              <span className="text-sm font-medium">Create or Import<BetaBadge className="ml-[0.4rem]" /></span>
            </button>
          </div>
        )}
      </main>

      <ConfirmDialog {...dialogProps} />

      {/* ── Create / Import chooser ── */}
      <CreateOrImportModal
        open={showCreateImport}
        onClose={() => setShowCreateImport(false)}
        onCreate={handleChooseCreate}
        onImport={handleChooseImport}
      />

      <Footer />
    </div>
  );
}
