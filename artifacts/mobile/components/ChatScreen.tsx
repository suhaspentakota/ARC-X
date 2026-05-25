import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, Keyboard, Animated, ActivityIndicator, Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, ChatMessage } from "@/context/AppContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createSpeechUtterance, isSpeechSynthesisAvailable } from "@/lib/tts";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

const SUGGESTIONS = [
  "What can you help me with?",
  "Give me a productivity tip",
  "Explain quantum computing",
  "Generate an image of a nebula",
];

function AnimatedMessageBubble({
  msg,
  colors,
  reducedMotion,
  isSpeaking,
}: {
  msg: ChatMessage;
  colors: any;
  reducedMotion: boolean;
  isSpeaking: boolean;
}) {
  const slideY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [reducedMotion]);

  if (reducedMotion) {
    return <MessageBubble msg={msg} colors={colors} reducedMotion={true} isSpeaking={isSpeaking} />;
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
      <MessageBubble msg={msg} colors={colors} reducedMotion={false} isSpeaking={isSpeaking} />
    </Animated.View>
  );
}

function MessageBubble({ msg, colors, reducedMotion, isSpeaking }: { msg: ChatMessage; colors: any; reducedMotion: boolean; isSpeaking: boolean }) {
  const isUser = msg.role === "user";
  if (msg.imageUrl) {
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: colors.glowSoft, borderColor: `rgba(0, 212, 255, 0.3)` }]}>
            <Text style={[styles.aiAvatarText, { color: colors.primary }]}>X</Text>
          </View>
        )}
        <View style={styles.imageContainer}>
          <Text style={[styles.imagePromptLabel, { color: colors.mutedForeground }]}>Generated image</Text>
          <View style={[styles.imagePlaceholder, { borderColor: `rgba(0, 212, 255, 0.3)`, backgroundColor: colors.surface }]}>
            {msg.imageUrl === "loading" ? (
              <View style={styles.imageLoadingWrap}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.imageLoadingText, { color: colors.mutedForeground }]}>Generating image...</Text>
              </View>
            ) : msg.imageUrl === "error" ? (
              <Text style={[styles.imageErrorText, { color: colors.destructive }]}>Image generation failed</Text>
            ) : (
              <GeneratedImage base64={msg.imageUrl} colors={colors} />
            )}
          </View>
        </View>
      </View>
    );
  }
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
            <TypingDots colors={colors} reducedMotion={reducedMotion} />
          </View>
        ) : (
          <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
            {msg.content}
          </Text>
        )}
        {msg.streaming && msg.content !== "" && (
          <StreamCursor colors={colors} reducedMotion={reducedMotion} />
        )}
        {!isUser && isSpeaking && (
          <SpeakingIndicator colors={colors} reducedMotion={reducedMotion} />
        )}
      </View>
    </View>
  );
}

function GeneratedImage({ base64, colors }: { base64: string; colors: any }) {
  const { Image } = require("react-native");
  return (
    <Image
      source={{ uri: `data:image/png;base64,${base64}` }}
      style={styles.generatedImg}
      resizeMode="cover"
    />
  );
}

function StreamCursor({ colors, reducedMotion }: { colors: any; reducedMotion: boolean }) {
  if (reducedMotion) {
    return <View style={[styles.streamCursor, { backgroundColor: colors.primary, opacity: 0.8 }]} />;
  }
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.streamCursor, { backgroundColor: colors.primary, opacity: blink }]} />;
}

function TypingDots({ colors, reducedMotion }: { colors: any; reducedMotion: boolean }) {
  if (reducedMotion) {
    return (
      <View style={styles.dotsRow}>
        <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.8 }]} />
      </View>
    );
  }
  const dotsRef = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]);
  useEffect(() => {
    dotsRef.current.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.dotsRow}>
      {dotsRef.current.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity: d }]} />
      ))}
    </View>
  );
}

function SpeakingIndicator({ colors, reducedMotion }: { colors: any; reducedMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 480, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, reducedMotion]);

  if (reducedMotion) {
    return (
      <View style={styles.speakingRow}>
        <View style={[styles.speakingDot, { backgroundColor: colors.neonPurple }]} />
        <Text style={[styles.speakingLabel, { color: colors.mutedForeground }]}>Speaking…</Text>
      </View>
    );
  }

  return (
    <View style={styles.speakingRow}>
      <Animated.View style={[styles.speakingDot, { backgroundColor: colors.neonPurple, opacity: pulse }]} />
      <Text style={[styles.speakingLabel, { color: colors.mutedForeground }]}>Speaking…</Text>
    </View>
  );
}

