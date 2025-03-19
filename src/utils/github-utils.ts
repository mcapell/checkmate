import { handleGitHubError } from './error-handler';

/**
 * GitHub repository information extracted from URL
 */
export interface RepoInfo {
  owner: string;
  repo: string;
  prNumber?: number;
  isValid: boolean;
}

/**
 * Regular expression to match GitHub pull request URLs
 * Pattern: https://github.com/{owner}/{repo}/pull/{number}
 */
const PR_URL_REGEX = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;

/**
 * Regular expression to match GitHub repository URLs
 * Pattern: https://github.com/{owner}/{repo}
 */
const REPO_URL_REGEX = /github\.com\/([^\/]+)\/([^\/]+)(?:\/|$)/;

/**
 * Extracts repository and PR information from a GitHub URL
 * 
 * @param url - The URL to extract information from
 * @returns Repository information object
 */
export function extractRepoInfoFromUrl(url: string): RepoInfo {
  try {
    if (!url || typeof url !== 'string') {
      throw handleGitHubError(
        'Invalid URL provided',
        { url },
        ['Ensure you are on a valid GitHub page'],
        false
      );
    }

    // Try to match as a pull request URL first
    const prMatch = url.match(PR_URL_REGEX);
    if (prMatch) {
      return {
        owner: prMatch[1],
        repo: prMatch[2],
        prNumber: parseInt(prMatch[3], 10),
        isValid: true,
      };
    }

    // Fall back to matching as a repository URL
    const repoMatch = url.match(REPO_URL_REGEX);
    if (repoMatch) {
      return {
        owner: repoMatch[1],
        repo: repoMatch[2],
        isValid: true,
      };
    }

    // Return invalid info if no match
    console.warn('URL does not match GitHub repo or PR pattern:', url);
    return {
      owner: '',
      repo: '',
      isValid: false,
    };
  } catch (error) {
    // If it's already an ExtensionError, re-throw it
    if ((error as any).category) {
      throw error;
    }
    
    const errorDetails = {
      url,
      error: error instanceof Error ? error.message : String(error),
    };
    
    console.error('Failed to extract repository information from URL:', errorDetails);
    
    throw handleGitHubError(
      'Failed to extract repository information from URL',
      errorDetails,
      [
        'Make sure you are on a valid GitHub repository or pull request page',
        'Check that the URL format is correct',
        'Try refreshing the page'
      ],
      false
    );
  }
}

/**
 * Generates a unique identifier for a pull request
 * Format: {owner}/{repo}#{number}
 * 
 * @param repoInfo - Repository information with PR number
 * @returns Unique PR identifier string or null if invalid
 */
export function generatePrIdentifier(repoInfo: RepoInfo): string | null {
  try {
    const { owner, repo, prNumber, isValid } = repoInfo;
    
    if (!isValid || !owner || !repo) {
      console.warn('Cannot generate PR identifier from invalid repo info:', repoInfo);
      return null;
    }

    if (prNumber) {
      return `${owner}/${repo}#${prNumber}`;
    }

    // Return repository identifier without PR number
    return `${owner}/${repo}`;
  } catch (error) {
    console.error('Failed to generate PR identifier:', {
      repoInfo,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return null;
  }
}

/**
 * Determines if the current page is a GitHub pull request page
 * 
 * @param url - The URL to check
 * @returns True if the URL is a GitHub PR page
 */
export function isGitHubPrPage(url: string): boolean {
  try {
    return PR_URL_REGEX.test(url);
  } catch (error) {
    console.warn('Error checking if URL is GitHub PR page:', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Extracts the repository and PR information from the current page URL
 * 
 * @returns Repository information object
 */
export function getCurrentRepoInfo(): RepoInfo {
  try {
    return extractRepoInfoFromUrl(window.location.href);
  } catch (error) {
    console.error('Failed to get current repo info:', error);
    return {
      owner: '',
      repo: '',
      isValid: false,
    };
  }
}

/**
 * Gets the PR identifier for the current page
 * 
 * @returns PR identifier or null if not on a valid PR page
 */
export function getCurrentPrIdentifier(): string | null {
  try {
    const repoInfo = getCurrentRepoInfo();
    return generatePrIdentifier(repoInfo);
  } catch (error) {
    console.error('Failed to get current PR identifier:', error);
    return null;
  }
} 