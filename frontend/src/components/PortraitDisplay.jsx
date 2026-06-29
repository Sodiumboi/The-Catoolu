import { useState, useCallback } from 'react';
import Tooltip from './ui/Tooltip';

// Renders a portrait image at its natural aspect ratio.
// The padding-bottom trick: a percentage padding-bottom is always
// calculated relative to the element's WIDTH, not height.
// So padding-bottom: 133% on a 140px wide box = 186px tall.
// We set this dynamically from the image's naturalHeight/naturalWidth.

export default function PortraitDisplay({ portrait, onUploadClick, readOnly = false }) {
  const [naturalW, setNaturalW] = useState(null);
  const [naturalH, setNaturalH] = useState(null);

  const handleLoad = useCallback((e) => {
    setNaturalW(e.target.naturalWidth);
    setNaturalH(e.target.naturalHeight);
  }, []);

  // Ratio defaults to 1:1 (square) until the image reports its size
  const paddingBottom = naturalW && naturalH
    ? `${(naturalH / naturalW) * 100}%`
    : '100%';

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: '140px' }}>

      {/* Aspect-ratio box */}
      <Tooltip content={readOnly ? undefined : 'Click to change portrait'}>
      <div
        className={`relative group rounded overflow-hidden w-full ${readOnly ? '' : 'cursor-pointer'}`}
        style={{
          paddingBottom,
          border: '2px solid var(--border-main)',
          transition: 'padding-bottom 0.2s ease',
        }}
        onClick={readOnly ? undefined : onUploadClick}
      >
        {/* Absolute inner layer fills the padded space exactly */}
        <div className="absolute inset-0">
          {portrait ? (
            <img
              src={`data:image/jpeg;base64,${portrait}`}
              alt="Investigator portrait"
              className="w-full h-full object-contain"
              onLoad={handleLoad}
              style={{ display: 'block' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs"
                 style={{ background: 'var(--bg-card)', color: 'var(--text-faint)' }}>
              No Portrait
            </div>
          )}

          {/* Hover overlay */}
          {!readOnly && (
            <div className="absolute inset-0 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                 style={{ background: 'rgba(0,0,0,0.55)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                📷 Change
              </span>
            </div>
          )}
        </div>
      </div>
      </Tooltip>

      {!readOnly && (
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Click to change
        </span>
      )}
    </div>
  );
}