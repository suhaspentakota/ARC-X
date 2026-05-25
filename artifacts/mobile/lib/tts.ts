import type { VoiceSettings } from "@/context/AppContext";

export interface VoicePreset {
  name: string;
  lang: string;
  keywords: string[];
}

export const PRESET_VOICES: VoicePreset[] = [
  { name: "Nova", lang: "en-US", keywords: ["nova", "samantha", "ava", "zoe"] },
  { name: "Alloy", lang: "en-US", keywords: ["alloy", "victoria", "karen", "google us english"] },
  { name: "Echo", lang: "en-US", keywords: ["echo", "alex", "daniel", "fred"] },
  { name: "Fable", lang: "en-GB", keywords: ["fable", "serena", "kate", "google uk english female"] },
  { name: "Onyx", lang: "en-US", keywords: ["onyx", "james", "thomas", "lee"] },
  { name: "Shimmer", lang: "en-AU", keywords: ["shimmer", "moira", "tessa", "google australian english"] },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function isSpeechSynthesisAvailable() {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export function getVoicePreset(name: string) {
  return PRESET_VOICES.find(v => v.name === name);
}

export function createSpeechUtterance(
  text: string,
  selectedVoice: string,
  settings: VoiceSettings,
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (!isSpeechSynthesisAvailable()) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preset = getVoicePreset(selectedVoice);

  if (preset) {
    const match = voices.find(v =>
      preset.keywords.some(k => v.name.toLowerCase().includes(k)) ||
      v.lang.toLowerCase().startsWith(preset.lang.toLowerCase())
    );
    if (match) utterance.voice = match;
  }

  const styleBoost = clamp(settings.expressiveness, 0, 1);
  utterance.rate = clamp(settings.rate * (1 + styleBoost * 0.08), 0.5, 2);
  utterance.pitch = clamp(settings.pitch * (1 + styleBoost * 0.15), 0, 2);
  utterance.volume = clamp(settings.volume, 0, 1);
  utterance.onstart = handlers?.onStart ?? null;
  utterance.onend = handlers?.onEnd ?? null;
  utterance.onerror = handlers?.onError ?? null;
  return utterance;
}
