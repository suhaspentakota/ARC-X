import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useColors } from "@/hooks/useColors";
import { ArcOrb } from "./ArcOrb";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const BOOT_LINES = [
  "Initializing neural core...",
  "Loading cognitive matrices...",
  "Syncing intelligence modules...",
  "Calibrating response systems...",
  "ARC X online.",
];

export function SplashScreenView() {
  const colors = useColors();
  const { setCurrentScreen } = useApp();
  const [lineIndex, setLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  const fadeIn = useRef(new Animated.Value(1)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.85)).current;
  const linesFade = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(linesFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1400);

    Animated.timing(progressWidth, {
      toValue: width * 0.7,
      duration: 4200,
      delay: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(taglineFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 5200);

    setTimeout(() => setCurrentScreen("home"), 6200);
  }, []);

  useEffect(() => {
    if (lineIndex >= BOOT_LINES.length) return;
    const line = BOOT_LINES[lineIndex];
    if (charIndex < line.length) {
      const t = setTimeout(() => {
        setCurrentText(line.slice(0, charIndex + 1));
        setCharIndex(c => c + 1);
      }, 30);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLineIndex(i => i + 1);
        setCharIndex(0);
        setCurrentText("");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [lineIndex, charIndex]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeIn }]}>
      <View style={styles.gridOverlay}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { borderColor: `rgba(0, 212, 255, 0.04)`, top: `${i * 14}%` as any }]} />
        ))}
      </View>

      <Animated.View style={[styles.titleContainer, { opacity: titleFade, transform: [{ scale: titleScale }] }]}>
        <Text style={[styles.arcText, { color: colors.primary }]}>ARC</Text>
        <Text style={[styles.xText, { color: "#ffffff" }]}>X</Text>
      </Animated.View>

      <View style={styles.orbContainer}>
        <ArcOrb size={110} pulsing intensity="medium" />
      </View>

      <Animated.View style={[styles.bootLines, { opacity: linesFade }]}>
        {BOOT_LINES.slice(0, lineIndex).map((line, i) => (
          <Text key={i} style={[styles.completedLine, { color: colors.mutedForeground }]}>
            {">"} {line}
          </Text>
        ))}
        {lineIndex < BOOT_LINES.length && (
          <Text style={[styles.activeLine, { color: colors.primary }]}>
            {">"} {currentText}
            <Text style={{ opacity: Math.floor(Date.now() / 500) % 2 === 0 ? 1 : 0 }}>_</Text>
          </Text>
        )}
      </Animated.View>

      <View style={[styles.progressTrack, { borderColor: `rgba(0, 212, 255, 0.2)` }]}>
        <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.primary }]} />
      </View>

      <Animated.Text style={[styles.tagline, { color: colors.mutedForeground, opacity: taglineFade }]}>
        Intelligence, Evolved.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 40,
  },
  arcText: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: 12,
  },
  xText: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    marginLeft: 4,
  },
  orbContainer: {
    marginBottom: 48,
  },
  bootLines: {
    alignSelf: "stretch",
    marginBottom: 32,
    minHeight: 100,
    paddingHorizontal: 8,
  },
  completedLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  activeLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: width * 0.7,
    height: 2,
    borderRadius: 1,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBar: {
    height: "100%",
    borderRadius: 1,
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
