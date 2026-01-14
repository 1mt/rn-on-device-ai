import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useOnDeviceAI, RewriteStyle } from '@1mt/expo-on-device-ai';
import { AIStatusBanner } from '../../components/AIStatusBanner';
import { TextInputCard } from '../../components/TextInputCard';
import { ResultCard } from '../../components/ResultCard';

const REWRITE_STYLES: { value: RewriteStyle; label: string; icon: string }[] = [
  { value: 'professional', label: 'Professional', icon: 'B' },
  { value: 'friendly', label: 'Friendly', icon: 'F' },
  { value: 'shorter', label: 'Shorter', icon: 'S' },
  { value: 'longer', label: 'Longer', icon: 'L' },
  { value: 'rephrase', label: 'Rephrase', icon: 'R' },
];

export default function RewriteScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] =
    useState<RewriteStyle>('professional');
  const [isLoading, setIsLoading] = useState(false);

  const { status, isAvailable, rewrite, error } = useOnDeviceAI();

  const handleRewrite = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const rewritten = await rewrite(inputText, selectedStyle);
      setResult(rewritten);
    } catch (e) {
      console.error('Rewrite error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <AIStatusBanner status={status} error={error} />

      <View style={styles.content}>
        <TextInputCard
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter text to rewrite..."
          minHeight={120}
        />

        {/* Style grid */}
        <Text style={styles.sectionTitle}>Rewrite as:</Text>
        <View style={styles.styleGrid}>
          {REWRITE_STYLES.map((style) => (
            <TouchableOpacity
              key={style.value}
              style={[
                styles.styleCard,
                selectedStyle === style.value && styles.styleCardActive,
              ]}
              onPress={() => setSelectedStyle(style.value)}
            >
              <Text style={styles.styleIcon}>{style.icon}</Text>
              <Text
                style={[
                  styles.styleCardText,
                  selectedStyle === style.value && styles.styleCardTextActive,
                ]}
              >
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.rewriteButton,
            (!isAvailable || isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleRewrite}
          disabled={!isAvailable || isLoading || !inputText.trim()}
        >
          <Text style={styles.rewriteButtonText}>
            {isLoading ? 'Rewriting...' : 'Rewrite'}
          </Text>
        </TouchableOpacity>

        {result && (
          <ResultCard
            title={`${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Version`}
            content={result}
            onUseAsInput={() => {
              setInputText(result);
              setResult(null);
            }}
          />
        )}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#3C3C43',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  styleIcon: {
    fontSize: 24,
    marginBottom: 4,
    fontWeight: '700',
    color: '#007AFF',
  },
  styleCardText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  styleCardTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  rewriteButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  rewriteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
