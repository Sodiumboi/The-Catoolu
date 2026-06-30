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
    <div
      className={`flex items-center gap-2.5 py-[7px] px-2.5 cursor-pointer [transition:background_0.1s_ease] ${isSelected ? 'bg-(--accent-bg)' : 'bg-transparent'}`}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      onClick={() => handleSelect(option)}>
      {/* Portrait / avatar */}
      {(option.image || option.imageFallback) && (
        <div className="w-8 h-8 rounded-full bg-(--bg-input) border-[0.5px] border-(--border-main) overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-medium text-(--text-muted)">
          {option.image
            ? <img src={option.image} alt="" className="w-full h-full object-cover" />
            : option.imageFallback
          }
        </div>
      )}
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] overflow-hidden text-ellipsis whitespace-nowrap ${isSelected ? 'font-medium text-(--accent)' : 'font-normal text-(--text-primary)'}`}>
          {option.label}
        </div>
        {option.sublabel && (
          <div className="text-[11px] text-(--text-muted) overflow-hidden text-ellipsis whitespace-nowrap">
            {option.sublabel}
          </div>
        )}
      </div>
      {/* Selected checkmark */}
      {isSelected && (
        <span className="icon icon-sm text-(--accent) shrink-0">
          check
        </span>
      )}
    </div>
  );

  const panel = open && createPortal(
    <div
      ref={panelRef}
      className="bg-(--bg-popup) border-[0.5px] border-(--border-main) rounded-lg shadow-(--shadow-dropdown) overflow-hidden animate-[fadeRise_150ms_ease-out_both]"
      style={panelStyle}>
      {/* Search bar */}
      {showSearch && (
        <div className="py-1.5 px-2 border-b-[0.5px] border-(--border-main)">
          <div className="flex items-center gap-1.5 bg-(--bg-input) border-[0.5px] border-(--border-input) rounded-md py-[5px] px-2">
            <span className="icon icon-sm text-(--text-faint)">search</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="border-none bg-transparent outline-none text-xs text-(--text-primary) flex-1 font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="bg-transparent border-none cursor-pointer text-(--text-faint) text-sm leading-none p-0">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Options list */}
      <div className="max-h-[280px] overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <div className="py-3 px-2.5 text-xs text-(--text-faint) text-center">
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
        className={`flex items-center gap-2 w-full py-[7px] px-2.5 bg-(--bg-input) border-[0.5px] rounded-lg text-left [transition:border-color_0.15s_ease] font-sans ${open ? 'border-(--border-focus)' : 'border-(--border-input)'} ${disabled ? 'cursor-not-allowed opacity-[0.55]' : 'cursor-pointer opacity-100'}`}>
        {/* Selected value preview */}
        {selectedOption?.image && (
          <div className="w-[22px] h-[22px] rounded-full overflow-hidden shrink-0">
            <img src={selectedOption.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <span className={`flex-1 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap ${selectedOption ? 'text-(--text-primary)' : 'text-(--text-faint)'}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={`icon icon-sm text-(--text-muted) [transition:transform_0.15s_ease] shrink-0 ${open ? '[transform:rotate(180deg)]' : '[transform:none]'}`}>
          expand_more
        </span>
      </button>

      {panel}
    </>
  );
}
