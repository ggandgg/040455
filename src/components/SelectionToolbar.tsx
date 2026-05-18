import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Action = {
  key: string;
  label: string;
  icon: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  actions: Action[];
};

export function SelectionToolbar({ visible, actions }: Props) {
  if (!visible) return null;
  return (
    <SafeAreaView edges={['bottom']} style={styles.wrap}>
      <View style={styles.row}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            disabled={a.disabled}
            onPress={a.onPress}
            style={[styles.item, a.disabled && styles.itemDisabled]}
          >
            <Text style={[styles.icon, a.destructive && styles.destructive]}>{a.icon}</Text>
            <Text style={[styles.label, a.destructive && styles.destructive]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#f8f8fa',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d0d0d6',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 4,
  },
  item: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 },
  itemDisabled: { opacity: 0.35 },
  icon: { fontSize: 22, marginBottom: 2 },
  label: { fontSize: 11, color: '#111' },
  destructive: { color: '#d70015' },
});
