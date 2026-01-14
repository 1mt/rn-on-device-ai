# Expo On-Device AI

Run AI models locally on iOS and Android devices with a simple React Native API. This Expo native module wraps **Apple Foundation Models** (iOS 26+) and **Gemini Nano** (Android) so you can use on-device AI without sending data to external servers.

## What it does

- **Text Generation** - Chat-style API with streaming responses
- **Summarization** - Condense text into concise summaries, bullet points, or headlines
- **Rewriting** - Change tone (professional, friendly) or adjust length
- **Works offline** - Everything runs on the device

## Requirements

### iOS
- iOS 26.0+ with Apple Intelligence enabled
- iPhone 15 Pro or newer / iPad or Mac with M1+

### Android
- Android 8.0+ (API 26)
- Pixel 9+, Galaxy S25+, Xiaomi 15+, OnePlus 13+
- Needs Google Play Services and a locked bootloader

## Installation

```bash
npm install @1mt/expo-on-device-ai
```

## Development

```bash
# Clone and install
bun install
# or: npm install

# Build the module
bun run build:module
# or: npm run build:module
```

### Running the Example

```bash
# Start dev server
bun run dev:example
# or: npm run dev:example

# iOS (needs a physical device with iOS 26+)
cd apps/example
npx expo prebuild --platform ios
npx expo run:ios --device

# Android (needs a supported device)
cd apps/example
npx expo prebuild --platform android
npx expo run:android --device
```

## Usage

### Basic Chat

```typescript
import { useOnDeviceAI } from '@1mt/expo-on-device-ai';

function ChatScreen() {
  const {
    status,
    isAvailable,
    messages,
    isGenerating,
    sendMessage,
    stopStreaming,
  } = useOnDeviceAI({
    systemPrompt: 'You are a helpful assistant.',
  });

  // Send a message (streams the response)
  await sendMessage('Hello, how are you?');

  // Stop if needed
  stopStreaming();
}
```

### Summarize Text

```typescript
const { summarize } = useOnDeviceAI();

const summary = await summarize(longText, { style: 'bullets' });
```

### Rewrite Text

```typescript
const { rewrite } = useOnDeviceAI();

const rewritten = await rewrite(text, 'professional');
```

### Low-Level API

If you need more control:

```typescript
import {
  checkAvailability,
  initSession,
  generate,
  startStreaming,
  addTokenListener,
} from '@1mt/expo-on-device-ai';

const { status } = await checkAvailability();

await initSession({ systemPrompt: 'You are helpful.' });

// One-shot generation
const response = await generate('What is 2+2?');

// Streaming
addTokenListener((event) => {
  console.log('Token:', event.token);
});
await startStreaming('Tell me a story');
```

## Hook Reference

`useOnDeviceAI(options?)` returns:

| Property | Description |
|----------|-------------|
| `status` | Model status (`available`, `downloading`, `downloadable`, `unavailable`) |
| `isAvailable` | Whether AI is ready to use |
| `isInitialized` | Whether session is set up |
| `messages` | Chat history |
| `isGenerating` | Currently generating a response |
| `error` | Error message if something went wrong |
| `initialize()` | Manually init the session |
| `generate(prompt, options?)` | Get a complete response (no streaming) |
| `sendMessage(content)` | Send a chat message (streams back) |
| `stopStreaming()` | Cancel current generation |
| `summarize(text, options?)` | Summarize text |
| `rewrite(text, style)` | Rewrite with a different tone |
| `clearChat()` | Clear message history |

## Project Structure

```
expo-on-device-ai/
├── apps/
│   └── example/              # Demo app
├── packages/
│   └── expo-on-device-ai/    # The native module
├── package.json
└── turbo.json
```

## Video Example on iPhone


https://github.com/user-attachments/assets/2f6a8697-4d9c-4372-90c5-7620809c0bd1


## How it works

**iOS** uses the `FoundationModels` framework from iOS 26 - a ~3B parameter LLM with a 4K token context window.

**Android** uses ML Kit's GenAI APIs with Gemini Nano, which has dedicated summarization and rewriting endpoints.

## License

MIT
