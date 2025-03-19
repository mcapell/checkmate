/**
 * Background Script
 * 
 * Handles communication between different extension components
 * and manages global extension state.
 */

import { getBrowserAPI } from '../utils/browser-detection';

// Get the browser API (works in both Firefox and Chrome)
const browser = getBrowserAPI();

/**
 * Initialize the background script
 * Sets up message listeners for communication with content scripts and popups
 */
export function initializeBackgroundScript() {
  console.log('Background script initialized');
  
  // Set up message listener for sidebar interactions
  browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    console.log('Background received message:', message.action);
    
    // Handle sidebar ready message
    if (message.action === 'sidebarReady' && sender.tab?.id) {
      // Make sure the browser action doesn't open a popup when the sidebar is available
      browser.action?.setPopup({ tabId: sender.tab.id, popup: '' });
      sendResponse({ success: true });
      return true; // Keep the message channel open
    }
    
    // Handle sidebar visibility changed
    if (message.action === 'sidebarVisibilityChanged' && sender.tab?.id) {
      // Notify other components about this change
      browser.runtime.sendMessage({
        action: 'sidebarStateChanged',
        data: {
          tabId: sender.tab.id,
          isVisible: message.data.isVisible,
          repoInfo: message.data.repoInfo
        }
      });
      
      sendResponse({ success: true });
      return true; // Keep the message channel open
    }
    
    // Handle options requests
    if (message.action === 'getOptionsFromBackground') {
      // Get options from storage
      browser.storage.sync.get(['defaultTemplateUrl', 'theme'], (data: any) => {
        sendResponse({ success: true, options: data });
      });
      return true; // Keep the message channel open
    }
    
    return false; // Not handled
  });
  
  // Handle browser action clicks
  browser.action?.onClicked.addListener(async (tab: any) => {
    if (!tab.id) return;
    
    try {
      // Check if we're on a GitHub PR page
      if (await isGitHubPrPage(tab.id)) {
        // Send message to toggle sidebar
        browser.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, (response: any) => {
          if (response?.success) {
            // Notify other components about state change
            browser.runtime.sendMessage({
              action: 'sidebarStateChanged',
              data: {
                tabId: tab.id,
                isVisible: response.isVisible,
                repoInfo: response.repoInfo
              }
            });
          }
        });
      } else {
        // Not on a PR page, open the options page
        browser.runtime.openOptionsPage();
      }
    } catch (error) {
      console.error('Error handling browser action click:', error);
    }
  });
}

/**
 * Check if the given tab is on a GitHub PR page
 * @param tabId The ID of the tab to check
 * @returns Promise resolving to true if on GitHub PR page
 */
export async function isGitHubPrPage(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    browser.tabs.sendMessage(tabId, { action: 'isGitHubPrPage' }, (response: any) => {
      resolve(response?.isPrPage || false);
    });
  });
}

// Initialize background script when loaded
initializeBackgroundScript(); 