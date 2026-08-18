import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const models = ['gemini-flash-latest'];
  
  for (const m of models) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: 'hi',
      });
      console.log(m, "WORKS!");
    } catch (e) {
      console.log(m, "FAILED:", e.message);
    }
  }
}
listModels();
