import { supabase } from './supabase';

// The fixed "Neka"-reasons. "Annat" reveals a free-text field.
export const DENY_REASONS = [
  'Skicket är för dåligt',
  'Priset stämmer inte',
  'Auktionen hinner inte',
  'Annat',
];

const MS_24H = 24 * 60 * 60 * 1000;

// Deletes resolved (approved/denied) cards whose decision is older than 24h.
// Runs on load — no server-side cron needed. Failures are non-fatal.
export async function cleanupOldCards() {
  const cutoff = new Date(Date.now() - MS_24H).toISOString();
  try {
    await supabase
      .from('cards')
      .delete()
      .neq('status', 'pending')
      .lt('decided_at', cutoff);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Kunde inte rensa gamla kort:', err);
  }
}

export async function fetchCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Scrapes the Tradera image via the Edge Function. Returns null on failure.
export async function scrapeImage(url) {
  const { data, error } = await supabase.functions.invoke('scrape-image', {
    body: { url },
  });
  if (error) throw error;
  return data?.imageUrl ?? null;
}

export async function createCard(card) {
  const { data, error } = await supabase
    .from('cards')
    .insert(card)
    .select()
    .single();
  if (error) throw error;

  // Notify the other user. Non-blocking-ish: we await so we can surface a
  // warning, but a failure here does not undo the saved card.
  const emailResult = await invokeEmail('send-review-email', data);
  return { card: data, emailResult };
}

export async function approveCard(card, decidedBy) {
  const patch = {
    status: 'approved',
    decided_by: decidedBy,
    decided_at: new Date().toISOString(),
    decision_reason: null,
    decision_reason_details: null,
  };
  const updated = await updateCard(card.id, patch);
  const emailResult = await invokeEmail('send-decision-email', updated);
  return { card: updated, emailResult };
}

export async function denyCard(card, decidedBy, reason, details) {
  const patch = {
    status: 'denied',
    decided_by: decidedBy,
    decided_at: new Date().toISOString(),
    decision_reason: reason,
    decision_reason_details: reason === 'Annat' ? details || null : null,
  };
  const updated = await updateCard(card.id, patch);
  const emailResult = await invokeEmail('send-decision-email', updated);
  return { card: updated, emailResult };
}

async function updateCard(id, patch) {
  const { data, error } = await supabase
    .from('cards')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Invokes an e-mail Edge Function. Returns { ok } or { ok:false, error }
// instead of throwing, so a mail hiccup never blocks the main action.
async function invokeEmail(fn, card) {
  try {
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { card },
    });
    if (error) return { ok: false, error: error.message || String(error) };
    if (data?.error) return { ok: false, error: data.error };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
