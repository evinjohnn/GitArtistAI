🎨 AI Git Artist: The Definitive Edition

![npm version](https://img.shields.io/npm/v/@evinjohn/ai-git-artist.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Built with Gemini 1.5](https://img.shields.io/badge/Built%20with-Gemini%201.5-blueviolet)

AI Git Artist is a professional-grade command-line tool that transforms your GitHub contribution graph into a canvas for stunning pixel art. It automates everything from repository creation to the final commit push, allowing you to focus purely on the creative process.

This project is directly inspired by the legendary `gitfiti.py` while being powered by Google's cutting-edge Gemini 1.5 AI model.

[DEMO]
---------------
(A demonstration of the tool's automated repository creation and text-to-art workflow)
https://i.imgur.com/G5g2fN7.gif

✨ Features Spotlight
---------------------

🧠 Intelligent Art Generation
-----------------------------
- Hybrid AI Triage System: Analyzes your request and chooses the best rendering path.
- Pixel-Perfect Text Engine: Uses a deterministic 7-pixel-high font for clean typography.
- Curated Pattern Library: Includes high-quality, hand-crafted shapes like "star" or "kitty".
- Generative AI Creativity: Produces brand new pixel art (e.g. "helicopter", "dragon") with AI refinement.

🚀 Workflow & Automation
------------------------
- Fully Automated Setup: Creates GitHub repo, links it, initializes locally — all automatically.
- Persistent Repo Manager: Easily access previously created art repos.
- Automated Authentication: Handles GitHub push/pull using your PAT without credential conflicts.

🎨 Creative Control & Precision
-------------------------------
- Flexible Date Control: Align art with the real GitHub graph start date or use custom dates.
- Canvas Positioning: Offset your creation left or right using "Week Offset".
- Multi-Level Density: Uses 1–15+ commits/day to simulate shading and highlights.

🛡️ Safety & Convenience
------------------------
- Undo Last Action: Revert a drawing with a simple menu option.
- Resilient Wipe History: Clean slate with a double-confirmed reset, handles edge cases.
- Public/Private Mode: Choose repo visibility on creation.

📦 Installation & Usage
-----------------------

Quick Start (Recommended for Users)
Install globally via npm:

    npm install -g @evinjohn/ai-git-artist

One-Time API Key Setup
On first run, it will prompt you to create a .env file.

1. Get Your Keys:
   - Google API Key → from Google AI Studio
   - GitHub PAT → from GitHub Developer Settings (classic token with `repo` scope)

2. Create Config File:
   You'll be told the path (e.g. ~/.config/ai-git-artist/.env). Add:

    GOOGLE_API_KEY=your_google_key_here
    GITHUB_PAT=your_github_pat_here

3. Run the Artist:

    ai-git-artist

You're ready to create art!

Developer Setup (Manual)

1. Clone the repository:

    git clone https://github.com/evinjohnn/GitArtistAI.git
    cd GitArtistAI

2. Install dependencies:

    npm install

3. Create .env in root directory:

    GOOGLE_API_KEY=your_google_key_here
    GITHUB_PAT=your_github_pat_here

4. Start the app:

    npm start

The tool will launch with full source control.

🙏 Inspiration
--------------
Special thanks to `gelstudios/gitfiti` for the original concept. This modern version extends that legacy with AI generation and full GitHub automation.

📜 License
----------
This project is licensed under the MIT License.