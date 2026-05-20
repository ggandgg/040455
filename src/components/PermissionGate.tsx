import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getPermissionState,
  presentLimitedLibraryPicker,
  requestPermissions,
  type PermissionState,
} from '@/features/library/safe-media';

type Props = {
  children: (state: 'granted' | 'limited') => React.ReactNode;
};

export function PermissionGate({ children }: Props) {
  const [state, setState] = useState<PermissionState | 'pending'>('pending');

  useEffect(() => {
    (async () => {
      const current = await getPermissionState();
      if (current === 'granted' || current === 'limited') {
        setState(current);
        return;
      }
      const next = await requestPermissions();
      setState(next);
    })();
  }, []);

  if (state === 'pending') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>需要相片權限</Text>
        <Text style={styles.body}>
          請至 設定 → 隱私權與安全性 → 照片 中允許本 app 讀取。{'\n'}
          所有處理 100% 在裝置本機完成，不會傳出資料。
        </Text>
        <Pressable style={styles.btn} onPress={() => Linking.openSettings()}>
          <Text style={styles.btnText}>開啟設定</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {state === 'limited' ? (
        <View style={styles.limitedBanner}>
          <Text style={styles.limitedText}>目前僅授權部分照片</Text>
          <Pressable onPress={() => presentLimitedLibraryPicker()}>
            <Text style={styles.limitedAction}>重新選取</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.fill}>{children(state)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  body: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  btn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  limitedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff4d6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6d29a',
  },
  limitedText: { fontSize: 12, color: '#6b4f00' },
  limitedAction: { fontSize: 12, color: '#0a5cff', fontWeight: '600' },
});
