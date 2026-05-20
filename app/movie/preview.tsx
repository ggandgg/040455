import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Sharing from 'expo-sharing';
import { useComposerStore } from '@/store/composer-store';
import { saveToLibrary, requestAddPermission } from '@/features/library/safe-media';

export default function PreviewScreen() {
  const router = useRouter();
  const result = useComposerStore((s) => s.result);
  const reset = useComposerStore((s) => s.reset);

  const player = useVideoPlayer(result?.uri ?? '', (p) => {
    p.loop = true;
    p.play();
  });

  if (!result) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyText}>沒有可預覽的影片</Text>
        <Pressable onPress={() => router.replace('/(tabs)/movie')} style={styles.btn}>
          <Text style={styles.btnText}>回到剪片</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const saveToAlbum = async () => {
    const perm = await requestAddPermission();
    if (perm === 'denied') {
      Alert.alert('沒有寫入相簿權限', '請至設定中允許寫入相簿。');
      return;
    }
    try {
      await saveToLibrary(result.uri);
      Alert.alert('已儲存', '影片已存到相簿。');
    } catch (e) {
      Alert.alert('儲存失敗', String((e as Error).message ?? e));
    }
  };

  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('無法分享');
      return;
    }
    await Sharing.shareAsync(result.uri, { mimeType: 'video/mp4', dialogTitle: '分享影片' });
  };

  const close = () => {
    reset();
    router.replace('/(tabs)/movie');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={close}>
          <Text style={styles.headerBtn}>關閉</Text>
        </Pressable>
        <Text style={styles.headerTitle}>預覽</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.videoWrap}>
        <VideoView style={styles.video} player={player} contentFit="contain" />
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {result.width}×{result.height} ・ {(result.durationMs / 1000).toFixed(1)}s
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={saveToAlbum}>
          <Text style={styles.primaryBtnText}>儲存到相簿</Text>
        </Pressable>
        <View style={styles.row}>
          <Pressable style={styles.secondaryBtn} onPress={share}>
            <Text style={styles.secondaryBtnText}>分享</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/movie/composer')}>
            <Text style={styles.secondaryBtnText}>重新合成</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontSize: 14, marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBtn: { color: '#fff', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  videoWrap: { flex: 1, justifyContent: 'center' },
  video: { flex: 1, width: '100%' },
  meta: { alignItems: 'center', paddingVertical: 10 },
  metaText: { color: '#bbb', fontSize: 12 },
  actions: { padding: 16 },
  primaryBtn: {
    backgroundColor: '#0a5cff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff2',
  },
  secondaryBtnText: { color: '#fff', fontSize: 15 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff2', borderRadius: 8 },
  btnText: { color: '#fff' },
});
