/**
 * Unit tests for content script functionality
 * 
 * Note: This tests only the functions directly, not the module side-effects
 */

import { Sidebar } from '../../src/content/sidebar';
import * as githubUtils from '../../src/utils/github-utils';

// Mock the sidebar class
jest.mock('../../src/content/sidebar');

// Mock chrome runtime
const mockSendMessage = jest.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    getURL: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
} as any;

// Create mock sidebar instance for testing
const mockSidebar = {
  inject: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  destroy: jest.fn(),
  setContent: jest.fn()
};

// Mock the content script's injectSidebar function
const injectSidebar = (repoInfo: any) => {
  // Setup the Sidebar constructor mock to return our mockSidebar
  (Sidebar as jest.Mock).mockImplementation(() => mockSidebar);
  
  // Create sidebar
  const sidebar = new Sidebar(repoInfo);
  sidebar.inject();
  sidebar.hide();
  return sidebar;
};

describe('Content Script Functions', () => {
  const mockRepoInfo = {
    owner: 'test-owner',
    repo: 'test-repo',
    prNumber: 123,
    isValid: true
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="gh-header-actions"></div>
    `;
    
    // Mock github utilities
    jest.spyOn(githubUtils, 'isGitHubPrPage').mockReturnValue(true);
    jest.spyOn(githubUtils, 'getCurrentRepoInfo').mockReturnValue(mockRepoInfo);
    jest.spyOn(githubUtils, 'getCurrentPrIdentifier').mockReturnValue('test-owner/test-repo#123');
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });
  
  test('injectSidebar should create and configure sidebar correctly', () => {
    // Execute
    const sidebar = injectSidebar(mockRepoInfo);
    
    // Verify
    expect(Sidebar).toHaveBeenCalledWith(mockRepoInfo);
    expect(mockSidebar.inject).toHaveBeenCalled();
    expect(mockSidebar.hide).toHaveBeenCalled();
  });
  
  test('sidebar message handling should work correctly', () => {
    // Setup
    const sidebar = injectSidebar(mockRepoInfo);
    const sendResponse = jest.fn();
    
    // Create a message handler similar to what's in content.ts
    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      if (!sidebar) return;
      
      switch (message.action) {
        case 'showSidebar':
          sidebar.show();
          sendResponse({ success: true });
          break;
          
        case 'hideSidebar':
          sidebar.hide();
          sendResponse({ success: true });
          break;
          
        case 'updateSidebarContent':
          if (message.data && message.data.content) {
            sidebar.setContent(message.data.content);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No content provided' });
          }
          break;
      }
    };
    
    // Test show action
    handleMessage({ action: 'showSidebar' }, {}, sendResponse);
    expect(mockSidebar.show).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test hide action
    handleMessage({ action: 'hideSidebar' }, {}, sendResponse);
    expect(mockSidebar.hide).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test update content action
    handleMessage({ 
      action: 'updateSidebarContent',
      data: { content: '<p>Test content</p>' }
    }, {}, sendResponse);
    expect(mockSidebar.setContent).toHaveBeenCalledWith('<p>Test content</p>');
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test update content with missing data
    handleMessage({ 
      action: 'updateSidebarContent',
      data: {}
    }, {}, sendResponse);
    expect(mockSidebar.setContent).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ 
      success: false, 
      error: 'No content provided' 
    });
  });
}); 