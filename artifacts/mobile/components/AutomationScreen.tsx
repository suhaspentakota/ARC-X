import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, Modal, TextInput
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "./GlassCard";
import { useApp, Routine } from "@/context/AppContext";

const ACTION_ICONS: Record<string, string> = {
  Weather: "cloud", Calendar: "calendar", News: "newspaper",
  DND: "moon", Productivity: "briefcase", Timer: "timer",
  Summary: "bar-chart", Tomorrow: "sunrise", Relax: "music",
};

export function AutomationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, routines, setRoutines, tasks, setTasks } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineTime, setNewRoutineTime] = useState("08:00");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleRoutine = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const addRoutine = () => {
    if (!newRoutineName.trim()) return;
    const newR: Routine = {
      id: Date.now().toString(),
      name: newRoutineName.trim(),
      time: newRoutineTime,
      enabled: true,
      actions: ["Calendar", "News"],
    };
    setRoutines(prev => [...prev, newR]);
    setNewRoutineName("");
    setShowAddModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const priorityColor = (p: string) => {
    if (p === "high") return colors.destructive;
    if (p === "medium") return colors.neonBlue;
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AUTOMATION</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ROUTINES</Text>
        {routines.map(routine => (
          <GlassCard key={routine.id} style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <View>
                <Text style={[styles.routineName, { color: colors.foreground }]}>{routine.name}</Text>
                <Text style={[styles.routineTime, { color: colors.primary }]}>{routine.time} daily</Text>
              </View>
              <Switch
                value={routine.enabled}
                onValueChange={() => toggleRoutine(routine.id)}
                trackColor={{ false: colors.muted, true: colors.glowMedium }}
                thumbColor={routine.enabled ? colors.primary : colors.mutedForeground}
              />
            </View>
            <View style={styles.actionsRow}>
              {routine.actions.map((action, i) => (
                <View key={i} style={[styles.actionChip, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.2)` }]}>
                  <Ionicons name={ACTION_ICONS[action] as any || "flash"} size={12} color={colors.primary} />
                  <Text style={[styles.actionChipText, { color: colors.mutedForeground }]}>{action}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>TASK MANAGER</Text>
        {tasks.map(task => (
          <TouchableOpacity key={task.id} onPress={() => toggleTask(task.id)} activeOpacity={0.7}>
            <GlassCard style={styles.taskCard} padding={14}>
              <View style={styles.taskRow}>
                <View style={[
                  styles.taskCheck,
                  {
                    backgroundColor: task.completed ? colors.primary : "transparent",
                    borderColor: priorityColor(task.priority),
                  }
                ]}>
                  {task.completed && <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.taskTitle,
                    {
                      color: task.completed ? colors.mutedForeground : colors.foreground,
                      textDecorationLine: task.completed ? "line-through" : "none",
                    }
                  ]}>{task.title}</Text>
                  {task.dueDate && (
                    <Text style={[styles.taskDue, { color: colors.mutedForeground }]}>{task.dueDate}</Text>
                  )}
                </View>
                <View style={[styles.priorityBadge, { borderColor: priorityColor(task.priority) }]}>
                  <Text style={[styles.priorityText, { color: priorityColor(task.priority) }]}>{task.priority}</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: `rgba(0, 212, 255, 0.3)` }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Routine</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: `rgba(0, 212, 255, 0.3)`, backgroundColor: colors.surface }]}
              placeholder="Routine name..."
              placeholderTextColor={colors.mutedForeground}
              value={newRoutineName}
              onChangeText={setNewRoutineName}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: `rgba(0, 212, 255, 0.3)`, backgroundColor: colors.surface }]}
              placeholder="Time (e.g. 08:00)"
              placeholderTextColor={colors.mutedForeground}
              value={newRoutineTime}
              onChangeText={setNewRoutineTime}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: `rgba(0, 212, 255, 0.3)` }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={addRoutine}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 4 },
  addBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 14 },
  routineCard: { marginBottom: 12 },
  routineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  routineName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  routineTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  actionChipText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskCard: { marginBottom: 10 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  taskCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  taskDue: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  priorityBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  modal: { width: "85%", borderRadius: 20, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, fontSize: 14, fontFamily: "Inter_400Regular" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  modalBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
