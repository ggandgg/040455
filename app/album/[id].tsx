import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AssetGrid } from '@/components/AssetGrid';
import { ColumnPicker } from '@/components/ColumnPicker';
import { useAssets } from '@/features/library/use-assets';
import { useLibraryStore } from '@/store/library-store';
import { useViewerStore } from '@/store/viewer-store';

export default function AlbumScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const columns = useLibraryStore((s) => s.columns);
  const setColumns = useLibraryStore((s) => s.setColumns);
  const openViewer = useViewerStore((s) => s.open);

  const { assets, loadMore, isLoadingMore } = useAssets({ albumId: id });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: title ?? '相簿', headerBackTitle: '返回' }} />
      <View style={styles.toolbar}>
        <ColumnPicker value={columns} onChange={setColumns} />
      </View>
      <AssetGrid
        assets={assets}
        columns={columns}
        onPressAsset={(_, index) => {
          openViewer(assets, index);
          router.push('/photo');
        }}
        onEndReached={loadMore}
        isLoadingMore={isLoadingMore}
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
});
