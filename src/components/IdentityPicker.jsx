import { config } from '../lib/config';
import { setUser } from '../lib/storage';

// After the password, the user picks which of the two people they are.
// Stored in localStorage so they only choose once per device.
export default function IdentityPicker({ onPicked }) {
  const [name1, name2] = config.users;

  const pick = (name) => {
    setUser(name);
    onPicked(name);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <h1 className="text-2xl font-bold tracking-tight text-cream">Vem är du?</h1>
        <p className="mt-2 text-sm text-stone">
          Välj vem du är så vet vi vem som ska godkänna.
        </p>

        <div className="mt-8 grid gap-3">
          <IdentityButton name={name1} onClick={() => pick(name1)} />
          <IdentityButton name={name2} onClick={() => pick(name2)} />
        </div>
      </div>
    </div>
  );
}

function IdentityButton({ name, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-ink-500/60 bg-ink-800/70 px-5 py-4 text-left transition hover:border-gold/60 hover:bg-ink-700 hover:shadow-glow active:scale-[.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="text-base font-semibold text-cream">Jag är {name}</span>
      <svg
        className="ml-auto text-stone transition group-hover:translate-x-0.5 group-hover:text-gold"
        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
