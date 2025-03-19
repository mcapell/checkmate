/**
 * Content Script 
 * 
 * Detects GitHub PR pages, injects the sidebar, and 
 * manages interactions with the GitHub page.
 */

import { getBrowserAPI } from '../utils/browser-detection';
import { storageManager } from '../utils/storage';
import { templateManager } from '../utils/template-manager';
import { sidebarManager } from './sidebar-manager';
import { stateManager } from '../utils/state-manager';

// Get the browser API (works in both Firefox and Chrome)
const browser = getBrowserAPI();

/**
 * Check if the current page is a GitHub Pull Request page
 * @returns {boolean} True if we're on a GitHub PR page
 */
function isGitHubPrPage(): boolean {
  // URL pattern match for GitHub PR pages
  const prPattern = /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/;
  return prPattern.test(window.location.href);
}

/**
 * Extract repository and PR information from the current URL
 * @returns {Object} Information about the current PR
 */
function extractPrInfo() {
  // URL format: https://github.com/owner/repo/pull/123
  const urlPath = window.location.pathname;
  const parts = urlPath.split('/').filter(part => part.length > 0);
  
  if (parts.length >= 4 && parts[2] === 'pull') {
    return {
      owner: parts[0],
      repo: parts[1],
      prNumber: parseInt(parts[3], 10)
    };
  }
  
  return null;
}

/**
 * Initialize the content script
 * This is the main entry point for content script execution
 */
export async function initializeContentScript() {
  console.log('Content script initialized');
  
  // Setup message listener
  browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    console.log('Content script received message:', message.action);
    
    // Check if we're on a PR page
    if (message.action === 'isGitHubPrPage') {
      sendResponse({ isPrPage: isGitHubPrPage() });
      return;
    }
    
    // Show/hide sidebar
    if (message.action === 'showSidebar' || message.action === 'hideSidebar') {
      const visible = message.action === 'showSidebar';
      sidebarManager.setSidebarVisibility(visible);
      
      const prInfo = extractPrInfo();
      sendResponse({ 
        success: true, 
        isVisible: visible,
        repoInfo: prInfo
      });
      
      // Send visibility change notification
      browser.runtime.sendMessage({
        action: 'sidebarVisibilityChanged',
        data: {
          isVisible: visible,
          repoInfo: prInfo
        }
      });
      
      return;
    }
    
    // Toggle sidebar
    if (message.action === 'toggleSidebar') {
      const isVisible = sidebarManager.toggleSidebar();
      const prInfo = extractPrInfo();
      
      sendResponse({
        success: true,
        isVisible,
        repoInfo: prInfo
      });
      
      // Send visibility change notification
      browser.runtime.sendMessage({
        action: 'sidebarVisibilityChanged',
        data: {
          isVisible,
          repoInfo: prInfo
        }
      });
      
      return;
    }
  });
  
  // Only inject sidebar on GitHub PR pages
  if (!isGitHubPrPage()) {
    console.log('Not a GitHub PR page, content script will not inject sidebar');
    return;
  }
  
  try {
    // Get extension options
    const options = await storageManager.getOptions();
    
    // Load template
    const template = await templateManager.loadTemplate(options.defaultTemplateUrl);
    
    // Get current PR information
    const prInfo = extractPrInfo();
    if (!prInfo) {
      console.error('Failed to extract PR information');
      return;
    }
    
    // Create sidebar with template
    await sidebarManager.createSidebar(template, prInfo);
    
    // Load saved state for this PR
    await stateManager.loadState(window.location.href);
    
    // Notify background script that the sidebar is ready
    browser.runtime.sendMessage({
      action: 'sidebarReady',
      data: {
        repoInfo: prInfo,
        prIdentifier: `${prInfo.owner}/${prInfo.repo}#${prInfo.prNumber}`
      }
    });
    
    console.log('Sidebar injected successfully');
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
} 