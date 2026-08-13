import { useState } from 'react';
import Modal from './Modal';
import { DENY_REASONS, denyCard } from '../lib/api';
import { useToast } from '../lib/toast';

// Modal shown when the non-submitter clicks "Neka".
// Radio reasons; "Annat" reveals a free-text field.
export default function DenyModal({ card, currentUser, onClose, onDone }) {
  const notify = useToast();
  const [reason, setReason] = useState(DENY_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (reason === 'Annat' && !details.trim()) {
      setError('Skriv en kort anledning.');
      return;
    }
    setSubmitting(true);
    try {
      const { card: updated, emailResult } = await denyCard(
        card,
        currentUser,
        reason,
        details,
      );
      onDone?.(updated);
      if (emailResult?.ok) {
        notify(`Du nekade "${card.name}". ${card.submitted_by} fick ett mejl.`, 'info');
      } else {
        notify('Kortet nekades, men mejlet kunde inte skickas.', 'error');
      }
      onClose();
    } catch (err) {
      notify('Kunde inte spara beslutet. Försök igen.', 'error');
      // eslint-disable-next-line no-console
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Neka "${card.name}"`} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-stone">Välj varför du nekar. {card.submitted_by} får ett mejl med anledningen.</p>

        <div className="space-y-2">
          {DENY_REASONS.map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                reason === r
                  ? 'border-gold/60 bg-gold/10'
                  : 'border-ink-500/60 bg-ink-900/30 hover:bg-ink-700/60'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => {
                  setReason(r);
                  setError('');
                }}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sm font-medium text-cream">{r}</span>
            </label>
          ))}
        </div>

        {reason === 'Annat' && (
          <div className="animate-fade-in">
            <textarea
              className="field-input min-h-[80px] resize-y"
              autoFocus
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setError('');
              }}
              placeholder="Skriv anledningen…"
            />
            {error && <p className="mt-1 text-sm text-deny">{error}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Avbryt
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-deny px-4 py-2.5 font-semibold text-ink-900 transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
          >
            {submitting ? 'Sparar…' : 'Neka kortet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
