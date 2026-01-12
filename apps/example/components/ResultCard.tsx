import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Copy, ArrowUp } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

type Props = {
  title: string;
  content: string;
  onUseAsInput?: () => void;
};

export function ResultCard({ title, content, onUseAsInput }: Props) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(content);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
            <Copy size={18} color="#007AFF" />
          </TouchableOpacity>
          {onUseAsInput && (
            <TouchableOpacity onPress={onUseAsInput} style={styles.actionButton}>
              <ArrowUp size={18} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
});
