/**
 * Integration test for extension initialization
 * Tests that all components initialize correctly and in the right order
 */

import { mockChrome } from '../mocks/chrome-mock';
import { mockDOMEnvironment } from '../mocks/dom-mock';

// Mock the fetch API
global.fetch = jest.fn();

// Mock chrome API
global.chrome = mockChrome as any;

describe('Extension Initialization', () => {
  let dom: { cleanup: () => void };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default DOM environment with a PR page
    dom = mockDOMEnvironment({
      isGitHubPR: true
    });
    
    // Mock successful storage operations
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      // Return default options
      callback({
        defaultTemplateUrl: 'https://example.com/template.yaml',
        theme: 'auto'
      });
    });
    
    // Mock successful template fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
        # Code Review Checklist
        
        ## Security
        - [ ] Authentication and authorization are properly implemented
        - [ ] Input validation is in place
        
        ## Performance
        - [ ] Database queries are optimized
        - [ ] No unnecessary API calls
      `)
    });
  });
  
  afterEach(() => {
    // Clean up DOM
    dom.cleanup();
  });
  
  test('Background script initializes correctly', () => {
    // Import the background script entrypoint
    const { initializeBackgroundScript } = require('../../src/background');
    
    // Setup message listener spy
    const addListenerSpy = jest.spyOn(chrome.runtime.onMessage, 'addListener');
    
    // Initialize background script
    initializeBackgroundScript();
    
    // Verify listeners were added
    expect(addListenerSpy).toHaveBeenCalled();
  });
  
  test('Content script detects PR page and injects sidebar', async () => {
    // Import the content script
    const { initializeContentScript } = require('../../src/content');
    
    // Initialize content script
    await initializeContentScript();
    
    // Verify the sidebar was created
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).not.toBeNull();
    
    // Verify the sidebar has the correct structure
    const header = sidebar?.querySelector('.sidebar-header');
    const content = sidebar?.querySelector('.sidebar-content');
    
    expect(header).not.toBeNull();
    expect(content).not.toBeNull();
    
    // Verify checklist items were created
    const checklistItems = sidebar?.querySelectorAll('.checklist-item');
    expect(checklistItems?.length).toBeGreaterThan(0);
  });
  
  test('Content script does not inject sidebar on non-PR pages', async () => {
    // Clean up and recreate with non-PR page
    dom.cleanup();
    dom = mockDOMEnvironment({
      isGitHubPR: false
    });
    
    // Import the content script
    const { initializeContentScript } = require('../../src/content');
    
    // Initialize content script
    await initializeContentScript();
    
    // Verify the sidebar was not created
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).toBeNull();
  });
  
  test('Options page initializes and saves options correctly', async () => {
    // Setup DOM for options page
    dom.cleanup();
    document.body.innerHTML = `
      <div id="options-form">
        <input type="text" id="defaultTemplateUrl" value="https://example.com/template.yaml" />
        <select id="theme">
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <button type="submit" id="save-button">Save</button>
      </div>
    `;
    
    // Mock storage.sync.set
    mockChrome.storage.sync.set.mockImplementation((data: any, callback: () => void) => {
      if (callback) callback();
    });
    
    // Import options page script
    const { initializeOptionsPage } = require('../../src/options');
    
    // Initialize options page
    initializeOptionsPage();
    
    // Change the options
    const templateUrlInput = document.getElementById('defaultTemplateUrl') as HTMLInputElement;
    const themeSelect = document.getElementById('theme') as HTMLSelectElement;
    
    templateUrlInput.value = 'https://example.com/new-template.yaml';
    themeSelect.value = 'dark';
    
    // Click save button
    const saveButton = document.getElementById('save-button') as HTMLButtonElement;
    saveButton.click();
    
    // Verify options were saved
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    
    // Verify correct values were saved
    const savedOptions = mockChrome.storage.sync.set.mock.calls[0][0];
    expect(savedOptions.defaultTemplateUrl).toBe('https://example.com/new-template.yaml');
    expect(savedOptions.theme).toBe('dark');
  });
  
  test('Background responds to messaging from content script', async () => {
    // Setup message passing spies
    mockChrome.runtime.sendMessage.mockImplementation((message: any, callback: any) => {
      if (callback) callback({ success: true });
    });
    
    // Mock message listener
    const messageListener = jest.fn().mockImplementation((message: any, sender: any, sendResponse: any) => {
      if (message.action === 'sidebarReady') {
        sendResponse({ success: true });
        return true; // Keep the message channel open
      }
      return false;
    });
    
    // Add message listener
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Import modules
    const { initializeContentScript } = require('../../src/content');
    
    // Run the content script
    await initializeContentScript();
    
    // Send sidebar ready message
    chrome.runtime.sendMessage({ 
      action: 'sidebarReady',
      data: {
        prUrl: 'https://github.com/owner/repo/pull/123'
      }
    }, (response: any) => {
      expect(response.success).toBe(true);
    });
    
    // Verify listener was called
    expect(messageListener).toHaveBeenCalled();
  });
  
  test('Theme changes affect sidebar appearance', async () => {
    // Mock options with dark theme
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      // Return dark theme option
      callback({
        defaultTemplateUrl: 'https://example.com/template.yaml',
        theme: 'dark'
      });
    });
    
    // Import content script
    const { initializeContentScript } = require('../../src/content');
    
    // Run the content script
    await initializeContentScript();
    
    // Verify sidebar has dark theme class
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.classList.contains('theme-dark')).toBe(true);
    
    // Change theme to light
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      // Return light theme option
      callback({
        defaultTemplateUrl: 'https://example.com/template.yaml',
        theme: 'light'
      });
    });
    
    // Simulate theme change event
    document.dispatchEvent(new CustomEvent('options-changed', {
      detail: { theme: 'light' }
    }));
    
    // Verify sidebar has light theme class
    expect(sidebar?.classList.contains('theme-dark')).toBe(false);
    expect(sidebar?.classList.contains('theme-light')).toBe(true);
  });
}); 