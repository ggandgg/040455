import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function OnboardingScreen() {
  const router = useRouter();
  const markSeen = useOnboardingStore((s) => s.markSeen);

  const start = async () => {
    await markSeen();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.brand}>Photo</Text>
        <Text style={styles.title}>歡迎</Text>
        <Text style={styles.subtitle}>整理、分享、把你的照片做成短片。</Text>

        <View style={styles.section}>
          <Bullet icon="◧" title="瀏覽與整理" desc="按相簿或日期檢視、多選收藏到自訂精選集。" />
          <Bullet icon="✦" title="精選集" desc="把照片分組儲存，不影響系統相簿。" />
          <Bullet icon="▶" title="自動剪片" desc="挑幾張照片或影片，一鍵產生 Reels 規格短片。" />
        </View>

        <View style={styles.privacy}>
          <Text style={styles.privacyTitle}>關於隱私</Text>
          <Text style={styles.privacyText}>
            • 所有處理 100% 在你的 iPhone 本機完成{'\n'}
            • 不會傳輸任何照片、影片或個人資料{'\n'}
            • 不蒐集任何使用統計或分析{'\n'}
            • 永遠不會讀取你的「已隱藏」或「最近刪除」相簿{'\n'}
            • 多支手機分別安裝，彼此完全獨立、不會同步
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={start}>
          <Text style={styles.ctaText}>開始使用</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.bulletTitle}>{title}</Text>
        <Text style={styles.bulletDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 24 },
  brand: { fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: '700', marginTop: 6 },
  subtitle: { fontSize: 15, color: '#555', marginTop: 8, marginBottom: 28 },
  section: { gap: 16, marginBottom: 28 },
  bullet: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bulletIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
    color: '#0a5cff',
    marginTop: 2,
  },
  bulletTitle: { fontSize: 15, fontWeight: '600' },
  bulletDesc: { fontSize: 13, color: '#666', marginTop: 2, lineHeight: 18 },
  privacy: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 16,
  },
  privacyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  privacyText: { fontSize: 12, color: '#444', lineHeight: 20 },
  footer: { padding: 24, paddingTop: 8 },
  cta: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
