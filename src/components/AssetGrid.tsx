import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ListRenderItem } from 'react-native';
import type { Asset } from '@/features/library/safe-media';
import { AssetThumb } from './AssetThumb';

const GAP = 2;

type Props = {
  assets: Asset[];
  columns: number;
  onPressAsset: (asset: Asset, index: number) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
};

export function AssetGrid({
  assets,
  columns,
  onPressAsset,
  onEndReached,
  isLoadingMore,
  ListHeaderComponent,
}: Props) {
  const { width } = useWindowDimensions();
  const cellSize = useMemo(
    () => Math.floor((width - GAP * (columns - 1)) / columns),
    [width, columns],
  );

  const renderItem = useCallback<ListRenderItem<Asset>>(
    ({ item, index }) => (
      <View style={{ marginRight: (index + 1) % columns === 0 ? 0 : GAP, marginBottom: GAP }}>
        <AssetThumb asset={item} size={cellSize} onPress={() => onPressAsset(item, index)} />
      </View>
    ),
    [columns, cellSize, onPressAsset],
  );

  return (
    <FlatList
      key={`grid-${columns}`}
      data={assets}
      keyExtractor={(a) => a.id}
      numColumns={columns}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      removeClippedSubviews
      initialNumToRender={columns * 8}
      maxToRenderPerBatch={columns * 10}
      windowSize={5}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { paddingVertical: 20, alignItems: 'center' },
});
