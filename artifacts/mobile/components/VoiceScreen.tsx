import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
  Dimensions, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ArcOrb } from "./ArcOrb";
import { useApp } from "@/context/AppContext";
import { PRESET_VOICES, createSpeechUtterance, isSpeechSynthesisAvailable } from "@/lib/tts";

const { width } = Dimensions.get("window");

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Tap to activate",
  listening: "Listening...",
  processing: "Processing...",
  speaking: "ARC X responding",
};

const BAR_COUNT = 24;

const TEST_PHRASES = [
  "ARC X systems are fully operational.",
  "Neural core is online and ready.",
  "Intelligence, evolved.",
];

function WaveformBars({ active, colors, voiceState, reducedMotion }: { active: boolean; colors: any; voiceState: VoiceState; reducedMotion: boolean }) {
  const barsRef = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  );

  useEffect(() => {
    const bars = barsRef.current;
    if (!active || reducedMotion) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.15, duration: 300, useNativeDriver: true }).start());
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    bars.forEach((b, i) => {
      const loop = () => {
        const base = voiceState === "speaking" ? 0.3 : 0.15;
        const peak = voiceState === "speaking" ? 0.95 : 0.85;
        const h = base + Math.random() * (peak - base);
        Animated.timing(b, {
          toValue: h,
          duration: 80 + Math.random() * 180,
          useNativeDriver: true,
        }).start(({ finished }) => { if (finished) loop(); });
      };
      const t = setTimeout(loop, i * 25);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [active, voiceState, reducedMotion]);

  const barColor = voiceState === "speaking" ? colors.neonPurple : colors.primary;

  return (
    <View style={styles.waveform}>
      {barsRef.current.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: active ? barColor : colors.muted,
              transform: [{ scaleY: b }],
              opacity: active ? 1 : 0.3,
            }
          ]}
        />
      ))}
    </View>
  );
}

