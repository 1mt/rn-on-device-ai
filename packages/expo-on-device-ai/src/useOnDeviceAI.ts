import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as OnDeviceAI from './api';
import type {
  ModelStatus,
  GenerateOptions,
  SummarizeOptions,
  RewriteStyle,
  ChatMessage,
} from './OnDeviceAI.types';

type UseOnDeviceAIOptions = {
  systemPrompt?: string;
  autoInitialize?: boolean;
};

export function useOnDeviceAI(options: UseOnDeviceAIOptions = {}) {
  const { systemPrompt, autoInitialize = true } = options;

  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const initPromise = useRef<Promise<void> | null>(null);

  // Check availability on mount
  useEffect(() => {
    OnDeviceAI.checkAvailability().then((result) => {
      setStatus(result.status as ModelStatus);
    });
  }, []);

  // Re-initialize when app returns to foreground (iOS unloads model)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active' && isInitialized) {
          OnDeviceAI.initSession({ systemPrompt });
        }
      }
    );
    return () => subscription.remove();
  }, [isInitialized, systemPrompt]);

  // Set up event listeners
  useEffect(() => {
    const tokenSub = OnDeviceAI.addTokenListener((event) => {
      setTokens((prev: string[]) => [...prev, event.token]);
    });

    const completionSub = OnDeviceAI.addCompletionListener(() => {
      setIsGenerating(false);
    });

    const errorSub = OnDeviceAI.addErrorListener((event) => {
      setError(event.message);
      setIsGenerating(false);
    });

    return () => {
      tokenSub.remove();
      completionSub.remove();
      errorSub.remove();
    };
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && status === 'available' && !isInitialized) {
      initialize();
    }
  }, [status, autoInitialize, isInitialized]);

  const initialize = useCallback(async () => {
    if (initPromise.current) return initPromise.current;

    initPromise.current = (async () => {
      if (status === 'downloadable') {
        await OnDeviceAI.downloadModel();
      }
      await OnDeviceAI.initSession({ systemPrompt });
      setIsInitialized(true);
    })();

    return initPromise.current;
  }, [status, systemPrompt]);

  const generate = useCallback(
    async (prompt: string, opts?: GenerateOptions): Promise<string> => {
      if (!isInitialized) await initialize();
      return OnDeviceAI.generate(prompt, opts);
    },
    [isInitialized, initialize]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!isInitialized) await initialize();

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

      // Start streaming
      setTokens([]);
      setError(null);
      setIsGenerating(true);

      // Add placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);

      await OnDeviceAI.startStreaming(content);
    },
    [isInitialized, initialize]
  );

  // Update assistant message as tokens arrive
  useEffect(() => {
    if (tokens.length > 0) {
      setMessages((prev: ChatMessage[]) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: tokens.join(''),
          };
        }
        return updated;
      });
    }
  }, [tokens]);

  const stopStreaming = useCallback(() => {
    OnDeviceAI.stopStreaming();
    setIsGenerating(false);
  }, []);

  const summarize = useCallback(
    async (text: string, opts?: SummarizeOptions): Promise<string> => {
      if (!isInitialized) await initialize();
      return OnDeviceAI.summarize(text, opts);
    },
    [isInitialized, initialize]
  );

  const rewrite = useCallback(
    async (text: string, style: RewriteStyle = 'rephrase'): Promise<string> => {
      if (!isInitialized) await initialize();
      return OnDeviceAI.rewrite(text, style);
    },
    [isInitialized, initialize]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setTokens([]);
    OnDeviceAI.clearSession();
    OnDeviceAI.initSession({ systemPrompt });
  }, [systemPrompt]);

  return {
    // Status
    status,
    isAvailable: status === 'available',
    isInitialized,

    // Chat state
    messages,
    currentStreamingText: tokens.join(''),
    isGenerating,
    error,

    // Methods
    initialize,
    generate,
    sendMessage,
    stopStreaming,
    summarize,
    rewrite,
    clearChat,
  };
}
