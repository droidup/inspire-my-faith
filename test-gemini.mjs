import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/DWC_WORK/Work Files/My Sync Cloud/Wordpress/Web/inspiremyfaith.com/inspire-my-faith 08-05-2026/.env' });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key found in .env");
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e.message || e);
  }
}

testGemini();
