/**
 * End-to-end tests for the GitHub Code Review Checklist extension
 * These tests simulate the complete user workflow from loading a PR page
 * to interaction with the sidebar and templates
 */

import { mockChrome } from '../mocks/chrome-mock';
import { mockDOMEnvironment } from '../mocks/dom-mock';

// Mock the browser API
global.chrome = mockChrome as any;

describe('End-to-end Extension Workflow', () => {
  // Set up DOM environment
  let dom: { cleanup: () => void };
  
  beforeEach(() => {
    // Reset and setup mocks
    jest.clearAllMocks();
    mockChrome.storage.sync.get.mockReset();
    mockChrome.storage.sync.set.mockReset();
    
    // Setup default options
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      callback({
        defaultTemplateUrl: 'https://example.com/template.yaml',
        theme: 'auto'
      });
    });
    
    // Setup DOM with a PR page structure
    dom = mockDOMEnvironment({
      isGitHubPR: true
    });
  });
  
  afterEach(() => {
    dom.cleanup();
  });
  
  test('Extension initializes correctly on GitHub PR page', async () => {
    // Import the content script dynamically to ensure mocks are set up
    const { initializeContentScript } = require('../../src/content');
    
    // Run the content script initialization
    await initializeContentScript();
    
    // Verify the sidebar was injected
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).not.toBeNull();
    
    // Verify the template was loaded
    const checklistItems = document.querySelectorAll('.checklist-item');
    expect(checklistItems.length).toBeGreaterThan(0);
  });
  
  test('Extension does not initialize on non-PR pages', async () => {
    // Reset DOM to a non-PR page
    dom.cleanup();
    dom = mockDOMEnvironment({
      isGitHubPR: false
    });
    
    // Import the content script
    const { initializeContentScript } = require('../../src/content');
    
    // Run the content script initialization
    await initializeContentScript();
    
    // Verify the sidebar was not injected
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).toBeNull();
  });
  
  test('Checklist state persists between page reloads', async () => {
    // Import the content script
    const { initializeContentScript } = require('../../src/content');
    const { storageManager } = require('../../src/utils/storage');
    
    // Mock the PR URL and state data
    const prUrl = 'https://github.com/owner/repo/pull/123';
    const initialState = {
      [prUrl]: {
        items: {
          'item-1': { checked: true, notes: 'Test note' },
          'item-2': { checked: false, notes: '' }
        },
        timestamp: Date.now()
      }
    };
    
    // Setup the initial state
    jest.spyOn(storageManager, 'getChecklistState').mockResolvedValue(initialState);
    
    // Run the content script
    await initializeContentScript();
    
    // Verify the state was restored
    const checkbox1 = document.querySelector('#item-1') as HTMLInputElement;
    const notes1 = document.querySelector('#notes-item-1') as HTMLTextAreaElement;
    
    expect(checkbox1.checked).toBe(true);
    expect(notes1.value).toBe('Test note');
  });
  
  test('Options affect extension behavior', async () => {
    // Mock the custom options
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      callback({
        defaultTemplateUrl: 'https://example.com/custom-template.yaml',
        theme: 'dark'
      });
    });
    
    // Import the module
    const { initializeContentScript } = require('../../src/content');
    
    // Run the content script
    await initializeContentScript();
    
    // Verify the theme is applied
    const sidebar = document.querySelector('#github-code-review-checklist-sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.classList.contains('theme-dark')).toBe(true);
  });
}); 