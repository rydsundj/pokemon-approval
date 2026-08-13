import { useState } from 'react';
import StatusBadge from './StatusBadge';
import Countdown from './Countdown';
import { formatSek, formatRelativeSv } from '../lib/format';

// A single card in the grid.
export default function CardTile({ card, currentUser, now, onApprove, onDeny }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSubmitter = card.submitted_by === currentUser;
  const isPending = card.status === 'pending';
  const canDecide = isPending && !isSubmitter;

  const reasonText =
    card.decision_reason === 'Annat' && card.decision_reason_details
      ? card.decision_reason_details
      : card.decision_reason;

  const approve = async () => {
    setBusy(true);
    try {
      await onApprove(card);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const shell =
    card.status === 'denied'
      ? 'opacity-60 saturate-[.65] border-ink-600/60'
      : card.status === 'approved'
        ? 'border-approve/30 shadow-glow'
        : 'border-ink-500/50';

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-ink-800/80 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${shell}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-700">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-800"
          style={{ display: card.image_url ? 'none' : 'flex' }}
        >
          <svg viewBox="0 0 64 64" className="h-14 w-14 opacity-30">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e0a94b" strokeWidth="3" />
            <path d="M6 32h52" stroke="#e0a94b" strokeWidth="3" />
            <circle cx="32" cy="32" r="8" fill="#14110c" stroke="#e0a94b" strokeWidth="3" />
          </svg>
        </div>
        <div className="absolute left-2.5 top-2.5">
          <StatusBadge status={card.status} reason={reasonText} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name */}
        <h3 className="text-base font-semibold leading-snug text-cream">{card.name}</h3>

        {/* Countdown — the visual anchor */}
        <Countdown endsAt={card.auction_ends_at} now={now} />

        {/* Prices */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-ink-600/60 bg-ink-900/40 py-2.5">
          <Price label="Max bud" value={formatSek(card.max_bid)} highlight />
          <Price label="Bedömt värde" value={formatSek(card.estimated_value)} />
          <Price label="Near mint" value={formatSek(card.near_mint_value)} />
        </div>

        {/* Optional comment */}
        {card.comment && (
          <p className="rounded-lg bg-ink-900/40 px-3 py-2 text-sm leading-relaxed text-stone">
            {card.comment}
          </p>
        )}

        {/* Meta */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-stone">
          <span>
            Inlagd av <span className="font-medium text-cream/90">{card.submitted_by}</span>{' '}
            {formatRelativeSv(card.submitted_at, now)}
          </span>
          <a
            href={card.tradera_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-gold transition hover:text-gold-soft"
          >
            Tradera
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </div>

        {/* Decision controls (only for the non-submitter, while pending) */}
        {canDecide && (
          <div className="pt-1">
            {confirming ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="mr-auto text-sm text-stone">Godkänna budet?</span>
                <button onClick={() => setConfirming(false)} disabled={busy} className="btn-ghost px-3 py-2 text-sm">
                  Avbryt
                </button>
                <button onClick={approve} disabled={busy} className="btn-gold px-3 py-2 text-sm">
                  {busy ? 'Sparar…' : 'Ja, godkänn'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onDeny(card)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-deny/40 bg-deny/10 px-3 py-2.5 text-sm font-semibold text-deny transition hover:bg-deny/20 active:scale-[.98]"
                >
                  Neka
                </button>
                <button
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-approve/40 bg-approve/10 px-3 py-2.5 text-sm font-semibold text-approve transition hover:bg-approve/20 active:scale-[.98]"
                >
                  Godkänn
                </button>
              </div>
            )}
          </div>
        )}

        {/* Own pending card: gentle note that we're waiting on the other person */}
        {isPending && isSubmitter && (
          <p className="pt-1 text-center text-xs text-stone/80">
            Väntar på att den andra ska granska.
          </p>
        )}
      </div>
    </div>
  );
}

function Price({ label, value, highlight = false }) {
  return (
    <div className="px-1 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-stone/80">
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${highlight ? 'text-gold' : 'text-cream'}`}>
        {value}
      </div>
    </div>
  );
}
