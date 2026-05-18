import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Asset } from '@/features/library/safe-media';

type Props = {
  asset: Asset;
  size: number;
  onPress: () => void;
};

function AssetThumbBase({ asset, size, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size }}>
      <Image
        source={{ uri: asset.uri }}
        style={styles.image}
        contentFit="cover"
        recyclingKey={asset.id}
        cachePolicy="memory-disk"
        transition={120}
      />
      {asset.mediaType === 'video' ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{formatDuration(asset.duration)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function formatDuration(s: number): string {
  if (!s || s < 0) return '';
  const total = Math.round(s);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

export const AssetThumb = memo(AssetThumbBase);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
