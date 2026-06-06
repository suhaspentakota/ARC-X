# ARC X Documentation

## Voice & TTS Configuration

ARC X uses the **Web Speech API** for text-to-speech (TTS) with configurable prosody controls ("talkness").

### Supported Voices

ARC X includes 6 voice presets:
- **Nova** – Balanced, friendly tone
- **Alloy** – Clear, professional
- **Echo** – Resonant, warm
- **Fable** – Narrative, expressive
- **Onyx** – Deep, authoritative
- **Shimmer** – Bright, energetic

### Talkness Controls

Users can adjust the following voice characteristics:
- **Speaking Rate** (0.1x – 2.0x): Controls how fast the assistant speaks
- **Pitch** (0 – 2.0): Adjusts the frequency of the voice
- **Volume** (0 – 100%): Controls output loudness
- **Expressiveness** (0 – 1.0): Optional parameter for future TTS provider integration

### Web Speech API Fallback

ARC X defaults to the browser's Web Speech API, which:
- **Requires no API keys** or external credentials
- Works offline
- Supports voice selection and prosody control
- May vary in available voices across browsers

If Web Speech is unavailable in your browser, voice output is gracefully disabled with a user notice.

### How to Use

1. **Select a Voice**: Open Settings → Voice Settings and choose a voice preset
2. **Adjust Talkness**: Use the increment/decrement buttons for rate, pitch, volume
3. **Preview**: Click "Preview Voice" to hear your current settings
4. **Auto-Speak**: Enable "Auto-speak assistant responses" to hear replies automatically

### Persisted Preferences

Your voice and talkness settings are saved locally and restored on app launch.

### Future Integrations

To integrate a premium TTS provider (OpenAI, Google Cloud, etc.), update `artifacts/mobile/lib/tts.ts` and extend the `VoiceSettings` interface with provider-specific parameters.

## Response Animations

ARC X includes smooth animations when the assistant responds:
- **Streaming Cursor**: Animated blinking cursor during token flow
- **Reveal Animation**: Text reveal effect for non-streamed responses
- **Speaking Indicator**: Animated pulse bars when audio is playing
- **Reduced Motion Support**: All animations respect the user's accessibility preference (prefers-reduced-motion)

## Accessibility

- All voice controls include ARIA labels and accessibility hints
- Reduced-motion is respected for users with motion sensitivity
- Keyboard navigation is fully supported
- Speech synthesis availability is detected and communicated to users
