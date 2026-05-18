import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Album } from '@/features/library/safe-media';

type Props = {
  albums: Album[];
};

export function AlbumList({ albums }: Props) {
  const router = useRouter();
  return (
    <FlatList
      data={albums}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            router.push({ pathname: '/album/[id]', params: { id: item.id, title: item.title } })
          }
        >
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.count}>{item.assetCount}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: { flex: 1 },
  title: { fontSize: 15, color: '#111' },
  count: { fontSize: 12, color: '#888', marginTop: 2 },
  chevron: { fontSize: 22, color: '#bbb' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e5ea', marginLeft: 16 },
});
