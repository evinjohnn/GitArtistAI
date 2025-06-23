#!/usr/bin/env node

// index.js
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { startChat } from './src/ui.js';
import chalk from 'chalk';

// --- START: New Global Config Logic ---

// Define the path for the global config file.
const configDir = path.join(os.homedir(), '.config', 'ai-git-artist');
const configPath = path.join(configDir, '.env');

// Load the configuration from the global path.
dotenv.config({ path: configPath });

// --- END: New Global Config Logic ---


// --- Modify the API Key check to give better instructions ---
if (!process.env.GOOGLE_API_KEY || !process.env.GITHUB_PAT) {
  console.error(chalk.red.bold('\nFATAL ERROR: API Keys are not configured.'));
  console.error(chalk.yellow('Please follow these one-time setup steps:'));
  
  if (!fs.existsSync(configDir)) {
      console.log(chalk.cyan(`1. Creating configuration directory: ${configDir}`));
      fs.mkdirSync(configDir, { recursive: true });
  }
  
  console.log(chalk.cyan(`2. Create or open this file: ${configPath}`));
  console.log(chalk.cyan('3. Add your keys to the file like this:'));
  console.log(chalk.whiteBright('\nGOOGLE_API_KEY=your_google_key_here\nGITHUB_PAT=your_github_pat_here\n'));
  console.error(chalk.yellow('Get your keys from Google AI Studio and GitHub Developer Settings.'));
  process.exit(1); // Stop the application
}
// --- END of modified check ---

console.log(chalk.bold.green('🎨 Welcome to the AI Git Artist!'));
console.log(chalk.yellow('A professional tool to paint your GitHub contribution graph.\n'));

startChat();