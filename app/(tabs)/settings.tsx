import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>隱私</Text>
          <Text style={styles.cardText}>
            本 app 100% 在裝置本機運作。{'\n'}
            不會傳輸任何照片、影片或個人資料到外部伺服器。{'\n'}
            不蒐集任何使用統計或分析。
          </Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={() => Linking.openSettings()}>
          <Text style={styles.rowLabel}>開啟系統 Photo 權限</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>版本 {Constants.expoConfig?.version ?? '0.1.0'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  card: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  cardText: { fontSize: 13, color: '#444', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLabel: { fontSize: 15 },
  rowChevron: { fontSize: 18, color: '#999' },
  footer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16 },
  footerText: { fontSize: 12, color: '#999' },
});
