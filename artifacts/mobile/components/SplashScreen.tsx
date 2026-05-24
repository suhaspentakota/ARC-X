import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const BOOT_LINES = [
  "[ BOOT ] Initializing neural core v7.4.1",
  "[ LOAD ] Cognitive matrices online",
  "[ SYNC ] Intelligence modules calibrated",
  "[ NET  ] Quantum link established",
  "[ OK   ] ARC X — Systems nominal",
];

function ReactorRing({ delay, size, color, duration }: { delay: number; size: number; color: string; duration: number }) {
  const scale = useRef(new Animated.Value(0.1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: duration * 0.3, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: duration * 0.7, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[
      styles.reactorRing,
      { width: size, height: size, borderRadius: size / 2, borderColor: color, transform: [{ scale }], opacity }
    ]} />
  );
}

export function SplashScreenView() {
  const colors = useColors();
  const { setCurrentScreen } = useApp();
  const [lineIndex, setLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [showLines, setShowLines] = useState(false);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const coreScale = useRef(new Animated.Value(0)).current;
  const coreOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(1.2)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const innerRotate = useRef(new Animated.Value(0)).current;
  const outerRotate = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(coreOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(coreScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(innerRotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(outerRotate, { toValue: -1, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      ]).start();
    }, 900);

    setTimeout(() => setShowLines(true), 1600);

    Animated.timing(progressWidth, {
      toValue: width * 0.68,
      duration: 4000,
      delay: 1700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 5200);

    setTimeout(() => {
      Animated.timing(containerOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setCurrentScreen("home");
      });
    }, 5800);
  }, []);

  useEffect(() => {
    if (!showLines) return;
    if (lineIndex >= BOOT_LINES.length) return;
    const line = BOOT_LINES[lineIndex];
    if (charIndex < line.length) {
      const t = setTimeout(() => {
        setCurrentText(line.slice(0, charIndex + 1));
        setCharIndex(c => c + 1);
      }, 18);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLineIndex(i => i + 1);
        setCharIndex(0);
        setCurrentText("");
      }, 380);
      return () => clearTimeout(t);
    }
  }, [lineIndex, charIndex, showLines]);

  const innerSpin = innerRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const outerSpin = outerRotate.interpolate({ inputRange: [-1, 0], outputRange: ["-360deg", "0deg"] });

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: containerOpacity }]}>
      <View style={styles.gridOverlay}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { borderColor: `rgba(0, 212, 255, 0.03)`, top: `${i * 11}%` as any }]} />
        ))}
      </View>

      <View style={styles.reactorSection}>
        <Animated.View style={[styles.reactorWrap, { opacity: coreOpacity, transform: [{ scale: coreScale }] }]}>
          <ReactorRing delay={200} size={240} color="rgba(0, 212, 255, 0.12)" duration={1200} />
          <ReactorRing delay={400} size={190} color="rgba(0, 102, 255, 0.18)" duration={1000} />
          <ReactorRing delay={600} size={150} color="rgba(0, 212, 255, 0.25)" duration={900} />
          <ReactorRing delay={800} size={115} color="rgba(123, 47, 255, 0.3)" duration={800} />

          <Animated.View style={[styles.orbitRingOuter, { transform: [{ rotate: outerSpin }] }]} />
          <Animated.View style={[styles.orbitRingInner, { transform: [{ rotate: innerSpin }] }]} />

          <Animated.View style={[styles.coreGlow, { opacity: glowPulse, shadowColor: colors.primary }]} />
          <View style={[styles.coreDisk, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <View style={[styles.coreInner, { backgroundColor: colors.primary }]} />
            <View style={[styles.coreCenter, { backgroundColor: "#ffffff" }]} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.titleRow, { opacity: titleOpacity, transform: [{ scale: titleScale }] }]}>
        <Text style={[styles.arcText, { color: colors.primary }]}>ARC</Text>
        <Text style={[styles.xText, { color: "#ffffff" }]}>X</Text>
      </Animated.View>

      {showLines && (
        <View style={styles.bootLines}>
          {BOOT_LINES.slice(0, lineIndex).map((line, i) => (
            <Text key={i} style={[styles.completedLine, { color: `rgba(0, 212, 255, 0.4)` }]}>{line}</Text>
          ))}
          {lineIndex < BOOT_LINES.length && (
            <Text style={[styles.activeLine, { color: colors.primary }]}>
              {currentText}<Text style={{ opacity: 0.9 }}>█</Text>
            </Text>
          )}
        </View>
      )}

      <View style={[styles.progressTrack, { borderColor: `rgba(0, 212, 255, 0.15)` }]}>
        <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.primary }]} />
        <Animated.View style={[styles.progressGlow, { width: progressWidth, shadowColor: colors.primary }]} />
      </View>

      <Animated.Text style={[styles.tagline, { color: colors.mutedForeground, opacity: taglineOpacity }]}>
        INTELLIGENCE, EVOLVED.
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
  reactorSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    height: 260,
  },
  reactorWrap: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  reactorRing: {
    position: "absolute",
    borderWidth: 1,
  },
  orbitRingOuter: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: "rgba(0, 102, 255, 0.5)",
    borderStyle: "dashed",
  },
  orbitRingInner: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "rgba(123, 47, 255, 0.5)",
    borderStyle: "dashed",
  },
  coreGlow: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0, 212, 255, 0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  coreDisk: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
  },
  coreInner: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 12,
  },
  coreCenter: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 24,
  },
  arcText: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 14,
  },
  xText: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    marginLeft: 2,
  },
  bootLines: {
    alignSelf: "stretch",
    marginBottom: 24,
    minHeight: 90,
  },
  completedLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  activeLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  progressTrack: {
    width: width * 0.68,
    height: 2,
    borderRadius: 1,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  progressBar: {
    height: "100%",
    borderRadius: 1,
  },
  progressGlow: {
    position: "absolute",
    height: "100%",
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 4,
  },
});
