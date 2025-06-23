// src/ui.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import moment from 'moment';
import { getAiCommand, getArtistPixels } from './ai.js';
import { patterns, textArt } from './patterns.js';
import { getCanvasStartDate } from './utils.js';
import * as gitManager from './git-manager.js';
import * as githubManager from './github-manager.js';
import { existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// =============================================================================
// HELPER FUNCTIONS & CONSTANTS
// =============================================================================

/**
 * A map to render different densities with different colors/styles for a better preview.
 * THIS IS THE LINE THAT WAS FIXED.
 */
const DENSITY_COLOR_MAP = {
  1: chalk.green,
  2: chalk.greenBright,
  3: chalk.bold.green, // CORRECTED: Changed '.' to ':'
  4: chalk.white.bgGreen,
};

/**
 * Renders a beautiful, multi-density preview of the pixel art in the terminal.
 * @param {Array<[number, number, number]>} pixels - The array of [week, day, density] coordinates.
 */
function renderPreview(pixels) {
  if (!pixels || pixels.length === 0) {
    console.log(chalk.yellow('No pixels to preview for this drawing.'));
    return;
  }
  const maxWeek = Math.max(0, ...pixels.map(([w]) => w));
  const grid = Array.from({ length: 7 }, () => Array(maxWeek + 1).fill(0));
  for (const [w, d, density] of pixels) {
    if (d >= 0 && d < 7 && w >= 0 && w <= maxWeek) {
      grid[d][w] = density;
    }
  }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  console.log(chalk.yellow.bold('\n--- Drawing Preview ---'));
  grid.forEach((row, index) => {
    const coloredRow = row.map(d => d > 0 ? (DENSITY_COLOR_MAP[d] || chalk.green)('■') : chalk.dim('·')).join(' ');
    console.log(`${chalk.gray(days[index])} | ${coloredRow}`);
  });
  console.log(chalk.yellow.bold('-----------------------\n'));
}

/**
 * Deterministically converts text to pixel data using the font library.
 * @param {string} text The text to render.
 * @returns {Array<[number, number, number]>} Pixel data.
 */
function processTextIntent(text) {
  const pixels = [];
  let currentWeekOffset = 0;
  for (const char of text.toUpperCase()) {
    const charData = textArt[char] || textArt[' '];
    if (charData) {
      for (let week = 0; week < charData.length; week++) {
        for (let day = 0; day < charData[week].length; day++) {
          if (charData[week][day] === 1) {
            pixels.push([currentWeekOffset + week, day, 4]); // Draw text at max density
          }
        }
      }
      currentWeekOffset += charData.length + 1;
    }
  }
  return pixels;
}

/**
 * Retrieves pixel data for a known shape from the pattern library.
 * @param {string} name The name of the shape.
 * @returns {Array<[number, number, number]>} Pixel data.
 */
function processKnownShapeIntent(name) {
  const patternData = patterns[name];
  if (!patternData) return [];
  const pixels = [];
  for (let day = 0; day < patternData.length; day++) {
    for (let week = 0; week < patternData[day].length; week++) {
      const density = patternData[day][week];
      if (density > 0) {
        pixels.push([week, day, density]);
      }
    }
  }
  return pixels;
}

// =============================================================================
// REFACTORED MAIN WORKFLOW
// =============================================================================

/**
 * This function contains the core logic for prompting the user for art,
 * getting AI feedback, and committing the final art. It's refactored
 * to be callable from multiple workflows.
 */
async function promptForArtAndCommit() {
    let finalStartDate;
    const { dateMethod } = await inquirer.prompt([{
      type: 'list',
      name: 'dateMethod',
      message: 'How do you want to position your art on the timeline?',
      choices: [
        { name: 'Automatic (Aligns with the start of your GitHub graph)', value: 'auto' },
        { name: 'Set a specific start date (YYYY-MM-DD)', value: 'specific' },
      ],
    }]);

    if (dateMethod === 'auto') {
      finalStartDate = getCanvasStartDate();
      console.log(chalk.blue(`Aligning art with graph start date: ${finalStartDate.format('YYYY-MM-DD')}`));
    } else {
      const { specificDate } = await inquirer.prompt([{
        type: 'input',
        name: 'specificDate',
        message: 'Enter the start date (e.g., 2024-01-20):',
        validate: input => {
          if (moment(input, 'YYYY-MM-DD', true).isValid()) {
            return true;
          }
          return 'Please enter a valid date in YYYY-MM-DD format.';
        },
      }]);
      finalStartDate = moment(specificDate, 'YYYY-MM-DD').startOf('week');
      console.log(chalk.blue(`Art will begin on the week of your specified date, starting on Sunday: ${finalStartDate.format('YYYY-MM-DD')}`));
    }

    const { weekOffset } = await inquirer.prompt([{
        type: 'input', name: 'weekOffset',
        message: 'Enter week offset (how many columns to shift right):',
        default: '1',
        validate: input => !isNaN(parseInt(input, 10)) || 'Please enter a valid number.',
    }]);
    const offset = parseInt(weekOffset, 10);

    // --- NEW: Prompt for Author Details ---
    console.log(chalk.bold.cyan('\nPlease provide the author details for the commits.'));
    console.log(chalk.gray('This email MUST be associated with the target GitHub account.'));

    const { authorName } = await inquirer.prompt([{
      type: 'input',
      name: 'authorName',
      message: 'Enter the Git author name (e.g., "Your Name"):'
    }]);

    const { authorEmail } = await inquirer.prompt([{
      type: 'input',
      name: 'authorEmail',
      message: 'Enter the Git author email:'
    }]);
    // --- END: New Prompt ---

    const { initialPrompt } = await inquirer.prompt([{ type: 'input', name: 'initialPrompt', message: 'Describe what you want to create (e.g., "star", "evin", "a helicopter"):' }]);
    const userInput = initialPrompt;

    console.log(chalk.gray('\n🤖 Triage AI is analyzing your request...'));
    const command = await getAiCommand(userInput);
    
    console.log(chalk.green.bold('\nAI Plan:'));
    console.log(chalk.white(command.plan));

    let processedPixels = [];
    switch (command.intent) {
      case 'text':
        processedPixels = processTextIntent(command.parameters.text);
        break;
      case 'known_shape':
        processedPixels = processKnownShapeIntent(command.parameters.name);
        break;
      case 'custom_shape':
        let satisfied = false;
        let currentDescription = command.parameters.description;
        let aiPixels = command.parameters.pixels; // Use the pixels from the initial triage call first

        while (!satisfied) {
          processedPixels = aiPixels;
          renderPreview(processedPixels.map(([w, d, density]) => [w + offset, d, density]));

          if (processedPixels.length === 0) {
            console.log(chalk.yellow("The artist couldn't create a drawing. Please try being more descriptive."));
            return;
          }

          const { feedback } = await inquirer.prompt([{
            type: 'list',
            name: 'feedback',
            message: 'How does the generated art look?',
            choices: [
              { name: '✅ Looks great, proceed!', value: 'proceed' },
              { name: '🤔 Let\'s refine this...', value: 'refine' },
              { name: '❌ Cancel this drawing', value: 'cancel' },
            ]
          }]);

          if (feedback === 'proceed') {
            satisfied = true;
          } else if (feedback === 'cancel') {
            console.log(chalk.red('Operation cancelled.'));
            return;
          } else { // 'refine'
            const { refinement } = await inquirer.prompt([{
              type: 'input',
              name: 'refinement',
              message: "What should I change? (e.g., 'make it wider', 'add more spikes')"
            }]);
            currentDescription = `${currentDescription}, but ${refinement}`;
            // Re-run just the artist AI with the new description
            aiPixels = await getArtistPixels(currentDescription); 
          }
        }
        break;
      default:
        console.error(chalk.red(`Unknown AI intent: ${command.intent}`));
        return;
    }
    
    const finalPixels = processedPixels.map(([w, d, density]) => [w + offset, d, density]);
    
    if (command.intent !== 'custom_shape') {
        renderPreview(finalPixels);
    }

    if (finalPixels.length === 0) {
        console.log(chalk.yellow("The artist couldn't create a drawing for that request. Please try being more descriptive."));
        return;
    }

    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Looks good, create the commits?',
        default: true,
    }]);

    if (confirm) {
      const currentPath = process.cwd();
      await gitManager.saveUndoPoint(currentPath);
      await gitManager.generateCommits(finalPixels, finalStartDate, { name: authorName, email: authorEmail }, currentPath);
    } else {
      console.log(chalk.red('Operation cancelled.'));
    }
}

