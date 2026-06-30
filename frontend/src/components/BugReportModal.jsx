import { useState, useRef } from 'react';
import apiClient from '../api/client';
import UploadProgressBar from './UploadProgressBar';

export default function BugReportModal({ onClose }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [image,       setImage]       = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);
  const fileRef = useRef(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim())       { setError('Please add a title.'); return; }
    if (!description.trim()) { setError('Please describe the issue.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       title.trim());
      fd.append('description', description.trim());
      fd.append('page_url',    window.location.pathname);
      fd.append('user_agent',  navigator.userAgent);
      if (image) fd.append('image', image);

      await apiClient.post('/bugs', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (image && e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(0,0,0,0.45)] z-[200]"
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-[480px] bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) p-7">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="icon text-(--text-faint) text-xl">bug_report</span>
          <h2 className="m-0 flex-1 font-serif text-lg text-(--text-primary)">Report a Bug</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-(--text-faint) text-xl leading-none p-0.5"
          >✕</button>
        </div>

        {done ? (
          /* Success state */
          <div className="text-center py-6">
            <span className="icon text-[40px] text-(--color-primary)">check_circle</span>
            <p className="mt-3 mb-1 mx-0 font-serif text-base text-(--text-primary)">Thanks for the report!</p>
            <p className="m-0 text-[13px] text-(--text-faint)">
              We'll look into it.
            </p>
            <button
              onClick={onClose}
              className="mt-5 py-2 px-7 bg-(--color-primary) text-white border-none rounded-lg cursor-pointer font-sans text-[13px] font-medium"
            >Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Title */}
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5 font-sans uppercase tracking-[0.06em]">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short summary of the issue"
              maxLength={200}
              className="w-full py-[9px] px-3 bg-(--bg-input) border-[1.5px] border-(--border-input) rounded-lg text-(--text-primary) font-sans text-sm outline-none box-border"
            />

            {/* Description */}
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5 font-sans uppercase tracking-[0.06em] mt-3.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened? What did you expect to happen?"
              rows={4}
              className="w-full py-[9px] px-3 bg-(--bg-input) border-[1.5px] border-(--border-input) rounded-lg text-(--text-primary) font-sans text-sm outline-none box-border resize-y min-h-[100px]"
            />

            {/* Screenshot */}
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5 font-sans uppercase tracking-[0.06em] mt-3.5">
              Screenshot <span className="text-(--text-faint) font-normal">(optional, max 2 MB)</span>
            </label>

            {preview ? (
              <div className="relative inline-block mb-1">
                <img
                  src={preview}
                  alt="preview"
                  className="max-w-full max-h-[160px] rounded-lg border border-(--border-main) block"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1.5 right-1.5 bg-[rgba(0,0,0,0.55)] text-white border-none rounded-full w-[22px] h-[22px] cursor-pointer text-xs leading-[22px] text-center p-0"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 py-2 px-3.5 bg-(--bg-input) border-[1.5px] border-dashed border-(--border-input) rounded-lg cursor-pointer text-(--text-faint) text-[13px] font-sans mb-1"
              >
                <span className="icon icon-sm">attach_file</span>
                Attach screenshot
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />

            {/* Auto-filled info note */}
            <p className="mt-3 mx-0 mb-0 text-[11px] text-(--text-faint)">
              Current page and browser info will be sent automatically.
            </p>

            {error && (
              <p className="mt-2.5 mx-0 mb-0 text-[13px] text-(--danger) font-sans">{error}</p>
            )}

            {/* Upload progress */}
            {uploadProgress !== null && (
              <div className="mt-3">
                <UploadProgressBar progress={uploadProgress} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 mt-5 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 bg-transparent border border-(--border-main) rounded-lg cursor-pointer text-(--text-secondary) font-sans text-[13px]"
              >Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className={`py-2 px-6 text-white border-none rounded-lg font-sans text-[13px] font-medium ${submitting ? 'bg-(--text-faint) cursor-not-allowed' : 'bg-(--color-primary) cursor-pointer'}`}
              >{submitting ? 'Sending…' : 'Submit Report'}</button>
            </div>

          </form>
        )}
      </div>
    </>
  );
}
