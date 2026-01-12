import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useOnDeviceAI, ModelStatus } from '@repo/expo-on-device-ai';
import {
  CheckCircle,
  XCircle,
  Download,
  Loader,
  Trash2,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { status, isInitialized, clearChat } = useOnDeviceAI();

  const getStatusIcon = () => {
    switch (status) {
      case ModelStatus.Available:
        return <CheckCircle size={24} color="#34C759" />;
      case ModelStatus.Downloading:
        return <Loader size={24} color="#FF9500" />;
      case ModelStatus.Downloadable:
        return <Download size={24} color="#007AFF" />;
      default:
        return <XCircle size={24} color="#FF3B30" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case ModelStatus.Available:
        return 'On-device AI is ready';
      case ModelStatus.Downloading:
        return 'Model is downloading...';
      case ModelStatus.Downloadable:
        return 'Model available for download';
      default:
        return 'On-device AI unavailable';
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Chat History',
      'This will clear all messages. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChat },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{getStatusText()}</Text>
            <Text style={styles.statusSubtitle}>
              {Platform.OS === 'ios'
                ? 'Apple Foundation Models'
                : 'Gemini Nano'}
            </Text>
          </View>
        </View>
      </View>

      {/* Device Info */}
      <Text style={styles.sectionHeader}>Device Information</Text>
      <View style={styles.card}>
        <InfoRow label="Platform" value={Platform.OS} />
        <InfoRow label="Version" value={String(Platform.Version)} />
        <InfoRow
          label="AI Backend"
          value={Platform.OS === 'ios' ? 'FoundationModels' : 'ML Kit GenAI'}
        />
        <InfoRow
          label="Session"
          value={isInitialized ? 'Active' : 'Not initialized'}
        />
      </View>

      {/* Requirements */}
      <Text style={styles.sectionHeader}>Requirements</Text>
      <View style={styles.card}>
        {Platform.OS === 'ios' ? (
          <>
            <InfoRow label="iOS Version" value="26.0+" />
            <InfoRow label="Device" value="iPhone 15 Pro+ / M1 iPad/Mac" />
            <InfoRow label="Setting" value="Apple Intelligence enabled" />
          </>
        ) : (
          <>
            <InfoRow label="Android" value="8.0+ (API 26)" />
            <InfoRow label="Device" value="Pixel 9+, Galaxy S25+, etc." />
            <InfoRow label="Bootloader" value="Must be locked" />
          </>
        )}
      </View>

      {/* Actions */}
      <Text style={styles.sectionHeader}>Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={handleClearData}>
        <Trash2 size={20} color="#FF3B30" />
        <Text style={styles.actionButtonText}>Clear Chat History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6D72',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 16,
    color: '#000000',
  },
  infoValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});
