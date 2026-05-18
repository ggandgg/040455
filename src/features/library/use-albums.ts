import { useEffect, useState } from 'react';
import { getAlbums, type Album } from './safe-media';

export function useAlbums(enabled = true) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);
    getAlbums()
      .then((data) => {
        if (!cancelled) setAlbums(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { albums, isLoading };
}
