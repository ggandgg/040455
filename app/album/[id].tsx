import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AssetGrid } from '@/components/AssetGrid';
import { ColumnPicker } from '@/components/ColumnPicker';
import { SelectionToolbar } from '@/components/SelectionToolbar';
import { AddToCollectionSheet } from '@/components/AddToCollectionSheet';
import { useAssets } from '@/features/library/use-assets';
import { useLibraryStore } from '@/store/library-store';
import { useSelectionStore } from '@/store/selection-store';
import { useViewerStore } from '@/store/viewer-store';
import { deleteAssetsAction, shareAssets } from '@/features/library/actions';

export default function AlbumScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const columns = useLibraryStore((s) => s.columns);
  const setColumns = useLibraryStore((s) => s.setColumns);
  const selection = useSelectionStore();
  const openViewer = useViewerStore((s) => s.open);
  const [showSheet, setShowSheet] = useState(false);

  const { assets, loadMore, isLoadingMore, reload } = useAssets({ albumId: id });
  const selected = assets.filter((a) => selection.ids.has(a.id));

  const handleDelete = () => {
    Alert.alert('刪除照片', `將 ${selection.count()} 張照片移到「最近刪除」。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteAssetsAction(selected);
          if (ok) {
            selection.exit();
            await reload();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: title ?? '相簿', headerBackTitle: '返回' }} />
      <View style={styles.toolbar}>
        {selection.active ? (
          <View style={styles.selRow}>
            <Pressable onPress={selection.exit}>
              <Text style={styles.selAction}>取消</Text>
            </Pressable>
            <Text style={styles.selCount}>已選 {selection.count()}</Text>
            <Pressable onPress={() => selection.selectAll(assets.map((a) => a.id))}>
              <Text style={styles.selAction}>全選</Text>
            </Pressable>
          </View>
        ) : (
          <ColumnPicker value={columns} onChange={setColumns} />
        )}
      </View>
      <AssetGrid
        assets={assets}
        columns={columns}
        selectionVisible={selection.active}
        selectedIds={selection.ids}
        onPressAsset={(a, i) => {
          if (selection.active) {
            selection.toggle(a.id);
          } else {
            openViewer(assets, i);
            router.push('/photo');
          }
        }}
        onLongPressAsset={(a) => {
          if (!selection.active) selection.enter(a.id);
        }}
        onEndReached={loadMore}
        isLoadingMore={isLoadingMore}
      />

      <SelectionToolbar
        visible={selection.active}
        actions={[
          {
            key: 'share',
            label: '分享',
            icon: '↗',
            disabled: selection.count() === 0,
            onPress: () => shareAssets(selected),
          },
          {
            key: 'collect',
            label: '精選集',
            icon: '✦',
            disabled: selection.count() === 0,
            onPress: () => setShowSheet(true),
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
        visible={showSheet}
        assetIds={Array.from(selection.ids)}
        onClose={(added) => {
          setShowSheet(false);
          if (added) selection.exit();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  selRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selAction: { color: '#0a5cff', fontSize: 15 },
  selCount: { fontSize: 15, fontWeight: '600' },
});
