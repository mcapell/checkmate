/**
 * Popup script for GitHub Code Review Checklist extension
 * 
 * This script manages the popup UI and interactions.
 */
import { storageManager } from '../utils/storage';
import { templateManager } from '../utils/template';
import { ChecklistTemplate, ErrorCategory, ExtensionError, LoadingState } from '../types';
import { handleTemplateError, handleYamlError, handleNetworkError, handleUnknownError } from '../utils/error-handler';

// UI Elements
let checklistContainer: HTMLElement | null;
let loadingContainer: HTMLElement | null;
let loadingMessage: HTMLElement | null;
let errorContainer: HTMLElement | null;
let errorTitle: HTMLElement | null;
let errorMessage: HTMLElement | null;
let errorSuggestions: HTMLElement | null;
let retryButton: HTMLElement | null;
let refreshButton: HTMLElement | null;
let newChecklistButton: HTMLElement | null;
let goToPrButton: HTMLElement | null;
let nonPrContainer: HTMLElement | null;

// Current state
let currentTemplate: ChecklistTemplate | null = null;
let currentError: ExtensionError | null = null;
let currentOperation: string | null = null;
let currentTabId: number | null = null;
let sidebarState: { isVisible: boolean; repoInfo?: any } | null = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI references
  checklistContainer = document.getElementById('checklist-container');
  loadingContainer = document.getElementById('loading-container');
  loadingMessage = document.getElementById('loading-message');
  errorContainer = document.getElementById('error-container');
  errorTitle = document.getElementById('error-title');
  errorMessage = document.getElementById('error-message');
  errorSuggestions = document.getElementById('error-suggestions');
  retryButton = document.getElementById('retry-btn');
  refreshButton = document.getElementById('refresh-btn');
  newChecklistButton = document.getElementById('new-checklist-btn');
  nonPrContainer = document.getElementById('non-pr-container');
  goToPrButton = document.getElementById('go-to-pr-btn');

  // Set up event listeners
  if (newChecklistButton) {
    newChecklistButton.addEventListener('click', createNewChecklist);
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', refreshChecklist);
  }

  if (retryButton) {
    retryButton.addEventListener('click', retryLastOperation);
  }
  
  if (goToPrButton) {
    goToPrButton.addEventListener('click', navigateToPrPage);
  }

  // Get the current tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      currentTabId = tabs[0].id;
      
      // Check if this is a GitHub PR page
      checkIfPrPage(currentTabId)
        .then(isPrPage => {
          if (isPrPage) {
            // This is a PR page, load the checklist
            loadChecklists();
          } else {
            // This is not a PR page, show non-PR UI
            showNonPrInterface();
          }
        })
        .catch(error => {
          // If there's an error, default to non-PR interface
          console.error('Error checking if PR page:', error);
          showNonPrInterface();
        });
    }
  });
});

/**
 * Check if the current tab is a GitHub PR page
 */
async function checkIfPrPage(tabId: number): Promise<boolean> {
  try {
    // Ask the content script if this is a PR page
    const response = await chrome.tabs.sendMessage(tabId, { action: 'checkIfPrPage' });
    return response && response.isPrPage === true;
  } catch (error) {
    console.error('Error checking if PR page:', error);
    return false;
  }
}

/**
 * Show the non-PR interface
 */
function showNonPrInterface(): void {
  if (!nonPrContainer || !checklistContainer || !loadingContainer || !errorContainer) return;
  
  // Hide other containers
  checklistContainer.style.display = 'none';
  loadingContainer.style.display = 'none';
  errorContainer.style.display = 'none';
  
  // Create and show the non-PR container if it doesn't exist
  if (!nonPrContainer) {
    nonPrContainer = document.createElement('div');
    nonPrContainer.id = 'non-pr-container';
    nonPrContainer.className = 'non-pr-container';
    document.body.appendChild(nonPrContainer);
  }
  
  nonPrContainer.innerHTML = `
    <div class="non-pr-message">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32" fill="#6e7781">
        <path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
      </svg>
      <h2>Not a GitHub Pull Request</h2>
      <p>This extension adds a checklist to GitHub pull requests.</p>
      <p>Navigate to a GitHub PR to use the checklist feature.</p>
      <div class="non-pr-buttons">
        <button id="go-to-pr-btn" class="primary-btn">Go to GitHub</button>
        <button id="open-options-btn" class="secondary-btn">Options</button>
      </div>
    </div>
  `;
  
  nonPrContainer.style.display = 'block';
  
  // Add event listeners to the newly created buttons
  document.getElementById('go-to-pr-btn')?.addEventListener('click', navigateToPrPage);
  document.getElementById('open-options-btn')?.addEventListener('click', openOptionsPage);
}

/**
 * Navigate to GitHub PR page
 */
function navigateToPrPage(): void {
  chrome.tabs.create({ url: 'https://github.com/pulls' });
  window.close(); // Close the popup
}

/**
 * Open the options page
 */
