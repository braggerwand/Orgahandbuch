import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "./configService";

// Initialisierung des Gemini-Clients gemäß globalen Richtlinien
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sendet eine Anfrage an Gemini Flash für Workspace-Aufgaben.
 * @param prompt Die Benutzereingabe oder der gewählte Prompt.
 * @param contextText Der Inhalt der aktuell bearbeiteten Datei.
 */
export const runGeminiPrompt = async (prompt: string, contextText: string): Promise<string> => {
  try {
    // 1. System-Anweisung dynamisch aus der Konfiguration laden
    const systemInstructionText = await getSystemPrompt();

    // 2. Aufruf der generateContent Methode mit dem empfohlenen Modell 'gemini-3-flash-preview'
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Kontext-Informationen:
        ${contextText}

        Spezifische Aufgabe:
        ${prompt}
      `,
      config: {
        systemInstruction: systemInstructionText,
      }
    });

    // Zugriff auf den generierten Text über das .text Property (nicht als Methode aufrufen)
    return response.text || "Keine Antwort von der KI generiert.";
  } catch (error) {
    console.error("Gemini API Service Fehler:", error);
    return `Fehler bei der KI-Verarbeitung: ${(error as Error).message}`;
  }
};