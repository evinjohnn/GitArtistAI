// src/ai-artist.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const artistSystemPrompt = `
You are a master pixel artist. Your task is to transform a textual description into a pixel art masterpiece for a GitHub contribution graph.

**CANVAS & COORDINATE SYSTEM:**
- The canvas is a 7-day high grid ('d', 0=Sun to 6=Sat).
- Your output **MUST** be a single, valid JSON object with one key: "pixels".
- "pixels": An array of \`[w, d, density]\` coordinates (w=week, d=day, density=1-4).

**ARTISTIC PRINCIPLES:**
- **Shading is Key:** Use a mix of all four density levels (1-4) to create depth and highlights.
- **Composition:** Keep drawings compact and recognizable (e.g., 10-25 weeks wide).
- **Interpret Creatively:** Transform the description into compelling art.

Your entire response must be ONLY the JSON object. It must start with \`{\` and end with \`}\`. Do not add markdown backticks.
`;

export async function getArtistPixels(description) {
  console.log(chalk.blue('...Engaging generative artist for custom shape...'));
  const result = await model.generateContent([artistSystemPrompt, `User Request: "${description}"`]);
  const response = await result.response;
  const rawResponseText = response.text();
  
  // A more robust JSON extraction
  const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Generative artist failed to produce valid JSON pixel data.");
  
  try {
    const parsedJson = JSON.parse(jsonMatch[0]);
    return parsedJson.pixels || [];
  } catch (e) {
    console.error(chalk.red("Error parsing artist's JSON response."), e);
    return []; // Return empty array on parse failure
  }
}