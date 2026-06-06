import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../lib/tts';

interface AppContextType {
  selectedVoice: string | undefined;
  setSelectedVoice: (voiceId: string | undefined) => Promise<void>;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => Promise<void>;
  autoSpeakResponses: boolean;
  setAutoSpeakResponses: (auto: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SELECTED_VOICE: 'arc_selected_voice',
  VOICE_SETTINGS: 'arc_voice_settings',
  AUTO_SPEAK: 'arc_auto_speak_responses',
};

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedVoice, setSelectedVoiceState] = useState<string | undefined>();
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [autoSpeakResponses, setAutoSpeakResponsesState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [voice, settings, autoSpeak] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_VOICE),
          AsyncStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.AUTO_SPEAK),
        ]);

        if (voice) setSelectedVoiceState(voice);
        if (settings) setVoiceSettingsState(JSON.parse(settings));
        if (autoSpeak !== null) setAutoSpeakResponsesState(autoSpeak === 'true');
      } catch (error) {
        console.warn('Failed to load voice settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const setSelectedVoice = async (voiceId: string | undefined) => {
    setSelectedVoiceState(voiceId);
    try {
      if (voiceId) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_VOICE, voiceId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_VOICE);
      }
    } catch (error) {
      console.warn('Failed to save selected voice:', error);
    }
  };

  const setVoiceSettings = async (settings: VoiceSettings) => {
    setVoiceSettingsState(settings);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save voice settings:', error);
    }
  };

  const setAutoSpeakResponses = async (auto: boolean) => {
    setAutoSpeakResponsesState(auto);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SPEAK, auto ? 'true' : 'false');
    } catch (error) {
      console.warn('Failed to save auto-speak preference:', error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        selectedVoice,
        setSelectedVoice,
        voiceSettings,
        setVoiceSettings,
        autoSpeakResponses,
        setAutoSpeakResponses,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
