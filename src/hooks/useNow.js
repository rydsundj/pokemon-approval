import { useEffect, useState } from 'react';

// Returns the current time in ms, refreshed on an interval.
// One shared ticker drives every live countdown on the page.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
