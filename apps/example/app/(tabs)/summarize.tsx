import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useOnDeviceAI } from '@1mt/expo-on-device-ai';
import { AIStatusBanner } from '../../components/AIStatusBanner';
import { TextInputCard } from '../../components/TextInputCard';
import { ResultCard } from '../../components/ResultCard';
import { EXAMPLE_TEXTS } from '../../constants/prompts';

type SummarizeStyle = 'concise' | 'bullets' | 'headline';

export default function SummarizeScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<SummarizeStyle>('concise');
  const [isLoading, setIsLoading] = useState(false);

  const { status, isAvailable, summarize, error } = useOnDeviceAI();

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const summary = await summarize(inputText, { style: selectedStyle });
      setResult(summary);
    } catch (e) {
      console.error('Summarization error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setInputText(EXAMPLE_TEXTS.article);
    setResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <AIStatusBanner status={status} error={error} />

      <View style={styles.content}>
        <TextInputCard
          value={inputText}
          onChangeText={setInputText}
          placeholder="Paste or type text to summarize..."
          minHeight={150}
        />

        {/* Style selector */}
        <View style={styles.styleSelector}>
          <Text style={styles.styleLabel}>Summary style:</Text>
          <View style={styles.styleButtons}>
            {(['concise', 'bullets', 'headline'] as const).map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleButton,
                  selectedStyle === style && styles.styleButtonActive,
                ]}
                onPress={() => setSelectedStyle(style)}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    selectedStyle === style && styles.styleButtonTextActive,
                  ]}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.exampleButton} onPress={loadExample}>
            <Text style={styles.exampleButtonText}>Load Example</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summarizeButton,
              (!isAvailable || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSummarize}
            disabled={!isAvailable || isLoading || !inputText.trim()}
          >
            <Text style={styles.summarizeButtonText}>
              {isLoading ? 'Summarizing...' : 'Summarize'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Result */}
        {result && <ResultCard title="Summary" content={result} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  styleSelector: {
    marginTop: 16,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#3C3C43',
  },
  styleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  styleButtonActive: {
    backgroundColor: '#007AFF',
  },
  styleButtonText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  styleButtonTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  exampleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  exampleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  summarizeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  summarizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
