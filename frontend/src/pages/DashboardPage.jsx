import { useState, useEffect, useRef } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import CharacterCard from '../components/CharacterCard';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [characters, setCharacters]   = useState([]);
  const [loading, setLoading]         = useState(true); // true = load on mount
  const [error, setError]             = useState('');
  const [importing, setImporting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const fileInputRef = useRef(null);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/characters');
      setCharacters(response.data.characters);
    } catch (err) {
      setError('Failed to load characters. Is the backend running?');
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
      setError('Please select a .json file.');
      return;
    }

    setImporting(true);
    setError('');

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
        setError('Invalid JSON file. Please check the file and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to import character.');
      }
    } finally {
      setImporting(false);
    }
  };

  // ── Delete character ───────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/characters/${deleteConfirm.id}`);
      setCharacters(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete character.');
      setDeleteConfirm(null);
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
    <div style={{
      minHeight:     '100vh',
      background:    'var(--bg-page)',
      display:       'flex',
      flexDirection: 'column',
    }}>

      {/* Hidden file input — triggered by "Import Another" card */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* ── Top Navigation Bar ── */}
      <NavBar
        activeTab="investigators"
        onImport={handleFileImport}
        investigatorCount={characters.length}
      />

      {/* ── Main Content ── */}
      <main style={{
        maxWidth: '1200px',
        margin:   '0 auto',
        padding:  '32px 24px',
        flex:     1,
      }}>

        {/* Page header + search */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'space-between',
            flexWrap:       'wrap',
            gap:            '12px',
            marginBottom:   '16px',
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize:   '28px',
                color:      'var(--text-primary)',
                margin:     '0 0 4px',
                lineHeight: '1.2',
              }}>
                Investigators
              </h2>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize:   '13px',
                color:      'var(--text-muted)',
                margin:     0,
              }}>
                {characters.length === 0
                  ? 'No investigators yet — import a JSON file to begin'
                  : `${characters.length} investigator${characters.length !== 1 ? 's' : ''} in the vault`}
              </p>
            </div>

            {/* Search input — only show when there are characters */}
            {characters.length > 0 && (
              <div style={{ position: 'relative' }}>
                <span style={{
                  position:      'absolute',
                  left:          '10px',
                  top:           '50%',
                  transform:     'translateY(-50%)',
                  pointerEvents: 'none',
                }}>
                  <span className="icon icon-sm">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Search investigators..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    padding:      '7px 12px 7px 32px',
                    borderRadius: '8px',
                    border:       '1px solid var(--border-input)',
                    background:   'var(--bg-card)',
                    color:        'var(--text-primary)',
                    width:        '220px',
                    outline:      'none',
                    transition:   'border-color 0.15s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position:   'absolute',
                      right:      '8px',
                      top:        '50%',
                      transform:  'translateY(-50%)',
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      color:      'var(--text-muted)',
                      padding:    '2px',
                      lineHeight: 1,
                    }}
                  >
                    <span className="icon icon-sm">close</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded text-sm flex items-center justify-between"
               style={{ background: 'var(--danger)22', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}><span className="icon icon-sm">warning</span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'var(--danger)', opacity: 0.7 }}><span className="icon icon-sm">close</span></button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <img src={logo} alt="Loading"
                   className="object-contain animate-pulse mx-auto mb-4"
                   style={{ width: '56px', height: '56px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Summoning investigators...</p>
            </div>
          </div>

        /* Empty state */
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 opacity-30"><span className="icon" style={{ fontSize:'56px' }}>history_edu</span></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              The vault is empty
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Import a Dhole's House JSON file to add your first investigator
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded font-medium transition-all duration-150"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-input)',
              }}>
              <span className="icon icon-sm">folder_open</span>{' '}Import Your First Character
            </button>
          </div>

        /* No search results */
        ) : filteredCharacters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ marginBottom: '12px', opacity: 0.3 }}><span className="icon" style={{ fontSize:'40px' }}>search</span></div>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   '15px',
              color:      'var(--text-muted)',
              margin:     '0 0 8px',
            }}>
              No investigators match "{search}"
            </p>
            <button
              onClick={() => setSearch('')}
              style={{
                fontFamily:     'var(--font-sans)',
                fontSize:       '13px',
                color:          'var(--accent)',
                background:     'none',
                border:         'none',
                cursor:         'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear search
            </button>
          </div>

        /* Character grid */
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map(character => (
              <CharacterCard
                key={character.id}
                character={character}
                onOpen={(id) => navigate(`/character/${id}`)}
                onDelete={(id, name) => setDeleteConfirm({ id, name })}
              />
            ))}

            {/* "Add another" card */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg p-5 border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-48 transition-all duration-200"
              style={{ borderColor: 'var(--accent)33', color: 'var(--accent)55' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--accent)33';
                e.currentTarget.style.color = 'var(--accent)55';
              }}
            >
              <span className="text-3xl">+</span>
              <span className="text-sm font-medium">Import Another</span>
            </button>
          </div>
        )}
      </main>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
             style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-lg p-6 border"
               style={{
                 background:  'var(--bg-card)',
                 borderColor: 'var(--danger)',
                 boxShadow:   '0 0 40px rgba(139,26,26,0.3)',
               }}>
            <h3 className="font-bold text-lg mb-2"
                style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
              Delete Investigator?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {deleteConfirm.name}
              </strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded text-sm font-medium transition-all"
                style={{
                  background:  'var(--bg-input)',
                  color:       'var(--text-muted)',
                  border:      '1px solid var(--border-main)',
                }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded text-sm font-medium transition-all"
                style={{
                  background: 'var(--danger)',
                  color:      'var(--text-primary)',
                }}>
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
