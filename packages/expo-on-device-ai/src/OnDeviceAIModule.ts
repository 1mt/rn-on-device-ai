import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';
import {
  ModelStatus,
  type OnDeviceAIEvents,
  type AvailabilityResult,
  type SessionOptions,
  type GenerateOptions,
  type SummarizeOptions,
  type RewriteStyle,
} from './OnDeviceAI.types';

declare class OnDeviceAIModuleClass extends NativeModule<OnDeviceAIEvents> {
  checkAvailability(): Promise<AvailabilityResult>;
  downloadModel(): Promise<boolean>;
  initSession(options?: SessionOptions): Promise<void>;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  startStreaming(prompt: string, options?: GenerateOptions): Promise<void>;
  stopStreaming(): void;
  summarize(text: string, options?: SummarizeOptions): Promise<string>;
  rewrite(text: string, style: RewriteStyle): Promise<string>;
  clearSession(): void;
}

// Fallback module for when native module isn't available
const FallbackModule = {
  addListener: () => ({ remove: () => {} }),
  removeListeners: () => {},
  checkAvailability: async (): Promise<AvailabilityResult> => ({
    status: ModelStatus.Unavailable,
    reason: Platform.OS === 'ios' ? 'deviceNotEligible' : 'deviceNotSupported',
  }),
  downloadModel: async () => false,
  initSession: async () => {},
  generate: async () => {
    throw new Error('On-device AI is not available on this device');
  },
  startStreaming: async () => {
    throw new Error('On-device AI is not available on this device');
  },
  stopStreaming: () => {},
  summarize: async () => {
    throw new Error('On-device AI is not available on this device');
  },
  rewrite: async () => {
    throw new Error('On-device AI is not available on this device');
  },
  clearSession: () => {},
} as unknown as OnDeviceAIModuleClass;

let OnDeviceAIModule: OnDeviceAIModuleClass;

try {
  OnDeviceAIModule = requireNativeModule<OnDeviceAIModuleClass>('OnDeviceAI');
} catch {
  console.warn(
    'OnDeviceAI native module not found. On-device AI features will be unavailable. ' +
    'This is expected if running in Expo Go or on a device without iOS 26+.'
  );
  OnDeviceAIModule = FallbackModule;
}

export default OnDeviceAIModule;
