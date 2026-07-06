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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-400 p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-(--bg-card) border border-(--border-main) rounded-2xl p-6 max-w-120 w-full shadow-(--shadow-dropdown)"
      >
        <h2 className="font-serif text-xl text-(--text-primary) mt-0 mb-1.5">
          Crop Profile Picture
        </h2>
        <p className="text-[13px] text-(--text-muted) mt-0 mb-4">
          Drag to reposition · Drag edges to resize
        </p>

        {/* Crop area */}
        <div className="flex justify-center mb-5 bg-(--bg-section-hd) rounded-[10px] p-3 max-h-90 overflow-y-auto overscroll-contain">
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
              className="max-w-full max-h-80"
            />
          </ReactCrop>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-(--bg-section-hd) rounded-lg">
          <span className="text-xs text-(--text-muted)">
            Preview:
          </span>
          <CropPreview imgRef={imgRef} crop={completedCrop} size={56} displaySize={imgDisplaySize} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={36} displaySize={imgDisplaySize} />
          <CropPreview imgRef={imgRef} crop={completedCrop} size={24} displaySize={imgDisplaySize} />
          <span className="text-[11px] text-(--text-faint)">
            Saved at up to 800px
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !completedCrop}
            className={`btn-primary ${(saving || !completedCrop) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    // width/height stay inline — `size` is a per-call-site numeric prop (56/36/24)
    return (
      <div className="rounded-full bg-(--border-main) shrink-0" style={{ width: size, height: size }} />
    );
  }

  return (
    // width/height stay inline — `size` is a per-call-site numeric prop (56/36/24)
    <div className="rounded-full overflow-hidden shrink-0 border-2 border-(--border-main)" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="block" style={{ width: size, height: size }} />
    </div>
  );
}