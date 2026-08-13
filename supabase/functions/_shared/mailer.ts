// Sends e-mail through Gmail (SMTP + App Password) + the shared HTML shell.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { formatSek, formatDateTimeSv } from './format.ts';

export interface Card {
  id: string;
  name: string;
  tradera_url: string;
  image_url: string | null;
  image_urls: string[] | null;
  max_bid: number;
  estimated_value: number;
  near_mint_value: number;
  auction_ends_at: string;
  comment: string | null;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'denied';
  decision_reason: string | null;
  decision_reason_details: string | null;
  decided_by: string | null;
  decided_at: string | null;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const user = Deno.env.get('GMAIL_USER');
  const rawPass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !rawPass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD saknas i Supabase-secrets.');
  }
  // Google visar app-lösenordet i grupper med mellanslag; ta bort dem.
  const password = rawPass.replace(/\s+/g, '');
  const fromName = Deno.env.get('MAIL_FROM_NAME') ?? 'Pokémon-koordinator';

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: user, password },
    },
  });

  try {
    await client.send({
      // Gmail kräver att avsändaradressen är kontot vi loggar in med.
      from: `${fromName} <${user}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      content: 'auto', // genererar automatiskt en text-version
    });
  } finally {
    await client.close();
  }
}

// ── Shared HTML pieces ─────────────────────────────────────────
const GOLD = '#c1852c';
const INK = '#14110c';
const CREAM = '#efe9dd';

export function emailShell(inner: string): string {
  return `<!doctype html>
<html lang="sv">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0d09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0d09;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${INK};border:1px solid #2c251b;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:22px 26px 10px;">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};font-weight:700;">Pokémon-koordinator</div>
        </td></tr>
        ${inner}
      </table>
      <div style="max-width:520px;color:#6f665a;font-size:12px;padding:14px 26px;text-align:left;">
        Du får det här mejlet eftersom du delar Pokémon-koordinatorn med en vän.
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ctaButton(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:10px;">${escapeHtml(label)}</a>`;
}

// A neat three-column price row.
export function priceRow(card: Card): string {
  const cell = (label: string, value: string) =>
    `<td style="padding:10px 6px;text-align:center;">
      <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8b8172;">${label}</div>
      <div style="font-size:16px;font-weight:700;color:${CREAM};margin-top:3px;">${value}</div>
    </td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1b1712;border:1px solid #2c251b;border-radius:12px;margin:6px 0 2px;">
    <tr>
      ${cell('Max bud', formatSek(card.max_bid))}
      ${cell('Bedömt värde', formatSek(card.estimated_value))}
      ${cell('Near mint', formatSek(card.near_mint_value))}
    </tr>
  </table>`;
}

export function detailLine(label: string, value: string): string {
  return `<div style="margin:4px 0;font-size:14px;color:${CREAM};"><span style="color:#8b8172;">${escapeHtml(label)}:</span> ${value}</div>`;
}

// Returns every image on the card (falls back to the single image_url).
function imageList(card: Card): string[] {
  if (card.image_urls && card.image_urls.length > 0) return card.image_urls;
  return card.image_url ? [card.image_url] : [];
}

function imgTag(src: string, alt: string): string {
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="100%" style="display:block;width:100%;max-height:360px;object-fit:contain;background:#0f0d09;border-radius:12px;border:1px solid #2c251b;margin:2px 0 10px;">`;
}

// Single (main) image — used in the decision e-mail.
export function cardImage(card: Card): string {
  const imgs = imageList(card);
  return imgs.length ? imgTag(imgs[0], card.name) : '';
}

// All images stacked — used in the review e-mail (front, back, details).
export function cardImages(card: Card): string {
  const imgs = imageList(card).slice(0, 8);
  if (imgs.length === 0) return '';
  const count =
    imgs.length > 1
      ? `<div style="font-size:12px;color:#8b8172;margin:0 0 6px;">${imgs.length} bilder från annonsen</div>`
      : '';
  return count + imgs.map((src, i) => imgTag(src, `${card.name} (bild ${i + 1})`)).join('');
}

export function auctionEndLine(card: Card): string {
  return detailLine('Auktionen slutar', formatDateTimeSv(card.auction_ends_at));
}

export function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
