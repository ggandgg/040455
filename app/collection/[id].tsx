import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AssetGrid } from '@/components/AssetGrid';
import { ColumnPicker } from '@/components/ColumnPicker';
import { SelectionToolbar } from '@/components/SelectionToolbar';
import {
  deleteCollection,
  getCollection,
  listCollectionItems,
  removeAssetFromCollection,
} from '@/features/collections/repo';
import { getAssetsByIds, type Asset } from '@/features/library/safe-media';
import { shareAssets } from '@/features/library/actions';
import { useLibraryStore } from '@/store/library-store';
import { useSelectionStore } from '@/store/selection-store';
import { useViewerStore } from '@/store/viewer-store';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const columns = useLibraryStore((s) => s.columns);
  const setColumns = useLibraryStore((s) => s.setColumns);
  const selection = useSelectionStore();
  const openViewer = useViewerStore((s) => s.open);

  const [title, setTitle] = useState('精選集');
  const [assets, setAssets] = useState<Asset[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const meta = await getCollection(id);
    if (meta) setTitle(meta.name);
    const assetIds = await listCollectionItems(id);
    const loaded = await getAssetsByIds(assetIds);
    setAssets(loaded);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = assets.filter((a) => selection.ids.has(a.id));

  const handleRemove = () => {
    if (!id) return;
    Alert.alert('從精選集移除', `將 ${selection.count()} 張從精選集移除（不會刪除原檔）。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '移除',
        style: 'destructive',
        onPress: async () => {
          for (const a of selected) {
            await removeAssetFromCollection(id, a.id);
          }
          selection.exit();
          await load();
        },
      },
    ]);
  };

  const handleDeleteCollection = () => {
    if (!id) return;
    Alert.alert('刪除精選集', `「${title}」會被刪除（原相簿照片不受影響）。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await deleteCollection(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title,
          headerBackTitle: '返回',
          headerRight: () => (
            <Pressable onPress={handleDeleteCollection} hitSlop={10}>
              <Text style={styles.headerRight}>刪除</Text>
            </Pressable>
          ),
        }}
      />

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
            key: 'remove',
            label: '移除',
            icon: '⊖',
            destructive: true,
            disabled: selection.count() === 0,
            onPress: handleRemove,
          },
        ]}
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
  headerRight: { color: '#d70015', fontSize: 15 },
});
