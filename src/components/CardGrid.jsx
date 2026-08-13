import CardTile from './CardTile';

// Orders cards: pending first (soonest auction end first), then resolved
// (most recently decided first). Renders the responsive grid.
export default function CardGrid({ cards, currentUser, now, onApprove, onDeny }) {
  const sorted = [...cards].sort((a, b) => {
    const aPending = a.status === 'pending';
    const bPending = b.status === 'pending';
    if (aPending !== bPending) return aPending ? -1 : 1;
    if (aPending) {
      // Soonest-ending auctions first.
      return new Date(a.auction_ends_at) - new Date(b.auction_ends_at);
    }
    // Resolved: most recent decision first.
    return new Date(b.decided_at || 0) - new Date(a.decided_at || 0);
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          currentUser={currentUser}
          now={now}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      ))}
    </div>
  );
}
