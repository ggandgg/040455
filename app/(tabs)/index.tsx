import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PermissionGate } from '@/components/PermissionGate';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ColumnPicker } from '@/components/ColumnPicker';
import { AssetGrid } from '@/components/AssetGrid';
import { AlbumList } from '@/components/AlbumList';
import { useAssets } from '@/features/library/use-assets';
import { useAlbums } from '@/features/library/use-albums';
import { useLibraryStore, type LibrarySegment } from '@/store/library-store';
import { useViewerStore } from '@/store/viewer-store';
import { getFavoritesAlbum } from '@/features/library/safe-media';

const SEGMENTS: { value: LibrarySegment; label: string }[] = [
  { value: 'all', label: '所有' },
  { value: 'favorites', label: '最愛' },
  { value: 'albums', label: '相簿' },
];

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <PermissionGate>{() => <LibraryContent />}</PermissionGate>
    </SafeAreaView>
  );
}

function LibraryContent() {
  const router = useRouter();
  const segment = useLibraryStore((s) => s.segment);
  const setSegment = useLibraryStore((s) => s.setSegment);
  const columns = useLibraryStore((s) => s.columns);
  const setColumns = useLibraryStore((s) => s.setColumns);
  const openViewer = useViewerStore((s) => s.open);

  const [favoritesId, setFavoritesId] = useState<string | null>(null);

  useEffect(() => {
    getFavoritesAlbum().then((album) => setFavoritesId(album?.id ?? null));
  }, []);

  const showAll = segment === 'all';
  const showFavorites = segment === 'favorites';
  const showAlbums = segment === 'albums';

  const assetQuery = useAssets({
    albumId: showFavorites ? favoritesId : null,
    enabled: showAll || (showFavorites && !!favoritesId),
  });

  const { albums, isLoading: albumsLoading } = useAlbums(showAlbums);

  return (
    <View style={styles.body}>
      <View style={styles.toolbar}>
        <View style={styles.segmentRow}>
          <SegmentedControl value={segment} options={SEGMENTS} onChange={setSegment} />
        </View>
        {!showAlbums ? <ColumnPicker value={columns} onChange={setColumns} /> : null}
      </View>

      {showAlbums ? (
        <AlbumList albums={albums} />
      ) : (
        <AssetGrid
          assets={assetQuery.assets}
          columns={columns}
          onPressAsset={(_, index) => {
            openViewer(assetQuery.assets, index);
            router.push('/photo');
          }}
          onEndReached={assetQuery.loadMore}
          isLoadingMore={assetQuery.isLoadingMore}
        />
      )}

      {showAlbums && albumsLoading ? null : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  segmentRow: { flex: 1 },
});
