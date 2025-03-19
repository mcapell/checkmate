import { ChecklistState, ErrorCategory, ExtensionOptions } from '../types';
import { handleStorageError } from './error-handler';

/**
 * Interface for the storage manager that handles persistent storage
 * of checklist state and extension options
 */
export interface StorageManager {
  /**
   * Saves the checklist state to browser storage
   * @param state - The checklist state to save
   * @returns A promise that resolves when the state is saved
   */
  saveChecklistState(state: ChecklistState): Promise<void>;

  /**
   * Retrieves the checklist state from browser storage
   * @returns A promise that resolves with the checklist state or null if not found
   */
  getChecklistState(): Promise<ChecklistState | null>;

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
 * Browser-agnostic implementation of the StorageManager interface
 * Handles both Chrome and Firefox browser APIs
 */
class BrowserStorageManager implements StorageManager {
  private storage: chrome.storage.StorageArea;

  /**
   * Create a new BrowserStorageManager
   * @param storageArea - Optional storage area to use (for testing)
   */
  constructor(storageArea?: chrome.storage.StorageArea) {
    // Use provided storage area (for testing) or get from browser
    if (storageArea) {
      this.storage = storageArea;
    } else {
      // Check if we're in a browser environment
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Use sync storage if available, fall back to local storage
        this.storage = chrome.storage.sync || chrome.storage.local;
      } else {
        throw handleStorageError(
          'Browser storage is not available',
          { environment: typeof window !== 'undefined' ? 'browser' : 'non-browser' },
          [
            'Make sure you are using a supported browser',
            'Check if browser extensions are enabled'
          ],
          false
        );
      }
    }
  }

  /**
   * Saves the checklist state to browser storage
   * @param state - The checklist state to save
   * @returns A promise that resolves when the state is saved
   */
  async saveChecklistState(state: ChecklistState): Promise<void> {
    try {
      if (!state) {
        throw new Error('Cannot save null or undefined checklist state');
      }
      
      console.log('Saving checklist state...');
      await this.set({ [STORAGE_KEYS.CHECKLIST_STATE]: state });
      console.log('Checklist state saved successfully');
    } catch (error) {
      console.error('Failed to save checklist state:', error);
      throw handleStorageError(
        'Failed to save checklist state',
        { 
          error: error instanceof Error ? error.message : String(error),
          state: { ...state, items: 'truncated for logging' }
        },
        [
          'Try again in a few moments',
          'Check your browser permissions for storage access',
          'If the problem persists, try clearing the extension data'
        ],
        true
      );
    }
  }

  /**
   * Retrieves the checklist state from browser storage
   * @returns A promise that resolves with the checklist state or null if not found
   */
  async getChecklistState(): Promise<ChecklistState | null> {
    try {
      console.log('Retrieving checklist state...');
      const result = await this.get(STORAGE_KEYS.CHECKLIST_STATE);
      const state = result[STORAGE_KEYS.CHECKLIST_STATE] || null;
      
      if (state) {
        console.log('Checklist state retrieved successfully');
      } else {
        console.log('No existing checklist state found');
      }
      
      return state;
    } catch (error) {
      console.error('Failed to retrieve checklist state:', error);
      throw handleStorageError(
        'Failed to retrieve checklist state', 
        error instanceof Error ? error.message : String(error),
        [
          'Try reloading the extension',
          'Check your browser permissions for storage access',
          'If the problem persists, try clearing the extension data'
        ],
        true
      );
    }
  }

  /**
   * Saves the extension options to browser storage
   * @param options - The extension options to save
   * @returns A promise that resolves when the options are saved
   */
  async saveOptions(options: ExtensionOptions): Promise<void> {
    try {
      if (!options) {
        throw new Error('Cannot save null or undefined options');
      }
      
      console.log('Saving extension options...');
      await this.set({ [STORAGE_KEYS.OPTIONS]: options });
      console.log('Extension options saved successfully');
    } catch (error) {
      console.error('Failed to save extension options:', error);
      throw handleStorageError(
        'Failed to save extension options', 
        { 
          error: error instanceof Error ? error.message : String(error),
          options
        },
        [
          'Try again in a few moments',
          'Check your browser permissions for storage access',
          'If the problem persists, try clearing the extension data'
        ],
        true
      );
    }
  }

  /**
   * Retrieves the extension options from browser storage
   * @returns A promise that resolves with the extension options (or default options if none are found)
   */
  async getOptions(): Promise<ExtensionOptions> {
    try {
      console.log('Retrieving extension options...');
      const result = await this.get(STORAGE_KEYS.OPTIONS);
      const options = result[STORAGE_KEYS.OPTIONS] || DEFAULT_OPTIONS;
      
      if (result[STORAGE_KEYS.OPTIONS]) {
        console.log('Extension options retrieved successfully');
      } else {
        console.log('No stored options found, using default options');
      }
      
      return options;
    } catch (error) {
      console.error('Failed to retrieve extension options:', error);
      console.log('Falling back to default options due to error');
      
      // For options, we always fall back to defaults rather than throw
      return DEFAULT_OPTIONS;
    }
  }

  /**
   * Clears all storage data
   * @returns A promise that resolves when the storage is cleared
   */
  async clearStorage(): Promise<void> {
    try {
      console.log('Clearing storage...');
      await new Promise<void>((resolve, reject) => {
        this.storage.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw handleStorageError(
        'Failed to clear storage', 
        error instanceof Error ? error.message : String(error),
        [
          'Try reloading the extension',
          'Check your browser permissions for storage access',
          'Try again in a few moments'
        ],
        true
      );
    }
  }

  /**
   * Helper method to set a value in storage with browser compatibility
   * @param items - Object containing keys and values to store
   * @returns A promise that resolves when the operation is complete
   */
  private async set(items: Record<string, any>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.storage.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Helper method to get a value from storage with browser compatibility
   * @param key - Key to retrieve from storage
   * @returns A promise that resolves with the requested data
   */
  private async get(key: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      this.storage.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }
}

// Export a singleton instance of the storage manager
// Only create it if we're in a browser environment
let storageManagerInstance: StorageManager;

try {
  storageManagerInstance = new BrowserStorageManager();
} catch (error) {
  console.warn('Browser storage not available, storage manager will not be initialized', error);
}

export const storageManager: StorageManager = storageManagerInstance!;

// Export the class for testing purposes
export { BrowserStorageManager }; 