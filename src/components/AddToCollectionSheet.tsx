import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addAssetsToCollection,
  createCollection,
  listCollections,
  type Collection,
} from '@/features/collections/repo';

type Props = {
  visible: boolean;
  assetIds: string[];
  onClose: (added: boolean) => void;
};

export function AddToCollectionSheet({ visible, assetIds, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listCollections()
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [visible]);

  const addTo = async (collectionId: string) => {
    const added = await addAssetsToCollection(collectionId, assetIds);
    Alert.alert('已加入', `成功加入 ${added} 張到精選集。`);
    onClose(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const c = await createCollection(name);
    await addAssetsToCollection(c.id, assetIds);
    setNewName('');
    setCreating(false);
    Alert.alert('已建立', `精選集「${name}」已建立並加入 ${assetIds.length} 張。`);
    onClose(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => onClose(false)}>
            <Text style={styles.cancel}>取消</Text>
          </Pressable>
          <Text style={styles.title}>加入精選集</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          將 {assetIds.length} 張照片加入既有精選集，或建立新的。
        </Text>

        {creating ? (
          <View style={styles.createBox}>
            <TextInput
              autoFocus
              value={newName}
              onChangeText={setNewName}
              placeholder="新精選集名稱"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.createActions}>
              <Pressable
                onPress={() => {
                  setNewName('');
                  setCreating(false);
                }}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>取消</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                style={[styles.primaryBtn, !newName.trim() && styles.btnDisabled]}
                disabled={!newName.trim()}
              >
                <Text style={styles.primaryBtnText}>建立</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.createRow} onPress={() => setCreating(true)}>
            <Text style={styles.createIcon}>＋</Text>
            <Text style={styles.createText}>建立新精選集</Text>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.list}>
            {collections.length === 0 ? (
              <Text style={styles.empty}>還沒有精選集。建立一個吧。</Text>
            ) : (
              collections.map((c) => (
                <Pressable key={c.id} style={styles.row} onPress={() => addTo(c.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{c.name}</Text>
                    <Text style={styles.rowMeta}>{c.itemCount} 張</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  cancel: { fontSize: 15, color: '#0a5cff' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, color: '#666', paddingHorizontal: 16, paddingVertical: 12 },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  createIcon: { fontSize: 22, color: '#0a5cff', marginRight: 10 },
  createText: { fontSize: 15, color: '#0a5cff' },
  createBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  input: {
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#d0d0d6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#eef0f4' },
  secondaryBtnText: { color: '#333', fontWeight: '500' },
  primaryBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#0a5cff' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  list: { flex: 1 },
  empty: { color: '#888', textAlign: 'center', marginTop: 24 },
  loading: { paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  rowName: { fontSize: 15 },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  chevron: { fontSize: 22, color: '#bbb' },
});
