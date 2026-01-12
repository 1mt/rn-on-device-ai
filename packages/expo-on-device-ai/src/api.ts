import { Platform } from 'react-native';
import type { EventSubscription } from 'expo-modules-core';
import OnDeviceAIModule from './OnDeviceAIModule';
import type {
  AvailabilityResult,
  SessionOptions,
  GenerateOptions,
  SummarizeOptions,
  RewriteStyle,
  TokenEvent,
  CompletionEvent,
  ErrorEvent,
} from './OnDeviceAI.types';

/**
 * Check if on-device AI is available
 */
export async function checkAvailability(): Promise<AvailabilityResult> {
  return OnDeviceAIModule.checkAvailability();
}

/**
 * Download the AI model (Android only)
 */
export async function downloadModel(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  return OnDeviceAIModule.downloadModel();
}

/**
 * Initialize a session with optional system prompt
 */
export async function initSession(options?: SessionOptions): Promise<void> {
  return OnDeviceAIModule.initSession(options);
}

/**
 * Generate text (non-streaming)
 */
export async function generate(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  return OnDeviceAIModule.generate(prompt, options);
}

/**
 * Start streaming generation
 */
export async function startStreaming(
  prompt: string,
  options?: GenerateOptions
): Promise<void> {
  return OnDeviceAIModule.startStreaming(prompt, options);
}

/**
 * Stop streaming generation
 */
export function stopStreaming(): void {
  return OnDeviceAIModule.stopStreaming();
}

/**
 * Summarize text
 */
export async function summarize(
  text: string,
  options?: SummarizeOptions
): Promise<string> {
  return OnDeviceAIModule.summarize(text, options);
}

/**
 * Rewrite text in a given style
 */
export async function rewrite(
  text: string,
  style: RewriteStyle = 'rephrase'
): Promise<string> {
  return OnDeviceAIModule.rewrite(text, style);
}

/**
 * Clear current session
 */
export function clearSession(): void {
  return OnDeviceAIModule.clearSession();
}

// Event listeners
export function addTokenListener(
  listener: (event: TokenEvent) => void
): EventSubscription {
  return OnDeviceAIModule.addListener('onToken', listener);
}

export function addCompletionListener(
  listener: (event: CompletionEvent) => void
): EventSubscription {
  return OnDeviceAIModule.addListener('onComplete', listener);
}

export function addErrorListener(
  listener: (event: ErrorEvent) => void
): EventSubscription {
  return OnDeviceAIModule.addListener('onError', listener);
}
