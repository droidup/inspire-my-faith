import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    for await (const model of response) {
      console.log(model.name);
    }
  } catch (e) {
    console.error("FAIL:", e);
  }
}
test();
