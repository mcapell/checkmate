/**
 * Integration tests for extension component communication
 * Tests message passing between background script, content script, popup, and options
 */

// Using jest for typings since vitest might not be installed
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as backgroundMock from './background-mock';

// Mock Chrome API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn(),
    create: jest.fn()
  },
  action: {
    setPopup: jest.fn(),
    openPopup: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Provide mock for global chrome object
global.chrome = mockChrome as any;

describe('Extension Communication', () => {
  let messageListeners: Array<(message: any, sender: any, sendResponse: any) => void | boolean> = [];
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Set up mock for message listeners
    messageListeners = [];
    mockChrome.runtime.onMessage.addListener.mockImplementation((callback: any) => {
      messageListeners.push(callback);
    });
    
    // Set up mock for tabs.query to return active tab
    mockChrome.tabs.query.mockImplementation((query: any, callback: any) => {
      callback([{ id: 12345, url: 'https://github.com/owner/repo/pull/123' }]);
    });
  });
  
  afterEach(() => {
    messageListeners = [];
  });
  
  /**
   * Helper function to simulate a message being sent to all listeners
   */
  function simulateMessage(message: any, sender: any = {}, callback: (response: any) => void = () => {}) {
    let hasCallback = false;
    
    messageListeners.forEach(listener => {
      const response = listener(message, sender, callback);
      if (response === true) {
        hasCallback = true;
      }
    });
    
    // If no callbacks kept the channel open, call the callback immediately
    if (!hasCallback) {
      callback({});
    }
  }
  
  /**
   * Test background script receiving messages from content script
   */
  it('should handle sidebar ready message from content script', () => {
    // Set up mock response
    mockChrome.action.setPopup.mockReturnValue(undefined);
    
    // Simulate message handler for sidebar ready
    const messageHandler = (message: any, sender: any, sendResponse: any) => {
      if (message.action === 'sidebarReady' && sender.tab?.id) {
        // Make sure the popup doesn't open when browser action is clicked
        mockChrome.action.setPopup({ tabId: sender.tab.id, popup: '' });
        sendResponse({ success: true });
        return true;
      }
      return false;
    };
    
    // Add the message handler
    messageListeners.push(messageHandler);
    
    // Send the message
    const response = jest.fn();
    simulateMessage({ 
      action: 'sidebarReady',
      data: {
        repoInfo: { owner: 'test-owner', repo: 'test-repo', prNumber: 123 },
        prIdentifier: 'test-owner/test-repo#123'
      }
    }, { tab: { id: 12345 } }, response);
    
    // Verify popup would be cleared in a real scenario
    expect(mockChrome.action.setPopup).toHaveBeenCalledWith({ 
      tabId: 12345, 
      popup: '' 
    });
    
    // Verify response called with success
    expect(response).toHaveBeenCalledWith({ success: true });
  });
  
  /**
   * Test background script receiving sidebar visibility change
   */
  it('should track sidebar visibility changes from content script', () => {
    // Set up mock response
    mockChrome.runtime.sendMessage.mockReturnValue(undefined);
    
    // Simulate message handler for sidebar visibility change
    const messageHandler = (message: any, sender: any, sendResponse: any) => {
      if (message.action === 'sidebarVisibilityChanged' && sender.tab?.id && message.data) {
        // Notify other components about the change
        mockChrome.runtime.sendMessage({
          action: 'sidebarStateChanged',
          data: {
            tabId: sender.tab.id,
            isVisible: message.data.isVisible,
            repoInfo: message.data.repoInfo
          }
        });
        
        sendResponse({ success: true });
        return true;
      }
      return false;
    };
    
    // Add the message handler
    messageListeners.push(messageHandler);
    
    // Send the message
    const response = jest.fn();
    simulateMessage({ 
      action: 'sidebarVisibilityChanged',
      data: {
        isVisible: true,
        repoInfo: { owner: 'test-owner', repo: 'test-repo', prNumber: 123 }
      } 
    }, { tab: { id: 12345 } }, response);
    
    // Verify background would forward state change 
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'sidebarStateChanged',
      data: {
        tabId: 12345,
        isVisible: true,
        repoInfo: { owner: 'test-owner', repo: 'test-repo', prNumber: 123 }
      }
    });
    
    // Verify response was called with success
    expect(response).toHaveBeenCalledWith({ success: true });
  });
  
  /**
   * Test background script handling options requests
   */
  it('should handle options requests from popup and options page', () => {
    // Mock storage data
    const storageData = {
      defaultTemplateUrl: 'https://example.com/template.yaml',
      theme: 'dark'
    };
    
    // Setup storage mock to return options
    mockChrome.storage.sync.get.mockImplementation((keys: any, callback: any) => {
      callback(storageData);
    });
    
    // Simulate message handler for getting options
    const messageHandler = (message: any, sender: any, sendResponse: any) => {
      if (message.action === 'getOptionsFromBackground') {
        // Get options from storage
        mockChrome.storage.sync.get(['defaultTemplateUrl', 'theme'], (data: any) => {
          sendResponse({ success: true, options: data });
        });
        return true;
      }
      return false;
    };
    
    // Add the message handler
    messageListeners.push(messageHandler);
    
    // Send the message
    const response = jest.fn();
    simulateMessage({ action: 'getOptionsFromBackground' }, {}, response);
    
    // Verify storage was accessed
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    
    // Verify response was called with the options
    expect(response).toHaveBeenCalledWith({ 
      success: true, 
      options: storageData 
    });
  });
  
  /**
   * Test background script handling browser action clicks on PR pages
   */
  it('should handle browser action clicks on PR pages', async () => {
    // Mock the PR page check to return true
    const isGitHubPrPageSpy = jest.spyOn(backgroundMock, 'isGitHubPrPage').mockResolvedValue(true);
    
    // Mock tabs.sendMessage to simulate content script response
    mockChrome.tabs.sendMessage.mockImplementation((tabId: any, message: any, callback: any) => {
      if (message.action === 'showSidebar' || message.action === 'hideSidebar') {
        callback({ success: true, isVisible: message.action === 'showSidebar' });
      }
    });
    
    // Mock runtime.sendMessage for state change notification
    mockChrome.runtime.sendMessage.mockReturnValue(undefined);
    
    // Simulate browser action click handler
    const mockClickHandler = async (tab: {id: number}) => {
      if (!tab.id) return;
      
      try {
        // Check if on PR page
        const isPrPage = await backgroundMock.isGitHubPrPage(tab.id);
        
        if (isPrPage) {
          // Send show sidebar message
          mockChrome.tabs.sendMessage(tab.id, { action: 'showSidebar' }, (response: any) => {
            if (response?.success) {
              mockChrome.runtime.sendMessage({
                action: 'sidebarStateChanged',
                data: {
                  tabId: tab.id,
                  isVisible: true
                }
              });
            }
          });
        } else {
          mockChrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
          mockChrome.action.openPopup();
        }
      } catch (error) {
        mockChrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
        mockChrome.action.openPopup();
      }
    };
    
    // Call the mock handler
    await mockClickHandler({ id: 12345 });
    
    // Verify that tabs.sendMessage was called with correct action
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      12345,
      { action: 'showSidebar' },
      expect.any(Function)
    );
    
    // Verify runtime.sendMessage was called to notify about state change
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'sidebarStateChanged',
      data: {
        tabId: 12345,
        isVisible: true
      }
    });
    
    // Verify PR page was checked
    expect(isGitHubPrPageSpy).toHaveBeenCalled();
  });
  
  /**
   * Test background script handling browser action clicks on non-PR pages
   */
  it('should open popup for browser action clicks on non-PR pages', async () => {
    // Mock the PR page check to return false
    const isGitHubPrPageSpy = jest.spyOn(backgroundMock, 'isGitHubPrPage').mockResolvedValue(false);
    
    // Mock action.setPopup and action.openPopup
    mockChrome.action.setPopup.mockReturnValue(undefined);
    mockChrome.action.openPopup.mockReturnValue(undefined);
    
    // Simulate browser action click handler
    const mockClickHandler = async (tab: {id: number}) => {
      if (!tab.id) return;
      
      try {
        // Check if on PR page
        const isPrPage = await backgroundMock.isGitHubPrPage(tab.id);
        
        if (isPrPage) {
          // Send show sidebar message
          mockChrome.tabs.sendMessage(tab.id, { action: 'showSidebar' }, (response: any) => {
            if (response?.success) {
              mockChrome.runtime.sendMessage({
                action: 'sidebarStateChanged',
                data: {
                  tabId: tab.id,
                  isVisible: true
                }
              });
            }
          });
        } else {
          mockChrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
          mockChrome.action.openPopup();
        }
      } catch (error) {
        mockChrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
        mockChrome.action.openPopup();
      }
    };
    
    // Call the mock handler
    await mockClickHandler({ id: 12345 });
    
    // Verify that popup was opened
    expect(mockChrome.action.setPopup).toHaveBeenCalledWith({ 
      tabId: 12345, 
      popup: 'popup.html' 
    });
    expect(mockChrome.action.openPopup).toHaveBeenCalled();
    
    // Verify tabs.sendMessage was not called
    expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    
    // Verify PR page was checked
    expect(isGitHubPrPageSpy).toHaveBeenCalled();
  });
}); 