import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useComposerStore } from '@/store/composer-store';
import { BUILTIN_TEMPLATES } from '@/features/movie/templates';
import { BUILTIN_TRACKS, trackUri } from '@/features/movie/use-music';
import { composeMovie, isMovieMakerAvailable } from 'movie-maker';

const DURATION_PRESETS = [15, 30, 60, 90];

export default function ComposerScreen() {
  const router = useRouter();
  const assets = useComposerStore((s) => s.assets);
  const template = useComposerStore((s) => s.template);
  const setTemplate = useComposerStore((s) => s.setTemplate);
  const musicId = useComposerStore((s) => s.musicId);
  const setMusicId = useComposerStore((s) => s.setMusicId);
  const customMusic = useComposerStore((s) => s.customMusic);
  const setCustomMusic = useComposerStore((s) => s.setCustomMusic);
  const durationSec = useComposerStore((s) => s.durationSec);
  const setDurationSec = useComposerStore((s) => s.setDurationSec);
  const setResult = useComposerStore((s) => s.setResult);

  const [composing, setComposing] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (res.canceled || res.assets.length === 0) return;
    const a = res.assets[0]!;
    setCustomMusic({ uri: a.uri, name: a.name });
    setMusicId('custom');
  };

  const start = async () => {
    if (assets.length === 0) {
      Alert.alert('沒有素材', '請先選擇 5 張以上的照片或影片。');
      return;
    }
    if (!isMovieMakerAvailable) {
      Alert.alert(
        '原生模組未載入',
        '此功能需要 development build（EAS Build 後的 IPA），Expo Go 無法使用。',
      );
      return;
    }
    setComposing(true);
    setProgress(0);
    try {
      const resolvedMusicUri =
        musicId === 'custom' ? customMusic?.uri : trackUri(musicId);
      const result = await composeMovie(
        {
          assets,
          template,
          musicUri: resolvedMusicUri,
          outputDurationMs: durationSec * 1000,
        },
        (p) => setProgress(p),
      );
      setResult(result);
      router.replace('/movie/preview');
    } catch (e) {
      Alert.alert('合成失敗', String((e as Error).message ?? e));
    } finally {
      setComposing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Section title={`素材（${assets.length}）`}>
          <Text style={styles.note}>
            {assets.length === 0
              ? '尚未選擇素材。'
              : `已選 ${assets.length} 個，照片 ${assets.filter((a) => a.kind === 'photo').length} 張、影片 ${assets.filter((a) => a.kind === 'video').length} 段。`}
          </Text>
        </Section>

        <Section title="模板">
          {BUILTIN_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.option, t.id === template.id && styles.optionActive]}
              onPress={() => setTemplate(t)}
            >
              <Text style={styles.optionTitle}>{t.name}</Text>
              <Text style={styles.optionDesc}>
                {t.rhythm.minClipMs}–{t.rhythm.maxClipMs} ms / 片
              </Text>
            </Pressable>
          ))}
        </Section>

        <Section title="長度">
          <View style={styles.row}>
            {DURATION_PRESETS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, s === durationSec && styles.chipActive]}
                onPress={() => setDurationSec(s)}
              >
                <Text style={[styles.chipText, s === durationSec && styles.chipTextActive]}>
                  {s}s
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="配樂">
          {BUILTIN_TRACKS.map((tr) => (
            <Pressable
              key={tr.id}
              style={[styles.option, tr.id === musicId && styles.optionActive]}
              onPress={() => {
                setMusicId(tr.id);
              }}
            >
              <Text style={styles.optionTitle}>{tr.name}</Text>
              <Text style={styles.optionDesc}>{tr.vibe}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.option, musicId === 'custom' && styles.optionActive]}
            onPress={pickAudio}
          >
            <Text style={styles.optionTitle}>
              {customMusic ? `自選：${customMusic.name}` : '從檔案選擇音訊…'}
            </Text>
            <Text style={styles.optionDesc}>
              {customMusic ? '輕點以更換' : 'MP3 / M4A / WAV / AAC'}
            </Text>
          </Pressable>

          <Text style={styles.note}>
            內建配樂音檔將於後續版本提供。選擇「無配樂」或內建占位曲將輸出無聲影片。
          </Text>
        </Section>

        <Pressable
          style={[styles.cta, composing && styles.ctaDisabled]}
          disabled={composing}
          onPress={start}
        >
          {composing ? (
            <View style={styles.ctaContent}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.ctaText}>合成中 {Math.round(progress * 100)}%</Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>開始合成</Text>
          )}
        </Pressable>

        {composing ? <ProgressBar value={progress} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  option: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  optionActive: { borderColor: '#0a5cff', borderWidth: 2 },
  optionTitle: { fontSize: 15, fontWeight: '500' },
  optionDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#eef0f4',
  },
  chipActive: { backgroundColor: '#111' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  note: { fontSize: 12, color: '#888', lineHeight: 18, marginTop: 4 },
  cta: {
    backgroundColor: '#0a5cff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { backgroundColor: '#7aa5ff' },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  progressTrack: {
    marginTop: 14,
    height: 4,
    backgroundColor: '#eef0f4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#0a5cff' },
});
