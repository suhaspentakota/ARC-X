import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  borderOpacity?: number;
  padding?: number;
}

export function GlassCard({ children, style, glowColor, borderOpacity = 0.2, padding = 16 }: GlassCardProps) {
  const colors = useColors();
  const glow = glowColor || colors.primary;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.holographic,
        borderColor: `rgba(0, 212, 255, ${borderOpacity})`,
        padding,
        shadowColor: glow,
      },
      style,
    ]}>
      <View style={[styles.topLine, { backgroundColor: `rgba(0, 212, 255, 0.4)` }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  topLine: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
});
