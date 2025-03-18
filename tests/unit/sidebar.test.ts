/**
 * Unit tests for the sidebar component
 */

import { Sidebar } from '../../src/content/sidebar';
import { RepoInfo } from '../../src/utils/github-utils';
import { templateManager } from '../../src/utils/template';
import { storageManager } from '../../src/utils/storage';
import { ChecklistState, ChecklistTemplate } from '../../src/types';

// Mock template manager
jest.mock('../../src/utils/template', () => ({
  templateManager: {
    getDefaultTemplate: jest.fn(),
    fetchTemplate: jest.fn(),
    parseTemplate: jest.fn(),
    validateTemplate: jest.fn()
  }
}));

// Mock storage manager
jest.mock('../../src/utils/storage', () => ({
  storageManager: {
    getChecklistState: jest.fn(),
    saveChecklistState: jest.fn(),
    getOptions: jest.fn(),
    saveOptions: jest.fn(),
    clearStorage: jest.fn()
  }
}));

// Mock PR identifier function
jest.mock('../../src/utils/github-utils', () => {
  const originalModule = jest.requireActual('../../src/utils/github-utils');
  return {
    ...originalModule,
    generatePrIdentifier: jest.fn().mockReturnValue('test-owner/test-repo#123')
  };
});

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
  
  // Sample template for testing
  const mockTemplate: ChecklistTemplate = {
    sections: [
      {
        name: 'Test Section 1',
        items: [
          { name: 'Test Item 1' },
          { name: 'Test Item 2', url: 'https://example.com/docs' }
        ]
      },
      {
        name: 'Test Section 2',
        items: [
          { name: 'Test Item 3' }
        ]
      }
    ]
  };

  // Sample state for testing
  const mockState: ChecklistState = {
    items: {
      'test-item-1': { checked: true, needsAttention: false },
      'test-item-2': { checked: false, needsAttention: true },
      'test-item-3': { checked: true, needsAttention: false }
    },
    sections: { 
      'Test Section 1': true, 
      'Test Section 2': false 
    },
    lastUpdated: 1647609600000,
    templateUrl: 'https://github.com/owner/repo/template.json'
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
    
    // Mock template manager default implementation
    (templateManager.getDefaultTemplate as jest.Mock).mockResolvedValue(mockTemplate);

    // Mock storage manager default implementation
    (storageManager.getChecklistState as jest.Mock).mockResolvedValue(null);
    (storageManager.saveChecklistState as jest.Mock).mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });
  
  // Tests for state management
  describe('State Management', () => {
    test('should save state when checkbox is checked', async () => {
      // Inject sidebar
      sidebar.inject();
      
      // Show sidebar
      sidebar.show();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Get first checkbox
      const checkbox = document.querySelector('.checkmate-checklist-checkbox') as HTMLInputElement;
      
      // Click the checkbox
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify state was saved
      expect(storageManager.saveChecklistState).toHaveBeenCalled();
      
      // Check that the state contains the checked item
      const saveCall = (storageManager.saveChecklistState as jest.Mock).mock.calls[0][0];
      expect(saveCall.items['test-item-1'].checked).toBe(true);
    });
    
    test('should load saved state when opening sidebar', async () => {
      // Mock existing state
      (storageManager.getChecklistState as jest.Mock).mockResolvedValue(mockState);
      
      // Inject sidebar
      sidebar.inject();
      
      // Show sidebar
      sidebar.show();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify storage manager was called to get state
      expect(storageManager.getChecklistState).toHaveBeenCalled();
      
      // Check that checkboxes reflect the loaded state
      const checkboxes = document.querySelectorAll('.checkmate-checklist-checkbox') as NodeListOf<HTMLInputElement>;
      
      // First checkbox should be checked (Test Item 1)
      expect(checkboxes[0].checked).toBe(true);
      
      // Second checkbox should be unchecked (Test Item 2)
      expect(checkboxes[1].checked).toBe(false);
      
      // Third checkbox should be checked (Test Item 3)
      expect(checkboxes[2].checked).toBe(true);
      
      // Check that section 2 is collapsed (based on loaded state)
      const sections = document.querySelectorAll('.checkmate-checklist-section-content');
      expect((sections[1] as HTMLElement).style.display).toBe('none');
    });
    
    test('should initialize new state when no saved state exists', async () => {
      // Mock no existing state
      (storageManager.getChecklistState as jest.Mock).mockResolvedValue(null);
      
      // Inject sidebar
      sidebar.inject();
      
      // Show sidebar
      sidebar.show();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify storage manager was called to get state
      expect(storageManager.getChecklistState).toHaveBeenCalled();
      
      // Check that all checkboxes are unchecked
      const checkboxes = document.querySelectorAll('.checkmate-checklist-checkbox') as NodeListOf<HTMLInputElement>;
      Array.from(checkboxes).forEach(checkbox => {
        expect(checkbox.checked).toBe(false);
      });
    });
    
    test('should reset state when restart button is clicked', async () => {
      // Mock existing state
      (storageManager.getChecklistState as jest.Mock).mockResolvedValue(mockState);
      
      // Inject sidebar
      sidebar.inject();
      
      // Show sidebar
      sidebar.show();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify initial state (checkboxes should be checked according to mockState)
      const checkboxes = document.querySelectorAll('.checkmate-checklist-checkbox') as NodeListOf<HTMLInputElement>;
      expect(checkboxes[0].checked).toBe(true);
      
      // Click the restart button
      const restartButton = document.querySelector('.checkmate-restart-button') as HTMLButtonElement;
      restartButton.click();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify state was reset and saved
      expect(storageManager.saveChecklistState).toHaveBeenCalled();
      
      // Check that all checkboxes are unchecked now
      const updatedCheckboxes = document.querySelectorAll('.checkmate-checklist-checkbox') as NodeListOf<HTMLInputElement>;
      Array.from(updatedCheckboxes).forEach(checkbox => {
        expect(checkbox.checked).toBe(false);
      });
    });
    
    test('should update state when section is collapsed', async () => {
      // Inject sidebar
      sidebar.inject();
      
      // Show sidebar
      sidebar.show();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Get section header
      const sectionHeader = document.querySelector('.checkmate-checklist-section-header') as HTMLElement;
      
      // Click section header to collapse
      sectionHeader.click();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify state was saved
      expect(storageManager.saveChecklistState).toHaveBeenCalled();
      
      // Check that the state contains the collapsed section
      const saveCall = (storageManager.saveChecklistState as jest.Mock).mock.calls[0][0];
      expect(saveCall.sections['Test Section 1']).toBe(false);
    });
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
  
  test('should load template when sidebar is shown', async () => {
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Verify template manager was called
    expect(templateManager.getDefaultTemplate).toHaveBeenCalled();
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify sections are rendered
    const sections = document.querySelectorAll('.checkmate-checklist-section');
    expect(sections.length).toBe(2);
    
    // Verify section titles
    const sectionTitles = document.querySelectorAll('.checkmate-checklist-section-title');
    expect(sectionTitles[0].textContent).toBe('Test Section 1');
    expect(sectionTitles[1].textContent).toBe('Test Section 2');
    
    // Verify checklist items
    const checklistItems = document.querySelectorAll('.checkmate-checklist-item');
    expect(checklistItems.length).toBe(3);
    
    // Verify item labels
    const itemLabels = document.querySelectorAll('.checkmate-checklist-item-label');
    expect(itemLabels[0].textContent).toBe('Test Item 1');
    expect(itemLabels[1].textContent).toBe('Test Item 2');
    expect(itemLabels[2].textContent).toBe('Test Item 3');
    
    // Verify documentation link
    const docLinks = document.querySelectorAll('.checkmate-checklist-item-doc-link');
    expect(docLinks.length).toBe(1);
    expect(docLinks[0].getAttribute('href')).toBe('https://example.com/docs');
  });
  
  test('should show loading state while template is loading', async () => {
    // Mock template manager to return a delayed promise
    (templateManager.getDefaultTemplate as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockTemplate), 100);
      });
    });
    
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Verify loading state is shown
    const loadingElement = document.querySelector('.checkmate-checklist-loading');
    expect(loadingElement).toBeTruthy();
    
    // Wait for template to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify loading state is removed and template is rendered
    expect(document.querySelector('.checkmate-checklist-loading')).toBeFalsy();
    expect(document.querySelectorAll('.checkmate-checklist-section').length).toBe(2);
  });
  
  test('should show error state when template loading fails', async () => {
    // Mock template manager to throw an error
    const mockError = new Error('Failed to load template');
    (templateManager.getDefaultTemplate as jest.Mock).mockRejectedValue(mockError);
    
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Wait for error to be caught
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify error state is shown
    const errorElement = document.querySelector('.checkmate-checklist-error');
    expect(errorElement).toBeTruthy();
    expect(errorElement?.textContent).toContain('Failed to load template');
    
    // Verify retry button exists
    const retryButton = errorElement?.querySelector('button');
    expect(retryButton).toBeTruthy();
    
    // Click retry button
    retryButton?.click();
    
    // Verify template manager was called again
    expect(templateManager.getDefaultTemplate).toHaveBeenCalledTimes(2);
  });
  
  test('should toggle section visibility when section header is clicked', async () => {
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Get section elements
    const sectionHeader = document.querySelector('.checkmate-checklist-section-header') as HTMLElement;
    const sectionContent = document.querySelector('.checkmate-checklist-section-content') as HTMLElement;
    const toggleButton = document.querySelector('.checkmate-checklist-section-toggle') as HTMLElement;
    
    // Initially visible
    expect(sectionContent.style.display).not.toBe('none');
    
    // Click section header to collapse
    sectionHeader.click();
    
    // Verify section is collapsed
    expect(sectionContent.style.display).toBe('none');
    expect(toggleButton.innerHTML).toBe('▶');
    
    // Click section header to expand
    sectionHeader.click();
    
    // Verify section is expanded
    expect(sectionContent.style.display).toBe('block');
    expect(toggleButton.innerHTML).toBe('▼');
  });
  
  test('should handle checkbox click events', async () => {
    // Inject sidebar
    sidebar.inject();
    
    // Show sidebar
    sidebar.show();
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Get first checkbox
    const checkbox = document.querySelector('.checkmate-checklist-checkbox') as HTMLInputElement;
    
    // Click the checkbox
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    // Verify state is updated
    expect(storageManager.saveChecklistState).toHaveBeenCalled();
  });
}); 