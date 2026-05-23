import React from "react";
import { useApp } from "@/context/AppContext";
import { SplashScreenView } from "@/components/SplashScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { ChatScreen } from "@/components/ChatScreen";
import { VoiceScreen } from "@/components/VoiceScreen";
import { AutomationScreen } from "@/components/AutomationScreen";
import { ProductivityScreen } from "@/components/ProductivityScreen";
import { SettingsScreen } from "@/components/SettingsScreen";

export default function MainApp() {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case "splash": return <SplashScreenView />;
    case "home": return <HomeScreen />;
    case "chat": return <ChatScreen />;
    case "voice": return <VoiceScreen />;
    case "automation": return <AutomationScreen />;
    case "productivity": return <ProductivityScreen />;
    case "settings": return <SettingsScreen />;
    default: return <HomeScreen />;
  }
}
