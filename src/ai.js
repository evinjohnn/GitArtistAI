// src/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import { patterns, textArt } from './patterns.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const availablePatterns = Object.keys(patterns).join(', ');

// This is the new, definitive "Triage" system prompt.
const systemPrompt = `
You are an expert "Triage System" for the 'Git Artist' CLI. Your only job is to analyze the user's request and determine its INTENT. You must classify the request into one of three categories: "text", "known_shape", or "custom_shape".

**INTENT CATEGORIES & JSON OUTPUT:**

1.  **Intent: "text"**
    - **Trigger:** The user wants to write a word, name, or any sequence of letters/numbers. Look for phrases like "write", "spell", "the word", "my name", or if the prompt is just a name like "evin".
    - **JSON Output:**
      \`\`\`json
      { "intent": "text", "plan": "Rendering the text '{text}'.", "parameters": { "text": "{text_to_render}" } }
      \`\`\`

2.  **Intent: "known_shape"**
    - **Trigger:** The user's request clearly matches a shape from your known library.
    - **Your Library of Known Shapes:** \`${availablePatterns}\`
    - **JSON Output:**
      \`\`\`json
      { "intent": "known_shape", "plan": "Using the pre-made '{shape_name}' pattern.", "parameters": { "name": "{shape_name}" } }
      \`\`\`

3.  **Intent: "custom_shape"**
    - **Trigger:** The request is for a shape that is NOT text and is NOT in your known shapes library (e.g., "a helicopter", "a tiger", "a boat").
    - **JSON Output:**
      \`\`\`json
      { "intent": "custom_shape", "plan": "Generating a custom pixel art of a {description}.", "parameters": { "description": "{user_prompt}" } }
      \`\`\`

**ABSOLUTE RULES:**
- You MUST determine the user's primary intent.
- If a request is "draw a star", the intent is "known_shape", name "star".
- If a request is "evin", the intent is "text", text "evin".
- If a request is "a dragon", the intent is "custom_shape", description "a dragon".
- Your entire response MUST be only the single, valid JSON object corresponding to your decision.
`;

// This is a separate, dedicated prompt for when the AI needs to be a creative artist.
const artistSystemPrompt = `
You are a master pixel artist. Your task is to transform a textual description into a beautiful, shaded pixel art masterpiece for a GitHub contribution graph.

**CANVAS & COORDINATE SYSTEM:**
- The canvas is a 7-day high grid ('d', 0=Sun to 6=Sat).
- Your output **MUST** be a single, valid JSON object with one key: "pixels".
- "pixels": An array of \`[w, d, density]\` coordinates (w=week, d=day, density=1-4).

**ARTISTIC PRINCIPLES:**
- **Shading is Key:** Use a mix of all four density levels (1-4) to create depth and highlights.
- **Composition:** Keep drawings compact and recognizable (e.g., 10-25 weeks wide).
- **Interpret Creatively:** Transform the description into compelling art.

Your entire response must be ONLY the JSON object. It must start with \`{\` and end with \`}\`.
`;

export async function getArtistPixels(description) {
  console.log(chalk.blue('...Engaging generative artist for custom shape...'));
  const result = await model.generateContent([artistSystemPrompt, `User Request: "${description}"`]);
  const response = await result.response;
  const rawResponseText = response.text();
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

export async function getAiCommand(userInput) {
  const result = await model.generateContent([systemPrompt, `User Request: "${userInput}"`]);
  const response = await result.response;
  const rawResponseText = response.text();
  const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Triage AI failed to produce a valid JSON command.");
  
  const command = JSON.parse(jsonMatch[0]);

  // If the AI decides on a custom shape, we make a second, dedicated call to the "artist" AI.
  // This first call acts as a preview for the user.
  if (command.intent === 'custom_shape') {
    command.parameters.pixels = await getArtistPixels(command.parameters.description);
  }

  return command;
}