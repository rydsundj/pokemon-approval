import { createContext, useCallback, useContext, useState } from 'react';

// A minimal toast system for gentle, non-blocking notifications
// (e.g. "kortet sparades" or "mejlet kunde inte skickas").
const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message, tone = 'info', ms = 4200) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, tone }]);
      window.setTimeout(() => remove(id), ms);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            className={[
              'pointer-events-auto max-w-md w-full sm:w-auto animate-fade-in rounded-xl px-4 py-3 text-sm font-medium shadow-lift text-left',
              t.tone === 'error'
                ? 'bg-deny/15 border border-deny/40 text-deny'
                : t.tone === 'success'
                  ? 'bg-approve/15 border border-approve/40 text-approve'
                  : 'bg-ink-700 border border-ink-500/70 text-cream',
            ].join(' ')}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
