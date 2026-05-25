import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "./GlassCard";
import { useApp, VoiceSettings } from "@/context/AppContext";
import { createSpeechUtterance, PRESET_VOICES, isSpeechSynthesisAvailable } from "@/lib/tts";

const PERSONALITIES = ["Professional", "Casual", "Focused", "Creative", "Analytical"];
const VOICES = PRESET_VOICES.map(v => v.name);
type AdjustableVoiceKey = keyof Pick<VoiceSettings, "rate" | "pitch" | "volume" | "expressiveness">;

const TEST_PHRASES = [
  "ARC X systems are fully operational.",
  "Neural core is online and ready.",
  "Intelligence, evolved.",
];

function testVoice(voiceName: string, voiceSettings: VoiceSettings) {
  if (!isSpeechSynthesisAvailable()) return;
  window.speechSynthesis.cancel();
  const phrase = TEST_PHRASES[Math.floor(Math.random() * TEST_PHRASES.length)];
  const utterance = createSpeechUtterance(phrase, voiceName, voiceSettings);
  if (!utterance) return;
  window.speechSynthesis.speak(utterance);
}

export function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    setCurrentScreen,
    userName,
    setUserName,
    aiPersonality,
    setAiPersonality,
    selectedVoice,
    setSelectedVoice,
    voiceSettings,
    setVoiceSettings,
  } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const saveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingName(false);
  };

  const adjustVoiceSetting = (key: AdjustableVoiceKey, delta: number, min: number, max: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: Math.round(Math.min(max, Math.max(min, prev[key] + delta)) * 10) / 10,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>SETTINGS</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
      >
        <GlassCard style={styles.profileCard}>
          <View style={[styles.profileAvatar, { borderColor: colors.primary, backgroundColor: colors.glowSoft }]}>
            <Text style={[styles.profileAvatarText, { color: colors.primary }]}>
              {userName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: `rgba(0, 212, 255, 0.4)` }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={saveName}
                />
                <TouchableOpacity onPress={saveName} style={styles.saveNameBtn}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.foreground }]}>{userName}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.editNameBtn}>
                  <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>ARC X Commander</Text>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERSONALITY</Text>
        <View style={styles.chipsRow}>
          {PERSONALITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, {
                backgroundColor: aiPersonality === p ? colors.primary : colors.surface,
                borderColor: aiPersonality === p ? colors.primary : `rgba(0, 212, 255, 0.2)`,
              }]}
              onPress={() => {
                setAiPersonality(p);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.chipText, { color: aiPersonality === p ? colors.primaryForeground : colors.mutedForeground }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>VOICE</Text>
        <View style={styles.voiceGrid}>
          {VOICES.map(v => (
            <View key={v} style={styles.voiceRow}>
              <TouchableOpacity
                style={[styles.voiceChip, {
                  backgroundColor: selectedVoice === v ? colors.neonPurple : colors.surface,
                  borderColor: selectedVoice === v ? colors.neonPurple : `rgba(0, 212, 255, 0.2)`,
                  flex: 1,
                }]}
                onPress={() => {
                  setSelectedVoice(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <MaterialCommunityIcons
                  name="waveform"
                  size={13}
                  color={selectedVoice === v ? "#ffffff" : colors.mutedForeground}
                />
                <Text style={[styles.chipText, { color: selectedVoice === v ? "#ffffff" : colors.mutedForeground }]}>
                  {v}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testBtn, { borderColor: `rgba(0, 212, 255, 0.25)`, backgroundColor: colors.surface }]}
                onPress={() => {
                  testVoice(v, voiceSettings);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="play" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <GlassCard style={styles.talknessCard}>
          <Text style={[styles.talknessTitle, { color: colors.foreground }]}>Talkness</Text>
          {[
            { key: "rate", label: "Rate", value: voiceSettings.rate, min: 0.6, max: 1.6, step: 0.1 },
            { key: "pitch", label: "Pitch", value: voiceSettings.pitch, min: 0.5, max: 1.8, step: 0.1 },
            { key: "volume", label: "Volume", value: voiceSettings.volume, min: 0.2, max: 1, step: 0.1 },
            { key: "expressiveness", label: "Style", value: voiceSettings.expressiveness, min: 0, max: 1, step: 0.1 },
          ].map(item => (
            <View key={item.key} style={styles.talknessRow}>
              <Text style={[styles.talknessLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <View style={styles.talknessControl}>
                <TouchableOpacity
                  style={[styles.adjustBtn, { borderColor: `rgba(0, 212, 255, 0.22)`, backgroundColor: colors.surface }]}
                  accessibilityLabel={`Decrease ${item.label}`}
                  onPress={() => adjustVoiceSetting(item.key as AdjustableVoiceKey, -item.step, item.min, item.max)}
                >
                  <Ionicons name="remove" size={14} color={colors.primary} />
                </TouchableOpacity>
                <Text
                  style={[styles.talknessValue, { color: colors.foreground }]}
                  accessibilityLabel={`${item.label}: ${item.value.toFixed(1)}`}
                >
                  {item.value.toFixed(1)}
                </Text>
                <TouchableOpacity
                  style={[styles.adjustBtn, { borderColor: `rgba(0, 212, 255, 0.22)`, backgroundColor: colors.surface }]}
                  accessibilityLabel={`Increase ${item.label}`}
                  onPress={() => adjustVoiceSetting(item.key as AdjustableVoiceKey, item.step, item.min, item.max)}
                >
                  <Ionicons name="add" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={[styles.autoSpeakRow, { borderTopColor: `rgba(0, 212, 255, 0.12)` }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Auto speak responses</Text>
              <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>Read assistant replies aloud</Text>
            </View>
            <Switch
              value={voiceSettings.autoSpeakResponses}
              onValueChange={value => {
                setVoiceSettings(prev => ({ ...prev, autoSpeakResponses: value }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.muted, true: colors.glowMedium }}
              thumbColor={voiceSettings.autoSpeakResponses ? colors.primary : colors.mutedForeground}
            />
          </View>
          {!isSpeechSynthesisAvailable() && (
            <Text style={[styles.ttsNotice, { color: colors.mutedForeground }]}>
              Speech synthesis is unavailable on this device. Text responses still work normally.
            </Text>
          )}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>PREFERENCES</Text>
        <GlassCard style={styles.settingsGroup} padding={0}>
          {[
            { label: "Smart Notifications", sub: "Context-aware alerts", value: notifications, setter: setNotifications },
            { label: "Conversation Memory", sub: "Remember past sessions", value: memoryEnabled, setter: setMemoryEnabled },
            { label: "Auto Suggestions", sub: "Proactive recommendations", value: autoSuggest, setter: setAutoSuggest },
          ].map((item, i, arr) => (
            <View
              key={i}
              style={[
                styles.settingRow,
                { borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: `rgba(0, 212, 255, 0.1)` }
              ]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={v => { item.setter(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                trackColor={{ false: colors.muted, true: colors.glowMedium }}
                thumbColor={item.value ? colors.primary : colors.mutedForeground}
              />
            </View>
          ))}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>SYSTEM</Text>
        <GlassCard style={styles.settingsGroup} padding={0}>
          {[
            { label: "Privacy & Data", icon: "shield-outline" },
            { label: "Connected Apps", icon: "apps-outline" },
            { label: "Export Memory", icon: "cloud-download-outline" },
            { label: "Reset ARC X", icon: "refresh-outline" },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.settingRow,
                { borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: `rgba(0, 212, 255, 0.1)` }
              ]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name={item.icon as any} size={18} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground, marginLeft: 12 }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <View style={styles.versionRow}>
          <Text style={[styles.version, { color: colors.mutedForeground }]}>ARC X v1.0.0 — Intelligence, Evolved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  profileCard: { flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 16 },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  profileAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  editNameBtn: { padding: 4 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold",
    borderBottomWidth: 1, paddingVertical: 2,
  },
  saveNameBtn: { padding: 4 },
  profileRole: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  voiceGrid: { gap: 8, marginBottom: 4 },
  voiceRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  voiceChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  testBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  talknessCard: { marginTop: 12, gap: 10 },
  talknessTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  talknessRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  talknessLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  talknessControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  adjustBtn: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  talknessValue: { minWidth: 34, textAlign: "center", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  autoSpeakRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  ttsNotice: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 2 },
  settingsGroup: { marginBottom: 4, borderRadius: 16, overflow: "hidden" },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  versionRow: { alignItems: "center", paddingVertical: 24 },
  version: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
});
