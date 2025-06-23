// src/repo-manager.js
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

// A consistent, cross-platform path for our config file.
const CONFIG_DIR = path.join(os.homedir(), '.config', 'ai-git-artist');
const REPO_FILE_PATH = path.join(CONFIG_DIR, 'repositories.json');

/**
 * Reads the list of saved repositories from the JSON file.
 * @returns {Array<object>} An array of repository objects.
 */
export function getRepositories() {
  if (!existsSync(REPO_FILE_PATH)) {
    return []; // No file means no repositories saved yet.
  }
  try {
    const fileContent = readFileSync(REPO_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(chalk.red('Warning: Could not read or parse repositories.json. It might be corrupted.'), error);
    return [];
  }
}

/**
 * Adds a new repository to the JSON file.
 * @param {object} repoData - Object containing { name, localPath, remoteUrl }.
 */
export function addRepository(repoData) {
  const repos = getRepositories();
  
  // Avoid duplicates
  if (repos.some(repo => repo.localPath === repoData.localPath)) {
    return;
  }

  repos.push(repoData);

  try {
    // Ensure the config directory exists.
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(REPO_FILE_PATH, JSON.stringify(repos, null, 2));
    console.log(chalk.gray(`Saved repository "${repoData.name}" to your list for future use.`));
  } catch (error) {
    console.error(chalk.red('Error: Could not save repository to the list.'), error);
  }
}