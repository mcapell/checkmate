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

// Keep track of the current URL to prevent re-initialization on the same page
let currentUrl = window.location.href;

// Function to initialize the extension on GitHub pull request pages
function initOnPullRequestPage() {
  // Check if URL has changed to avoid re-initialization on the same page
  if (currentUrl === window.location.href && activeSidebar) {
    return;
  }
  
  // Update current URL
  currentUrl = window.location.href;
  
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
  } else {
    // Clean up sidebar if we're not on a PR page anymore
    cleanupExistingSidebar();
  }
}

// Function to inject sidebar into the page
function injectSidebar(repoInfo: RepoInfo): void {
  // If we already have a sidebar for this PR, don't reinject
  if (activeSidebar && 
      activeSidebar.getRepoOwner() === repoInfo.owner && 
      activeSidebar.getRepoName() === repoInfo.repo && 
      activeSidebar.getPrNumber() === repoInfo.prNumber) {
    console.log('Sidebar already exists for this PR, not reinjecting');
    return;
  }
  
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

// For SPA navigation in GitHub
let lastUrl = window.location.href;

// Function to check if URL has changed
function checkForURLChange() {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    initOnPullRequestPage();
  }
  
  // Continue checking periodically
  setTimeout(checkForURLChange, 1000);
}

// Start checking for URL changes instead of using MutationObserver
// This is more reliable for GitHub's SPA navigation
checkForURLChange();

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