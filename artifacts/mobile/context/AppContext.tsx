import React, { createContext, useContext, useState } from "react";

export type Screen =
  | "splash" | "home" | "chat" | "voice"
  | "automation" | "productivity" | "settings"
  | "imagegen" | "videogen";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  imageUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: "low" | "medium" | "high";
}

export interface Routine {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  actions: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface AppContextType {
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationId: number | null;
  setConversationId: (id: number | null) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (v: boolean) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  routines: Routine[];
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  userName: string;
  setUserName: (n: string) => void;
  aiPersonality: string;
  setAiPersonality: (p: string) => void;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_TASKS: Task[] = [
  { id: "1", title: "Review mission briefing", completed: false, priority: "high", dueDate: "Today" },
  { id: "2", title: "System optimization check", completed: true, priority: "medium" },
  { id: "3", title: "Schedule weekly sync", completed: false, priority: "low", dueDate: "Tomorrow" },
];

const DEFAULT_ROUTINES: Routine[] = [
  { id: "1", name: "Morning Briefing", time: "07:00", enabled: true, actions: ["Weather", "Calendar", "News"] },
  { id: "2", name: "Focus Mode", time: "09:00", enabled: true, actions: ["DND", "Productivity", "Timer"] },
  { id: "3", name: "Evening Wind Down", time: "21:00", enabled: false, actions: ["Summary", "Tomorrow", "Relax"] },
];

const DEFAULT_NOTES: Note[] = [
  { id: "1", title: "ARC X Ideas", content: "Integrate smart home controls and expand voice commands.", createdAt: new Date().toISOString() },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [userName, setUserName] = useState("Commander");
  const [aiPersonality, setAiPersonality] = useState("Professional");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Nova");

  return (
    <AppContext.Provider value={{
      currentScreen, setCurrentScreen,
      messages, setMessages,
      conversationId, setConversationId,
      isVoiceActive, setIsVoiceActive,
      tasks, setTasks,
      routines, setRoutines,
      notes, setNotes,
      userName, setUserName,
      aiPersonality, setAiPersonality,
      isStreaming, setIsStreaming,
      selectedVoice, setSelectedVoice,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
