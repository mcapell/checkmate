// Add Jest type declarations
declare const describe: (description: string, specDefinitions: () => void) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const expect: any;
declare const jest: any;

import { BrowserStorageManager, StorageManager } from '../../src/utils/storage';
import { ChecklistState, ExtensionOptions } from '../../src/types';

// Define the LastError type to match Chrome's API
interface LastError {
  message?: string;
}

// Mock chrome.storage API
const mockStorage = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
};

// Mock chrome runtime for tests
const mockRuntime = {
  lastError: undefined as LastError | undefined
};

// Define the type for the global object
declare const global: {
  chrome: any;
  [key: string]: any;
};

// Mock chrome API
global.chrome = {
  storage: {
    sync: mockStorage,
    local: mockStorage,
  },
  runtime: {
    lastError: undefined as LastError | undefined,
  },
} as any;

describe('BrowserStorageManager', () => {
  let storageManager: StorageManager;
  
  // Sample data for testing
  const sampleChecklistState: ChecklistState = {
    items: {
      'item1': { checked: true, needsAttention: false },
      'item2': { checked: false, needsAttention: true },
    },
    sections: { 'section1': true, 'section2': false },
    lastUpdated: 1647609600000, // Example timestamp
    templateUrl: 'https://github.com/owner/repo/template.json',
    templateVersion: '1.0.0',
  };
  
  const sampleOptions: ExtensionOptions = {
    defaultTemplateUrl: 'https://github.com/owner/repo/custom-template.json',
    theme: 'dark',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockRuntime.lastError = undefined;
    
    // Mock chrome API for each function call inside the class
    // We do this globally to avoid having to mock inside the class
    global.chrome = {
      runtime: mockRuntime
    } as any;
    
    // Create a new instance of BrowserStorageManager with our mock storage
    storageManager = new BrowserStorageManager(mockStorage as any);
  });

  describe('saveChecklistState', () => {
    test('saves state successfully', async () => {
      // Setup
      mockStorage.set.mockImplementation((items: Record<string, any>, callback: () => void) => callback());
      
      // Execute
      await storageManager.saveChecklistState(sampleChecklistState);
      
      // Verify
      expect(mockStorage.set).toHaveBeenCalledTimes(1);
      const setCall = mockStorage.set.mock.calls[0][0];
      expect(setCall).toHaveProperty('checkmate_checklist_state', sampleChecklistState);
    });

    test('handles errors when saving state', async () => {
      // Setup - simulate an error
      mockRuntime.lastError = { message: 'Storage error' };
      mockStorage.set.mockImplementation((items: Record<string, any>, callback: () => void) => callback());
      
      // Execute and verify
      await expect(storageManager.saveChecklistState(sampleChecklistState))
        .rejects.toMatchObject({
          category: 'storage',
          message: 'Failed to save checklist state',
          details: { message: 'Storage error' },
        });
    });
  });

  describe('getChecklistState', () => {
    test('gets state successfully', async () => {
      // Setup
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => {
        callback({
          'checkmate_checklist_state': sampleChecklistState,
        });
      });
      
      // Execute
      const result = await storageManager.getChecklistState();
      
      // Verify
      expect(mockStorage.get).toHaveBeenCalledTimes(1);
      expect(mockStorage.get).toHaveBeenCalledWith('checkmate_checklist_state', expect.any(Function));
      expect(result).toEqual(sampleChecklistState);
    });

    test('returns null when no state is found', async () => {
      // Setup
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => {
        callback({}); // Empty result
      });
      
      // Execute
      const result = await storageManager.getChecklistState();
      
      // Verify
      expect(result).toBeNull();
    });

    test('handles errors when getting state', async () => {
      // Setup - simulate an error
      mockRuntime.lastError = { message: 'Storage error' };
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => callback({}));
      
      // Execute and verify
      await expect(storageManager.getChecklistState())
        .rejects.toMatchObject({
          category: 'storage',
          message: 'Failed to retrieve checklist state',
          details: { message: 'Storage error' },
        });
    });
  });

  describe('saveOptions', () => {
    test('saves options successfully', async () => {
      // Setup
      mockStorage.set.mockImplementation((items: Record<string, any>, callback: () => void) => callback());
      
      // Execute
      await storageManager.saveOptions(sampleOptions);
      
      // Verify
      expect(mockStorage.set).toHaveBeenCalledTimes(1);
      const setCall = mockStorage.set.mock.calls[0][0];
      expect(setCall).toHaveProperty('checkmate_options', sampleOptions);
    });

    test('handles errors when saving options', async () => {
      // Setup - simulate an error
      mockRuntime.lastError = { message: 'Storage error' };
      mockStorage.set.mockImplementation((items: Record<string, any>, callback: () => void) => callback());
      
      // Execute and verify
      await expect(storageManager.saveOptions(sampleOptions))
        .rejects.toMatchObject({
          category: 'storage',
          message: 'Failed to save extension options',
          details: { message: 'Storage error' },
        });
    });
  });

  describe('getOptions', () => {
    test('gets options successfully', async () => {
      // Setup
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => {
        callback({
          'checkmate_options': sampleOptions,
        });
      });
      
      // Execute
      const result = await storageManager.getOptions();
      
      // Verify
      expect(mockStorage.get).toHaveBeenCalledTimes(1);
      expect(mockStorage.get).toHaveBeenCalledWith('checkmate_options', expect.any(Function));
      expect(result).toEqual(sampleOptions);
    });

    test('returns default options when no options are found', async () => {
      // Setup
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => {
        callback({}); // Empty result
      });
      
      // Execute
      const result = await storageManager.getOptions();
      
      // Verify
      expect(result).toEqual({
        defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
        theme: 'auto',
      });
    });

    test('handles errors when getting options', async () => {
      // Setup - simulate an error
      mockRuntime.lastError = { message: 'Storage error' };
      mockStorage.get.mockImplementation((key: string, callback: (result: Record<string, any>) => void) => callback({}));
      
      // Execute and verify
      await expect(storageManager.getOptions())
        .rejects.toMatchObject({
          category: 'storage',
          message: 'Failed to retrieve extension options',
          details: { message: 'Storage error' },
        });
    });
  });

  describe('clearStorage', () => {
    test('clears storage successfully', async () => {
      // Setup
      mockStorage.clear.mockImplementation((callback: () => void) => callback());
      
      // Execute
      await storageManager.clearStorage();
      
      // Verify
      expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    });

    test('handles errors when clearing storage', async () => {
      // Setup - simulate an error
      mockRuntime.lastError = { message: 'Storage error' };
      mockStorage.clear.mockImplementation((callback: () => void) => callback());
      
      // Execute and verify
      await expect(storageManager.clearStorage())
        .rejects.toMatchObject({
          category: 'storage',
          message: 'Failed to clear storage',
          details: { message: 'Storage error' },
        });
    });
  });
}); 