function VoiceChip({ name, selected, onPress, onTest, colors }: {
  name: string; selected: boolean; onPress: () => void;
  onTest: () => void; colors: any;
}) {
  return (
    <View style={styles.voiceChipRow}>
      <TouchableOpacity
        style={[styles.voiceChip, {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : `rgba(0, 212, 255, 0.2)`,
        }]}
        onPress={onPress}
      >
        <MaterialCommunityIcons
          name="waveform"
          size={14}
          color={selected ? colors.primaryForeground : colors.mutedForeground}
        />
        <Text style={[styles.voiceChipText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
          {name}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.testBtn, { borderColor: `rgba(0, 212, 255, 0.25)` }]}
        onPress={onTest}
      >
        <Ionicons name="play" size={12} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

export function VoiceScreen() {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, selectedVoice, setSelectedVoice, voiceSettings } = useApp();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [showVoices, setShowVoices] = useState(false);
  const recognitionRef = useRef<any>(null);
  const liveModePulse = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (voiceState !== "idle" && !reducedMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(liveModePulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(liveModePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      liveModePulse.setValue(1);
    }
  }, [voiceState, reducedMotion]);

  const speak = useCallback((text: string) => {
    if (!isSpeechSynthesisAvailable()) return;
    window.speechSynthesis.cancel();
    const utterance = createSpeechUtterance(text, selectedVoice, voiceSettings, {
      onStart: () => setVoiceState("speaking"),
      onEnd: () => {
        setVoiceState("idle");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onError: () => setVoiceState("idle"),
    });
    if (!utterance) return;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, voiceSettings]);

  const testVoice = useCallback((voiceName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phrase = TEST_PHRASES[Math.floor(Math.random() * TEST_PHRASES.length)];
    if (isSpeechSynthesisAvailable()) {
      window.speechSynthesis.cancel();
      const utterance = createSpeechUtterance(phrase, voiceName, voiceSettings);
      if (!utterance) return;
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceSettings]);

  const sendToArc = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setVoiceState("processing");
    try {
      const convRes = await fetch(`${API_BASE}/api/openai/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Voice Session" }),
      });
      const conv = await convRes.json();

      const msgRes = await fetch(`${API_BASE}/api/openai/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      const reader = msgRes.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.content) full += parsed.content;
              } catch {}
            }
          }
        }
      }
      setResponse(full);
      speak(full);
    } catch {
      setResponse("Unable to connect to ARC X neural core.");
      setVoiceState("idle");
    }
  }, [speak]);

  const startListening = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVoiceState("listening");
    setTranscript("");
    setResponse("");

    if (Platform.OS === "web") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: any) => {
          const t = Array.from(event.results).map((r: any) => r[0].transcript).join("");
          setTranscript(t);
        };
        recognition.onend = () => {
          if (recognitionRef.current) {
            const finalTranscript = transcript;
            setTranscript(prev => {
              sendToArc(prev || "Hello ARC X");
              return prev;
            });
          }
        };
        recognition.onerror = () => setVoiceState("idle");
        recognition.start();
        setTimeout(() => recognition.stop(), 6000);
        return;
      }
    }

    setTimeout(async () => {
      setTranscript("What's my status report today?");
      await sendToArc("What's my status report today?");
    }, 3000);
  }, [sendToArc, transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePress = () => {
    if (voiceState === "idle") {
      startListening();
    } else {
      stopListening();
    }
  };

  const isActive = voiceState !== "idle";
  const orbIntensity = voiceState === "listening" ? "high" : voiceState === "speaking" ? "medium" : "low";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => { stopListening(); setCurrentScreen("home"); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>VOICE</Text>
        <TouchableOpacity onPress={() => setShowVoices(v => !v)} style={styles.voiceToggle}>
          <MaterialCommunityIcons
            name="waveform"
            size={20}
            color={showVoices ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {showVoices ? (
        <ScrollView style={styles.voicesPanel} contentContainerStyle={styles.voicesPanelInner}>
          <Text style={[styles.voicesPanelTitle, { color: colors.mutedForeground }]}>SELECT VOICE</Text>
          {PRESET_VOICES.map(v => (
            <VoiceChip
              key={v.name}
              name={v.name}
              selected={selectedVoice === v.name}
              colors={colors}
              onPress={() => {
                setSelectedVoice(v.name);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onTest={() => testVoice(v.name)}
            />
          ))}
          <View style={[styles.voiceTip, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.15)` }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.voiceTipText, { color: colors.mutedForeground }]}>
              Tap ▶ to preview each voice. Actual voice depends on your device.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.body}>
          <View style={styles.orbWrap}>
            <Animated.View style={{ transform: [{ scale: reducedMotion ? 1 : liveModePulse }] }}>
              <ArcOrb size={130} pulsing={isActive} intensity={orbIntensity} />
            </Animated.View>
          </View>

          {isActive && (
            <View style={[styles.liveBadge, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.4)` }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveBadgeText, { color: colors.primary }]}>LIVE</Text>
            </View>
          )}

          <Text style={[styles.stateLabel, { color: isActive ? colors.primary : colors.mutedForeground }]}>
            {STATE_LABELS[voiceState]}
          </Text>

          <View style={[styles.voicePill, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.15)` }]}>
            <MaterialCommunityIcons name="waveform" size={12} color={colors.primary} />
            <Text style={[styles.voicePillText, { color: colors.mutedForeground }]}>{selectedVoice}</Text>
          </View>

          <WaveformBars active={voiceState === "listening" || voiceState === "speaking"} colors={colors} voiceState={voiceState} reducedMotion={reducedMotion} />

          {transcript !== "" && (
            <View style={[styles.transcriptBox, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}>
              <Text style={[styles.transcriptLabel, { color: colors.mutedForeground }]}>YOU</Text>
              <Text style={[styles.transcriptText, { color: colors.foreground }]}>{transcript}</Text>
            </View>
          )}

          {response !== "" && (
            <View style={[styles.responseBox, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.3)` }]}>
              <Text style={[styles.transcriptLabel, { color: colors.primary }]}>ARC X</Text>
              <Text style={[styles.transcriptText, { color: colors.foreground }]}>{response}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: bottomPad + 20 }]}>
        <TouchableOpacity
          style={[
            styles.micBtn,
            {
              backgroundColor: isActive ? colors.destructive : colors.primary,
              shadowColor: isActive ? colors.destructive : colors.primary,
            }
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={voiceState === "idle" ? "mic" : "stop"}
            size={32}
            color={colors.primaryForeground}
          />
        </TouchableOpacity>
        <Text style={[styles.micHint, { color: colors.mutedForeground }]}>
          {isActive ? "Tap to stop" : "Tap to speak"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 4 },
  voiceToggle: { padding: 4 },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 8 },
  orbWrap: { marginBottom: 20 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  stateLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 10, textAlign: "center" },
  voicePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginBottom: 24,
  },
  voicePillText: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  waveform: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 60, gap: 3, marginBottom: 24, width: width - 48,
  },
  bar: { width: 3, height: 40, borderRadius: 2 },
  transcriptBox: {
    alignSelf: "stretch", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  responseBox: {
    alignSelf: "stretch", borderRadius: 12, borderWidth: 1, padding: 14,
  },
  transcriptLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 6 },
  transcriptText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  footer: { alignItems: "center", paddingTop: 16, gap: 12 },
  micBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 24, elevation: 16,
  },
  micHint: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  voicesPanel: { flex: 1 },
  voicesPanelInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 10 },
  voicesPanelTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 4 },
  voiceChipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceChip: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  voiceChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  testBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  voiceTip: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  voiceTipText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
