// Status pill shown on each card.
export default function StatusBadge({ status, reason }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-approve/40 bg-approve/15 px-3 py-1 text-xs font-semibold text-approve">
        <Dot className="text-approve" /> Godkänd
      </span>
    );
  }
  if (status === 'denied') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-deny/40 bg-deny/15 px-3 py-1 text-xs font-semibold text-deny">
        <Dot className="text-deny" /> Nekad{reason ? ` · ${reason}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
      <Dot className="text-gold animate-pulse" /> Väntar på godkännande
    </span>
  );
}

function Dot({ className = '' }) {
  return <span className={`h-1.5 w-1.5 rounded-full bg-current ${className}`} />;
}
