/**
 * Options page script for GitHub Code Review Checklist
 * Handles loading and saving user preferences
 */

import { ExtensionOptions, ErrorCategory, ExtensionError } from '../types';

/**
 * DOM Elements
 */
const optionsForm = document.getElementById('options-form') as HTMLFormElement;
const defaultTemplateUrlInput = document.getElementById('default-template-url') as HTMLInputElement;
const themeLightRadio = document.getElementById('theme-light') as HTMLInputElement;
const themeDarkRadio = document.getElementById('theme-dark') as HTMLInputElement;
const themeAutoRadio = document.getElementById('theme-auto') as HTMLInputElement;
const statusMessage = document.getElementById('status-message') as HTMLDivElement;

/**
 * Load current options from storage via background script
 */
async function loadOptions(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getOptionsFromBackground'
    });
    
    if (response && response.success && response.options) {
      const options = response.options;
      
      // Set default template URL
      defaultTemplateUrlInput.value = options.defaultTemplateUrl || '';
      
      // Set theme radio button
      switch (options.theme) {
        case 'light':
          themeLightRadio.checked = true;
          break;
        case 'dark':
          themeDarkRadio.checked = true;
          break;
        case 'auto':
          themeAutoRadio.checked = true;
          break;
      }
    } else {
      throw new Error(response?.error?.message || 'Failed to load options');
    }
  } catch (error) {
    console.error('Failed to load options:', error);
    showStatus('Error loading settings', 'error');
    
    // Report error to background script for logging
    reportError({
      category: ErrorCategory.STORAGE,
      message: 'Failed to load options',
      details: error,
      timestamp: Date.now(),
      recoverable: true
    });
  }
}

/**
 * Save options to storage via background script
 */
async function saveOptions(event: Event): Promise<void> {
  event.preventDefault();
  
  try {
    // Get theme selection
    let theme: 'light' | 'dark' | 'auto' = 'auto';
    if (themeLightRadio.checked) {
      theme = 'light';
    } else if (themeDarkRadio.checked) {
      theme = 'dark';
    } else if (themeAutoRadio.checked) {
      theme = 'auto';
    }
    
    // Get template URL
    const defaultTemplateUrl = defaultTemplateUrlInput.value.trim();
    
    // Create options object
    const options: ExtensionOptions = {
      defaultTemplateUrl,
      theme
    };
    
    // Save to storage via background script
    const response = await chrome.runtime.sendMessage({
      action: 'saveOptionsFromBackground',
      data: {
        options
      }
    });
    
    if (response && response.success) {
      showStatus('Settings saved successfully!', 'success');
    } else {
      throw new Error(response?.error?.message || 'Failed to save options');
    }
  } catch (error) {
    console.error('Failed to save options:', error);
    showStatus('Error saving settings', 'error');
    
    // Report error to background script for logging
    reportError({
      category: ErrorCategory.STORAGE,
      message: 'Failed to save options',
      details: error,
      timestamp: Date.now(),
      recoverable: true
    });
  }
}

/**
 * Report an error to the background script
 */
function reportError(error: ExtensionError): void {
  chrome.runtime.sendMessage({
    action: 'logError',
    data: {
      error
    }
  });
}

/**
 * Show status message with success/error styling
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  
  // Hide after 3 seconds
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'optionsUpdated') {
    // Background script is telling us options were updated elsewhere
    // Reload options to stay in sync
    loadOptions();
  }
  
  // Always respond to keep the message channel open
  sendResponse({ success: true });
  return true;
});

/**
 * Initialize the options page
 */
function initOptionsPage(): void {
  // Load current options
  loadOptions();
  
  // Set up form submission handler
  optionsForm.addEventListener('submit', saveOptions);
}

// Initialize the options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initOptionsPage); 