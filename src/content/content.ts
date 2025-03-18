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

// Toggle the sidebar on browser action click
function toggleSidebar(): { success: boolean; isVisible?: boolean } {
  const sidebar = activeSidebar as Sidebar | null;
  
  if (!sidebar) {
    // We're not on a PR page or sidebar hasn't been initialized
    console.warn('Cannot toggle sidebar: not on a PR page or sidebar not initialized');
    return { success: false };
  }
  
  if (isGitHubPrPage(window.location.href)) {
    // Toggle sidebar visibility
    // Use DOM inspection to determine if the sidebar is visible
    const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
    const isCurrentlyVisible = sidebarContainer?.classList.contains('checkmate-sidebar-expanded') || false;
    
    if (isCurrentlyVisible) {
      sidebar.hide();
    } else {
      sidebar.show();
    }
    return { success: true, isVisible: !isCurrentlyVisible };
  }
  
  return { success: false };
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (!isGitHubPrPage(window.location.href) && 
     (message.action === 'showSidebar' || message.action === 'hideSidebar')) {
    // We're not on a PR page, send failure response
    console.warn('Not on a PR page, cannot handle sidebar action');
    sendResponse({ success: false, error: 'Not on a PR page' });
    return true;
  }
  
  // Type guard to ensure activeSidebar is treated as Sidebar type
  const sidebar = activeSidebar as Sidebar | null;
  
  switch (message.action) {
    case 'showSidebar':
      if (sidebar) {
        sidebar.show();
        sendResponse({ success: true, isVisible: true });
      } else {
        // Try to initialize since we might have missed it
        initOnPullRequestPage();
        // Check again after initialization
        const reinitializedSidebar = activeSidebar as Sidebar | null;
        if (reinitializedSidebar) {
          reinitializedSidebar.show();
          sendResponse({ success: true, isVisible: true });
        } else {
          sendResponse({ success: false, error: 'Sidebar not initialized' });
        }
      }
      break;
      
    case 'hideSidebar':
      if (sidebar) {
        sidebar.hide();
        sendResponse({ success: true, isVisible: false });
      } else {
        sendResponse({ success: false, error: 'Sidebar not initialized' });
      }
      break;
      
    case 'toggleSidebar':
      const result = toggleSidebar();
      sendResponse(result);
      break;
      
    case 'updateSidebarContent':
      if (sidebar && message.data && message.data.content) {
        sidebar.setContent(message.data.content);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No sidebar or content provided' });
      }
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async responses
}); 