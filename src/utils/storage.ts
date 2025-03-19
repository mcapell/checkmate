import { ChecklistState, ErrorCategory, ExtensionOptions, StorageState } from '../types';
import { handleStorageError } from './error-handler';
import { getBrowserAPI, promisify } from './browser-detection';

/**
 * Interface for the storage manager that handles persistent storage
 * of checklist state and extension options
 */
export interface IStorageManager {
  /**
   * Saves the checklist state to browser storage
   * @param state - The checklist state to save
   * @returns A promise that resolves when the state is saved
   */
  saveChecklistState(state: StorageState): Promise<void>;

  /**
   * Retrieves the checklist state from browser storage
   * @returns A promise that resolves with the checklist state or null if not found
   */
  getChecklistState(): Promise<StorageState>;

  /**
   * Saves the extension options to browser storage
   * @param options - The extension options to save
   * @returns A promise that resolves when the options are saved
   */
  saveOptions(options: ExtensionOptions): Promise<void>;

  /**
   * Retrieves the extension options from browser storage
   * @returns A promise that resolves with the extension options (or default options if none are found)
   */
  getOptions(): Promise<ExtensionOptions>;

  /**
   * Clears all storage data
   * @returns A promise that resolves when the storage is cleared
   */
  clearStorage(): Promise<void>;
}

// Storage keys
const STORAGE_KEYS = {
  CHECKLIST_STATE: 'checkmate_checklist_state',
  OPTIONS: 'checkmate_options',
};

// Default options to use if none are found
const DEFAULT_OPTIONS: ExtensionOptions = {
  defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
  theme: 'auto',
};

/**
 * Storage Manager
 * 
 * Handles persistent storage for the extension.
 */
class StorageManager implements IStorageManager {
  /**
   * Get extension options from storage
   * @returns The extension options
   */
  async getOptions(): Promise<ExtensionOptions> {
    const browser = getBrowserAPI();
    
    try {
      // Firefox uses promise-based API, Chrome uses callbacks
      if (typeof browser.storage.sync.get === 'function') {
        if (typeof browser === 'object' && browser.storage.sync.get.constructor.name !== 'AsyncFunction') {
          // Chrome-style: Use promisify for callback-based API
          const result = await promisify(browser.storage.sync.get.bind(browser.storage.sync), ['defaultTemplateUrl', 'theme']);
          return this.getDefaultOptions(result);
        } else {
          // Firefox-style: Already promise-based
          const result = await browser.storage.sync.get(['defaultTemplateUrl', 'theme']);
          return this.getDefaultOptions(result);
        }
      }
      
      // Fallback
      return this.getDefaultOptions({});
    } catch (error) {
      console.error('Error getting options:', error);
      return this.getDefaultOptions({});
    }
  }
  
  /**
   * Save extension options to storage
   * @param options The options to save
   */
  async saveOptions(options: ExtensionOptions): Promise<void> {
    const browser = getBrowserAPI();
    
    try {
      if (typeof browser.storage.sync.set === 'function') {
        if (typeof browser === 'object' && browser.storage.sync.set.constructor.name !== 'AsyncFunction') {
          // Chrome-style
          await promisify(browser.storage.sync.set.bind(browser.storage.sync), options);
        } else {
          // Firefox-style
          await browser.storage.sync.set(options);
        }
        
        // Dispatch event to notify other components about the options change
        document.dispatchEvent(new CustomEvent('options-changed', { detail: options }));
      }
    } catch (error) {
      console.error('Error saving options:', error);
      throw error;
    }
  }
  
  /**
   * Get checklist state from storage
   * @returns The checklist state
   */
  async getChecklistState(): Promise<StorageState> {
    const browser = getBrowserAPI();
    
    try {
      if (typeof browser.storage.local.get === 'function') {
        if (typeof browser === 'object' && browser.storage.local.get.constructor.name !== 'AsyncFunction') {
          // Chrome-style
          const result = await promisify(browser.storage.local.get.bind(browser.storage.local), 'checklistState');
          return result.checklistState || {};
        } else {
          // Firefox-style
          const result = await browser.storage.local.get('checklistState');
          return result.checklistState || {};
        }
      }
      
      // Fallback
      return {};
    } catch (error) {
      console.error('Error getting checklist state:', error);
      return {};
    }
  }
  
  /**
   * Save checklist state to storage
   * @param state The state to save
   */
  async saveChecklistState(state: StorageState): Promise<void> {
    const browser = getBrowserAPI();
    
    try {
      if (typeof browser.storage.local.set === 'function') {
        if (typeof browser === 'object' && browser.storage.local.set.constructor.name !== 'AsyncFunction') {
          // Chrome-style
          await promisify(browser.storage.local.set.bind(browser.storage.local), { checklistState: state });
        } else {
          // Firefox-style
          await browser.storage.local.set({ checklistState: state });
        }
      }
    } catch (error) {
      console.error('Error saving checklist state:', error);
      throw error;
    }
  }
  
  /**
   * Clear all stored data (options and state)
   */
  async clearStorage(): Promise<void> {
    const browser = getBrowserAPI();
    
    try {
      if (typeof browser.storage.local.clear === 'function') {
        if (typeof browser === 'object' && browser.storage.local.clear.constructor.name !== 'AsyncFunction') {
          // Chrome-style
          await promisify(browser.storage.local.clear.bind(browser.storage.local));
          await promisify(browser.storage.sync.clear.bind(browser.storage.sync));
        } else {
          // Firefox-style
          await browser.storage.local.clear();
          await browser.storage.sync.clear();
        }
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
  
  /**
   * Get default options if not found in storage
   * @param storedOptions Partial options from storage
   * @returns Complete options with defaults for missing values
   */
  private getDefaultOptions(storedOptions: Partial<ExtensionOptions>): ExtensionOptions {
    return {
      defaultTemplateUrl: storedOptions.defaultTemplateUrl || 'https://raw.githubusercontent.com/github/docs/main/content/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/customizing-code-scanning.md',
      theme: storedOptions.theme || 'auto'
    };
  }
}

// Export a singleton instance of the storage manager
// Only create it if we're in a browser environment
let storageManagerInstance: StorageManager;

try {
  storageManagerInstance = new StorageManager();
} catch (error) {
  console.warn('Browser storage not available, storage manager will not be initialized', error);
}

export const storageManager: IStorageManager = storageManagerInstance!;

// Export the class for testing purposes
export { StorageManager }; 