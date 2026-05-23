import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "./GlassCard";
import { useApp, Note } from "@/context/AppContext";

export function ProductivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, notes, setNotes } = useApp();
  const [showNote, setShowNote] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const openNew = () => {
    setEditNote(null);
    setNoteTitle("");
    setNoteContent("");
    setShowNote(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowNote(true);
  };

  const saveNote = () => {
    if (!noteTitle.trim()) return;
    if (editNote) {
      setNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, title: noteTitle, content: noteContent } : n));
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle.trim(),
        content: noteContent,
        createdAt: new Date().toISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowNote(false);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const ANALYTICS = [
    { label: "Focus Score", value: "87%", icon: "brain", color: colors.primary },
    { label: "Tasks Done", value: "12", icon: "checkmark-circle", color: colors.neonBlue },
    { label: "AI Sessions", value: "8", icon: "chatbubble", color: colors.neonPurple },
    { label: "Notes", value: notes.length.toString(), icon: "document-text", color: colors.neonCyan },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>HUB</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DAILY ANALYTICS</Text>
        <View style={styles.analyticsGrid}>
          {ANALYTICS.map((item, i) => (
            <GlassCard key={i} style={styles.analyticsCard} padding={14}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={[styles.analyticsValue, { color: colors.foreground }]}>{item.value}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.briefingCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={14} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>  AI DAILY BRIEFING</Text>
          </View>
          <Text style={[styles.briefingText, { color: colors.foreground }]}>
            Today's productivity score is above your weekly average. You're on track with high-priority tasks.
            3 upcoming calendar events detected. AI recommends a 25-minute focus block before lunch.
          </Text>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>SMART NOTES</Text>

        {notes.length === 0 && (
          <View style={[styles.emptyNotes, { borderColor: `rgba(0, 212, 255, 0.15)` }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notes yet</Text>
          </View>
        )}

        {notes.map(note => (
          <GlassCard key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={[styles.noteTitle, { color: colors.foreground }]} numberOfLines={1}>{note.title}</Text>
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={() => openEdit(note)} style={styles.noteActionBtn}>
                  <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteNote(note.id)} style={styles.noteActionBtn}>
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.noteContent, { color: colors.mutedForeground }]} numberOfLines={2}>
              {note.content || "No content"}
            </Text>
            <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
              {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </GlassCard>
        ))}
      </ScrollView>

      <Modal visible={showNote} transparent animationType="slide" onRequestClose={() => setShowNote(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: `rgba(0, 212, 255, 0.3)` }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editNote ? "Edit Note" : "New Note"}
              </Text>
              <TouchableOpacity onPress={() => setShowNote(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: `rgba(0, 212, 255, 0.25)`, backgroundColor: colors.surface }]}
              placeholder="Title..."
              placeholderTextColor={colors.mutedForeground}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <TextInput
              style={[styles.modalTextarea, { color: colors.foreground, borderColor: `rgba(0, 212, 255, 0.25)`, backgroundColor: colors.surface }]}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.mutedForeground}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={saveNote}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Note</Text>
            </TouchableOpacity>
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
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  analyticsCard: { width: "47%", alignItems: "center", gap: 6 },
  analyticsValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  analyticsLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.8 },
  briefingCard: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  briefingText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyNotes: { alignItems: "center", padding: 32, borderWidth: 1, borderRadius: 16, borderStyle: "dashed", gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  noteCard: { marginBottom: 12 },
  noteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  noteTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  noteActions: { flexDirection: "row", gap: 12 },
  noteActionBtn: { padding: 4 },
  noteContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
  noteDate: { fontSize: 10, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  modalTextarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 120 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
