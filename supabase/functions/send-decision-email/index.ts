// ============================================================
//  send-decision-email  →  "Beslut fattat"
//  Skickas till den som la in kortet när det godkänts/nekats.
// ============================================================
import { handlePreflight, json } from '../_shared/cors.ts';
import { userByName } from '../_shared/users.ts';
import {
  Card,
  sendEmail,
  emailShell,
  ctaButton,
  detailLine,
  cardImage,
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
    if (!card?.name || !card?.submitted_by || !card?.status) {
      throw new Error('saknar fält');
    }
  } catch {
    return json({ error: 'Ogiltig kort-data.' }, 400);
  }

  const recipient = userByName(card.submitted_by);
  if (!recipient) {
    return json(
      { error: 'Hittade ingen mottagare. Är USER_NAME_*/USER_EMAIL_* satta som secrets?' },
      500,
    );
  }

  const siteUrl = Deno.env.get('SITE_URL') ?? '';
  const approved = card.status === 'approved';
  const decidedBy = escapeHtml(card.decided_by ?? 'Den andra användaren');

  const badge = approved
    ? `<span style="display:inline-block;background:rgba(95,191,122,.16);color:#8fe0a5;border:1px solid rgba(95,191,122,.4);font-weight:700;font-size:14px;padding:6px 14px;border-radius:999px;">✓ Godkänd</span>`
    : `<span style="display:inline-block;background:rgba(226,109,109,.16);color:#f0a3a3;border:1px solid rgba(226,109,109,.4);font-weight:700;font-size:14px;padding:6px 14px;border-radius:999px;">✕ Nekad</span>`;

  const headline = approved
    ? `${decidedBy} godkände kortet – kör på budet!`
    : `${decidedBy} nekade kortet.`;

  let reasonBlock = '';
  if (!approved) {
    const reasonText = card.decision_reason_details?.trim()
      ? card.decision_reason_details
      : card.decision_reason ?? '';
    if (reasonText) {
      reasonBlock = `<div style="margin-top:12px;padding:12px 14px;background:#1b1712;border:1px solid #2c251b;border-radius:10px;">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8b8172;">Anledning</div>
        <div style="font-size:15px;color:#efe9dd;margin-top:4px;">${escapeHtml(reasonText)}</div>
      </div>`;
    }
  }

  const html = emailShell(`
    <tr><td style="padding:6px 26px 0;">
      <div style="margin-bottom:12px;">${badge}</div>
      <div style="font-size:22px;font-weight:800;color:#efe9dd;">Beslut fattat</div>
      <div style="font-size:15px;color:#a1968a;margin:6px 0 16px;">${escapeHtml(headline)}</div>
      ${cardImage(card)}
      <div style="margin-top:6px;">
        ${detailLine('Kort', `<strong style="color:#efe9dd;">${escapeHtml(card.name)}</strong>`)}
        ${detailLine('Beslut av', decidedBy)}
      </div>
      ${reasonBlock}
      <div style="margin:22px 0 6px;">
        ${ctaButton(siteUrl, 'Öppna koordinatorn →')}
      </div>
      <div style="font-size:13px;color:#8b8172;margin:4px 0 20px;">
        Auktionen på <a href="${escapeHtml(card.tradera_url)}" style="color:#e0a94b;">Tradera</a>.
      </div>
    </td></tr>
  `);

  try {
    await sendEmail({
      to: recipient.email,
      subject: approved
        ? `Godkänt: ${card.name}`
        : `Nekat: ${card.name}`,
      html,
    });
    return json({ ok: true, sentTo: recipient.name });
  } catch (err) {
    return json({ error: String(err) }, 502);
  }
});
