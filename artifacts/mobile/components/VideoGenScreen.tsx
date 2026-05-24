import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Animated, Easing, Platform, Dimensions, Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

type GenState = "idle" | "generating" | "done" | "error";

const STYLES = ["Cinematic", "Anime", "Documentary", "Sci-Fi", "Abstract"];

const PROMPT_IDEAS = [
  "A spacecraft launching into orbit through storm clouds",
  "Deep sea creatures swimming past ancient ruins",
  "A time-lapse of a futuristic city being built",
  "Neon samurai walking through rain-soaked Tokyo",
];

function StoryboardFrame({ index, b64, colors, active, onPress }: {
  index: number; b64: string; colors: any; active: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.96)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: active ? 1 : 0.96, friction: 8, tension: 100, useNativeDriver: true }).start();
  }, [active]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[
        styles.frameCard,
        { borderColor: active ? colors.primary : `rgba(0, 212, 255, 0.15)`, transform: [{ scale }] }
      ]}>
        <Image
          source={{ uri: `data:image/png;base64,${b64}` }}
          style={styles.frameImg}
          resizeMode="cover"
        />
        <View style={[styles.frameLabelRow, { backgroundColor: "rgba(2, 8, 16, 0.85)" }]}>
          <View style={[styles.frameDot, { backgroundColor: active ? colors.primary : colors.mutedForeground }]} />
          <Text style={[styles.frameLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
            SCENE {index + 1}
          </Text>
        </View>
        {active && <View style={[styles.frameGlow, { borderColor: colors.primary }]} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

function GeneratingAnimation({ colors, step, total }: { colors: any; step: number; total: number }) {
  const scanLine = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLine, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  const translateY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-160, 160] });

  return (
    <View style={styles.genContainer}>
      <View style={[styles.genScreen, { borderColor: `rgba(0, 212, 255, 0.3)`, backgroundColor: colors.surface }]}>
        <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary, transform: [{ translateY }] }]} />
        <View style={styles.genGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[styles.genGridCell, { borderColor: `rgba(0, 212, 255, 0.06)`, opacity: pulse }]}
            />
          ))}
        </View>
        <View style={styles.genCenterContent}>
          <MaterialCommunityIcons name="film" size={32} color={colors.primary} />
          <Text style={[styles.genStepText, { color: colors.foreground }]}>
            Scene {step} / {total}
          </Text>
        </View>
      </View>
      <Animated.Text style={[styles.genLabel, { color: colors.primary, opacity: pulse }]}>
        RENDERING STORYBOARD...
      </Animated.Text>
      <View style={[styles.progressBar, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}>
        <View style={[styles.progressFill, {
          backgroundColor: colors.primary,
          width: `${(step / total) * 100}%` as any,
        }]} />
      </View>
    </View>
  );
}

