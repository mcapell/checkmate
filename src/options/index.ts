/**
 * Options Page
 * 
 * Manages the extension options page UI and logic
 */

import { ExtensionOptions } from '../types';
import { storageManager } from '../utils/storage';

/**
 * Initialize the options page
 * Sets up UI elements and event handlers
 */
export function initializeOptionsPage() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', async () => {
    // Get form elements
    const form = document.getElementById('options-form');
    const templateUrlInput = document.getElementById('defaultTemplateUrl') as HTMLInputElement;
    const themeSelect = document.getElementById('theme') as HTMLSelectElement;
    const saveButton = document.getElementById('save-button');
    const statusElement = document.getElementById('status');
    
    // Load current options
    const options = await storageManager.getOptions();
    
    // Populate form with current values
    if (templateUrlInput) {
      templateUrlInput.value = options.defaultTemplateUrl;
    }
    
    if (themeSelect) {
      themeSelect.value = options.theme;
    }
    
    // Handle form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const newOptions: ExtensionOptions = {
          defaultTemplateUrl: templateUrlInput?.value || options.defaultTemplateUrl,
          theme: (themeSelect?.value as any) || options.theme
        };
        
        // Save options
        try {
          await storageManager.saveOptions(newOptions);
          
          // Show success message
          if (statusElement) {
            statusElement.textContent = 'Options saved successfully!';
            statusElement.classList.add('success');
            statusElement.classList.remove('error');
            
            // Clear message after a timeout
            setTimeout(() => {
              statusElement.textContent = '';
              statusElement.classList.remove('success');
            }, 3000);
          }
        } catch (error) {
          console.error('Error saving options:', error);
          
          // Show error message
          if (statusElement) {
            statusElement.textContent = 'Error saving options. Please try again.';
            statusElement.classList.add('error');
            statusElement.classList.remove('success');
          }
        }
      });
    }
    
    // Handle save button click (if not in a form)
    if (saveButton && !form) {
      saveButton.addEventListener('click', async () => {
        // Get form values
        const newOptions: ExtensionOptions = {
          defaultTemplateUrl: templateUrlInput?.value || options.defaultTemplateUrl,
          theme: (themeSelect?.value as any) || options.theme
        };
        
        // Save options
        try {
          await storageManager.saveOptions(newOptions);
          
          // Show success message
          if (statusElement) {
            statusElement.textContent = 'Options saved successfully!';
            statusElement.classList.add('success');
            statusElement.classList.remove('error');
            
            // Clear message after a timeout
            setTimeout(() => {
              statusElement.textContent = '';
              statusElement.classList.remove('success');
            }, 3000);
          }
        } catch (error) {
          console.error('Error saving options:', error);
          
          // Show error message
          if (statusElement) {
            statusElement.textContent = 'Error saving options. Please try again.';
            statusElement.classList.add('error');
            statusElement.classList.remove('success');
          }
        }
      });
    }
  });
}

// Initialize the options page if this is the options page
if (document.querySelector('#options-page')) {
  initializeOptionsPage();
} 