import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PermissionGate } from '@/components/PermissionGate';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ColumnPicker } from '@/components/ColumnPicker';
import { AssetGrid } from '@/components/AssetGrid';
import { AlbumList } from '@/components/AlbumList';
import { SelectionToolbar } from '@/components/SelectionToolbar';
import { AddToCollectionSheet } from '@/components/AddToCollectionSheet';
import { useAssets } from '@/features/library/use-assets';
import { useAlbums } from '@/features/library/use-albums';
import { useLibraryStore, type LibrarySegment } from '@/store/library-store';
import { useViewerStore } from '@/store/viewer-store';
import { useSelectionStore } from '@/store/selection-store';
import { getFavoritesAlbum } from '@/features/library/safe-media';
import { deleteAssetsAction, shareAssets } from '@/features/library/actions';

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

  const selection = useSelectionStore();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const [favoritesId, setFavoritesId] = useState<string | null>(null);
  useEffect(() => {
    getFavoritesAlbum().then((a) => setFavoritesId(a?.id ?? null));
  }, []);

  const showAll = segment === 'all';
  const showFavorites = segment === 'favorites';
  const showAlbums = segment === 'albums';

  const assetQuery = useAssets({
    albumId: showFavorites ? favoritesId : null,
    enabled: showAll || (showFavorites && !!favoritesId),
  });
  const { albums } = useAlbums(showAlbums);

  const selectedAssets = useMemo(
    () => assetQuery.assets.filter((a) => selection.ids.has(a.id)),
    [assetQuery.assets, selection.ids],
  );

  const onPressAsset = (assetId: string, index: number) => {
    if (selection.active) {
      selection.toggle(assetId);
      return;
    }
    openViewer(assetQuery.assets, index);
    router.push('/photo');
  };

  const onLongPressAsset = (assetId: string) => {
    if (!selection.active) selection.enter(assetId);
  };

  const handleDelete = () => {
    Alert.alert('刪除照片', `將 ${selection.count()} 張照片移到「最近刪除」。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteAssetsAction(selectedAssets);
          if (ok) {
            selection.exit();
            await assetQuery.reload();
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    await shareAssets(selectedAssets);
  };

  return (
    <View style={styles.body}>
      <View style={styles.toolbar}>
        {selection.active ? (
          <View style={styles.selectionHeader}>
            <Pressable onPress={selection.exit}>
              <Text style={styles.selectionCancel}>取消</Text>
            </Pressable>
            <Text style={styles.selectionCount}>已選 {selection.count()}</Text>
            <Pressable
              onPress={() => selection.selectAll(assetQuery.assets.map((a) => a.id))}
            >
              <Text style={styles.selectionAction}>全選</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.segmentRow}>
              <SegmentedControl value={segment} options={SEGMENTS} onChange={setSegment} />
            </View>
            {!showAlbums ? <ColumnPicker value={columns} onChange={setColumns} /> : null}
          </>
        )}
      </View>

      {showAlbums ? (
        <AlbumList albums={albums} />
      ) : (
        <AssetGrid
          assets={assetQuery.assets}
          columns={columns}
          selectionVisible={selection.active}
          selectedIds={selection.ids}
          onPressAsset={(a, i) => onPressAsset(a.id, i)}
          onLongPressAsset={(a) => onLongPressAsset(a.id)}
          onEndReached={assetQuery.loadMore}
          isLoadingMore={assetQuery.isLoadingMore}
        />
      )}

      <SelectionToolbar
        visible={selection.active && !showAlbums}
        actions={[
          {
            key: 'share',
            label: '分享',
            icon: '↗',
            disabled: selection.count() === 0,
            onPress: handleShare,
          },
          {
            key: 'collect',
            label: '精選集',
            icon: '✦',
            disabled: selection.count() === 0,
            onPress: () => setShowAddSheet(true),
          },
          {
            key: 'delete',
            label: '刪除',
            icon: '🗑',
            destructive: true,
            disabled: selection.count() === 0,
            onPress: handleDelete,
          },
        ]}
      />

      <AddToCollectionSheet
        visible={showAddSheet}
        assetIds={Array.from(selection.ids)}
        onClose={(added) => {
          setShowAddSheet(false);
          if (added) selection.exit();
        }}
      />
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
  selectionHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCancel: { color: '#0a5cff', fontSize: 15 },
  selectionAction: { color: '#0a5cff', fontSize: 15 },
  selectionCount: { fontSize: 15, fontWeight: '600' },
});