async function handleNewRepoWorkflow() {
  if (!process.env.GITHUB_PAT) {
    console.error(chalk.red.bold('\nFATAL ERROR: GITHUB_PAT is not set in your .env file.'));
    console.error(chalk.yellow('To use this feature, please follow these steps:'));
    console.error('1. Go to https://github.com/settings/tokens/new');
    console.error('2. Give the token a name (e.g., "ai-git-artist-token").');
    console.error('3. Set an expiration date.');
    console.error('4. Under "Repository permissions", grant it the "repo" scope (full control of repositories).');
    console.error('5. Click "Generate token" and copy it.');
    console.error('6. Add this line to your .env file: GITHUB_PAT=your_new_token');
    return;
  }
  
  const { repoName } = await inquirer.prompt([{
      type: 'input',
      name: 'repoName',
      message: 'Enter a name for your new GitHub repository:',
      validate: input => input.length > 0 || 'Repository name cannot be empty.'
  }]);

  // --- NEW PROMPT FOR PRIVACY ---
  const { isPrivate } = await inquirer.prompt([{
      type: 'confirm',
      name: 'isPrivate',
      message: 'Should this new repository be private? (Note: You must enable "private contributions" in your GitHub profile settings to see the graph)',
      default: false // Default to public, which is safer for visibility
  }]);
  // --- END OF NEW PROMPT ---

  // --- MODIFY: Pass the isPrivate flag to the createRepo function ---
  const repoUrl = await githubManager.createRepo(repoName, process.env.GITHUB_PAT, isPrivate);

  if (!repoUrl) {
    console.log(chalk.red('\nFailed to create repository. Please check the errors above. Aborting.'));
    return;
  }

  // --- AUTOMATE LOCAL SETUP ---
  const localRepoPath = path.join(process.cwd(), repoName);
  if (existsSync(localRepoPath)) {
    console.error(chalk.red.bold(`\nA directory named "${repoName}" already exists here. Please remove it or choose a different name.`));
    return;
  }

  console.log(chalk.blue(`Setting up local directory at: ${localRepoPath}`));
  mkdirSync(localRepoPath);
  process.chdir(localRepoPath); // IMPORTANT: Change the current directory to the new folder

  try {
      execSync('git init');
      execSync(`git remote add origin ${repoUrl}`);
      console.log(chalk.green('✅ Local repository initialized and linked to GitHub.'));
  } catch (e) {
      console.error(chalk.red('Failed to initialize local git repository.'), e);
      return;
  }
  
  // Now that we are in a configured repo, run the drawing workflow
  await promptForArtAndCommit();
}

