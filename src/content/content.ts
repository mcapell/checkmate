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
import { ChecklistTemplate } from '../types';
import { Sidebar } from './sidebar';

console.log('GitHub Code Review Checklist extension loaded');

// Detect Firefox for Firefox-specific logging
const isFirefox = navigator.userAgent.includes('Firefox');
if (isFirefox) {
  console.log('Running in Firefox browser');
}

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
  console.log('Checking if current page is a GitHub PR:', window.location.href);
  
  if (isGitHubPrPage(window.location.href)) {
    console.log('Pull request page detected, initializing checklist...');
    
    // Extract repository and PR information
    const repoInfo: RepoInfo = getCurrentRepoInfo();
    const prIdentifier = getCurrentPrIdentifier();
    
    console.log('Extracted PR info:', {
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      prNumber: repoInfo.prNumber,
      isValid: repoInfo.isValid,
      prIdentifier
    });
    
    if (repoInfo.isValid && prIdentifier) {
      console.log(`Detected PR: ${prIdentifier}, injecting sidebar`);
      
      // Inject sidebar UI
      injectSidebar(repoInfo);
    } else {
      console.warn('Could not extract valid PR information from URL');
    }
  } else {
    console.log('Not a PR page, current URL:', window.location.href);
    // Clean up sidebar if we're not on a PR page anymore
    cleanupExistingSidebar();
  }
}

// Function to inject sidebar into the page
function injectSidebar(repoInfo: RepoInfo, template?: ChecklistTemplate): void {
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
  
  // Create and inject new sidebar with template if provided
  activeSidebar = new Sidebar(repoInfo, template);
  activeSidebar.inject();
  
  // Initial state - hide the sidebar
  activeSidebar.hide();
  
  // Add extra debugging for Firefox
  if (isFirefox) {
    console.log('Firefox: Sidebar elements injected, current DOM structure:');
    const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
    console.log('Sidebar container found:', sidebarContainer !== null);
    if (sidebarContainer) {
      console.log('Sidebar container classes:', sidebarContainer.className);
    }
  }
  
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

// Send sidebar visibility change to background script
function notifySidebarVisibilityChange(isVisible: boolean): void {
  if (!activeSidebar) return;
  
  const repoInfo = {
    owner: activeSidebar.getRepoOwner(),
    repo: activeSidebar.getRepoName(),
    prNumber: activeSidebar.getPrNumber()
  };
  
  chrome.runtime.sendMessage({
    action: 'sidebarVisibilityChanged',
    data: {
      isVisible,
      repoInfo
    }
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  // Type guard to ensure activeSidebar is treated as Sidebar type
  const sidebar = activeSidebar as Sidebar | null;
  
  switch (message.action) {
    case 'checkIfPrPage':
      // Background script is asking if we're on a PR page
      const isPrPage = isGitHubPrPage(window.location.href);
      sendResponse({ success: true, isPrPage });
      break;
      
    case 'showSidebar':
      if (!isGitHubPrPage(window.location.href)) {
        // We're not on a PR page, send failure response
        sendResponse({ success: false, error: 'Not on a PR page' });
        return true;
      }
      
      if (sidebar) {
        sidebar.show();
        // Check if the sidebar is visible (Firefox debugging)
        if (isFirefox) {
          const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
          console.log('Firefox: After show() - Container classes:', sidebarContainer?.className);
        }
        notifySidebarVisibilityChange(true);
        sendResponse({ success: true, isVisible: true });
      } else {
        // Try to initialize since we might have missed it
        initOnPullRequestPage();
        // Check again after initialization
        const reinitializedSidebar = activeSidebar as Sidebar | null;
        if (reinitializedSidebar) {
          reinitializedSidebar.show();
          // Check if the sidebar is visible (Firefox debugging)
          if (isFirefox) {
            const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
            console.log('Firefox: After reinitialized show() - Container classes:', sidebarContainer?.className);
          }
          notifySidebarVisibilityChange(true);
          sendResponse({ success: true, isVisible: true });
        } else {
          sendResponse({ success: false, error: 'Sidebar not initialized' });
        }
      }
      break;
      
    case 'hideSidebar':
      if (!isGitHubPrPage(window.location.href)) {
        // We're not on a PR page, send failure response
        sendResponse({ success: false, error: 'Not on a PR page' });
        return true;
      }
      
      if (sidebar) {
        sidebar.hide();
        // Check if the sidebar is hidden (Firefox debugging)
        if (isFirefox) {
          const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
          console.log('Firefox: After hide() - Container classes:', sidebarContainer?.className);
        }
        notifySidebarVisibilityChange(false);
        sendResponse({ success: true, isVisible: false });
      } else {
        sendResponse({ success: false, error: 'Sidebar not initialized' });
      }
      break;
      
    case 'toggleSidebar':
      const result = toggleSidebar();
      if (result.success && result.isVisible !== undefined) {
        // Check toggle result (Firefox debugging)
        if (isFirefox) {
          const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
          console.log('Firefox: After toggle() - Container classes:', sidebarContainer?.className);
          console.log('Firefox: Toggled visibility to:', result.isVisible);
        }
        notifySidebarVisibilityChange(result.isVisible);
      }
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
      
    case 'tabUpdated':
      // Background script is notifying us of a tab update
      // This is helpful for SPA navigation in GitHub
      if (message.url && message.url !== currentUrl) {
        initOnPullRequestPage();
      }
      sendResponse({ success: true });
      break;
      
    default:
      // Unknown action
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  // Keep the message channel open for asynchronous response
  return true;
}); 