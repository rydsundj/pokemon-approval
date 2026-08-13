// ============================================================
//  send-review-email  →  "Nytt kort att granska"
//  Skickas till den ANDRA användaren när ett kort läggs till.
// ============================================================
import { handlePreflight, json } from '../_shared/cors.ts';
import { otherUser } from '../_shared/users.ts';
import { coarseUntilSv } from '../_shared/format.ts';
import {
  Card,
  sendEmail,
  emailShell,
  ctaButton,
  priceRow,
  detailLine,
  cardImages,
  auctionEndLine,
  escapeHtml,
} from '../_shared/mailer.ts';

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return json({ error: 'Endast POST stöds.' }, 405);

  let card: Card;
  try {
    const body = await req.json();
    card = body?.card as Card;
    if (!card?.name || !card?.submitted_by) throw new Error('saknar fält');
  } catch {
    return json({ error: 'Ogiltig kort-data.' }, 400);
  }

  const recipient = otherUser(card.submitted_by);
  if (!recipient) {
    return json(
      { error: 'Hittade ingen mottagare. Är USER_NAME_*/USER_EMAIL_* satta som secrets?' },
      500,
    );
  }

  const siteUrl = Deno.env.get('SITE_URL') ?? '';

  const commentBlock = card.comment
    ? `<div style="margin-top:10px;padding:10px 12px;background:#1b1712;border:1px solid #2c251b;border-radius:10px;color:#cfc7b8;font-size:14px;">
         <span style="color:#8b8172;">Kommentar:</span> ${escapeHtml(card.comment)}
       </div>`
    : '';

  const html = emailShell(`
    <tr><td style="padding:6px 26px 0;">
      <div style="font-size:22px;font-weight:800;color:#efe9dd;">Nytt kort att granska</div>
      <div style="font-size:14px;color:#a1968a;margin:6px 0 16px;">
        ${escapeHtml(card.submitted_by)} vill bjuda på <strong style="color:#efe9dd;">${escapeHtml(card.name)}</strong> och behöver ditt godkännande.
      </div>
      ${cardImages(card)}
      ${priceRow(card)}
      <div style="margin-top:12px;">
        ${auctionEndLine(card)}
        ${detailLine('Inlagt av', escapeHtml(card.submitted_by))}
      </div>
      <div style="margin-top:10px;font-size:15px;color:#efe9dd;">
        Auktionen slutar <strong style="color:#e0a94b;">${escapeHtml(coarseUntilSv(card.auction_ends_at))}</strong>.
      </div>
      ${commentBlock}
      <div style="margin:22px 0 6px;">
        ${ctaButton(siteUrl, 'Granska kortet →')}
      </div>
      <div style="font-size:13px;color:#8b8172;margin:4px 0 20px;">
        Eller öppna auktionen på <a href="${escapeHtml(card.tradera_url)}" style="color:#e0a94b;">Tradera</a>.
      </div>
    </td></tr>
  `);

  try {
    await sendEmail({
      to: recipient.email,
      subject: `Nytt kort att granska: ${card.name}`,
      html,
    });
    return json({ ok: true, sentTo: recipient.name });
  } catch (err) {
    return json({ error: String(err) }, 502);
  }
});
