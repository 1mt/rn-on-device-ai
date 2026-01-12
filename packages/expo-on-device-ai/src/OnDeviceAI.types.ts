export enum ModelStatus {
  Available = 'available',
  Downloading = 'downloading',
  Downloadable = 'downloadable',
  Unavailable = 'unavailable',
}

export type UnavailableReason =
  | 'appleIntelligenceNotEnabled'
  | 'deviceNotEligible'
  | 'modelNotReady'
  | 'deviceNotSupported'
  | 'unknown';

export type AvailabilityResult = {
  status: ModelStatus;
  reason?: UnavailableReason | null;
};

export type SessionOptions = {
  systemPrompt?: string;
};

export type GenerateOptions = {
  temperature?: number; // 0.0 - 1.0
  maxTokens?: number; // Max output tokens
};

export type SummarizeOptions = {
  style?: 'concise' | 'bullets' | 'headline';
};

export type RewriteStyle =
  | 'professional'
  | 'friendly'
  | 'shorter'
  | 'longer'
  | 'rephrase';

export type TokenEvent = {
  token: string;
  index: number;
};

export type CompletionEvent = {
  totalTokens: number;
  finishReason: 'complete' | 'cancelled' | 'maxTokens';
};

export type ErrorEvent = {
  message: string;
  code: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type OnDeviceAIEvents = {
  onToken: (event: TokenEvent) => void;
  onComplete: (event: CompletionEvent) => void;
  onError: (event: ErrorEvent) => void;
};
