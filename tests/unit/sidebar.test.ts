/**
 * Unit tests for the sidebar component
 */

import { Sidebar } from '../../src/content/sidebar';
import { RepoInfo } from '../../src/utils/github-utils';

// Mock chrome.runtime API
global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://mock-extension-id/${path}`),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
} as any;

describe('Sidebar Component', () => {
  // Sample repo info for testing
  const mockRepoInfo: RepoInfo = {
    owner: 'test-owner',
    repo: 'test-repo',
    prNumber: 123,
    isValid: true,
  };
  
  // Setup DOM elements
  let sidebar: Sidebar;
  let container: HTMLElement;
  let githubHeaderActions: HTMLElement;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup document body
    document.body.innerHTML = '';
    
    // Create mock GitHub header actions element
    githubHeaderActions = document.createElement('div');
    githubHeaderActions.className = 'gh-header-actions';
    document.body.appendChild(githubHeaderActions);
    
    // Create sidebar instance
    sidebar = new Sidebar(mockRepoInfo);
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  test('should create sidebar instance with correct properties', () => {
    // Verify sidebar is created
    expect(sidebar).toBeDefined();
  });
  
  test('should inject sidebar into DOM', () => {
    // Inject sidebar
    sidebar.inject();
    
    // Check if toggle button is added to GitHub header
    const toggleButton = document.querySelector('.checkmate-sidebar-toggle');
    expect(toggleButton).toBeTruthy();
    
    // Check if sidebar container is added to body
    const sidebarContainer = document.querySelector('.checkmate-sidebar-container');
    expect(sidebarContainer).toBeTruthy();
    
    // Check if stylesheet is injected
    const styleLink = document.querySelector('link[href*="sidebar.css"]');
    expect(styleLink).toBeTruthy();
  });
  
  test('should toggle sidebar visibility', () => {
    // Inject sidebar
    sidebar.inject();
    
    // Get sidebar container
    const sidebarContainer = document.querySelector('.checkmate-sidebar-container') as HTMLElement;
    
    // Initially hidden
    sidebar.hide();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-collapsed')).toBeTruthy();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-expanded')).toBeFalsy();
    
    // Show sidebar
    sidebar.show();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-expanded')).toBeTruthy();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-collapsed')).toBeFalsy();
    
    // Toggle to hide
    sidebar.toggle();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-collapsed')).toBeTruthy();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-expanded')).toBeFalsy();
    
    // Toggle to show
    sidebar.toggle();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-expanded')).toBeTruthy();
    expect(sidebarContainer.classList.contains('checkmate-sidebar-collapsed')).toBeFalsy();
  });
  
  test('should notify background script on visibility change', () => {
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Verify message was sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'sidebarVisibilityChanged',
      data: {
        isVisible: true,
        repoInfo: mockRepoInfo
      }
    });
    
    // Hide sidebar
    sidebar.hide();
    
    // Verify message was sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'sidebarVisibilityChanged',
      data: {
        isVisible: false,
        repoInfo: mockRepoInfo
      }
    });
  });
  
  test('should update content when setContent is called', () => {
    // Inject sidebar
    sidebar.inject();
    
    // Update content
    const testContent = '<p>Test content</p>';
    sidebar.setContent(testContent);
    
    // Get content element
    const contentElement = document.querySelector('.checkmate-sidebar-content');
    expect(contentElement?.innerHTML).toBe(testContent);
  });
  
  test('should clean up when destroy is called', () => {
    // Inject sidebar
    sidebar.inject();
    
    // Verify elements exist
    expect(document.querySelector('.checkmate-sidebar-container')).toBeTruthy();
    expect(document.querySelector('.checkmate-sidebar-toggle')).toBeTruthy();
    
    // Destroy sidebar
    sidebar.destroy();
    
    // Verify elements are removed
    expect(document.querySelector('.checkmate-sidebar-container')).toBeFalsy();
    expect(document.querySelector('.checkmate-sidebar-toggle')).toBeFalsy();
  });
}); 