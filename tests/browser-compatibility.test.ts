/**
 * Browser Compatibility Tests
 * 
 * These tests verify that the extension is compatible with both Firefox and Chrome.
 * We check for browser-specific APIs and ensure appropriate polyfills are in place.
 */

import { mockChrome } from './mocks/chrome-mock';
import { ExtensionOptions } from '../src/types'; // Import types

describe('Browser Compatibility', () => {
  // Store original window object
  const originalWindow = { ...window };
  
  afterEach(() => {
    // Restore window to original state
    Object.defineProperties(window, Object.getOwnPropertyDescriptors(originalWindow));
  });
  
  test('Extension initializes with Chrome API', () => {
    // Setup Chrome mock
    global.chrome = mockChrome as any;
    
    // Define browser as undefined (Chrome environment)
    Object.defineProperty(window, 'browser', {
      value: undefined,
      writable: true
    });
    
    // Import the module to test
    const { detectBrowser } = require('../src/utils/browser-detection');
    
    // Run the detection
    const browserInfo = detectBrowser();
    
    // Verify Chrome was detected
    expect(browserInfo.isChrome).toBe(true);
    expect(browserInfo.isFirefox).toBe(false);
  });
  
  test('Extension initializes with Firefox API', () => {
    // Setup Firefox mock
    const mockBrowser = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    
    // Define browser for Firefox environment
    Object.defineProperty(window, 'browser', {
      value: mockBrowser,
      writable: true
    });
    
    // Chrome is still available but should be ignored
    global.chrome = mockChrome as any;
    
    // Import the module to test
    const { detectBrowser } = require('../src/utils/browser-detection');
    
    // Run the detection
    const browserInfo = detectBrowser();
    
    // Verify Firefox was detected
    expect(browserInfo.isFirefox).toBe(true);
    expect(browserInfo.isChrome).toBe(false);
  });
  
  test('Storage works in both browsers', () => {
    // Setup Chrome mock
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockImplementation((keys, callback) => {
            callback({ testKey: 'chrome-value' });
          }),
          set: jest.fn().mockImplementation((data, callback) => {
            if (callback) callback();
          })
        }
      }
    } as any;
    
    // Import the storage module
    const { storageManager } = require('../src/utils/storage');
    
    // Test with Chrome API
    return storageManager.getOptions().then((options: ExtensionOptions) => {
      expect(chrome.storage.sync.get).toHaveBeenCalled();
      
      // Now test with Firefox API
      global.chrome = undefined as any;
      
      // Setup Firefox mock
      const mockBrowser = {
        storage: {
          sync: {
            get: jest.fn().mockImplementation(keys => {
              return Promise.resolve({ testKey: 'firefox-value' });
            }),
            set: jest.fn().mockImplementation(data => {
              return Promise.resolve();
            })
          }
        }
      };
      
      // Define browser for Firefox environment
      Object.defineProperty(window, 'browser', {
        value: mockBrowser,
        writable: true
      });
      
      // Re-import the module with Firefox API
      jest.resetModules();
      const { storageManager: firefoxStorageManager } = require('../src/utils/storage');
      
      return firefoxStorageManager.getOptions().then((firefoxOptions: ExtensionOptions) => {
        expect(mockBrowser.storage.sync.get).toHaveBeenCalled();
      });
    });
  });
}); 