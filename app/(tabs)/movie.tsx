import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUILTIN_TEMPLATES } from '@/features/movie/templates';

export default function MovieScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.center}>
        <Text style={styles.title}>剪片</Text>
        <Text style={styles.subtitle}>
          M4–M5 將實作。{'\n'}
          已定義 {BUILTIN_TEMPLATES.length} 個模板：{BUILTIN_TEMPLATES.map((t) => t.id).join(' / ')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
});
