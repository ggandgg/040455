/**
 * The ONLY file allowed to import expo-media-library directly.
 * All other code must go through this wrapper, which enforces:
 *   - Hidden album exclusion (SPEC.md §6)
 *   - Recently Deleted not accessed
 *   - No EXIF GPS read
 */
import * as MediaLibrary from 'expo-media-library';

export type Asset = MediaLibrary.Asset;
export type Album = MediaLibrary.Album;
export type PagedInfo<T> = MediaLibrary.PagedInfo<T>;

export type PermissionState = 'granted' | 'limited' | 'denied';

const FORBIDDEN_ALBUM_TITLES = new Set([
  'Hidden',
  '已隱藏',
  'Recently Deleted',
  '最近刪除',
  '最近删除',
]);

const FAVORITES_TITLES = new Set(['Favorites', '最愛', '最爱']);

function toState(p: MediaLibrary.PermissionResponse | null): PermissionState {
  if (!p) return 'denied';
  if (p.accessPrivileges === 'limited') return 'limited';
  if (p.granted) return 'granted';
  return 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  const current = await MediaLibrary.getPermissionsAsync(false);
  return toState(current);
}

export async function requestPermissions(): Promise<PermissionState> {
  const result = await MediaLibrary.requestPermissionsAsync(false);
  return toState(result);
}

export async function requestAddPermission(): Promise<PermissionState> {
  const result = await MediaLibrary.requestPermissionsAsync(true);
  return toState(result);
}

export async function presentLimitedLibraryPicker(): Promise<void> {
  if (typeof MediaLibrary.presentPermissionsPickerAsync === 'function') {
    await MediaLibrary.presentPermissionsPickerAsync();
  }
}

export type AssetQuery = {
  first?: number;
  after?: string;
  mediaType?: ('photo' | 'video')[];
  sortBy?: 'creationTime' | 'modificationTime';
  albumId?: string | null;
};

export async function getAssets(query: AssetQuery = {}): Promise<PagedInfo<Asset>> {
  return MediaLibrary.getAssetsAsync({
    first: query.first ?? 60,
    after: query.after,
    mediaType: query.mediaType ?? ['photo'],
    sortBy: query.sortBy ?? 'creationTime',
    album: query.albumId ?? undefined,
  });
}

export async function getAssetById(id: string): Promise<Asset | null> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, { shouldDownloadFromNetwork: false });
    return info ?? null;
  } catch {
    return null;
  }
}

export async function getAssetsByIds(ids: string[]): Promise<Asset[]> {
  const results: Asset[] = [];
  for (const id of ids) {
    const a = await getAssetById(id);
    if (a) results.push(a);
  }
  return results;
}

export async function resolveLocalUri(asset: Asset): Promise<string> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
      shouldDownloadFromNetwork: false,
    });
    return info?.localUri ?? asset.uri;
  } catch {
    return asset.uri;
  }
}

export async function getAlbums(): Promise<Album[]> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  return albums.filter((a) => !FORBIDDEN_ALBUM_TITLES.has(a.title));
}

export async function getFavoritesAlbum(): Promise<Album | null> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  return albums.find((a) => FAVORITES_TITLES.has(a.title)) ?? null;
}

export async function saveToLibrary(localUri: string): Promise<Asset> {
  return MediaLibrary.createAssetAsync(localUri);
}

export async function deleteAssets(assetIds: string[]): Promise<boolean> {
  if (assetIds.length === 0) return false;
  return MediaLibrary.deleteAssetsAsync(assetIds);
}
