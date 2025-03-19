/**
 * Options page script for GitHub Code Review Checklist
 * Handles loading and saving user preferences
 */

import { ExtensionOptions } from '../types';
import { storageManager } from '../utils/storage';

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
 * Load current options from storage and populate form fields
 */
async function loadOptions(): Promise<void> {
  try {
    const options = await storageManager.getOptions();
    
    // Set default template URL
    defaultTemplateUrlInput.value = options.defaultTemplateUrl;
    
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
  } catch (error) {
    console.error('Failed to load options:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Save options to storage
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
    
    // Save to storage
    await storageManager.saveOptions(options);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save options:', error);
    showStatus('Error saving settings', 'error');
  }
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