export function ChatScreen() {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const {
    setCurrentScreen,
    messages,
    setMessages,
    conversationId,
    setConversationId,
    isStreaming,
    setIsStreaming,
    userName,
    selectedVoice,
    voiceSettings,
  } = useApp();
  const [inputText, setInputText] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }
    if (isSpeechSynthesisAvailable()) {
      window.speechSynthesis.cancel();
    }
  }, []);

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

  const generateImage = useCallback(async (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const imgMsgId = Date.now().toString();
    const imgMsg: ChatMessage = {
      id: imgMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      imageUrl: "loading",
    };
    setMessages(prev => [...prev, imgMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/openai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === imgMsgId ? { ...m, imageUrl: data.b64_json } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === imgMsgId ? { ...m, imageUrl: "error" } : m));
    }
  }, []);

  const speakAssistantReply = useCallback((messageId: string, text: string) => {
    if (!voiceSettings.autoSpeakResponses || !text.trim() || !isSpeechSynthesisAvailable()) return;
    window.speechSynthesis.cancel();
    const utterance = createSpeechUtterance(text, selectedVoice, voiceSettings, {
      onStart: () => setSpeakingMessageId(messageId),
      onEnd: () => setSpeakingMessageId(prev => (prev === messageId ? null : prev)),
      onError: () => setSpeakingMessageId(prev => (prev === messageId ? null : prev)),
    });
    if (!utterance) return;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, voiceSettings]);

  const revealAssistantReply = useCallback(async (messageId: string, fullText: string) => {
    if (reducedMotion || fullText.length < 2) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullText, streaming: false } : m));
      return;
    }

    const chunkSize = Math.max(1, Math.round(fullText.length / 36));
    let index = 0;
    await new Promise<void>((resolve) => {
      const tick = () => {
        index = Math.min(fullText.length, index + chunkSize);
        const nextText = fullText.slice(0, index);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: nextText, streaming: true } : m));
        if (index >= fullText.length) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, streaming: false } : m));
          resolve();
          return;
        }
        revealTimeoutRef.current = setTimeout(tick, 18);
      };
      tick();
    });
  }, [reducedMotion, setMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setInputText("");

    const lower = text.toLowerCase();
    if (lower.includes("generate image") || lower.includes("create image") || lower.includes("draw") || lower.includes("generate a picture")) {
      const prompt = text.replace(/generate\s+(an?\s+)?image\s+(of\s+)?/i, "")
        .replace(/create\s+(an?\s+)?image\s+(of\s+)?/i, "")
        .replace(/draw\s+(an?\s+)?/i, "")
        .replace(/generate\s+(a\s+)?picture\s+(of\s+)?/i, "")
        .trim() || text;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text.trim(), timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      await generateImage(prompt);
      return;
    }

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
                  speakAssistantReply(aiMsgId, accumulated);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              } catch {}
            }
          }
        }
      } else {
        const fallbackText = await response.text();
        await revealAssistantReply(aiMsgId, fallbackText || "I received your request.");
        speakAssistantReply(aiMsgId, fallbackText || "I received your request.");
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId
          ? { ...m, content: "Connection error. Please try again.", streaming: false }
          : m)
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, getOrCreateConversation, generateImage, revealAssistantReply, setMessages, setIsStreaming, speakAssistantReply]);

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
            setSpeakingMessageId(null);
            if (isSpeechSynthesisAvailable()) {
              window.speechSynthesis.cancel();
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.clearBtn}
        >
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyOrb, { borderColor: `rgba(0, 212, 255, 0.2)` }]}>
              <Text style={[styles.emptyOrbText, { color: colors.primary }]}>X</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Hello, {userName}.</Text>
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
            renderItem={({ item }) => (
              <AnimatedMessageBubble
                msg={item}
                colors={colors}
                reducedMotion={reducedMotion}
                isSpeaking={speakingMessageId === item.id}
              />
            )}
          />
        )}

        <View style={[styles.inputArea, { paddingBottom: bottomPad + 8, borderTopColor: `rgba(0, 212, 255, 0.12)` }]}>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: `rgba(0, 212, 255, 0.25)` }]}>
            <TouchableOpacity
              style={styles.imgBtn}
              onPress={() => {
                const prompt = inputText.trim() || "futuristic cityscape at night, neon lights, cinematic";
                setInputText("");
                const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: `Generate image: ${prompt}`, timestamp: new Date() };
                setMessages(prev => [...prev, userMsg]);
                generateImage(prompt);
              }}
            >
              <MaterialCommunityIcons name="image-plus" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
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
              style={[styles.sendBtn, { backgroundColor: isStreaming || !inputText.trim() ? colors.muted : colors.primary }]}
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(0, 212, 255, 0.1)",
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
  speakingRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  speakingDot: { width: 7, height: 7, borderRadius: 3.5 },
  speakingLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  imageContainer: { maxWidth: "85%" },
  imagePromptLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5, marginBottom: 6 },
  imagePlaceholder: {
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
    minHeight: 180,
  },
  imageLoadingWrap: { padding: 32, alignItems: "center", gap: 12 },
  imageLoadingText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imageErrorText: { padding: 20, fontSize: 13, fontFamily: "Inter_400Regular" },
  generatedImg: { width: 260, height: 260 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyOrbText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 32 },
  suggestions: { alignSelf: "stretch", gap: 10 },
  suggestion: { padding: 14, borderRadius: 12, borderWidth: 1 },
  suggestionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputArea: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    borderRadius: 20, borderWidth: 1,
    paddingLeft: 8, paddingRight: 6, paddingVertical: 6, gap: 6,
  },
  imgBtn: { padding: 8, justifyContent: "center" },
  input: {
    flex: 1, fontSize: 14, fontFamily: "Inter_400Regular",
    maxHeight: 100, paddingVertical: 6,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
});
