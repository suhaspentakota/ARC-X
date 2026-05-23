import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, Keyboard, Animated, ActivityIndicator, Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, ChatMessage } from "@/context/AppContext";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

const SUGGESTIONS = [
  "What can you help me with?",
  "Give me a productivity tip",
  "Explain quantum computing",
  "Write a haiku about AI",
];

function MessageBubble({ msg, colors }: { msg: ChatMessage; colors: any }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.3)` }]}>
          <Text style={[styles.aiAvatarText, { color: colors.primary }]}>X</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: colors.primary }]
          : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.2)` }]
      ]}>
        {msg.streaming && msg.content === "" ? (
          <View style={styles.typingRow}>
            <TypingDots colors={colors} />
          </View>
        ) : (
          <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
            {msg.content}
          </Text>
        )}
        {msg.streaming && msg.content !== "" && (
          <View style={[styles.streamCursor, { backgroundColor: colors.primary }]} />
        )}
      </View>
    </View>
  );
}

function TypingDots({ colors }: { colors: any }) {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  React.useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.dotsRow}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity: d }]} />
      ))}
    </View>
  );
}

export function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScreen, messages, setMessages, conversationId, setConversationId, isStreaming, setIsStreaming, userName } = useApp();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getOrCreateConversation = useCallback(async (): Promise<number> => {
    if (conversationId) return conversationId;
    const res = await fetch(`${API_BASE}/api/openai/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `ARC X Session — ${new Date().toLocaleString()}` }),
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  }, [conversationId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setInputText("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    try {
      const convId = await getOrCreateConversation();
      const response = await fetch(`${API_BASE}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.content) {
                  accumulated += parsed.content;
                  const acc = accumulated;
                  setMessages(prev =>
                    prev.map(m => m.id === aiMsgId ? { ...m, content: acc } : m)
                  );
                }
                if (parsed.done) {
                  setMessages(prev =>
                    prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m)
                  );
                }
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId
          ? { ...m, content: "Connection error. Please try again.", streaming: false }
          : m)
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, getOrCreateConversation]);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setCurrentScreen("home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>ARC X</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([]);
            setConversationId(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.clearBtn}
        >
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyOrb, { borderColor: `rgba(0, 212, 255, 0.2)` }]}>
              <Text style={[styles.emptyOrbText, { color: colors.primary }]}>X</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Hello, {userName}.
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              How can I assist you today?
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestion, { borderColor: `rgba(0, 212, 255, 0.2)`, backgroundColor: colors.surface }]}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            keyExtractor={m => m.id}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item }) => <MessageBubble msg={item} colors={colors} />}
          />
        )}

        <View style={[styles.inputArea, { paddingBottom: bottomPad + 8, borderTopColor: `rgba(0, 212, 255, 0.12)` }]}>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.25)` }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Message ARC X..."
              placeholderTextColor={colors.mutedForeground}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
              editable={!isStreaming}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: isStreaming || !inputText.trim() ? colors.muted : colors.primary }
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={isStreaming || !inputText.trim()}
            >
              {isStreaming
                ? <ActivityIndicator size="small" color={colors.mutedForeground} />
                : <Ionicons name="arrow-up" size={18} color={isStreaming || !inputText.trim() ? colors.mutedForeground : colors.primaryForeground} />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: 3 },
  clearBtn: { padding: 4 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12 },
  msgRow: { marginBottom: 12, flexDirection: "row" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start", alignItems: "flex-end" },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginRight: 8, marginBottom: 2,
  },
  aiAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  streamCursor: { width: 2, height: 14, borderRadius: 1, marginTop: 2 },
  typingRow: { paddingVertical: 4 },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyOrbText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 32 },
  suggestions: { alignSelf: "stretch", gap: 10 },
  suggestion: {
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
});
