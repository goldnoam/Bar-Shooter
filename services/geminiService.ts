
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Implemented dynamic gossip generation using Gemini API as per coding guidelines.
export const getSaloonGossip = async (score: number, level: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a bartender in a Wild West saloon. A customer just shot bottles in your saloon.
      Final Score: ${score}
      Level reached: ${level}
      Give a short, funny, 1-sentence gossip or reaction in Hebrew about their shooting skills.
      Keep it short, thematic, and in character.`,
    });
    return response.text?.trim() || "לא רע בכלל עבור עירוני שכמוך...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "לא רע בכלל עבור עירוני שכמוך...";
  }
};
