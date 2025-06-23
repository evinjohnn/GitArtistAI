// src/git-manager.js
import { writeFile, readFile, rm } from 'fs/promises';
import simpleGit from 'simple-git';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import random from 'random';
import path from 'path';

const DATA_FILE_PATH = 'data.json';
const UNDO_FILE_PATH = '.git/undo_commit_hash.txt';

const densityMap = {
  1: { min: 1, max: 2 }, 2: { min: 3, max: 5 },
  3: { min: 6, max: 9 }, 4: { min: 10, max: 15 },
};

async function makeCommitsOnDate(date, density, authorDetails, git, basePath) {
  const { min, max } = densityMap[density] || densityMap[1];
  const commitCount = random.int(min, max);
  const dateString = date.format('YYYY-MM-DD');
  
  const author = `${authorDetails.name} <${authorDetails.email}>`;

  const dataFilePath = path.join(basePath, DATA_FILE_PATH);

  for (let i = 0; i < commitCount; i++) {
    const commitContent = JSON.stringify({ date: dateString, c: i + 1, r: Math.random() });
    await writeFile(dataFilePath, commitContent);
    await git.add(DATA_FILE_PATH);
    await git.commit(`feat: auto-commit for ${dateString}`, {
      '--date': date.toISOString(),
      '--author': author,
    });
  }
}

export async function generateCommits(pixels, startDate, authorDetails, basePath = process.cwd()) {
  const git = simpleGit({ baseDir: basePath });

  if (!pixels || pixels.length === 0) {
    console.log(chalk.yellow('No pixels to draw. Nothing to commit.'));
    return;
  }
  
  const commitsToMake = pixels.map(([week, day, density]) => {
    const date = startDate.clone().add(week, 'weeks').add(day, 'days');
    return { date, density };
  });

  const progressBar = new cliProgress.SingleBar({
    format: chalk.cyan('Painting Commits |') + '{bar}' + chalk.cyan('| {percentage}% || {value}/{total} Days'),
    barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
  });
  
  progressBar.start(commitsToMake.length, 0);
  for (const { date, density } of commitsToMake) {
    await makeCommitsOnDate(date, density, authorDetails, git, basePath);
    progressBar.increment();
  }
  progressBar.stop();
  
  console.log(chalk.bold.yellow('\nPushing to remote...'));
  try {
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    await git.push(['-u', 'origin', currentBranch, '--force']);
    console.log(chalk.bold.green.inverse('✅ Success! Your GitHub graph will update shortly.'));
  } catch (error) {
    console.error(chalk.red('Failed to push to GitHub. This can happen due to network issues or incorrect repository permissions.'));
    console.error(chalk.gray('Error details:'), error.message);
  }
}

export async function saveUndoPoint(basePath = process.cwd()) {
  const git = simpleGit({ baseDir: basePath });
  const undoFilePath = path.join(basePath, UNDO_FILE_PATH);
  try {
    const log = await git.log(['-1', '--pretty=%H']);
    await writeFile(undoFilePath, log.latest.hash);
    console.log(chalk.gray(`Undo point saved at commit ${log.latest.hash.substring(0, 7)}.`));
  } catch (err) {
    try {
      await writeFile(undoFilePath, 'initial');
    } catch (writeErr) {
      console.error(chalk.red("Error: Could not write undo point file. Check permissions."), writeErr);
    }
  }
}

export async function performUndo(basePath = process.cwd()) {
  const git = simpleGit({ baseDir: basePath });
  const undoFilePath = path.join(basePath, UNDO_FILE_PATH);
  try {
    const commitHash = await readFile(undoFilePath, 'utf-8');
    if (commitHash === 'initial') throw new Error("This is the first action; nothing to undo.");
    
    console.log(chalk.yellow(`Resetting repository to commit ${commitHash.substring(0, 7)}...`));
    await git.reset(['--hard', commitHash]);
    
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    await git.push('origin', currentBranch, { '--force': true });

    await rm(undoFilePath);
    console.log(chalk.green.inverse('✅ Undo successful.'));
  } catch (error) {
    console.error(chalk.red('Failed to perform undo:'), error.message);
  }
}

export async function wipeHistory(basePath = process.cwd()) {
  const git = simpleGit({ baseDir: basePath });
  const dataFilePath = path.join(basePath, DATA_FILE_PATH);
  console.log(chalk.red.bold('\nThis will delete the ENTIRE commit history of this repository.'));
  
  try {
    try {
      await git.branch(['-D', 'temp-branch']);
    } catch (e) { /* This is okay */ }

    let primaryBranch;
    try {
      primaryBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    } catch (e) {
      primaryBranch = 'main'; 
    }
    
    await git.checkout({ '--orphan': 'temp-branch' });
    
    await writeFile(dataFilePath, JSON.stringify({ reset: new Date().toISOString() }));
    await git.add(DATA_FILE_PATH);
    await git.commit('chore: repository reset');

    if (primaryBranch) {
      try {
        await git.branch(['-D', primaryBranch]);
      } catch(e) { /* This is okay */ }
    }

    await git.branch(['-m', 'main']);

    await git.push('origin', 'main', { '--force': true });
    
    console.log(chalk.bold.green.inverse('✅ Repository has been successfully wiped.'));
  } catch (error) {
    console.error(chalk.red('Failed to wipe repository:'), error.message);
  }
}