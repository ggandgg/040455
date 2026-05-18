import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useViewerStore } from '@/store/viewer-store';
import type { Asset } from '@/features/library/safe-media';

export default function PhotoViewerScreen() {
  const router = useRouter();
  const assets = useViewerStore((s) => s.assets);
  const initialIndex = useViewerStore((s) => s.index);
  const setIndex = useViewerStore((s) => s.setIndex);
  const closeViewer = useViewerStore((s) => s.close);

  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<Asset>>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== currentIndex) {
      setCurrentIndex(next);
      setIndex(next);
    }
  };

  const close = () => {
    closeViewer();
    router.back();
  };

  if (assets.length === 0) {
    return (
      <SafeAreaView style={styles.empty}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyText}>沒有照片可顯示</Text>
        <Pressable onPress={close} style={styles.closeBtn}>
          <Text style={styles.closeText}>關閉</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        ref={listRef}
        data={assets}
        keyExtractor={(a) => a.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <ZoomableImage uri={item.uri} width={width} height={height} />
          </View>
        )}
      />

      <SafeAreaView style={styles.headerWrap} edges={['top']} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <Pressable onPress={close} style={styles.headerBtn} hitSlop={10}>
            <Text style={styles.headerBtnText}>關閉</Text>
          </Pressable>
          <Text style={styles.counter}>
            {currentIndex + 1} / {assets.length}
          </Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ZoomableImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  return (
    <ScrollView
      style={{ width, height }}
      contentContainerStyle={{ width, height }}
      maximumZoomScale={3}
      minimumZoomScale={1}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bouncesZoom
      pinchGestureEnabled
    >
      <Image
        source={{ uri }}
        style={{ width, height }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  empty: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', marginBottom: 16 },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    minWidth: 60,
    paddingVertical: 6,
  },
  headerBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  counter: { color: '#fff', fontSize: 13, fontWeight: '500' },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff2',
    borderRadius: 8,
  },
  closeText: { color: '#fff' },
});
