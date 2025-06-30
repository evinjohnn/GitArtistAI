// src/tools.js
import chalk from 'chalk';
import moment from 'moment';
import { execSync } from 'child_process';
import path from 'path';

import * as githubManager from './github-manager.js';
import * as gitManager from './git-manager.js';
import * as repoManager from './repo-manager.js';
import { patterns, textArt } from './patterns.js';
import { getArtistPixels } from './ai-artist.js'; // We'll move the artist logic to its own file
import { getCanvasStartDate } from './utils.js';

// --- Internal Helper Functions (Moved from old ui.js) ---

function processTextIntent(text) {
  const pixels = [];
  let currentWeekOffset = 0;
  for (const char of text.toUpperCase()) {
    const charData = textArt[char] || textArt[' '];
    if (charData && charData.length > 0) {
      const numRows = charData.length;
      const numCols = charData[0].length;
      for (let col = 0; col < numCols; col++) {
        for (let row = 0; row < numRows; row++) {
          if (charData[row][col] === 1) {
            pixels.push([currentWeekOffset + col, row, 4]);
          }
        }
      }
      currentWeekOffset += numCols + 1;
    }
  }
  return pixels;
}

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


// --- Tool Implementations ---

export const toolImplementations = {
  create_github_repo: async ({ name, isPrivate, description }, isDryRun = false) => {
    if (isDryRun) {
      return `[DRY RUN] Would create ${isPrivate ? 'private' : 'public'} GitHub repo named "${name}".`;
    }
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) throw new Error("GITHUB_PAT is not set in your .env file.");
    const repoUrl = await githubManager.createRepo(name, GITHUB_PAT, isPrivate, description);
    if (!repoUrl) throw new Error(`Failed to create GitHub repo "${name}". It might already exist.`);
    return { name, remoteUrl: repoUrl, localPath: path.join(process.cwd(), name) };
  },

  setup_local_repo: ({ name, remoteUrl, localPath }, isDryRun = false) => {
    if (isDryRun) {
      return `[DRY RUN] Would initialize a local git repo in "${localPath}" and link it to ${remoteUrl}.`;
    }
    const authenticatedUrl = remoteUrl.replace('https://', `https://${process.env.GITHUB_PAT}@`);
    execSync(`git init "${localPath}"`);
    execSync(`git -C "${localPath}" remote add origin "${authenticatedUrl}"`);
    repoManager.addRepository({ name, localPath, remoteUrl });
    return `Successfully set up local repo at ${localPath}. You can now draw in it.`;
  },

  draw_art_in_repo: async ({ localPath, artType, parameters, weekOffset = 1, authorName, authorEmail }, isDryRun = false) => {
    console.log(chalk.blue(`Switching to repository: ${localPath}`));
    process.chdir(localPath);
    
    let pixels = [];
    if (artType === 'text') {
      pixels = processTextIntent(parameters.text);
    } else if (artType === 'known_shape') {
      pixels = processKnownShapeIntent(parameters.name);
    } else if (artType === 'custom_shape') {
      pixels = await getArtistPixels(parameters.description);
    }

    if (pixels.length === 0) return "Could not generate art. No commits were made.";

    const finalPixels = pixels.map(([w, d, density]) => [w + weekOffset, d, density]);
    const startDate = getCanvasStartDate(); // Use the automatic start date
    const authorDetails = { name: authorName, email: authorEmail };
    
    await gitManager.generateCommits(finalPixels, startDate, authorDetails, localPath, isDryRun);

    if (isDryRun) {
        return `[DRY RUN] Would generate commits for art type "${artType}" in repo "${localPath}".`;
    }

    return `Successfully drew "${parameters.text || parameters.name || parameters.description}" and pushed to GitHub.`;
  },

  list_saved_repos: () => {
    const repos = repoManager.getRepositories();
    if (repos.length === 0) {
        return "No saved repositories found. You can create one with the `create_github_repo` tool.";
    }
    return repos;
  },

  wipe_repository: async ({ localPath }, isDryRun = false) => {
    process.chdir(localPath);
    await gitManager.wipeHistory(localPath, isDryRun);
    if(isDryRun) {
        return `[DRY RUN] Would wipe all commit history in repository at ${localPath}.`
    }
    return `Successfully wiped commit history for repository at ${localPath}.`;
  },
};

// --- Tool Schemas (for the AI) ---

export const toolSchemas = [
  {
    name: "create_github_repo",
    description: "Creates a new repository on the user's GitHub account and returns its details. This is the first step for a new project.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "The name for the new repository. Should be a URL-friendly slug." },
        isPrivate: { type: "BOOLEAN", description: "Whether the repository should be private. Defaults to false." },
        description: { type: "STRING", description: "A brief description for the repository."}
      },
      required: ["name", "isPrivate", "description"]
    }
  },
  {
    name: "setup_local_repo",
    description: "Initializes a local git repository in a new directory, links it to the remote GitHub repo, and saves it for future use. This MUST be called after `create_github_repo`.",
    parameters: {
      type: "OBJECT",
      properties: {
          name: {type: "STRING", description: "The name of the repository."},
          remoteUrl: {type: "STRING", description: "The remote URL returned by `create_github_repo`."},
          localPath: {type: "STRING", description: "The local path for the repository returned by `create_github_repo`."}
      },
      required: ["name", "remoteUrl", "localPath"]
    }
  },
  {
    name: "draw_art_in_repo",
    description: "Draws pixel art by generating and pushing git commits to a specified local repository. This is the primary creative tool.",
    parameters: {
      type: "OBJECT",
      properties: {
        localPath: { type: "STRING", description: "The full local path to the repository to draw in. Use `list_saved_repos` to find this." },
        artType: { type: "STRING", description: "The type of art to create. One of 'text', 'known_shape', or 'custom_shape'." },
        parameters: { type: "OBJECT", description: "An object containing the specifics for the art. e.g., `{text: 'hello'}` or `{name: 'star'}` or `{description: 'a cool dragon'}`." },
        weekOffset: { type: "NUMBER", description: "How many weeks (columns) to shift the art to the right. Defaults to 1." },
        authorName: {type: "STRING", description: "The name to use for the git commit author (e.g., 'Your Name')."},
        authorEmail: {type: "STRING", description: "The email to use for the git commit author. MUST be an email associated with the GitHub account."},
      },
      required: ["localPath", "artType", "parameters", "authorName", "authorEmail"]
    }
  },
  {
      name: "list_saved_repos",
      description: "Lists all art repositories that have been previously created and saved by the tool.",
      parameters: { type: "OBJECT", properties: {} }
  },
  {
      name: "wipe_repository",
      description: "A destructive action that completely and irreversibly wipes the entire commit history of a specified repository.",
      parameters: {
          type: "OBJECT",
          properties: {
              localPath: {type: "STRING", description: "The full local path to the repository to wipe."},
          },
          required: ["localPath"]
      }
  }
];