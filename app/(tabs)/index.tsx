import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestPermissions, getPermissionState } from '@/features/library/safe-media';

export default function LibraryScreen() {
  const [perm, setPerm] = useState<'idle' | 'requesting' | 'granted' | 'limited' | 'denied'>('idle');

  useEffect(() => {
    (async () => {
      const current = await getPermissionState();
      if (current === 'granted' || current === 'limited') {
        setPerm(current);
        return;
      }
      setPerm('requesting');
      const next = await requestPermissions();
      setPerm(next);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.center}>
        {perm === 'idle' || perm === 'requesting' ? (
          <ActivityIndicator />
        ) : perm === 'denied' ? (
          <Text style={styles.text}>沒有相片權限。請至 設定 → Photo → 允許讀取。</Text>
        ) : (
          <Text style={styles.text}>權限：{perm} — M1 將在這裡顯示縮圖網格。</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 14, color: '#444', textAlign: 'center' },
});
