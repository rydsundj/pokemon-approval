import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cleanupOldCards, fetchCards } from '../lib/api';

// Loads the cards and keeps them fresh two ways:
//   1. Supabase Realtime — instant updates when either user changes a row.
//   2. A 20s polling fallback — in case Realtime isn't enabled on the table.
export function useCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didCleanup = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchCards();
      setCards(data);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!didCleanup.current) {
        didCleanup.current = true;
        await cleanupOldCards();
      }
      await refetch();
      if (active) setLoading(false);
    })();

    // Realtime subscription: any insert/update/delete → refetch.
    const channel = supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        () => refetch(),
      )
      .subscribe();

    // Polling fallback (also covers the case where Realtime is off).
    const poll = setInterval(refetch, 20000);

    // Refetch when the tab regains focus — handy on phones.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { cards, loading, error, refetch, setCards };
}
