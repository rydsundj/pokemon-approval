import { useState } from 'react';
import { config } from '../lib/config';
import { setAuthed } from '../lib/storage';

// Landing screen. A single shared password gates the site — just a
// "keep randoms out" grind, not real security.
export default function PasswordGate({ onAuthed }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (value === config.sharedPassword && config.sharedPassword !== '') {
      setAuthed();
      onAuthed();
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <Pokeball />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-cream">
          Pokémon-koordinator
        </h1>
        <p className="mt-2 text-sm text-stone">
          Ange det delade lösenordet för att komma in.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3 text-left">
          <div>
            <label htmlFor="pw" className="field-label sr-only">
              Lösenord
            </label>
            <input
              id="pw"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Lösenord"
              className={`field-input text-center ${
                error ? 'border-deny/70 ring-2 ring-deny/20' : ''
              }`}
            />
          </div>
          {error && (
            <p className="text-center text-sm text-deny">Fel lösenord. Försök igen.</p>
          )}
          <button type="submit" className="btn-gold w-full">
            Släpp in mig
          </button>
        </form>
      </div>
    </div>
  );
}

function Pokeball() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#e0a94b" strokeWidth="3" />
      <path d="M3 32h58" stroke="#e0a94b" strokeWidth="3" />
      <circle cx="32" cy="32" r="9" fill="#14110c" stroke="#e0a94b" strokeWidth="3" />
      <circle cx="32" cy="32" r="3.5" fill="#efe9dd" />
    </svg>
  );
}
