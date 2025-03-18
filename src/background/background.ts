/**
 * Background script for GitHub Code Review Checklist extension
 * 
 * This script runs in the background and manages the state of the extension.
 */

console.log('Background script initialized');

// Track the state of the sidebar for the active tab
interface SidebarState {
  isVisible: boolean;
  repoInfo?: any;
}

// Keep track of sidebar state for each tab
const tabSidebarState: { [tabId: number]: SidebarState } = {};

// Listen for installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    // Initialize default settings on install
    chrome.storage.sync.set({
      checklists: []
    });
  }
});

// Listen for browser action clicks (icon in toolbar)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Toggle the sidebar when the browser action is clicked
    const tabId = tab.id;
    const state = tabSidebarState[tabId] || { isVisible: false };
    
    // Check if we are on a GitHub PR page (only toggle if we are)
    chrome.tabs.sendMessage(tabId, {
      action: state.isVisible ? 'hideSidebar' : 'showSidebar'
    }, (response) => {
      // Only update our state tracking if the action was successful
      if (response && response.success) {
        // Update state
        tabSidebarState[tabId] = {
          ...state,
          isVisible: !state.isVisible
        };
      } else if (!response) {
        // No response means we might not be on a GitHub PR page
        // Open the popup instead
        chrome.action.setPopup({ tabId, popup: 'popup.html' });
        // Need to programmatically open the popup since we just set it
        chrome.action.openPopup();
        // Reset popup to empty after a short delay to ensure clicks work in the future
        setTimeout(() => {
          chrome.action.setPopup({ tabId, popup: '' });
        }, 1000);
      }
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((
  message: any, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  if (sender.tab && sender.tab.id) {
    const tabId = sender.tab.id;
    
    switch (message.action) {
      case 'sidebarReady':
        // Content script is telling us the sidebar is ready
        // Make sure the popup doesn't open when browser action is clicked
        chrome.action.setPopup({ tabId, popup: '' });
        break;
        
      case 'sidebarVisibilityChanged':
        // Content script is telling us the sidebar visibility changed
        if (message.data) {
          tabSidebarState[tabId] = {
            isVisible: message.data.isVisible,
            repoInfo: message.data.repoInfo
          };
        }
        break;
    }
  }
  
  // Always respond to keep the message channel open for async responses
  sendResponse({ success: true });
  return true; // Required for async response
}); 