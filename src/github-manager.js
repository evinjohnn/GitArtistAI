// src/github-manager.js
import axios from 'axios';
import chalk from 'chalk';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Creates a new repository on the user's GitHub account.
 * @param {string} repoName The name for the new repository.
 * @param {string} pat The user's Personal Access Token.
 * @param {boolean} isPrivate Whether the repository should be private.
 * @returns {Promise<string|null>} The HTTPS URL of the new repository, or null on failure.
 */
export async function createRepo(repoName, pat, isPrivate) {
  const privacy = isPrivate ? 'private' : 'public';
  console.log(chalk.blue(`\nCreating new ${privacy} GitHub repository named "${repoName}"...`));

  try {
    const response = await axios.post(
      `${GITHUB_API_URL}/user/repos`,
      {
        name: repoName,
        description: 'AI-generated art for my contribution graph, created with AI Git Artist.',
        private: isPrivate,
        auto_init: false,
      },
      {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.status === 201) {
      const repoUrl = response.data.clone_url;
      console.log(chalk.green.bold(`✅ Successfully created repository: ${repoUrl}`));
      return repoUrl;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        console.error(chalk.red.bold('Error: GitHub authentication failed. Your Personal Access Token is likely invalid or expired.'));
      } else if (error.response.status === 422) {
        console.error(chalk.red.bold(`Error: Could not create repository. A repository named "${repoName}" likely already exists on your account.`));
      } else {
        console.error(chalk.red(`GitHub API Error: ${error.response.status} - ${error.response.data.message}`));
      }
    } else {
      console.error(chalk.red('An unexpected network error occurred:'), error.message);
    }
    return null;
  }
}