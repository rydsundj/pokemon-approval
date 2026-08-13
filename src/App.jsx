import { useState } from 'react';
import { config } from './lib/config';
import { isAuthed, getUser, clearUser } from './lib/storage';
import { approveCard } from './lib/api';
import { ToastProvider, useToast } from './lib/toast';
import { useCards } from './hooks/useCards';
import { useNow } from './hooks/useNow';

import PasswordGate from './components/PasswordGate';
import IdentityPicker from './components/IdentityPicker';
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import EmptyState from './components/EmptyState';
import AddCardModal from './components/AddCardModal';
import DenyModal from './components/DenyModal';

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const [authed, setAuthedState] = useState(isAuthed);
  const [user, setUserState] = useState(getUser);

  if (!authed) return <PasswordGate onAuthed={() => setAuthedState(true)} />;
  if (!user) return <IdentityPicker onPicked={setUserState} />;

  return (
    <Main
      user={user}
      onSwitchUser={() => {
        clearUser();
        setUserState(null);
      }}
    />
  );
}

function Main({ user, onSwitchUser }) {
  const notify = useToast();
  const now = useNow(1000);
  const { cards, loading, error, setCards } = useCards();

  const [showAdd, setShowAdd] = useState(false);
  const [denyTarget, setDenyTarget] = useState(null);

  const pendingCount = cards.filter((c) => c.status === 'pending').length;

  // Local optimistic patch so decisions feel instant; Realtime confirms it.
  const patchCard = (updated) =>
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const handleApprove = async (card) => {
    try {
      const { card: updated, emailResult } = await approveCard(card, user);
      patchCard(updated);
      if (emailResult?.ok) {
        notify(`Du godkände "${card.name}". ${card.submitted_by} fick ett mejl.`, 'success');
      } else {
        notify('Kortet godkändes, men mejlet kunde inte skickas.', 'error');
      }
    } catch (err) {
      notify('Kunde inte spara beslutet. Försök igen.', 'error');
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return (
    <div className="min-h-[100dvh]">
      <Header user={user} onSwitchUser={onSwitchUser} />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        {/* Section header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-cream sm:text-2xl">
              Aktuella kort
            </h1>
            <p className="mt-1 text-sm text-stone">
              {loading
                ? 'Laddar…'
                : pendingCount > 0
                  ? `${pendingCount} kort väntar på beslut`
                  : 'Inget väntar på beslut just nu'}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold shadow-glow">
            <PlusIcon /> Lägg till kort
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-deny/40 bg-deny/10 px-4 py-3 text-sm text-deny">
            Kunde inte hämta korten. Kontrollera din anslutning och Supabase-inställningarna.
          </div>
        )}

        {loading ? (
          <GridSkeleton />
        ) : cards.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <CardGrid
            cards={cards}
            currentUser={user}
            now={now}
            onApprove={handleApprove}
            onDeny={setDenyTarget}
          />
        )}
      </main>

      {showAdd && (
        <AddCardModal
          currentUser={user}
          onClose={() => setShowAdd(false)}
          onCreated={(card) => setCards((prev) => [card, ...prev])}
        />
      )}

      {denyTarget && (
        <DenyModal
          card={denyTarget}
          currentUser={user}
          onClose={() => setDenyTarget(null)}
          onDone={patchCard}
        />
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-ink-600/50 bg-ink-800/60">
          <div className="aspect-[4/3] bg-ink-700/70" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 rounded bg-ink-700/70" />
            <div className="h-10 rounded bg-ink-700/70" />
            <div className="h-12 rounded bg-ink-700/70" />
          </div>
        </div>
      ))}
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
