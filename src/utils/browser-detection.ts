/**
 * Browser Detection Utility
 * 
 * Provides utilities to detect the current browser and handle browser-specific APIs
 */

// Add Firefox browser API type definition
declare global {
  interface Window {
    browser?: {
      runtime: typeof chrome.runtime;
      storage: typeof chrome.storage;
      tabs: typeof chrome.tabs;
      [key: string]: any;
    };
  }
}

interface BrowserInfo {
  isChrome: boolean;
  isFirefox: boolean;
  name: string;
}

/**
 * Detects the current browser environment
 * @returns {BrowserInfo} Information about the detected browser
 */
export function detectBrowser(): BrowserInfo {
  const isFirefox = typeof window.browser !== 'undefined';
  const isChrome = !isFirefox && typeof chrome !== 'undefined';
  
  let name = 'unknown';
  if (isChrome) name = 'chrome';
  if (isFirefox) name = 'firefox';
  
  return {
    isChrome,
    isFirefox,
    name
  };
}

/**
 * Gets the appropriate browser API for the current environment
 * Firefox uses promises for extension APIs, Chrome uses callbacks
 */
export function getBrowserAPI() {
  const browserInfo = detectBrowser();
  
  if (browserInfo.isFirefox && window.browser) {
    return window.browser;
  }
  
  if (browserInfo.isChrome) {
    return chrome;
  }
  
  // Fallback to Chrome API
  return chrome;
}

/**
 * Wraps Chrome-style callback APIs to return promises
 * This allows for consistent promise-based API usage
 * 
 * @param {any} chromeApiFunction - The Chrome API function to wrap
 * @param {any[]} args - Arguments to pass to the function
 * @returns {Promise<any>} Promise that resolves with the result
 */
export function promisify(chromeApiFunction: (...args: any[]) => void, ...args: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    chromeApiFunction(...args, (result: any) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
} 