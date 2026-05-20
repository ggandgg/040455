import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Asset } from '@/features/library/safe-media';

type Props = {
  asset: Asset;
  size: number;
  selected?: boolean;
  selectionVisible?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

function AssetThumbBase({
  asset,
  size,
  selected,
  selectionVisible,
  onPress,
  onLongPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={{ width: size, height: size }}
    >
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
      {selectionVisible ? (
        <View style={styles.checkWrap} pointerEvents="none">
          <View style={[styles.check, selected && styles.checkActive]}>
            {selected ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </View>
      ) : null}
      {selected ? <View style={styles.selectedOverlay} pointerEvents="none" /> : null}
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
  checkWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: '#0a5cff',
    borderColor: '#0a5cff',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#0a5cff',
  },
});
