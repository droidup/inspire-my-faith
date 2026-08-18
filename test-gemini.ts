import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: "Testing",
    });
    console.log("SUCCESS:", response.text);
  } catch (e) {
    console.error("FAIL:", e);
  }
}
test();
