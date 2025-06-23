#!/usr/bin/env node

// index.js
import 'dotenv/config'; 
import { startChat } from './src/ui.js';
import chalk from 'chalk';

// --- ADD THIS ROBUST CHECK ---
if (!process.env.GOOGLE_API_KEY) {
  console.error(chalk.red.bold('\nFATAL ERROR: GOOGLE_API_KEY is not set in your .env file.'));
  console.error(chalk.yellow('Please follow these steps:'));
  console.error('1. Get a key from https://aistudio.google.com/app/apikey');
  console.error('2. Create a file named .env in the project root.');
  console.error('3. Add this line to the .env file: GOOGLE_API_KEY=your_key_here');
  process.exit(1); // Stop the application
}
// --- END OF CHECK ---

console.log(chalk.bold.green('🎨 Welcome to the AI Git Artist!'));
console.log(chalk.yellow('A professional tool to paint your GitHub contribution graph.\n'));

startChat();