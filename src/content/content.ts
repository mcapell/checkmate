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
import { Sidebar } from './sidebar';

console.log('GitHub Code Review Checklist extension loaded');

// Keep track of the active sidebar instance
let activeSidebar: Sidebar | null = null;

// Function to initialize the extension on GitHub pull request pages
function initOnPullRequestPage() {
  if (isGitHubPrPage(window.location.href)) {
    console.log('Pull request page detected, initializing checklist...');
    
    // Extract repository and PR information
    const repoInfo: RepoInfo = getCurrentRepoInfo();
    const prIdentifier = getCurrentPrIdentifier();
    
    if (repoInfo.isValid && prIdentifier) {
      console.log(`Detected PR: ${prIdentifier}`);
      
      // Inject sidebar UI
      injectSidebar(repoInfo);
    } else {
      console.warn('Could not extract valid PR information from URL');
    }
  }
}

// Function to inject sidebar into the page
function injectSidebar(repoInfo: RepoInfo): void {
  console.log('Injecting sidebar for PR:', repoInfo);
  
  // Clean up any existing sidebar
  cleanupExistingSidebar();
  
  // Create and inject new sidebar
  activeSidebar = new Sidebar(repoInfo);
  activeSidebar.inject();
  
  // Initial state - hide the sidebar
  activeSidebar.hide();
  
  // Notify background script that sidebar is ready
  notifyBackgroundScript(repoInfo);
}

// Function to clean up existing sidebar
function cleanupExistingSidebar(): void {
  if (activeSidebar) {
    console.log('Cleaning up existing sidebar');
    activeSidebar.destroy();
    activeSidebar = null;
  }
}

// Function to notify background script that sidebar is ready
function notifyBackgroundScript(repoInfo: RepoInfo): void {
  chrome.runtime.sendMessage({
    action: 'sidebarReady',
    data: {
      repoInfo,
      prIdentifier: getCurrentPrIdentifier()
    }
  });
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

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!activeSidebar) return;
  
  switch (message.action) {
    case 'showSidebar':
      activeSidebar.show();
      sendResponse({ success: true });
      break;
      
    case 'hideSidebar':
      activeSidebar.hide();
      sendResponse({ success: true });
      break;
      
    case 'updateSidebarContent':
      if (message.data && message.data.content) {
        activeSidebar.setContent(message.data.content);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No content provided' });
      }
      break;
  }
}); 