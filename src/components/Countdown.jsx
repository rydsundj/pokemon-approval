import { countdownParts, formatCountdown } from '../lib/format';

// The visual anchor of each card: a big, monospace, live countdown.
// Turns red under one hour, grey once the auction has passed.
export default function Countdown({ endsAt, now }) {
  const parts = countdownParts(endsAt, now);
  const underHour = !parts.ended && parts.diffMs < 60 * 60 * 1000;

  const tone = parts.ended
    ? 'text-stone/70 border-ink-500/50 bg-ink-800/50'
    : underHour
      ? 'text-deny border-deny/40 bg-deny/10'
      : 'text-gold border-gold/30 bg-gold/[.07]';

  return (
    <div
      className={`flex items-center justify-center rounded-xl border px-3 py-2.5 font-mono text-base font-semibold tabular-nums tracking-tight ${tone}`}
    >
      {parts.ended && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 opacity-70">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      )}
      {formatCountdown(parts)}
    </div>
  );
}
