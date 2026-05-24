import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ArcOrb } from "./ArcOrb";
import { GlassCard } from "./GlassCard";
import { useApp, Screen } from "@/context/AppContext";

const { width } = Dimensions.get("window");

function getGreeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}.`;
  if (h < 17) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

const QUICK_ACTIONS: { icon: string; label: string; screen: Screen; iconLib: "ion" | "mci" | "feather" }[] = [
  { icon: "chatbubble-ellipses", label: "Chat", screen: "chat", iconLib: "ion" },
  { icon: "mic", label: "Voice", screen: "voice", iconLib: "ion" },
  { icon: "image-outline", label: "Image", screen: "imagegen", iconLib: "ion" },
  { icon: "film-outline", label: "Video", screen: "videogen", iconLib: "ion" },
];

export function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, userName, tasks, messages } = useApp();
  const time = useTime();
  const [systemStatus] = useState(98.7);
  const orbPressAnim = useRef(new Animated.Value(1)).current;
  const orbGlowAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const navigate = (screen: Screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen(screen);
  };

  const handleOrbPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(orbGlowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(orbGlowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    setTimeout(() => navigate("voice"), 200);
  };

  const h = time.getHours() % 12 || 12;
  const hours = h.toString().padStart(2, "0");
  const mins = time.getMinutes().toString().padStart(2, "0");
  const secs = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const recentMessages = messages.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting(userName)}</Text>
        <TouchableOpacity onPress={() => navigate("settings")} style={styles.settingsBtn}>
          <Feather name="settings" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }]}
      >
        <View style={styles.orbSection}>
          <Animated.View style={[
            styles.orbGlow,
            { shadowColor: colors.primary, opacity: orbGlowAnim }
          ]} />
          <ArcOrb size={100} pulsing intensity="medium" onPress={handleOrbPress} />
          <View style={styles.clockContainer}>
            <Text style={[styles.clock, { color: colors.foreground }]}>
              {hours}<Text style={{ color: colors.primary }}>:</Text>{mins}
              <Text style={[styles.secs, { color: colors.mutedForeground }]}> :{secs}</Text>
              <Text style={[styles.ampm, { color: colors.primary }]}> {ampm}</Text>
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            ARC X Online — Neural Core {systemStatus.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]}
              onPress={() => navigate(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.glowSoft }]}>
                {action.iconLib === "ion" && <Ionicons name={action.icon as any} size={22} color={colors.primary} />}
                {action.iconLib === "mci" && <MaterialCommunityIcons name={action.icon as any} size={22} color={colors.primary} />}
                {action.iconLib === "feather" && <Feather name={action.icon as any} size={22} color={colors.primary} />}
              </View>
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={styles.briefingCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>  BRIEFING</Text>
          </View>
          <Text style={[styles.briefingText, { color: colors.foreground }]}>
            {pendingTasks > 0
              ? `You have ${pendingTasks} pending task${pendingTasks > 1 ? "s" : ""} today. ${recentMessages > 0 ? `${recentMessages} messages in your current session.` : "Ready for your first query."}`
              : "All tasks complete. Systems nominal. Ready to assist."}
          </Text>
          <TouchableOpacity
            style={[styles.briefingAction, { borderColor: `rgba(0, 212, 255, 0.3)` }]}
            onPress={() => navigate("chat")}
          >
            <Text style={[styles.briefingActionText, { color: colors.primary }]}>Ask ARC X</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} padding={14}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{tasks.filter(t => t.completed).length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Done</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={14}>
            <Ionicons name="time" size={20} color={colors.neonPurple} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{pendingTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={14}>
            <Ionicons name="chatbubble" size={20} color={colors.neonBlue} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{recentMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Msgs</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.tasksCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>  PRIORITY TASKS</Text>
            <TouchableOpacity onPress={() => navigate("productivity")} style={styles.seeAll}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>
          {tasks.slice(0, 3).map(task => (
            <View key={task.id} style={styles.taskRow}>
              <View style={[
                styles.taskDot,
                { backgroundColor: task.completed ? colors.primary : "transparent", borderColor: colors.primary }
              ]} />
              <Text style={[
                styles.taskText,
                {
                  color: task.completed ? colors.mutedForeground : colors.foreground,
                  textDecorationLine: task.completed ? "line-through" : "none",
                }
              ]}>{task.title}</Text>
              {task.dueDate && (
                <Text style={[styles.taskDue, { color: colors.mutedForeground }]}>{task.dueDate}</Text>
              )}
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 8,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  settingsBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20 },
  orbSection: { alignItems: "center", paddingVertical: 20, position: "relative" },
  orbGlow: {
    position: "absolute",
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(0, 212, 255, 0.15)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
    top: "50%",
    marginTop: -100,
  },
  clockContainer: { alignItems: "center", marginTop: 8 },
  clock: { fontSize: 48, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  secs: { fontSize: 24, fontFamily: "Inter_400Regular" },
  ampm: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  date: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, letterSpacing: 0.5 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.8 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  actionBtn: {
    width: (width - 56) / 4,
    alignItems: "center", paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, gap: 8,
  },
  actionIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  briefingCard: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  seeAll: { marginLeft: "auto" },
  seeAllText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  briefingText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  briefingAction: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start",
  },
  briefingActionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.8 },
  tasksCard: { marginBottom: 16 },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  taskDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  taskText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  taskDue: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
