/**
 * Integration test for template loading and state persistence
 * Tests the interaction between template loading and state persistence
 */

import { mockChrome } from '../mocks/chrome-mock';
import { mockDOMEnvironment } from '../mocks/dom-mock';

// Mock the fetch API
global.fetch = jest.fn();

// Mock chrome API
global.chrome = mockChrome as any;

describe('Template and State Integration', () => {
  let dom: { cleanup: () => void };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default DOM environment
    dom = mockDOMEnvironment({
      isGitHubPR: true
    });
    
    // Configure window.location for the tests
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://github.com/owner/repo/pull/123',
        pathname: '/owner/repo/pull/123'
      },
      writable: true
    });
    
    // Mock successful storage operations
    mockChrome.storage.sync.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      // Return default options
      callback({
        defaultTemplateUrl: 'https://example.com/template.yaml'
      });
    });
    
    mockChrome.storage.local.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      // Return empty state by default
      callback({});
    });
    
    mockChrome.storage.local.set.mockImplementation((data: any, callback: () => void) => {
      if (callback) callback();
    });
    
    // Mock fetch to respond with a valid template
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
  
  test('Template loads and state is saved correctly', async () => {
    // Import modules
    const { templateManager } = require('../../src/utils/template-manager');
    const { storageManager } = require('../../src/utils/storage');
    const { sidebarManager } = require('../../src/content/sidebar-manager');
    
    // Mock the PR info extraction
    const extractPRInfoMock = jest.fn().mockReturnValue({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123
    });
    
    // Load template
    const template = await templateManager.loadTemplate('https://example.com/template.yaml');
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/template.yaml');
    expect(template).toBeTruthy();
    
    // Render sidebar with template
    await sidebarManager.createSidebar(template, extractPRInfoMock());
    
    // Verify the checklist items were created
    const checklistItems = document.querySelectorAll('.checklist-item');
    expect(checklistItems.length).toBeGreaterThan(0);
    
    // Simulate checking an item
    const firstCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(firstCheckbox).not.toBeNull();
    
    firstCheckbox.checked = true;
    firstCheckbox.dispatchEvent(new Event('change'));
    
    // Verify state was saved
    expect(mockChrome.storage.local.set).toHaveBeenCalled();
  });
  
  test('State is restored when revisiting a PR', async () => {
    // Setup pre-existing state
    const prUrl = 'https://github.com/owner/repo/pull/123';
    const existingState = {
      [prUrl]: {
        items: {
          'security-item-1': { checked: true, notes: 'Fixed auth issues' },
          'performance-item-2': { checked: false, notes: '' }
        },
        timestamp: Date.now() - 1000 // 1 second ago
      }
    };
    
    // Mock storage to return existing state
    mockChrome.storage.local.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      callback(existingState);
    });
    
    // Import modules
    const { templateManager } = require('../../src/utils/template-manager');
    const { sidebarManager } = require('../../src/content/sidebar-manager');
    const { stateManager } = require('../../src/utils/state-manager');
    
    // Mock the PR info extraction
    const extractPRInfoMock = jest.fn().mockReturnValue({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123
    });
    
    // Load template
    const template = await templateManager.loadTemplate('https://example.com/template.yaml');
    
    // Render sidebar with template
    await sidebarManager.createSidebar(template, extractPRInfoMock());
    
    // Get current PR URL
    const currentPrUrl = window.location.href;
    
    // Load state for this PR
    await stateManager.loadState(currentPrUrl);
    
    // Verify state was loaded from storage
    expect(mockChrome.storage.local.get).toHaveBeenCalled();
    
    // Verify checkboxes and notes reflect the state
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const firstCheckbox = checkboxes[0] as HTMLInputElement;
    
    // First checkbox should be checked based on our mock state
    expect(firstCheckbox.checked).toBe(true);
    
    // Verify notes were populated
    const notes = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(notes.value).toBe('Fixed auth issues');
  });
  
  test('Template changes affect state management', async () => {
    // Set up initial state with the first template
    const prUrl = 'https://github.com/owner/repo/pull/123';
    const initialState = {
      [prUrl]: {
        items: {
          'security-item-1': { checked: true, notes: 'Initial note' }
        },
        timestamp: Date.now() - 1000 // 1 second ago
      }
    };
    
    // Mock storage to return initial state
    mockChrome.storage.local.get.mockImplementation((keys: string | string[] | null, callback: (result: any) => void) => {
      callback(initialState);
    });
    
    // Import modules
    const { templateManager } = require('../../src/utils/template-manager');
    const { sidebarManager } = require('../../src/content/sidebar-manager');
    const { stateManager } = require('../../src/utils/state-manager');
    
    // Mock PR info extraction
    const extractPRInfoMock = jest.fn().mockReturnValue({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123
    });
    
    // First, load and render with initial template
    let template = await templateManager.loadTemplate('https://example.com/template.yaml');
    await sidebarManager.createSidebar(template, extractPRInfoMock());
    await stateManager.loadState(window.location.href);
    
    // Now change the template - simulate loading a different template
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(`
        # New Template
        
        ## Code Quality
        - [ ] Code follows style guidelines
        - [ ] Tests are comprehensive
        
        ## Documentation
        - [ ] API endpoints are documented
        - [ ] README is updated
      `)
    });
    
    // Load new template
    template = await templateManager.loadTemplate('https://example.com/new-template.yaml');
    
    // Recreate sidebar with new template
    await sidebarManager.createSidebar(template, extractPRInfoMock());
    
    // Load state for this PR (should handle merging with new template)
    await stateManager.loadState(window.location.href);
    
    // Verify that new checkboxes were created
    const checklistItems = document.querySelectorAll('.checklist-item');
    expect(checklistItems.length).toBe(4); // 2 items in each section of new template
    
    // Simulate checking a new item
    const newCheckbox = checklistItems[2].querySelector('input[type="checkbox"]') as HTMLInputElement;
    newCheckbox.checked = true;
    newCheckbox.dispatchEvent(new Event('change'));
    
    // Verify new state is saved
    expect(mockChrome.storage.local.set).toHaveBeenCalled();
    
    // The saved state should now include both the preserved original items and new items
    const setCallArgs = mockChrome.storage.local.set.mock.calls[0][0];
    expect(Object.keys(setCallArgs[prUrl].items).length).toBeGreaterThan(1);
  });
}); 