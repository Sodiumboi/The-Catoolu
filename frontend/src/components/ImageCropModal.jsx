import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ── Helper: get cropped canvas ────────────────────────────────
function getCroppedCanvas(image, crop) {
  const canvas  = document.createElement('canvas');
  const scaleX  = image.naturalWidth  / image.width;
  const scaleY  = image.naturalHeight / image.height;
  const size    = 256; // output size 256x256

  canvas.width  = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');

  // Draw circle clip
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width  * scaleX,
    crop.height * scaleY,
    0, 0, size, size
  );

  return canvas;
}

// ── Helper: canvas to Blob ─────────────────────────────────────
function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
}

export default function ImageCropModal({ imageSrc, onSave, onClose, saving }) {
  const imgRef  = useRef(null);
  const [crop,  setCrop]  = useState();
  const [completedCrop, setCompletedCrop] = useState();

  // Centre a square crop on image load
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width, height
    );
    setCrop(c);
    setCompletedCrop(c);
  }, []);

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    const canvas = getCroppedCanvas(imgRef.current, completedCrop);
    const blob   = await canvasToBlob(canvas);
    onSave(blob);
  };

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.75)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         300,
        padding:        '24px',
        backdropFilter: 'blur(6px)',
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
            circularCrop
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
          <CropPreview imgRef={imgRef} crop={completedCrop} size={56} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={36} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={24} />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            Saved at 256×256px
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
    </div>
  );
}

// ── Live crop preview at multiple sizes ────────────────────────
function CropPreview({ imgRef, crop, size }) {
  if (!crop || !imgRef.current) {
    return (
      <div style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        background:   'var(--border-main)',
      }} />
    );
  }

  const image  = imgRef.current;
  const scaleX = image.naturalWidth  / image.width;
  const scaleY = image.naturalHeight / image.height;
  const scale  = size / crop.width;

  return (
    <div style={{
      width:        size,
      height:       size,
      borderRadius: '50%',
      overflow:     'hidden',
      flexShrink:   0,
      border:       '2px solid var(--border-main)',
      position:     'relative',
    }}>
      <img
        src={image.src}
        alt="Preview"
        style={{
          position:  'absolute',
          left:      -(crop.x * scaleX * scale) + 'px',
          top:       -(crop.y * scaleY * scale) + 'px',
          width:     (image.naturalWidth * scale) + 'px',
          height:    'auto',
        }}
      />
    </div>
  );
}