import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ColumnCount } from '@/store/library-store';

type Props = {
  value: ColumnCount;
  onChange: (c: ColumnCount) => void;
};

const OPTIONS: ColumnCount[] = [2, 3, 4, 5];

export function ColumnPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((n) => {
        const active = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={[styles.txt, active && styles.txtActive]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0f4',
  },
  btnActive: { backgroundColor: '#111' },
  txt: { fontSize: 13, color: '#555' },
  txtActive: { color: '#fff', fontWeight: '700' },
});
