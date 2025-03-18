/**
 * Content script for GitHub Code Review Checklist extension
 * 
 * This script is injected into GitHub pages and adds the checklist UI.
 */

import { 
  isGitHubPrPage, 
  getCurrentRepoInfo, 
  getCurrentPrIdentifier,
  RepoInfo 
} from '../utils/github-utils';

console.log('GitHub Code Review Checklist extension loaded');

// Function to initialize the extension on GitHub pull request pages
function initOnPullRequestPage() {
  if (isGitHubPrPage(window.location.href)) {
    console.log('Pull request page detected, initializing checklist...');
    
    // Extract repository and PR information
    const repoInfo: RepoInfo = getCurrentRepoInfo();
    const prIdentifier = getCurrentPrIdentifier();
    
    if (repoInfo.isValid && prIdentifier) {
      console.log(`Detected PR: ${prIdentifier}`);
      
      // TODO: Inject sidebar UI
      injectSidebar(repoInfo);
    } else {
      console.warn('Could not extract valid PR information from URL');
    }
  }
}

// Placeholder function for sidebar injection (to be implemented in next step)
function injectSidebar(repoInfo: RepoInfo): void {
  console.log('Preparing to inject sidebar for PR:', repoInfo);
  // This will be implemented in the next step
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initOnPullRequestPage();
});

// Re-initialize on page navigation (for GitHub's SPA behavior)
const observer = new MutationObserver(() => {
  // Use a debounce mechanism to avoid excessive calls
  clearTimeout(observerTimer);
  observerTimer = setTimeout(initOnPullRequestPage, 300);
});

// Timer for debouncing observer callback
let observerTimer: ReturnType<typeof setTimeout>;

// Start observing for GitHub's page transitions
observer.observe(document.body, { childList: true, subtree: true }); 