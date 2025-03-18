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
        throw new Error('Browser storage is not available');
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
      await this.set({ [STORAGE_KEYS.CHECKLIST_STATE]: state });
    } catch (error) {
      throw handleStorageError('Failed to save checklist state', error);
    }
  }

  /**
   * Retrieves the checklist state from browser storage
   * @returns A promise that resolves with the checklist state or null if not found
   */
  async getChecklistState(): Promise<ChecklistState | null> {
    try {
      const result = await this.get(STORAGE_KEYS.CHECKLIST_STATE);
      return result[STORAGE_KEYS.CHECKLIST_STATE] || null;
    } catch (error) {
      throw handleStorageError('Failed to retrieve checklist state', error);
    }
  }

  /**
   * Saves the extension options to browser storage
   * @param options - The extension options to save
   * @returns A promise that resolves when the options are saved
   */
  async saveOptions(options: ExtensionOptions): Promise<void> {
    try {
      await this.set({ [STORAGE_KEYS.OPTIONS]: options });
    } catch (error) {
      throw handleStorageError('Failed to save extension options', error);
    }
  }

  /**
   * Retrieves the extension options from browser storage
   * @returns A promise that resolves with the extension options (or default options if none are found)
   */
  async getOptions(): Promise<ExtensionOptions> {
    try {
      const result = await this.get(STORAGE_KEYS.OPTIONS);
      return result[STORAGE_KEYS.OPTIONS] || DEFAULT_OPTIONS;
    } catch (error) {
      throw handleStorageError('Failed to retrieve extension options', error);
    }
  }

  /**
   * Clears all storage data
   * @returns A promise that resolves when the storage is cleared
   */
  async clearStorage(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.storage.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw handleStorageError('Failed to clear storage', error);
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
  console.warn('Browser storage not available, storage manager will not be initialized');
}

export const storageManager: StorageManager = storageManagerInstance!;

// Export the class for testing purposes
export { BrowserStorageManager }; 