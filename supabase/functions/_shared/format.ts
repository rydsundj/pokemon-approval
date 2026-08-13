// Swedish formatting helpers used inside the e-mail templates.
// Everything is rendered in the Europe/Stockholm timezone so the two
// users always see the auction time in their own local time, regardless
// of where the server runs.

const TZ = 'Europe/Stockholm';

const dateParts = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const sek = new Intl.NumberFormat('sv-SE');

// "onsdag 13 augusti 2026 kl. 20:30"
export function formatDateTimeSv(input: string | number | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const p: Record<string, string> = {};
  for (const part of dateParts.formatToParts(d)) p[part.type] = part.value;
  return `${p.weekday} ${p.day} ${p.month} ${p.year} kl. ${p.hour}:${p.minute}`;
}

export function formatSek(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–';
  return `${sek.format(n)} kr`;
}

// A rough, human countdown snapshot for the e-mail, e.g.
// "om ca 3 timmar" / "om ca 2 dagar" / "om ca 25 minuter".
export function coarseUntilSv(target: string | number | Date): string {
  const diff = new Date(target).getTime() - Date.now();
  if (isNaN(diff)) return '';
  if (diff <= 0) return 'auktionen har redan slutat';

  const min = Math.round(diff / 60000);
  if (min < 60) {
    return min <= 1 ? 'om ca 1 minut' : `om ca ${min} minuter`;
  }
  const hours = Math.round(diff / 3600000);
  if (hours < 24) {
    return hours === 1 ? 'om ca 1 timme' : `om ca ${hours} timmar`;
  }
  const days = Math.round(diff / 86400000);
  return days === 1 ? 'om ca 1 dag' : `om ca ${days} dagar`;
}
