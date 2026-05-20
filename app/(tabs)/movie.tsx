import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BUILTIN_TEMPLATES } from '@/features/movie/templates';
import { useComposerStore } from '@/store/composer-store';

export default function MovieTabScreen() {
  const router = useRouter();
  const setAssets = useComposerStore((s) => s.setAssets);
  const setTemplate = useComposerStore((s) => s.setTemplate);
  const template = useComposerStore((s) => s.template);
  const reset = useComposerStore((s) => s.reset);

  const pickAndOpen = async (templateId: string) => {
    const next = BUILTIN_TEMPLATES.find((t) => t.id === templateId) ?? BUILTIN_TEMPLATES[0]!;
    setTemplate(next);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!perm.granted && !perm.canAskAgain) {
      Alert.alert('需要相片權限', '請至設定中允許讀取相片。');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 30,
      orderedSelection: true,
    });
    if (picked.canceled || picked.assets.length === 0) return;

    setAssets(
      picked.assets
        .map((a) => ({
          id: a.assetId ?? '',
          kind: a.type === 'video' ? ('video' as const) : ('photo' as const),
        }))
        .filter((a) => a.id !== ''),
    );
    router.push('/movie/composer');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>剪片</Text>
        <Text style={styles.subtitle}>選一個模板，再挑 5–30 個媒體，自動產生短片。</Text>

        {BUILTIN_TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.card, t.id === template.id && styles.cardActive]}
            onPress={() => pickAndOpen(t.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{t.name}</Text>
              <Text style={styles.cardSpec}>
                {t.resolution.w}×{t.resolution.h}・{t.aspectRatio}
              </Text>
            </View>
            <Text style={styles.cardDesc}>
              節奏：{t.rhythm.minClipMs}–{t.rhythm.maxClipMs} ms / 片
              {'  '}效果：{t.effects.map((e) => e.type).join('、') || '無'}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={styles.resetBtn}
          onPress={() => {
            reset();
            Alert.alert('已重設', '草稿已清空。');
          }}
        >
          <Text style={styles.resetText}>清除目前草稿</Text>
        </Pressable>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            合成過程 100% 在裝置本機進行，不會傳出任何照片資料。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  cardActive: { borderColor: '#0a5cff', borderWidth: 2 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardSpec: { fontSize: 11, color: '#888' },
  cardDesc: { fontSize: 12, color: '#555' },
  resetBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  resetText: { color: '#d70015', fontSize: 13 },
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
  },
  disclaimerText: { fontSize: 11, color: '#666', lineHeight: 16, textAlign: 'center' },
});
