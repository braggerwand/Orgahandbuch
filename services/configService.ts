import { fetchAndActivate, getValue } from "firebase/remote-config";
import { remoteConfig } from "./firebase";

// Default prompt used if offline or key is missing
const DEFAULT_SYSTEM_PROMPT = `
Du bist ein hilfreicher Assistent für die Kanzlei Kiefer & Kollegen. 
Antworte professionell, präzise und im Kontext von Immobilienbewertung und Büroorganisation.
`.trim();

const REMOTE_CONFIG_KEY = "ai_system_prompt";

export const getSystemPrompt = async (): Promise<string> => {
  // Defensive check: If Firebase failed to init, return default immediately
  if (!remoteConfig) {
    console.log("Using local default prompt (Firebase not configured)");
    return DEFAULT_SYSTEM_PROMPT;
  }

  try {
    // Activate default values first to ensure we always have something
    remoteConfig.defaultConfig = {
      [REMOTE_CONFIG_KEY]: DEFAULT_SYSTEM_PROMPT,
    };

    // Attempt to fetch and activate remote values
    await fetchAndActivate(remoteConfig);
    
    const val = getValue(remoteConfig, REMOTE_CONFIG_KEY);
    return val.asString();

  } catch (error) {
    console.warn("Failed to fetch remote config, using default/cached value:", error);
    // Return default/cached value on error
    const val = getValue(remoteConfig, REMOTE_CONFIG_KEY);
    return val.asString() || DEFAULT_SYSTEM_PROMPT;
  }
};