import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

type Props = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

function TypingIndicator() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.typingText}>
      Thinking{dots}
    </Text>
  );
}

export function ChatMessage({ role, content, isStreaming }: Props) {
  const isUser = role === 'user';
  const showTypingIndicator = !isUser && isStreaming && !content;

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
      >
        {showTypingIndicator ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.text, isUser && styles.userText]}>
            {content}
            {isStreaming && content && <Text style={styles.cursor}> ▌</Text>}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },
  cursor: {
    color: '#8E8E93',
  },
  typingText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});