// This is the old workflow, now renamed
async function handleExistingRepoWorkflow() {
    console.log(chalk.cyan('\nThis requires you to be inside a local, empty git repository that is already linked to GitHub.'));
    await promptForArtAndCommit();
}

// =============================================================================
// UPDATED MAIN MENU
// =============================================================================
export async function startChat() {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list', name: 'action', message: 'What would you like to do?',
        choices: [
          // --- NEW MENU OPTIONS ---
          { name: '✨ Create New Art Repository & Draw (Recommended)', value: 'new_repo' },
          { name: '🎨 Draw in Existing Local Repository', value: 'existing_repo' },
          new inquirer.Separator(),
          { name: '↩️  Undo Last Action (in current repo)', value: 'undo' },
          { name: '💥 Wipe All Commit History (in current repo)', value: 'wipe' },
          { name: '🚪 Exit', value: 'exit' },
        ],
      },
    ]);
    try {
      switch (action) {
        // --- NEW HANDLERS ---
        case 'new_repo': await handleNewRepoWorkflow(); break;
        case 'existing_repo': await handleExistingRepoWorkflow(); break;
        case 'undo': await handleUndoRequest(); break;
        case 'wipe': await handleWipeRequest(); break;
        case 'exit': console.log(chalk.yellow('Happy painting!')); return;
      }
    } catch (error) {
      console.error(chalk.red.bold('\nAn unexpected error occurred:'), error.message);
    }
    console.log('\n');
  }
}

async function handleWipeRequest() {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: chalk.red.bold('Are you ABSOLUTELY SURE you want to wipe the ENTIRE commit history? This is irreversible.'),
    default: false,
  }]);
  if (confirm) await gitManager.wipeHistory(process.cwd());
  else console.log(chalk.yellow('Wipe operation cancelled.'));
}

async function handleUndoRequest() {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: 'Are you sure you want to undo the last action?',
    default: true,
  }]);
  if (confirm) await gitManager.performUndo(process.cwd());
  else console.log(chalk.yellow('Undo operation cancelled.'));
}