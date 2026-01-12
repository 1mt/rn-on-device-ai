import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Send, Square } from 'lucide-react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onStop,
  isGenerating,
  disabled,
}: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={disabled ? 'AI unavailable' : 'Message...'}
        placeholderTextColor="#8E8E93"
        multiline
        maxLength={2000}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (isGenerating || value.trim()) && styles.sendButtonActive,
        ]}
        onPress={isGenerating ? onStop : onSend}
        disabled={disabled || (!isGenerating && !value.trim())}
      >
        {isGenerating ? (
          <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Send size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    fontSize: 16,
    color: '#000000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
});
