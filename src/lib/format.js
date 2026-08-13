// Swedish-language formatting helpers for the UI.
// Auction times are always presented in Europe/Stockholm.

const TZ = 'Europe/Stockholm';
const sek = new Intl.NumberFormat('sv-SE');

const dateParts = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatSek(n) {
  if (n === null || n === undefined || n === '') return '–';
  return `${sek.format(n)} kr`;
}

// "onsdag 13 augusti kl. 20:30"
export function formatDateTimeSv(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const p = {};
  for (const part of dateParts.formatToParts(d)) p[part.type] = part.value;
  return `${p.weekday} ${p.day} ${p.month} kl. ${p.hour}:${p.minute}`;
}

// "för 12 min sedan", "precis nu", "igår", "för 3 dagar sedan"
export function formatRelativeSv(input, now = Date.now()) {
  const then = new Date(input).getTime();
  if (isNaN(then)) return '';
  const diff = Math.round((now - then) / 1000); // seconds ago (may be < 0)

  if (diff < 0) return 'nyss';
  if (diff < 45) return 'precis nu';
  if (diff < 90) return 'för 1 min sedan';

  const min = Math.round(diff / 60);
  if (min < 60) return `för ${min} min sedan`;

  if (diff < 5400) return 'för 1 tim sedan';
  const hours = Math.round(diff / 3600);
  if (hours < 24) return `för ${hours} tim sedan`;

  if (diff < 129600) return 'igår';
  const days = Math.round(diff / 86400);
  return `för ${days} dagar sedan`;
}

// Breaks a target time into countdown pieces relative to `now`.
export function countdownParts(target, now = Date.now()) {
  const diff = new Date(target).getTime() - now;
  if (isNaN(diff)) return { ended: true, diffMs: 0 };
  if (diff <= 0) return { ended: true, diffMs: diff };

  const totalSec = Math.floor(diff / 1000);
  return {
    ended: false,
    diffMs: diff,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

// "Slutar om 2t 14m 33s"  /  "Slutar om 1d 4t 9m 02s"
export function formatCountdown(p) {
  if (p.ended) return 'Auktionen har slutat';
  const pad = (n) => String(n).padStart(2, '0');
  const seg = [];
  if (p.days > 0) seg.push(`${p.days}d`);
  if (p.days > 0 || p.hours > 0) seg.push(`${p.hours}t`);
  seg.push(`${p.minutes}m`);
  seg.push(`${pad(p.seconds)}s`);
  return `Slutar om ${seg.join(' ')}`;
}
