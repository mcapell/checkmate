/**
 * Background script for GitHub Code Review Checklist extension
 * 
 * This script runs in the background and manages:
 * - Communication between components
 * - Browser action handling
 * - Extension state initialization
 */

import { ErrorCategory, ExtensionError } from '../types';
import { storageManager } from '../utils/storage';

console.log('Background script initialized');

// Track the state of the sidebar for the active tab
interface SidebarState {
  isVisible: boolean;
  repoInfo?: any;
}

// Keep track of sidebar state for each tab
const tabSidebarState: { [tabId: number]: SidebarState } = {};

/**
 * Initializes extension settings
 */
async function initializeExtension() {
  try {
    // Check if we need to set up default options
    const options = await storageManager.getOptions();
    if (!options || !options.defaultTemplateUrl) {
      // Set defaults if not present
      await storageManager.saveOptions({
        defaultTemplateUrl: 'https://raw.githubusercontent.com/user/default-checklist/main/checklist.yaml',
        theme: 'auto'
      });
    }
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    // Initialize default settings on install
    initializeExtension();
  }
});

/**
 * Checks if a tab is a GitHub PR page
 * 
 * @param tabId - Tab ID to check
 * @returns Promise that resolves to true if the tab is on a GitHub PR page
 */
export async function isGitHubPrPage(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'checkIfPrPage' });
    return response && response.isPrPage === true;
  } catch (error) {
    console.log('Not a GitHub PR page or content script not ready');
    return false;
  }
}

/**
 * Opens the popup UI programmatically
 */
function openPopup(tabId: number) {
  chrome.action.setPopup({ tabId, popup: 'popup.html' });
  chrome.action.openPopup();
  
  // Reset popup to empty after a short delay to ensure future clicks work correctly
  setTimeout(() => {
    chrome.action.setPopup({ tabId, popup: '' });
  }, 1000);
}

// Listen for browser action clicks (icon in toolbar)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  
  const tabId = tab.id;
  const state = tabSidebarState[tabId] || { isVisible: false };
  
  try {
    // First check if we're on a GitHub PR page
    const isPrPage = await isGitHubPrPage(tabId);
    
    if (isPrPage) {
      // On a PR page, toggle the sidebar
      chrome.tabs.sendMessage(tabId, {
        action: state.isVisible ? 'hideSidebar' : 'showSidebar'
      }, (response) => {
        if (response && response.success) {
          // Update state tracking
          tabSidebarState[tabId] = {
            ...state,
            isVisible: !state.isVisible
          };
          
          // Notify any other listeners about the state change
          chrome.runtime.sendMessage({
            action: 'sidebarStateChanged',
            data: {
              tabId,
              isVisible: !state.isVisible
            }
          });
        }
      });
    } else {
      // Not on a PR page, open the popup
      openPopup(tabId);
    }
  } catch (error) {
    console.error('Error handling browser action click:', error);
    // If anything fails, default to opening the popup
    openPopup(tabId);
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Reset sidebar state for this tab if URL has changed significantly
    // (This helps with SPA navigation in GitHub)
    const isGitHubUrl = tab.url.startsWith('https://github.com/');
    
    if (!isGitHubUrl) {
      // If we've navigated away from GitHub, clear the state
      delete tabSidebarState[tabId];
    }
    
    // Notify content script that tab has been updated
    try {
      chrome.tabs.sendMessage(tabId, { action: 'tabUpdated', url: tab.url });
    } catch (error) {
      // Content script may not be loaded yet, which is fine
    }
  }
});

// Handle tab closures
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up state when a tab is closed
  delete tabSidebarState[tabId];
});

// Listen for messages from content script, popup, or options page
chrome.runtime.onMessage.addListener((
  message: any, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  console.log('Background received message:', message.action);
  
  // Track if this message came from a tab
  const tabId = sender.tab?.id;
  
  switch (message.action) {
    case 'sidebarReady':
      // Content script is telling us the sidebar is ready
      if (tabId) {
        // Make sure the popup doesn't open when browser action is clicked
        chrome.action.setPopup({ tabId, popup: '' });
      }
      sendResponse({ success: true });
      break;
      
    case 'sidebarVisibilityChanged':
      // Content script is telling us the sidebar visibility changed
      if (tabId && message.data) {
        tabSidebarState[tabId] = {
          isVisible: message.data.isVisible,
          repoInfo: message.data.repoInfo
        };
        
        // Notify other components about the change
        chrome.runtime.sendMessage({
          action: 'sidebarStateChanged',
          data: {
            tabId,
            isVisible: message.data.isVisible,
            repoInfo: message.data.repoInfo
          }
        });
        
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Missing tab ID or data' });
      }
      break;
      
    case 'getOptionsFromBackground':
      // Options or popup is requesting current settings
      storageManager.getOptions()
        .then(options => {
          sendResponse({ success: true, options });
        })
        .catch(error => {
          sendResponse({ 
            success: false, 
            error: {
              category: ErrorCategory.STORAGE,
              message: 'Failed to retrieve options',
              details: error,
              timestamp: Date.now()
            } as ExtensionError
          });
        });
      return true; // Keep message channel open for async response
      
    case 'saveOptionsFromBackground':
      // Options page is sending new settings to save
      if (message.data && message.data.options) {
        storageManager.saveOptions(message.data.options)
          .then(() => {
            // Notify all components that options changed
            chrome.runtime.sendMessage({
              action: 'optionsUpdated',
              data: { options: message.data.options }
            });
            
            sendResponse({ success: true });
          })
          .catch(error => {
            sendResponse({ 
              success: false, 
              error: {
                category: ErrorCategory.STORAGE,
                message: 'Failed to save options',
                details: error,
                timestamp: Date.now()
              } as ExtensionError
            });
          });
        return true; // Keep message channel open for async response
      } else {
        sendResponse({ success: false, error: 'No options provided' });
      }
      break;
      
    case 'getActiveSidebarState':
      // Popup is asking for the current sidebar state for a tab
      if (message.data && message.data.tabId) {
        const requestedTabId = message.data.tabId;
        sendResponse({ 
          success: true, 
          state: tabSidebarState[requestedTabId] || { isVisible: false } 
        });
      } else {
        // If no tab ID provided, try to get current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTabId = tabs[0]?.id;
          if (activeTabId) {
            sendResponse({ 
              success: true, 
              state: tabSidebarState[activeTabId] || { isVisible: false } 
            });
          } else {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        });
        return true; // Keep message channel open for async response
      }
      break;
      
    case 'logError':
      // Any component is reporting an error
      console.error('Extension error:', message.data?.error || 'Unknown error');
      sendResponse({ success: true });
      break;
      
    case 'openOptionsPage':
      // Open the options page
      try {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error opening options page:', error);
        sendResponse({ 
          success: false, 
          error: {
            category: ErrorCategory.UNKNOWN,
            message: 'Failed to open options page',
            details: error,
            timestamp: Date.now()
          } as ExtensionError
        });
      }
      break;
      
    default:
      // Unknown action
      console.warn('Unknown message action received:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  // Return true if we need to keep the message channel open for async response
  return true;
});

// Initialize the extension
initializeExtension(); 