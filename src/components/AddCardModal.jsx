import { useState } from 'react';
import Modal from './Modal';
import { createCard, scrapeImages } from '../lib/api';
import { useToast } from '../lib/toast';

// Form for adding a new card. Scrapes ALL images from the Tradera listing
// on URL blur (front, back, details), with manual paste as fallback.
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
  const [images, setImages] = useState([]); // string[]
  const [manualUrl, setManualUrl] = useState('');
  const [scrape, setScrape] = useState('idle'); // idle | loading | done | failed
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onUrlBlur = async () => {
    const url = form.tradera_url.trim();
    if (!/^https?:\/\//i.test(url)) return;
    setScrape('loading');
    try {
      const found = await scrapeImages(url);
      if (found.length > 0) {
        // Behåll eventuella manuellt tillagda bilder överst, lägg till nya unika.
        setImages((prev) => uniq([...prev, ...found]));
        setScrape('done');
      } else {
        setScrape('failed');
      }
    } catch {
      setScrape('failed');
    }
  };

  const addManual = () => {
    const u = manualUrl.trim();
    if (!/^https?:\/\//i.test(u)) return;
    setImages((prev) => uniq([...prev, u]));
    setManualUrl('');
    setScrape('done');
  };

  const removeImage = (url) => setImages((prev) => prev.filter((u) => u !== url));

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
      image_url: images[0] ?? null,
      image_urls: images.length > 0 ? images : null,
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

        <ImageGallery
          images={images}
          scrape={scrape}
          manualUrl={manualUrl}
          onManualChange={setManualUrl}
          onAddManual={addManual}
          onRemove={removeImage}
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

function uniq(arr) {
  return Array.from(new Set(arr));
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

function ImageGallery({ images, scrape, manualUrl, onManualChange, onAddManual, onRemove }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="field-label mb-0">
          Bilder{images.length > 0 ? ` (${images.length})` : ''}
        </span>
        {scrape === 'loading' && (
          <span className="inline-flex items-center gap-2 text-xs text-stone">
            <Spinner /> Hämtar bilder från Tradera…
          </span>
        )}
      </div>

      {images.length > 0 ? (
        <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-ink-500/60 bg-ink-900"
            >
              <img src={url} alt={`Bild ${i + 1}`} className="h-full w-full object-contain" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                  Huvudbild
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Ta bort bild"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-cream opacity-0 transition group-hover:opacity-100 hover:bg-deny"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1.5 rounded-xl border border-ink-500/60 bg-ink-900/40 px-4 py-5 text-sm text-stone/70">
          {scrape === 'failed'
            ? 'Kunde inte hämta bilderna automatiskt. Klistra in en bild-URL nedan.'
            : 'Bilderna hämtas automatiskt när du klistrat in Tradera-länken.'}
        </div>
      )}

      {/* Manuell tillägg (fungerar alltid som komplement/fallback) */}
      <div className="mt-2 flex gap-2">
        <input
          className="field-input"
          type="url"
          value={manualUrl}
          onChange={(e) => onManualChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddManual();
            }
          }}
          placeholder="Klistra in extra bild-URL…"
        />
        <button type="button" onClick={onAddManual} className="btn-ghost whitespace-nowrap px-3">
          Lägg till
        </button>
      </div>
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
