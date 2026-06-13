import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ── Helper: get cropped canvas ────────────────────────────────
function getCroppedCanvas(image, crop, displayWidth, displayHeight) {
  const scaleX   = image.naturalWidth  / displayWidth;
  const scaleY   = image.naturalHeight / displayHeight;
  const naturalW = crop.width  * scaleX;
  const naturalH = crop.height * scaleY;

  // Scale down to max 800px on the longest side; never upscale
  const maxPx  = 800;
  const scale  = Math.min(1, maxPx / Math.max(naturalW, naturalH));
  const outW   = Math.round(naturalW * scale);
  const outH   = Math.round(naturalH * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    naturalW, naturalH,
    0, 0, outW, outH
  );

  return canvas;
}

// ── Helper: canvas to Blob ─────────────────────────────────────
function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.85);
  });
}

export default function ImageCropModal({ imageSrc, onSave, onClose, saving }) {
  const imgRef  = useRef(null);
  const [crop,  setCrop]  = useState();
  const [completedCrop,  setCompletedCrop]  = useState();
  const [imgDisplaySize, setImgDisplaySize] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Centre a square crop on image load
  // Use getBoundingClientRect for reliable rendered dimensions (image.width can
  // return the intrinsic width instead of the CSS layout width in some browsers).
  const onImageLoad = useCallback((e) => {
    const rect   = e.currentTarget.getBoundingClientRect();
    const width  = rect.width;
    const height = rect.height;
    setImgDisplaySize({ width, height });
    const c = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width, height
    );
    setCrop(c);
    setCompletedCrop(convertToPixelCrop(c, width, height));
  }, []);

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current || !imgDisplaySize) return;
    const canvas = getCroppedCanvas(imgRef.current, completedCrop, imgDisplaySize.width, imgDisplaySize.height);
    const blob   = await canvasToBlob(canvas);
    onSave(blob);
  };

  return createPortal(
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.6)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         400,
        padding:        '24px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-main)',
          borderRadius: '16px',
          padding:      '24px',
          maxWidth:     '480px',
          width:        '100%',
          boxShadow:    'var(--shadow-dropdown)',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '20px',
          color:      'var(--text-primary)',
          margin:     '0 0 6px',
        }}>
          Crop Profile Picture
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Drag to reposition · Drag edges to resize
        </p>

        {/* Crop area */}
        <div style={{
          display:         'flex',
          justifyContent:  'center',
          marginBottom:    '20px',
          background:      'var(--bg-section-hd)',
          borderRadius:    '10px',
          padding:         '12px',
          maxHeight:       '360px',
          overflowY:       'auto',
        }}>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={1}
            minWidth={60}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: '320px' }}
            />
          </ReactCrop>
        </div>

        {/* Preview */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
          marginBottom:  '20px',
          padding:       '12px',
          background:    'var(--bg-section-hd)',
          borderRadius:  '8px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Preview:
          </span>
          <CropPreview imgRef={imgRef} crop={completedCrop} size={56} displaySize={imgDisplaySize} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={36} displaySize={imgDisplaySize} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={24} displaySize={imgDisplaySize} />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            Saved at up to 800px
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding:      '9px 20px',
              borderRadius: '8px',
              border:       '1px solid var(--border-main)',
              background:   'transparent',
              color:        'var(--text-secondary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              cursor:       'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !completedCrop}
            style={{
              padding:      '9px 20px',
              borderRadius: '8px',
              border:       'none',
              background:   saving ? 'var(--text-muted)' : 'var(--color-primary)',
              color:        '#ffffff',
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              fontWeight:   '500',
              cursor:       saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Live crop preview at multiple sizes (canvas-drawn, always accurate) ──────
function CropPreview({ imgRef, crop, size, displaySize }) {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const image  = imgRef.current;
    if (!canvas || !image || !crop || !displaySize) return;

    const scaleX = image.naturalWidth  / displaySize.width;
    const scaleY = image.naturalHeight / displaySize.height;

    canvas.width  = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width  * scaleX,
      crop.height * scaleY,
      0, 0, size, size,
    );
  }, [crop, size, displaySize]);

  if (!crop || !displaySize) {
    return (
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        background:   'var(--border-main)',
        flexShrink:   0,
      }} />
    );
  }

  return (
    <div style={{
      width:        size,
      height:       size,
      borderRadius: '50%',
      overflow:     'hidden',
      flexShrink:   0,
      border:       '2px solid var(--border-main)',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: size, height: size }} />
    </div>
  );
}