function openOptionsPage(): void {
  chrome.runtime.openOptionsPage();
  window.close(); // Close the popup
}

/**
 * Set the UI state for loading
 * 
 * @param state - Loading state object
 */
function setLoadingState(state: LoadingState): void {
  if (!loadingContainer || !loadingMessage || !checklistContainer || !errorContainer) return;

  if (state.isLoading) {
    currentOperation = state.operation || null;
    loadingContainer.style.display = 'flex';
    checklistContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    if (nonPrContainer) {
      nonPrContainer.style.display = 'none';
    }
    
    if (state.message) {
      loadingMessage.textContent = state.message;
    } else {
      loadingMessage.textContent = 'Loading...';
    }
  } else {
    loadingContainer.style.display = 'none';
    checklistContainer.style.display = 'block';
  }
}

/**
 * Display an error in the UI
 * 
 * @param error - The error to display
 */
function displayError(error: ExtensionError): void {
  if (!errorContainer || !errorTitle || !errorMessage || !errorSuggestions || !checklistContainer || !loadingContainer) return;
  
  currentError = error;
  
  // Set up error container
  errorContainer.style.display = 'block';
  loadingContainer.style.display = 'none';
  checklistContainer.style.display = 'none';
  
  if (nonPrContainer) {
    nonPrContainer.style.display = 'none';
  }
  
  // Set error category and message
  errorTitle.textContent = `Error: ${getCategoryDisplayName(error.category)}`;
  errorMessage.textContent = error.message;
  
  // Clear and populate suggestions
  errorSuggestions.innerHTML = '';
  
  if (error.suggestions && error.suggestions.length > 0) {
    error.suggestions.forEach(suggestion => {
      // Make sure errorSuggestions is not null before using it
      if (errorSuggestions) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'error-suggestion';
        suggestionElement.textContent = suggestion;
        errorSuggestions.appendChild(suggestionElement);
      }
    });
    
    if (errorSuggestions) {
      errorSuggestions.style.display = 'block';
    }
  } else {
    if (errorSuggestions) {
      errorSuggestions.style.display = 'none';
    }
  }
  
  // Setup retry button visibility based on recoverable flag
  if (retryButton) {
    retryButton.style.display = error.recoverable ? 'block' : 'none';
  }
}

/**
 * Get a user-friendly display name for error categories
 * 
 * @param category - The error category
 * @returns Display name for the category
 */
function getCategoryDisplayName(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.TEMPLATE:
      return 'Template';
    case ErrorCategory.STORAGE:
      return 'Storage';
    case ErrorCategory.GITHUB:
      return 'GitHub';
    case ErrorCategory.NETWORK:
      return 'Network';
    case ErrorCategory.YAML:
      return 'YAML Parsing';
    default:
      return 'Unknown';
  }
}

/**
 * Retry the last operation that failed
 */
async function retryLastOperation(): Promise<void> {
  if (!currentError?.recoverable) return;
  
  switch (currentOperation) {
    case 'load':
      await loadChecklists();
      break;
    case 'refresh':
      await refreshChecklist();
      break;
    case 'create':
      createNewChecklist();
      break;
    default:
      await loadChecklists(); // Default to reload
  }
}

/**
 * Create a new checklist template
 */
function createNewChecklist(): void {
  // Create a new checklist or open a form
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') + '#new-template' });
  window.close(); // Close the popup
}

/**
 * Refresh the current checklist
 */
async function refreshChecklist(): Promise<void> {
  setLoadingState({
    isLoading: true,
    message: 'Refreshing checklist...',
    operation: 'refresh'
  });
  
  try {
    // Force reload checklist data
    await loadChecklists(true);
    setLoadingState({ isLoading: false });
  } catch (error) {
    handleTemplateLoadError(error, 'Failed to refresh checklist');
  }
}

/**
 * Get active sidebar state from background script
 */
async function getActiveSidebarState(): Promise<{ isVisible: boolean; repoInfo?: any } | null> {
  if (!currentTabId) return null;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getActiveSidebarState',
      data: { tabId: currentTabId }
    });
    
    if (response && response.success) {
      return response.state;
    }
  } catch (error) {
    console.error('Error getting sidebar state:', error);
  }
  
  return null;
}

/**
 * Load checklists from storage
 */
async function loadChecklists(forceRefresh: boolean = false): Promise<void> {
  setLoadingState({
    isLoading: true,
    message: 'Loading checklists...',
    operation: 'load'
  });
  
  try {
    // Get the current sidebar state
    sidebarState = await getActiveSidebarState();
    
    // Fetch default template from options
    const optionsResponse = await chrome.runtime.sendMessage({
      action: 'getOptionsFromBackground'
    });
    
    if (!optionsResponse || !optionsResponse.success) {
      throw new Error(optionsResponse?.error?.message || 'Failed to load options');
    }
    
    const options = optionsResponse.options;
    
    // Use options to load template
    let template: ChecklistTemplate;
    
    if (forceRefresh) {
      template = await templateManager.fetchTemplate(options.defaultTemplateUrl);
    } else {
      template = await templateManager.getDefaultTemplate();
    }
    
    currentTemplate = template;
    
    // Render the template
    renderTemplate(template);
    
    // Hide loading state
    setLoadingState({ isLoading: false });
  } catch (error) {
    handleTemplateLoadError(error);
  }
}