export function VideoGenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen } = useApp();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [genState, setGenState] = useState<GenState>("idle");
  const [frames, setFrames] = useState<string[]>([]);
  const [activeFrame, setActiveFrame] = useState(0);
  const [genStep, setGenStep] = useState(0);
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const TOTAL_FRAMES = 3;

  const generate = async () => {
    if (!prompt.trim() || genState === "generating") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenState("generating");
    setFrames([]);
    setGenStep(0);
    resultOpacity.setValue(0);

    const styleTag = `${selectedStyle} style, cinematic 8K, dramatic lighting, high detail`;
    const shots = [
      `${prompt}, establishing wide shot, ${styleTag}`,
      `${prompt}, close-up action shot, ${styleTag}`,
      `${prompt}, epic final frame, golden hour, ${styleTag}`,
    ];

    try {
      const result: string[] = [];
      for (let i = 0; i < shots.length; i++) {
        setGenStep(i + 1);
        const res = await fetch(`${API_BASE}/api/openai/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: shots[i] }),
        });
        const data = await res.json();
        if (data.b64_json) {
          result.push(data.b64_json);
          setFrames(prev => [...prev, data.b64_json]);
        }
      }
      if (result.length > 0) {
        setActiveFrame(0);
        setGenState("done");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(resultOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      } else {
        setGenState("error");
      }
    } catch {
      setGenState("error");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="film" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>  VIDEO GEN</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {genState !== "done" && (
          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>DESCRIBE YOUR VIDEO</Text>
            <TextInput
              style={[styles.promptInput, { color: colors.foreground }]}
              placeholder="A cinematic sequence of..."
              placeholderTextColor={colors.mutedForeground}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              maxLength={400}
              editable={genState !== "generating"}
            />
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginTop: 4 }]}>VISUAL STYLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
              {STYLES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.styleChip,
                    {
                      backgroundColor: selectedStyle === s ? colors.primary : colors.background,
                      borderColor: selectedStyle === s ? colors.primary : `rgba(0, 212, 255, 0.25)`,
                    }
                  ]}
                  onPress={() => {
                    setSelectedStyle(s);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.styleChipText, { color: selectedStyle === s ? colors.primaryForeground : colors.mutedForeground }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.generateBtn,
                { backgroundColor: !prompt.trim() || genState === "generating" ? colors.muted : colors.primary, shadowColor: colors.primary }
              ]}
              onPress={generate}
              disabled={!prompt.trim() || genState === "generating"}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="play-circle" size={20} color={colors.primaryForeground} />
              <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
                {genState === "generating" ? "Generating..." : "Generate Storyboard"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {genState === "idle" && (
          <View>
            <Text style={[styles.ideasLabel, { color: colors.mutedForeground }]}>PROMPT IDEAS</Text>
            {PROMPT_IDEAS.map((idea, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.ideaChip, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.15)` }]}
                onPress={() => { setPrompt(idea); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <MaterialCommunityIcons name="movie-play" size={13} color={colors.primary} />
                <Text style={[styles.ideaText, { color: colors.foreground }]}>{idea}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.15)` }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Generates a 3-scene cinematic storyboard. Each scene is individually rendered for maximum quality.
              </Text>
            </View>
          </View>
        )}

        {genState === "generating" && (
          <GeneratingAnimation colors={colors} step={genStep} total={TOTAL_FRAMES} />
        )}

        {genState === "done" && frames.length > 0 && (
          <Animated.View style={{ opacity: resultOpacity, gap: 16 }}>
            <View style={styles.mainFrameWrap}>
              <Image
                source={{ uri: `data:image/png;base64,${frames[activeFrame]}` }}
                style={[styles.mainFrame, { width: width - 40 }]}
                resizeMode="cover"
              />
              <View style={[styles.mainFrameOverlay, { backgroundColor: "rgba(2, 8, 16, 0.7)" }]}>
                <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="play" size={24} color={colors.primaryForeground} />
                </View>
              </View>
              <View style={[styles.frameBadge, { backgroundColor: "rgba(0, 212, 255, 0.15)", borderColor: `rgba(0, 212, 255, 0.3)` }]}>
                <Text style={[styles.frameBadgeText, { color: colors.primary }]}>SCENE {activeFrame + 1}</Text>
              </View>
            </View>

            <View style={styles.filmStrip}>
              {frames.map((f, i) => (
                <StoryboardFrame
                  key={i} index={i} b64={f} colors={colors}
                  active={activeFrame === i}
                  onPress={() => { setActiveFrame(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                />
              ))}
            </View>

            <View style={styles.resultBtns}>
              <TouchableOpacity
                style={[styles.resultBtn, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}
                onPress={() => { setGenState("idle"); setFrames([]); setPrompt(""); }}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.resultBtnText, { color: colors.foreground }]}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultBtn, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.3)` }]}
                onPress={() => { setGenState("idle"); setTimeout(generate, 50); }}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={[styles.resultBtnText, { color: colors.foreground }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {genState === "error" && (
          <View style={[styles.errorCard, { backgroundColor: `rgba(255, 51, 102, 0.1)`, borderColor: `rgba(255, 51, 102, 0.3)` }]}>
            <Ionicons name="alert-circle" size={24} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>Generation failed. Please try again.</Text>
            <TouchableOpacity onPress={() => setGenState("idle")}>
              <Text style={[styles.errorRetry, { color: colors.primary }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 3 },
  scroll: { padding: 20, gap: 16 },
  inputCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  inputLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  promptInput: {
    fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, minHeight: 72,
    textAlignVertical: "top",
  },
  styleScroll: { marginHorizontal: -4 },
  styleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginHorizontal: 4,
  },
  styleChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  generateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  generateBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  ideasLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 10 },
  ideaChip: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  ideaText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  genContainer: { alignItems: "center", paddingVertical: 24, gap: 16 },
  genScreen: {
    width: width - 80, height: 220, borderRadius: 16, borderWidth: 1,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.6 },
  genGrid: {
    position: "absolute", flexDirection: "row", flexWrap: "wrap", left: 0, right: 0, top: 0, bottom: 0,
  },
  genGridCell: { width: "33.3%", height: "25%", borderWidth: 0.5 },
  genCenterContent: { alignItems: "center", gap: 8 },
  genStepText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  genLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  progressBar: { width: width - 80, height: 3, borderRadius: 2, borderWidth: 1, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  mainFrameWrap: {
    borderRadius: 16, overflow: "hidden", position: "relative",
    borderWidth: 1, borderColor: "rgba(0, 212, 255, 0.3)",
  },
  mainFrame: { height: (width - 40) * 0.56 },
  mainFrameOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    alignItems: "center", justifyContent: "center", height: 80,
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00d4ff", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 16, elevation: 12,
  },
  frameBadge: {
    position: "absolute", top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  frameBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  filmStrip: { flexDirection: "row", gap: 8 },
  frameCard: {
    flex: 1, borderRadius: 10, borderWidth: 1.5, overflow: "hidden", position: "relative",
  },
  frameImg: { width: "100%", height: 70 },
  frameLabelRow: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3,
  },
  frameDot: { width: 4, height: 4, borderRadius: 2 },
  frameLabel: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  frameGlow: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10, borderWidth: 1.5,
  },
  resultBtns: { flexDirection: "row", gap: 10 },
  resultBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  resultBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorCard: {
    borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  errorRetry: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
