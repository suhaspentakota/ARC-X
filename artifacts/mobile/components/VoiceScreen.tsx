import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ArcOrb } from "./ArcOrb";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Say 'Hey ARC' to begin",
  listening: "Listening...",
  processing: "Processing...",
  speaking: "ARC X responding",
};

const STATE_SUBTITLES: Record<VoiceState, string> = {
  idle: "Voice assistant ready",
  listening: "Speak now",
  processing: "Neural analysis in progress",
  speaking: "Intelligence, Evolved.",
};

const BAR_COUNT = 20;

function WaveformBars({ active, colors }: { active: boolean; colors: any }) {
  const barsRef = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))
  );

  useEffect(() => {
    const bars = barsRef.current;
    if (!active) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.2, duration: 300, useNativeDriver: true }).start());
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    bars.forEach((b, i) => {
      const loop = () => {
        const h = 0.2 + Math.random() * 0.8;
        Animated.timing(b, {
          toValue: h,
          duration: 100 + Math.random() * 200,
          useNativeDriver: true,
        }).start(({ finished }) => { if (finished) loop(); });
      };
      const t = setTimeout(loop, i * 30);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [active]);

  return (
    <View style={styles.waveform}>
      {barsRef.current.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: active ? colors.primary : colors.muted,
              transform: [{ scaleY: b }],
              opacity: active ? 1 : 0.4,
            }
          ]}
        />
      ))}
    </View>
  );
}

export function VoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, setMessages, conversationId, setConversationId } = useApp();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const simulateVoiceFlow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVoiceState("listening");
    setTranscript("");
    setResponse("");

    await new Promise(r => setTimeout(r, 2500));
    setTranscript("What's my schedule for today?");
    setVoiceState("processing");

    await new Promise(r => setTimeout(r, 1500));
    setVoiceState("speaking");
    setResponse("You have 3 pending tasks. Your focus mode begins at 9 AM. I've detected clear skies with 72°F — ideal conditions. Ready to assist with anything else.");

    await new Promise(r => setTimeout(r, 4000));
    setVoiceState("idle");
  };

  const handlePress = () => {
    if (voiceState === "idle") {
      simulateVoiceFlow();
    } else {
      setVoiceState("idle");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const isActive = voiceState !== "idle";
  const orbIntensity = voiceState === "listening" ? "high" : voiceState === "processing" ? "high" : voiceState === "speaking" ? "medium" : "low";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>VOICE</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.orbWrap}>
          <ArcOrb size={130} pulsing={isActive} intensity={orbIntensity} />
        </View>

        <Text style={[styles.stateLabel, { color: isActive ? colors.primary : colors.mutedForeground }]}>
          {STATE_LABELS[voiceState]}
        </Text>
        <Text style={[styles.stateSubtitle, { color: colors.mutedForeground }]}>
          {STATE_SUBTITLES[voiceState]}
        </Text>

        <WaveformBars active={voiceState === "listening" || voiceState === "speaking"} colors={colors} />

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 4 },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 16 },
  orbWrap: { marginBottom: 32 },
  stateLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 8, textAlign: "center" },
  stateSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 32 },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: 3,
    marginBottom: 28,
  },
  bar: {
    width: 3,
    height: 40,
    borderRadius: 2,
  },
  transcriptBox: {
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  responseBox: {
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  transcriptLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 6 },
  transcriptText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    gap: 12,
  },
  micBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
  micHint: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
});
