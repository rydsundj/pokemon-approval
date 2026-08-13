// Top bar: brand, who you are, and a discreet "byt användare" link.
export default function Header({ user, onSwitchUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-600/60 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0">
            <circle cx="16" cy="16" r="14" fill="none" stroke="#e0a94b" strokeWidth="2.5" />
            <path d="M2 16h28" stroke="#e0a94b" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="4.5" fill="#14110c" stroke="#e0a94b" strokeWidth="2.5" />
          </svg>
          <span className="font-semibold tracking-tight text-cream">
            Pokémon-koordinator
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-stone sm:inline">
            Inloggad som <span className="font-medium text-cream">{user}</span>
          </span>
          <button
            onClick={onSwitchUser}
            className="rounded-lg px-2.5 py-1.5 text-stone transition hover:bg-ink-700 hover:text-gold"
          >
            byt användare
          </button>
        </div>
      </div>
    </header>
  );
}
