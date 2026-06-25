import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchable,
  renderOption,
  placement = 'auto',
  width,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  // Auto-enable search when > 5 options
  const showSearch = searchable ?? options.length > 5;

  // Selected option label
  const selectedOption = options.find(o => o.value === value);

  // Filter options by search
  const filtered = search
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Position the panel relative to trigger
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = Math.min(filtered.length * 40 + (showSearch ? 44 : 0) + 8, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const goUp = placement === 'top' ||
      (placement === 'auto' && spaceBelow < panelH && spaceAbove > spaceBelow);

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: width ?? rect.width,
      zIndex: 1200,
      ...(goUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }
      ),
    });
  }, [filtered.length, showSearch, placement, width]);

  // Open / close
  const toggle = () => {
    if (disabled) return;
    if (!open) {
      calculatePosition();
      setOpen(true);
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setOpen(false);
      setSearch('');
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
    setSearch('');
  };

  // Close on outside click; reposition (don't close) on scroll / resize so the
  // panel tracks the trigger instead of vanishing when a scroll container moves.
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    const reposition = () => calculatePosition();
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, calculatePosition]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') { setOpen(false); setSearch(''); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Default rich row renderer
  const defaultRenderOption = (option, isSelected) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 10px',
      cursor: 'pointer',
      background: isSelected ? 'var(--accent-bg)' : 'transparent',
      transition: 'background 0.1s ease',
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)'; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    onClick={() => handleSelect(option)}>
      {/* Portrait / avatar */}
      {(option.image || option.imageFallback) && (
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--bg-input)',
          border: '0.5px solid var(--border-main)',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-muted)',
        }}>
          {option.image
            ? <img src={option.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : option.imageFallback
          }
        </div>
      )}
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: isSelected ? 500 : 400,
          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {option.label}
        </div>
        {option.sublabel && (
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {option.sublabel}
          </div>
        )}
      </div>
      {/* Selected checkmark */}
      {isSelected && (
        <span className="icon icon-sm" style={{ color: 'var(--accent)', flexShrink: 0 }}>
          check
        </span>
      )}
    </div>
  );

  const panel = open && createPortal(
    <div
      ref={panelRef}
      style={{
        ...panelStyle,
        background: 'var(--bg-popup)',
        border: '0.5px solid var(--border-main)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-dropdown)',
        overflow: 'hidden',
        animation: 'fadeRise 150ms ease-out both',
      }}>
      {/* Search bar */}
      {showSearch && (
        <div style={{
          padding: '6px 8px',
          borderBottom: '0.5px solid var(--border-main)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-input)',
            border: '0.5px solid var(--border-input)',
            borderRadius: 6,
            padding: '5px 8px',
          }}>
            <span className="icon icon-sm" style={{ color: 'var(--text-faint)' }}>search</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12,
                color: 'var(--text-primary)',
                flex: 1,
                fontFamily: 'var(--font-sans)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-faint)', fontSize: 14, lineHeight: 1, padding: 0,
                }}>
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Options list */}
      <div style={{
        maxHeight: 280,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '12px 10px',
            fontSize: 12,
            color: 'var(--text-faint)',
            textAlign: 'center',
          }}>
            No results
          </div>
        ) : filtered.map(option => (
          <div key={option.value}>
            {(renderOption ?? defaultRenderOption)(option, option.value === value)}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={toggle}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '7px 10px',
          background: 'var(--bg-input)',
          border: `0.5px solid ${open ? 'var(--border-focus)' : 'var(--border-input)'}`,
          borderRadius: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          textAlign: 'left',
          transition: 'border-color 0.15s ease',
          fontFamily: 'var(--font-sans)',
        }}>
        {/* Selected value preview */}
        {selectedOption?.image && (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src={selectedOption.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <span style={{
          flex: 1,
          fontSize: 13,
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-faint)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="icon icon-sm" style={{
          color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s ease',
          flexShrink: 0,
        }}>
          expand_more
        </span>
      </button>

      {panel}
    </>
  );
}
