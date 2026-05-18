/**
 * The ONLY file allowed to import expo-media-library directly.
 * All other code must go through this wrapper, which enforces:
 *   - Hidden album exclusion (SPEC.md §6)
 *   - Recently Deleted not accessed
 *   - No EXIF GPS read
 */
import * as MediaLibrary from 'expo-media-library';

export type PermissionState = 'granted' | 'limited' | 'denied';

const FORBIDDEN_ALBUM_TITLES = new Set([
  'Hidden',
  '已隱藏',
  'Recently Deleted',
  '最近刪除',
  '最近删除',
]);

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
  // false = readOnly (no NSPhotoLibraryAddUsageDescription needed here)
  const result = await MediaLibrary.requestPermissionsAsync(false);
  return toState(result);
}

export async function requestAddPermission(): Promise<PermissionState> {
  // true = writeOnly (for saving exported movies back to camera roll)
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
  album?: { id: string; title: string } | null;
};

export async function getAssets(query: AssetQuery = {}) {
  const album = query.album ?? undefined;

  if (album && FORBIDDEN_ALBUM_TITLES.has(album.title)) {
    return { assets: [], endCursor: '', hasNextPage: false, totalCount: 0 };
  }

  return MediaLibrary.getAssetsAsync({
    first: query.first ?? 100,
    after: query.after,
    mediaType: query.mediaType ?? ['photo'],
    sortBy: query.sortBy ?? 'creationTime',
    album: album?.id,
  });
}

export async function getAlbums() {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  return albums.filter((a) => !FORBIDDEN_ALBUM_TITLES.has(a.title));
}

export async function saveToLibrary(localUri: string) {
  return MediaLibrary.createAssetAsync(localUri);
}
