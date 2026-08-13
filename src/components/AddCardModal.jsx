import { useState } from 'react';
import Modal from './Modal';
import { createCard, scrapeImage } from '../lib/api';
import { useToast } from '../lib/toast';

// Form for adding a new card. Scrapes the Tradera image on URL blur,
// with a manual image-URL paste as fallback.
export default function AddCardModal({ currentUser, onClose, onCreated }) {
  const notify = useToast();

  const [form, setForm] = useState({
    name: '',
    tradera_url: '',
    max_bid: '',
    estimated_value: '',
    near_mint_value: '',
    auction_ends_at: '',
    comment: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [scrape, setScrape] = useState('idle'); // idle | loading | done | failed
  const [showManual, setShowManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onUrlBlur = async () => {
    const url = form.tradera_url.trim();
    if (!/^https?:\/\//i.test(url)) return;
    setScrape('loading');
    try {
      const found = await scrapeImage(url);
      if (found) {
        setImageUrl(found);
        setScrape('done');
        setShowManual(false);
      } else {
        setScrape('failed');
        setShowManual(true);
      }
    } catch {
      setScrape('failed');
      setShowManual(true);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Fyll i kortets namn.';
    if (!/^https?:\/\//i.test(form.tradera_url.trim()))
      e.tradera_url = 'Ange en giltig länk.';
    for (const [key, label] of [
      ['max_bid', 'Max bud'],
      ['estimated_value', 'Bedömt värde'],
      ['near_mint_value', 'Near mint-värde'],
    ]) {
      const n = Number(form[key]);
      if (form[key] === '' || Number.isNaN(n) || n < 0)
        e[key] = `Ange ${label} som en siffra.`;
    }
    if (!form.auction_ends_at) e.auction_ends_at = 'Välj när auktionen slutar.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      tradera_url: form.tradera_url.trim(),
      image_url: imageUrl.trim() || null,
      max_bid: Math.round(Number(form.max_bid)),
      estimated_value: Math.round(Number(form.estimated_value)),
      near_mint_value: Math.round(Number(form.near_mint_value)),
      // datetime-local is wall-clock time; store the corresponding instant.
      auction_ends_at: new Date(form.auction_ends_at).toISOString(),
      comment: form.comment.trim() || null,
      submitted_by: currentUser,
      status: 'pending',
    };

    try {
      const { card, emailResult } = await createCard(payload);
      onCreated?.(card);
      if (emailResult?.ok) {
        notify('Kortet sparades och den andra fick ett mejl.', 'success');
      } else {
        notify('Kortet sparades, men mejlet kunde inte skickas.', 'error');
        // eslint-disable-next-line no-console
        console.warn('E-postfel:', emailResult?.error);
      }
      onClose();
    } catch (err) {
      notify('Kunde inte spara kortet. Försök igen.', 'error');
      // eslint-disable-next-line no-console
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Lägg till kort" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Kortets namn" error={errors.name}>
          <input
            className="field-input"
            value={form.name}
            onChange={set('name')}
            placeholder="t.ex. Charizard Base Set 4/102"
          />
        </Field>

        <Field label="Länk till Tradera-auktion" error={errors.tradera_url}>
          <input
            className="field-input"
            type="url"
            inputMode="url"
            value={form.tradera_url}
            onChange={set('tradera_url')}
            onBlur={onUrlBlur}
            placeholder="https://www.tradera.com/item/…"
          />
        </Field>

        {/* Image preview / status */}
        <ImagePreview
          scrape={scrape}
          imageUrl={imageUrl}
          showManual={showManual}
          onToggleManual={() => setShowManual((v) => !v)}
          onManualChange={(v) => {
            setImageUrl(v);
            if (v) setScrape('done');
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Max bud (kr)" error={errors.max_bid}>
            <input className="field-input" type="number" min="0" inputMode="numeric" value={form.max_bid} onChange={set('max_bid')} placeholder="0" />
          </Field>
          <Field label="Vad jag tror det är värt (kr)" error={errors.estimated_value}>
            <input className="field-input" type="number" min="0" inputMode="numeric" value={form.estimated_value} onChange={set('estimated_value')} placeholder="0" />
          </Field>
          <Field label="Near mint (Collectr/eBay, kr)" error={errors.near_mint_value}>
            <input className="field-input" type="number" min="0" inputMode="numeric" value={form.near_mint_value} onChange={set('near_mint_value')} placeholder="0" />
          </Field>
        </div>

        <Field label="Auktionen slutar" error={errors.auction_ends_at}>
          <input
            className="field-input"
            type="datetime-local"
            value={form.auction_ends_at}
            onChange={set('auction_ends_at')}
          />
        </Field>

        <Field label="Kommentar (valfritt)">
          <textarea
            className="field-input min-h-[80px] resize-y"
            value={form.comment}
            onChange={set('comment')}
            placeholder="Något den andra borde veta?"
          />
        </Field>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Avbryt
          </button>
          <button type="submit" disabled={submitting} className="btn-gold flex-1">
            {submitting ? 'Sparar…' : 'Spara & meddela'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-deny">{error}</p>}
    </div>
  );
}

function ImagePreview({ scrape, imageUrl, showManual, onToggleManual, onManualChange }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="field-label mb-0">Bild</span>
        <button
          type="button"
          onClick={onToggleManual}
          className="text-xs font-medium text-gold transition hover:text-gold-soft"
        >
          {showManual ? 'Dölj manuell inmatning' : 'Klistra in bild-URL manuellt'}
        </button>
      </div>

      <div className="mt-1.5 overflow-hidden rounded-xl border border-ink-500/60 bg-ink-900/40">
        {scrape === 'loading' ? (
          <div className="flex items-center gap-3 px-4 py-6 text-sm text-stone">
            <Spinner /> Hämtar bild från Tradera…
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Förhandsvisning" className="max-h-56 w-full object-contain bg-ink-900" />
        ) : scrape === 'failed' ? (
          <div className="px-4 py-5 text-sm text-stone">
            Kunde inte hämta bilden automatiskt. Klistra in en bild-URL nedan.
          </div>
        ) : (
          <div className="px-4 py-5 text-sm text-stone/70">
            Bilden hämtas automatiskt när du klistrat in Tradera-länken.
          </div>
        )}
      </div>

      {showManual && (
        <input
          className="field-input mt-2"
          type="url"
          value={imageUrl}
          onChange={(e) => onManualChange(e.target.value)}
          placeholder="https://…/bild.jpg"
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
