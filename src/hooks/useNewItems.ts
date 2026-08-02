import { useEffect, useRef, useState } from 'react';

/**
 * Houdt bij welke id's NIEUW in een lijst verschijnen ná de eerste render.
 * Zo animeren we alleen echte state-veranderingen (nieuwe mail, nieuwe factuur)
 * en niet elke page-load — dat zou de app trager laten aanvoelen.
 */
export function useNewItems(ids: string[], resetMs = 400): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Data komt asynchroon binnen: pas bij de eerste NIET-lege lijst markeren we
    // alles als "gezien". Zo animeert de initiële load nooit.
    if (seen.current === null) {
      if (ids.length === 0) return;
      seen.current = new Set(ids);
      return;
    }

    const added = ids.filter((id) => !seen.current!.has(id));
    if (added.length === 0) return;

    added.forEach((id) => seen.current!.add(id));
    setFresh(new Set(added));

    const timer = window.setTimeout(() => setFresh(new Set()), resetMs);
    return () => window.clearTimeout(timer);
  }, [ids.join('|'), resetMs]);


  return fresh;
}
