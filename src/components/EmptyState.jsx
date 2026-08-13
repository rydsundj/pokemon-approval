// Shown when there are no cards at all.
export default function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-500/60 bg-ink-800/30 px-6 py-16 text-center animate-fade-in">
      <svg viewBox="0 0 96 96" className="mb-5 h-24 w-24 opacity-90">
        <circle cx="48" cy="48" r="30" fill="none" stroke="#3a3125" strokeWidth="4" />
        <path d="M18 48h60" stroke="#3a3125" strokeWidth="4" />
        <circle cx="48" cy="48" r="9" fill="#14110c" stroke="#3a3125" strokeWidth="4" />
        {/* little sparkles */}
        <path d="M76 22l1.6 4.4L82 28l-4.4 1.6L76 34l-1.6-4.4L70 28l4.4-1.6z" fill="#e0a94b" opacity="0.8" />
        <path d="M22 66l1.2 3.3L26.5 70.5l-3.3 1.2L22 75l-1.2-3.3L17.5 70.5l3.3-1.2z" fill="#e0a94b" opacity="0.55" />
      </svg>
      <h3 className="text-lg font-semibold text-cream">Inga kort just nu.</h3>
      <p className="mt-1.5 max-w-xs text-sm text-stone">
        Dags att jaga fynd på Tradera.
      </p>
      <button onClick={onAdd} className="btn-gold mt-6">
        <PlusIcon /> Lägg till kort
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
