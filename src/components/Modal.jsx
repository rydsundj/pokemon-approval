import { useEffect } from 'react';

// A reusable, mobile-friendly modal shell with a dimmed backdrop.
export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} animate-scale-in rounded-t-2xl sm:rounded-2xl border border-ink-500/60 bg-ink-800 shadow-lift max-h-[92vh] overflow-y-auto`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-600/70 bg-ink-800/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-cream">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="rounded-lg p-1.5 text-stone transition hover:bg-ink-600 hover:text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