/**
 * Handle template loading errors
 */
function handleTemplateLoadError(error: unknown, customMessage?: string): void {
  console.error('Template load error:', error);
  
  let errorObj: ExtensionError;
  
  if ((error as any)?.name === 'YAMLException') {
    errorObj = handleYamlError(
      'Failed to parse YAML template',
      error,
      undefined,
      true
    );
  } else if ((error as Error)?.message?.includes('network')) {
    errorObj = handleNetworkError(
      'Failed to download template',
      error,
      undefined,
      true
    );
  } else if ((error as ExtensionError)?.category === ErrorCategory.TEMPLATE) {
    // Keep the original error if it's already an ExtensionError
    errorObj = error as ExtensionError;
  } else {
    errorObj = handleUnknownError(
      'An unknown error occurred while loading the template',
      error,
      undefined,
      true
    );
  }
  
  // Override with custom message if provided
  if (customMessage) {
    errorObj.message = customMessage;
  }
  
  // Display the error in the UI
  displayError(errorObj);
  
  // Report error to background script for logging
  chrome.runtime.sendMessage({
    action: 'logError',
    data: {
      error: errorObj
    }
  });
}

/**
 * Render a template in the UI
 */
function renderTemplate(template: ChecklistTemplate): void {
  if (!checklistContainer) return;
  
  // Clear existing content
  checklistContainer.innerHTML = '';
  
  if (template.sections.length === 0) {
    checklistContainer.innerHTML = '<div class="empty-state">No checklist items found. Create a new checklist template or select a different one.</div>';
    return;
  }
  
  // Render each section
  template.sections.forEach((section, sectionIndex) => {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'checklist-section';
    
    // Create section header
    const headerElement = document.createElement('h2');
    headerElement.className = 'section-header';
    headerElement.textContent = section.name;
    sectionElement.appendChild(headerElement);
    
    // Create section items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'checklist-items';
    
    // Add each checklist item
    section.items.forEach((item, itemIndex) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'checklist-item';
      
      const itemContent = document.createElement('div');
      itemContent.className = 'item-content';
      
      // Create item name (with link if URL provided)
      if (item.url) {
        const linkElement = document.createElement('a');
        linkElement.href = item.url;
        linkElement.target = '_blank';
        linkElement.textContent = item.name;
        linkElement.className = 'item-link';
        itemContent.appendChild(linkElement);
      } else {
        itemContent.textContent = item.name;
      }
      
      itemElement.appendChild(itemContent);
      itemsContainer.appendChild(itemElement);
    });
    
    sectionElement.appendChild(itemsContainer);
    checklistContainer.appendChild(sectionElement);
  });
  
  // Add sidebar toggle
  if (currentTabId && sidebarState) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'sidebar-toggle-container';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = `sidebar-toggle-btn ${sidebarState.isVisible ? 'active' : ''}`;
    toggleButton.textContent = sidebarState.isVisible ? 'Hide Sidebar' : 'Show Sidebar';
    
    toggleButton.addEventListener('click', () => toggleSidebar(currentTabId!));
    
    toggleContainer.appendChild(toggleButton);
    checklistContainer.appendChild(toggleContainer);
  }
}

/**
 * Toggle the sidebar in the content script
 */
async function toggleSidebar(tabId: number): Promise<void> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'toggleSidebar' });
    
    if (response && response.success) {
      // Update our local state
      if (sidebarState) {
        sidebarState.isVisible = !!response.isVisible;
      }
      
      // Update UI
      const toggleButton = document.querySelector('.sidebar-toggle-btn');
      if (toggleButton) {
        if (response.isVisible) {
          toggleButton.textContent = 'Hide Sidebar';
          toggleButton.classList.add('active');
        } else {
          toggleButton.textContent = 'Show Sidebar';
          toggleButton.classList.remove('active');
        }
      }
    }
  } catch (error) {
    console.error('Failed to toggle sidebar:', error);
    
    // Display error
    displayError({
      category: ErrorCategory.GITHUB,
      message: 'Failed to toggle sidebar. Try refreshing the page.',
      details: error,
      timestamp: Date.now(),
      recoverable: false
    });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sidebarStateChanged') {
    // Background script is telling us sidebar state has changed
    if (message.data && message.data.tabId === currentTabId) {
      sidebarState = {
        isVisible: message.data.isVisible,
        repoInfo: message.data.repoInfo
      };
      
      // Update UI if template is rendered
      if (currentTemplate) {
        renderTemplate(currentTemplate);
      }
    }
  }
  
  // Always respond to keep the message channel open
  sendResponse({ success: true });
  return true;
}); 