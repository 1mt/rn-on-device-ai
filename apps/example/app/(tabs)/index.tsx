import { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import { useOnDeviceAI } from '@repo/expo-on-device-ai';
import { AIStatusBanner } from '../../components/AIStatusBanner';
import { ChatMessage } from '../../components/ChatMessage';
import { ChatInput } from '../../components/ChatInput';
import { SYSTEM_PROMPTS } from '../../constants/prompts';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const {
    status,
    isAvailable,
    messages,
    isGenerating,
    error,
    sendMessage,
    stopStreaming,
  } = useOnDeviceAI({
    systemPrompt: SYSTEM_PROMPTS.assistant,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <AIStatusBanner status={status} error={error} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessage
            role={item.role}
            content={item.content}
            isStreaming={
              item.role === 'assistant' &&
              isGenerating &&
              item.id === messages[messages.length - 1]?.id
            }
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isAvailable
                ? 'Send a message to start chatting'
                : 'On-device AI is not available'}
            </Text>
          </View>
        }
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        onStop={stopStreaming}
        isGenerating={isGenerating}
        disabled={!isAvailable}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
