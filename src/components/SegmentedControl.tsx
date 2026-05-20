import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
};

export function SegmentedControl<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#eef0f4',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  label: { fontSize: 13, color: '#555' },
  labelActive: { color: '#111', fontWeight: '600' },
});
