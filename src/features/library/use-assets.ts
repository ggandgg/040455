import { useCallback, useEffect, useRef, useState } from 'react';
import { getAssets, type Asset } from './safe-media';

const PAGE_SIZE = 60;

export type UseAssetsParams = {
  albumId?: string | null;
  enabled?: boolean;
};

export type UseAssetsResult = {
  assets: Asset[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
};

export function useAssets({ albumId = null, enabled = true }: UseAssetsParams = {}): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchPage = useCallback(
    async (after?: string) => {
      return getAssets({
        first: PAGE_SIZE,
        after,
        albumId: albumId ?? undefined,
      });
    },
    [albumId],
  );

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    cursorRef.current = undefined;
    try {
      const page = await fetchPage(undefined);
      setAssets(page.assets);
      cursorRef.current = page.endCursor;
      setHasMore(page.hasNextPage);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage(cursorRef.current);
      setAssets((prev) => prev.concat(page.assets));
      cursorRef.current = page.endCursor;
      setHasMore(page.hasNextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [enabled, fetchPage, hasMore, isLoadingMore]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { assets, isLoading, isLoadingMore, hasMore, loadMore, reload };
}
