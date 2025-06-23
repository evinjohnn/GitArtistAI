🎨 AI Git Artist: The Definitive Edition

[License: MIT]      [Node.js >= 18]      [Built with Gemini 1.5]

AI Git Artist is a professional-grade command-line tool that transforms your GitHub contribution graph into a canvas for stunning pixel art. Inspired by the legendary gitfiti.py and supercharged with Google’s cutting-edge Gemini 1.5 AI, this tool blends creativity, automation, and reliability into a single CLI experience.

🖼️ Demonstration
----------------
(Insert Demo GIF Here)
A preview of the tool creating a 'rocket' on the command line.

✨ Core Features
---------------
🧠 Ultimate Hybrid Model (Triage AI System)
- Perfect Text Rendering: Uses a deterministic pixel-perfect font engine.
- Reliable Shapes: Uses a library of hand-crafted patterns.
- Creative AI Generation: For custom requests, generates fresh pixel art using Gemini AI.

🎯 gitfiti-Grade Canvas Control
- Auto Date Alignment: Ensures your art starts on the correct date.
- Week Offset: Shift your art left or right for composition.

🎨 Advanced Artistry
- Uses 4 density levels (1–15 commits) for highlights and texture.

🛡️ Safety-First Design
- Undo: Revert your last drawing easily.
- Wipe: Reset your repo safely with confirmation.

🚀 Getting Started
------------------
Prerequisites:
- Node.js v18+
- Git
- Google AI API Key (Get it from Google AI Studio)

1. Clone the Repository:
   git clone https://github.com/your-username/ai-git-artist.git
   cd ai-git-artist

2. Install Dependencies:
   npm install

3. Set Up Environment Variables:
   Create a `.env` file in the root directory:
   GOOGLE_API_KEY=your_key_here

4. Link to an Empty GitHub Repository:
   ⚠️ WARNING: This tool force-pushes and rewrites history. Use only on a dedicated, empty repo.

   git init
   git remote add origin https://github.com/your-username/your-empty-art-repo.git

5. Start the Application:
   npm start

🛠️ How It Works: The Triage Architecture
-----------------------------------------
1. User Input (ui.js): You enter a shape or word.
2. AI Triage (ai.js): Classifies intent:
   - text → use font engine
   - known_shape → from library
   - custom_shape → generate with AI
3. Canvas (ui.js): Renders preview adjusted by offset.
4. Git (git-manager.js): Commits are generated and pushed to GitHub.

📂 File Structure
-----------------
- index.js: Main launcher
- src/ui.js: User interface and logic controller
- src/ai.js: Triage and art generation AI
- src/patterns.js: Pattern + font library
- src/git-manager.js: Handles Git commands and history
- src/utils.js: Helper tools (e.g., start date logic)

🔮 Future Features
------------------
- 🖼️ Image-to-Graffiti: Convert logos/images to commits using Gemini.
- ✍️ Font & Density Options
- 🎨 Terminal Template Painter
- 🌐 Web UI for easy access

🙏 Acknowledgements
-------------------
Thanks to the original gitfiti project by gelstudios for the inspiration.

📜 License
----------
Licensed under the MIT License. See LICENSE file for details.
