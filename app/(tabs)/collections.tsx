import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  createCollection,
  listCollections,
  type Collection,
} from '@/features/collections/repo';
import { getAssetById } from '@/features/library/safe-media';

export default function CollectionsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const data = await listCollections();
    setCollections(data);
    const coverMap: Record<string, string> = {};
    await Promise.all(
      data.map(async (c) => {
        if (!c.coverAsset) return;
        const a = await getAssetById(c.coverAsset);
        if (a?.uri) coverMap[c.id] = a.uri;
      }),
    );
    setCovers(coverMap);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createCollection(name);
    setNewName('');
    setCreating(false);
    await load();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>精選集</Text>
        <Pressable onPress={() => setCreating((v) => !v)} hitSlop={10}>
          <Text style={styles.addBtn}>＋</Text>
        </Pressable>
      </View>

      {creating ? (
        <View style={styles.createBox}>
          <TextInput
            autoFocus
            value={newName}
            onChangeText={setNewName}
            placeholder="精選集名稱"
            style={styles.input}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleCreate}
            style={[styles.createBtn, !newName.trim() && styles.btnDisabled]}
            disabled={!newName.trim()}
          >
            <Text style={styles.createBtnText}>建立</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={collections.length === 0 ? styles.emptyWrap : styles.listWrap}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>還沒有精選集</Text>
            <Text style={styles.emptyHint}>
              在「相簿」長按選照片 → 加入精選集{'\n'}或按右上角 ＋ 直接建立
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({ pathname: '/collection/[id]', params: { id: item.id } })
            }
            onLongPress={() => {
              Alert.alert(item.name, undefined, [
                { text: '取消', style: 'cancel' },
                {
                  text: '刪除精選集',
                  style: 'destructive',
                  onPress: async () => {
                    const { deleteCollection } = await import(
                      '@/features/collections/repo'
                    );
                    await deleteCollection(item.id);
                    await load();
                  },
                },
              ]);
            }}
          >
            <View style={styles.coverWrap}>
              {covers[item.id] ? (
                <Image source={{ uri: covers[item.id] }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverPlaceholderText}>✦</Text>
                </View>
              )}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowCount}>{item.itemCount} 張</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  title: { fontSize: 20, fontWeight: '600' },
  addBtn: { fontSize: 28, color: '#0a5cff', lineHeight: 30 },
  createBox: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  input: {
    flex: 1,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#d0d0d6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  createBtn: { backgroundColor: '#0a5cff', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  listWrap: { paddingVertical: 4 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#444', marginBottom: 8 },
  emptyHint: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  coverWrap: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef0f4' },
  coverPlaceholderText: { fontSize: 22, color: '#bbb' },
  rowText: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 15, color: '#111' },
  rowCount: { fontSize: 12, color: '#888', marginTop: 4 },
  chevron: { fontSize: 22, color: '#bbb' },
});
