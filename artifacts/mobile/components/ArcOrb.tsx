import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, TouchableWithoutFeedback } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ArcOrbProps {
  size?: number;
  pulsing?: boolean;
  intensity?: "low" | "medium" | "high";
  onPress?: () => void;
}

export function ArcOrb({ size = 120, pulsing = true, intensity = "medium", onPress }: ArcOrbProps) {
  const colors = useColors();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const innerGlow = useRef(new Animated.Value(0.6)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const burst1 = useRef(new Animated.Value(1)).current;
  const burst1Opacity = useRef(new Animated.Value(0)).current;
  const burst2 = useRef(new Animated.Value(1)).current;
  const burst2Opacity = useRef(new Animated.Value(0)).current;
  const burst3 = useRef(new Animated.Value(1)).current;
  const burst3Opacity = useRef(new Animated.Value(0)).current;
  const coreFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) return;

    const dur = intensity === "high" ? 1000 : intensity === "medium" ? 1600 : 2400;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.35, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1.6, duration: dur * 1.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 1, duration: dur * 1.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }, dur / 3);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse3, { toValue: 1.9, duration: dur * 1.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse3, { toValue: 1, duration: dur * 1.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }, (dur / 3) * 2);

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, { toValue: 1, duration: dur * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(innerGlow, { toValue: 0.6, duration: dur * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulsing, intensity]);

  const fireBurst = () => {
    burst1.setValue(1);
    burst1Opacity.setValue(0.9);
    burst2.setValue(1);
    burst2Opacity.setValue(0.7);
    burst3.setValue(1);
    burst3Opacity.setValue(0.5);
    coreFlash.setValue(1);

    Animated.parallel([
      Animated.spring(pressScale, { toValue: 0.92, friction: 8, tension: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(burst1, { toValue: 2.4, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(burst1Opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(burst2, { toValue: 2.8, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(burst2Opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(160),
        Animated.timing(burst3, { toValue: 3.2, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(160),
        Animated.timing(burst3Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(coreFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(pressScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
    });
  };

  const handlePress = () => {
    fireBurst();
    onPress?.();
  };

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const ringSize1 = size * 1.35;
  const ringSize2 = size * 1.6;
  const ringSize3 = size * 1.9;

  const content = (
    <View style={[styles.container, { width: size * 2.2, height: size * 2.2 }]}>
      <Animated.View style={[
        styles.burstRing,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: colors.primary,
          transform: [{ scale: burst1 }],
          opacity: burst1Opacity,
        }
      ]} />
      <Animated.View style={[
        styles.burstRing,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: colors.neonBlue,
          transform: [{ scale: burst2 }],
          opacity: burst2Opacity,
        }
      ]} />
      <Animated.View style={[
        styles.burstRing,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: colors.neonPurple,
          transform: [{ scale: burst3 }],
          opacity: burst3Opacity,
        }
      ]} />

      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <View style={[styles.container, { width: size * 2.2, height: size * 2.2 }]}>
          <Animated.View style={[styles.ring, {
            width: ringSize3, height: ringSize3, borderRadius: ringSize3 / 2,
            borderColor: `rgba(0, 212, 255, 0.06)`, transform: [{ scale: pulse3 }],
          }]} />
          <Animated.View style={[styles.ring, {
            width: ringSize2, height: ringSize2, borderRadius: ringSize2 / 2,
            borderColor: `rgba(0, 212, 255, 0.12)`, transform: [{ scale: pulse2 }],
          }]} />
          <Animated.View style={[styles.ring, {
            width: ringSize1, height: ringSize1, borderRadius: ringSize1 / 2,
            borderColor: `rgba(0, 212, 255, 0.22)`, transform: [{ scale: pulse1 }],
          }]} />

          <Animated.View style={[styles.orbitRing, {
            width: size * 1.1, height: size * 1.1, borderRadius: (size * 1.1) / 2,
            transform: [{ rotate: spin }],
          }]} />

          <Animated.View style={[styles.core, {
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: colors.background,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            opacity: innerGlow,
          }]}>
            <Animated.View style={[styles.innerCore, {
              width: size * 0.6, height: size * 0.6, borderRadius: (size * 0.6) / 2,
              backgroundColor: colors.primary, shadowColor: colors.primary,
              opacity: coreFlash.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }),
            }]} />
            <Animated.View style={[styles.innerCoreCenter, {
              width: size * 0.25, height: size * 0.25, borderRadius: (size * 0.25) / 2,
              backgroundColor: coreFlash.interpolate({ inputRange: [0, 1], outputRange: ["#ffffff", "#ffffff"] as any }),
              shadowColor: "#ffffff",
              opacity: coreFlash.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }),
            }]} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={handlePress}>
        {content}
      </TouchableWithoutFeedback>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
  },
  burstRing: {
    position: "absolute",
    borderWidth: 2,
  },
  orbitRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(0, 102, 255, 0.4)",
    borderStyle: "dashed",
  },
  core: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  innerCore: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
  },
  innerCoreCenter: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
});
