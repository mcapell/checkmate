import { StorageState, ExtensionOptions, ChecklistState } from '../../src/types';
import { IStorageManager } from '../../src/utils/storage';

/**
 * Mock implementation of the StorageManager for tests
 */
export class MockStorageManager implements IStorageManager {
  private storage: Record<string, any> = {};

  /**
   * Get the checklist state from mock storage
   */
  async getChecklistState(): Promise<StorageState> {
    return this.storage['checklistState'] || {};
  }

  /**
   * Save checklist state to mock storage
   */
  async saveChecklistState(state: StorageState): Promise<void> {
    this.storage['checklistState'] = state;
    return;
  }

  /**
   * Get extension options from mock storage
   */
  async getOptions(): Promise<ExtensionOptions> {
    return this.storage['options'] || {
      defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
      theme: 'auto'
    };
  }

  /**
   * Save extension options to mock storage
   */
  async saveOptions(options: ExtensionOptions): Promise<void> {
    this.storage['options'] = options;
    return;
  }

  /**
   * Clear mock storage
   */
  async clearStorage(): Promise<void> {
    this.storage = {};
    return;
  }

  /**
   * Special method for testing: set mock storage state directly
   */
  setMockState(key: string, value: any): void {
    this.storage[key] = value;
  }
}

/**
 * Mock Chrome storage API for browser API testing
 */
export const mockChromeStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  },
  local: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }
}; 