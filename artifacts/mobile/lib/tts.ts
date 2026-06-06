/**
 * Shared TTS module for voice output across ARC X.
 * Provides voice presets, prosody controls (talkness), and Web Speech API integration.
 */

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  expressiveness?: number;
}

export const VOICE_PRESETS = [
  { id: 'nova', name: 'Nova', lang: 'en-US' },
  { id: 'alloy', name: 'Alloy', lang: 'en-US' },
  { id: 'echo', name: 'Echo', lang: 'en-US' },
  { id: 'fable', name: 'Fable', lang: 'en-US' },
  { id: 'onyx', name: 'Onyx', lang: 'en-US' },
  { id: 'shimmer', name: 'Shimmer', lang: 'en-US' },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  expressiveness: 0.5,
};

export function isWebSpeechAvailable(): boolean {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  return synth !== null && synth !== undefined;
}

export function findSpeechVoice(voiceId?: string): SpeechSynthesisVoice | null {
  if (!isWebSpeechAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (voiceId) {
    const preset = VOICE_PRESETS.find(v => v.id === voiceId);
    if (preset) {
      const match = voices.find(v =>
        v.name.toLowerCase().includes(preset.name.toLowerCase())
      );
      if (match) return match;
    }
  }

  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

export function createSpeechUtterance(
  text: string,
  voiceId: string | undefined,
  voiceSettings: VoiceSettings,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  }
): SpeechSynthesisUtterance | null {
  if (!isWebSpeechAvailable()) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findSpeechVoice(voiceId);

  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = Math.max(0.1, Math.min(2.0, voiceSettings.rate || 1.0));
  utterance.pitch = Math.max(0, Math.min(2.0, voiceSettings.pitch || 1.0));
  utterance.volume = Math.max(0, Math.min(1.0, voiceSettings.volume || 1.0));

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
  if (callbacks?.onError) utterance.onerror = callbacks.onError;

  return utterance;
}

export function stopSpeech(): void {
  if (isWebSpeechAvailable()) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (!isWebSpeechAvailable()) return false;
  return window.speechSynthesis.speaking;
}
