/**
 * Content script for GitHub Code Review Checklist extension
 * 
 * This script is injected into GitHub pages and adds the checklist UI.
 */

console.log('GitHub Code Review Checklist extension loaded');

// Function to initialize the extension on GitHub pull request pages
function initOnPullRequestPage() {
  const isPullRequestPage = window.location.pathname.includes('/pull/');
  
  if (isPullRequestPage) {
    console.log('Pull request page detected, initializing checklist...');
    // TODO: Implement checklist UI insertion
  }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initOnPullRequestPage();
});

// Re-initialize on page navigation (for GitHub's SPA behavior)
const observer = new MutationObserver(() => {
  initOnPullRequestPage();
});

// Start observing for GitHub's page transitions
observer.observe(document.body, { childList: true, subtree: true }); 