import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, Download, Loader } from 'lucide-react-native';
import { ModelStatus, downloadModel } from '@1mt/expo-on-device-ai';

type Props = {
  status: ModelStatus | null;
  error?: string | null;
};

export function AIStatusBanner({ status, error }: Props) {
  if (status === ModelStatus.Available && !error) {
    return null;
  }

  if (error) {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <AlertCircle size={16} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (status === ModelStatus.Downloading) {
    return (
      <View style={[styles.banner, styles.downloadingBanner]}>
        <Loader size={16} color="#FF9500" />
        <Text style={styles.downloadingText}>Downloading AI model...</Text>
      </View>
    );
  }

  if (status === ModelStatus.Downloadable) {
    return (
      <TouchableOpacity
        style={[styles.banner, styles.downloadableBanner]}
        onPress={() => downloadModel()}
      >
        <Download size={16} color="#007AFF" />
        <Text style={styles.downloadableText}>Tap to download AI model</Text>
      </TouchableOpacity>
    );
  }

  if (status === ModelStatus.Unavailable) {
    return (
      <View style={[styles.banner, styles.unavailableBanner]}>
        <AlertCircle size={16} color="#8E8E93" />
        <Text style={styles.unavailableText}>
          On-device AI not available on this device
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBanner: {
    backgroundColor: '#FFEBEB',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  downloadingBanner: {
    backgroundColor: '#FFF5E5',
  },
  downloadingText: {
    color: '#FF9500',
    fontSize: 14,
  },
  downloadableBanner: {
    backgroundColor: '#E5F1FF',
  },
  downloadableText: {
    color: '#007AFF',
    fontSize: 14,
  },
  unavailableBanner: {
    backgroundColor: '#F2F2F7',
  },
  unavailableText: {
    color: '#8E8E93',
    fontSize: 14,
  },
});
