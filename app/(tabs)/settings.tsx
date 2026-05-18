import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { getDB } from '@/db/client';

export default function SettingsScreen() {
  const router = useRouter();

  const resetDb = () => {
    Alert.alert(
      '清除所有精選集',
      '會刪掉所有自訂精選集與草稿。系統相簿與照片本身不受影響。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            const db = await getDB();
            await db.execAsync(
              'DELETE FROM collection_items; DELETE FROM collections; DELETE FROM movie_drafts;',
            );
            Alert.alert('已清除', '所有精選集與剪片草稿已移除。');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>設定</Text>

        <Group title="隱私">
          <View style={styles.card}>
            <Text style={styles.cardText}>
              • 所有照片處理 100% 在裝置本機{'\n'}
              • 不傳任何資料到外部伺服器{'\n'}
              • 不蒐集統計、分析或追蹤{'\n'}
              • 永遠不存取「已隱藏」或「最近刪除」{'\n'}
              • 多支手機之間不會同步、互不關聯
            </Text>
          </View>
        </Group>

        <Group title="權限">
          <Row label="開啟系統 Photo 權限" onPress={() => Linking.openSettings()} />
        </Group>

        <Group title="App 資料">
          <Row label="清除所有精選集" destructive onPress={resetDb} />
          <Row label="重看歡迎畫面" onPress={() => router.push('/onboarding')} />
        </Group>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            版本 {Constants.expoConfig?.version ?? '0.1.0'}
          </Text>
          <Text style={styles.footerText}>
            Build {Constants.expoConfig?.ios?.buildNumber ?? '1'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  destructive,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 18 },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 16,
  },
  cardText: { fontSize: 13, color: '#444', lineHeight: 22 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  rowLabel: { fontSize: 15 },
  destructive: { color: '#d70015' },
  chevron: { fontSize: 18, color: '#bbb' },
  footer: { marginTop: 12, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#999', marginTop: 2 },
});
