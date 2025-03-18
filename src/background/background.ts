/**
 * Background script for GitHub Code Review Checklist extension
 * 
 * This script runs in the background and manages the state of the extension.
 */

console.log('Background script initialized');

// Listen for installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    // Initialize default settings on install
    chrome.storage.sync.set({
      checklists: []
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((
  message: any, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  // Handle messages here
  sendResponse({ success: true });
  return true; // Required for async response
}); 