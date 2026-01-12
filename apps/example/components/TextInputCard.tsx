import { View, TextInput, StyleSheet } from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function TextInputCard({
  value,
  onChangeText,
  placeholder,
  minHeight = 100,
}: Props) {
  return (
    <View style={styles.card}>
      <TextInput
        style={[styles.input, { minHeight }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
});
