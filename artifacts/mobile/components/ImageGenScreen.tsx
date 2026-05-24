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

const PROMPT_IDEAS = [
  "A futuristic cyberpunk cityscape at night with neon reflections",
  "An astronaut floating in deep space near a glowing nebula",
  "A holographic ARC reactor in a dark laboratory",
  "A sleek black sports car speeding through rain-soaked streets",
  "A quantum computer core with glowing blue circuits",
];

type GenState = "idle" | "generating" | "done" | "error";

function GeneratingAnimation({ colors }: { colors: any }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(ring1, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true })).start();
    setTimeout(() => Animated.loop(Animated.timing(ring2, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true })).start(), 400);
    setTimeout(() => Animated.loop(Animated.timing(ring3, { toValue: -1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start(), 200);
    Animated.loop(Animated.sequence([
      Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const spin1 = ring1.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const spin2 = ring2.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const spin3 = ring3.interpolate({ inputRange: [-1, 0], outputRange: ["-360deg", "0deg"] });

  return (
    <View style={styles.genAnimContainer}>
      <View style={styles.genOrbWrap}>
        <Animated.View style={[styles.genRing, styles.genRing1, { borderColor: colors.primary, transform: [{ rotate: spin1 }] }]} />
        <Animated.View style={[styles.genRing, styles.genRing2, { borderColor: colors.neonBlue, transform: [{ rotate: spin2 }] }]} />
        <Animated.View style={[styles.genRing, styles.genRing3, { borderColor: colors.neonPurple, transform: [{ rotate: spin3 }] }]} />
        <View style={[styles.genCore, { backgroundColor: colors.primary }]} />
      </View>
      <Animated.Text style={[styles.genLabel, { color: colors.primary, opacity: textOpacity }]}>
        SYNTHESIZING IMAGE...
      </Animated.Text>
      <Text style={[styles.genSub, { color: colors.mutedForeground }]}>Neural rendering in progress</Text>
    </View>
  );
}

export function ImageGenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen } = useApp();
  const [prompt, setPrompt] = useState("");
  const [genState, setGenState] = useState<GenState>("idle");
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [imageOpacity] = useState(new Animated.Value(0));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const generate = async () => {
    if (!prompt.trim() || genState === "generating") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenState("generating");
    setImageB64(null);
    imageOpacity.setValue(0);

    try {
      const res = await fetch(`${API_BASE}/api/openai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (data.b64_json) {
        setImageB64(data.b64_json);
        setGenState("done");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(imageOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
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
          <MaterialCommunityIcons name="image-plus" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>  IMAGE GEN</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>DESCRIBE YOUR IMAGE</Text>
          <TextInput
            style={[styles.promptInput, { color: colors.foreground }]}
            placeholder="A cinematic scene of..."
            placeholderTextColor={colors.mutedForeground}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={500}
            editable={genState !== "generating"}
          />
          <TouchableOpacity
            style={[
              styles.generateBtn,
              {
                backgroundColor: genState === "generating" ? colors.muted : colors.primary,
                shadowColor: colors.primary,
              }
            ]}
            onPress={generate}
            disabled={!prompt.trim() || genState === "generating"}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={genState === "generating" ? "loading" : "creation"}
              size={18}
              color={colors.primaryForeground}
            />
            <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
              {genState === "generating" ? "Generating..." : "Generate Image"}
            </Text>
          </TouchableOpacity>
        </View>

        {genState === "idle" && (
          <View>
            <Text style={[styles.ideasLabel, { color: colors.mutedForeground }]}>PROMPT IDEAS</Text>
            {PROMPT_IDEAS.map((idea, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.ideaChip, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.15)` }]}
                onPress={() => {
                  setPrompt(idea);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="sparkles" size={13} color={colors.primary} />
                <Text style={[styles.ideaText, { color: colors.foreground }]}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {genState === "generating" && <GeneratingAnimation colors={colors} />}

        {genState === "done" && imageB64 && (
          <Animated.View style={[styles.resultCard, { opacity: imageOpacity }]}>
            <View style={[styles.imageBorder, { borderColor: `rgba(0, 212, 255, 0.3)`, backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: `data:image/png;base64,${imageB64}` }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              <View style={[styles.imageGlowBar, { backgroundColor: colors.primary }]} />
            </View>
            <View style={[styles.resultActions, { borderTopColor: `rgba(0, 212, 255, 0.1)` }]}>
              <TouchableOpacity
                style={[styles.resultAction, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}
                onPress={() => {
                  setGenState("idle");
                  setImageB64(null);
                  setPrompt("");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.resultActionText, { color: colors.foreground }]}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultAction, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.3)` }]}
                onPress={() => {
                  setGenState("idle");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={[styles.resultActionText, { color: colors.foreground }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {genState === "error" && (
          <View style={[styles.errorCard, { backgroundColor: `rgba(255, 51, 102, 0.1)`, borderColor: `rgba(255, 51, 102, 0.3)` }]}>
            <Ionicons name="alert-circle" size={24} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Generation failed. Check your connection and try again.
            </Text>
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
    fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, minHeight: 80,
    textAlignVertical: "top",
  },
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
  genAnimContainer: { alignItems: "center", paddingVertical: 40, gap: 16 },
  genOrbWrap: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  genRing: { position: "absolute", borderWidth: 1.5 },
  genRing1: { width: 110, height: 110, borderRadius: 55, borderStyle: "dashed" },
  genRing2: { width: 80, height: 80, borderRadius: 40 },
  genRing3: { width: 54, height: 54, borderRadius: 27, borderStyle: "dashed" },
  genCore: { width: 24, height: 24, borderRadius: 12 },
  genLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  genSub: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  resultCard: { gap: 0 },
  imageBorder: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden", position: "relative",
  },
  resultImage: { width: "100%", height: width - 40 },
  imageGlowBar: { height: 2, opacity: 0.6 },
  resultActions: {
    flexDirection: "row", gap: 10, paddingTop: 12,
  },
  resultAction: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  resultActionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorCard: {
    borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  errorRetry: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
