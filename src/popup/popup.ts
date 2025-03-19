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

// Current state
let currentTemplate: ChecklistTemplate | null = null;
let currentError: ExtensionError | null = null;
let currentOperation: string | null = null;

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

  // Load existing checklists
  loadChecklists();
});

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
  if (!currentError || !currentOperation) return;
  
  switch (currentOperation) {
    case 'loadChecklists':
      loadChecklists();
      break;
    case 'refreshChecklist':
      refreshChecklist();
      break;
    default:
      // Default fallback to loading checklists
      loadChecklists();
  }
}

/**
 * Create a new checklist
 */
function createNewChecklist(): void {
  console.log('Creating new checklist...');
  // TODO: Implement checklist creation UI
}

/**
 * Refresh the current checklist
 */
async function refreshChecklist(): Promise<void> {
  setLoadingState({ isLoading: true, message: 'Refreshing checklist...', operation: 'refreshChecklist' });
  
  try {
    const options = await storageManager.getOptions();
    const template = await templateManager.fetchTemplate(options.defaultTemplateUrl);
    currentTemplate = template;
    renderTemplate(template);
    setLoadingState({ isLoading: false });
  } catch (error) {
    handleTemplateLoadError(error);
  }
}

/**
 * Load checklists from storage
 */
async function loadChecklists(): Promise<void> {
  setLoadingState({ isLoading: true, message: 'Loading checklist...', operation: 'loadChecklists' });
  
  try {
    // Retrieve checklists from storage
    const checklistState = await storageManager.getChecklistState();
    const options = await storageManager.getOptions();
    
    if (!checklistState) {
      // No checklist state, load the default template
      try {
        const defaultTemplate = await templateManager.getDefaultTemplate();
        currentTemplate = defaultTemplate;
        renderTemplate(defaultTemplate);
        setLoadingState({ isLoading: false });
      } catch (error) {
        handleTemplateLoadError(error);
      }
    } else {
      // Have a saved state, load template from the saved URL
      try {
        const template = await templateManager.fetchTemplate(checklistState.templateUrl);
        currentTemplate = template;
        renderTemplate(template);
        setLoadingState({ isLoading: false });
      } catch (error) {
        // If we can't load the saved template, try the default template
        try {
          console.warn('Failed to load template from saved URL, trying default template');
          const defaultTemplate = await templateManager.getDefaultTemplate();
          currentTemplate = defaultTemplate;
          renderTemplate(defaultTemplate);
          setLoadingState({ isLoading: false });
        } catch (fallbackError) {
          // Both attempts failed
          handleTemplateLoadError(fallbackError, 'Failed to load both saved and default templates');
        }
      }
    }
  } catch (error) {
    // Storage error
    handleTemplateLoadError(error);
  }
}

/**
 * Handle template loading errors
 * 
 * @param error - The error that occurred
 * @param customMessage - Optional custom error message
 */
function handleTemplateLoadError(error: unknown, customMessage?: string): void {
  let extensionError: ExtensionError;
  
  if ((error as ExtensionError).category) {
    // Already an ExtensionError
    extensionError = error as ExtensionError;
  } else if (error instanceof Error) {
    if (error.message.includes('YAML')) {
      extensionError = handleYamlError(
        customMessage || 'Failed to parse template YAML',
        error,
        undefined,
        true
      );
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      extensionError = handleNetworkError(
        customMessage || 'Failed to download template',
        error,
        undefined,
        true
      );
    } else {
      extensionError = handleTemplateError(
        customMessage || 'Failed to load template',
        error,
        undefined,
        true
      );
    }
  } else {
    extensionError = handleUnknownError(
      customMessage || 'An unknown error occurred while loading the template',
      error,
      undefined,
      true
    );
  }
  
  displayError(extensionError);
}

/**
 * Render a template in the UI
 * 
 * @param template - The template to render
 */
function renderTemplate(template: ChecklistTemplate): void {
  if (!checklistContainer) return;
  
  checklistContainer.innerHTML = '';
  
  // Create a title for the default template
  const title = document.createElement('h2');
  title.textContent = 'Code Review Checklist';
  title.style.fontSize = '14px';
  title.style.marginTop = '10px';
  title.style.marginBottom = '10px';
  checklistContainer.appendChild(title);
  
  // Render each section
  template.sections.forEach(section => {
    // Ensure checklistContainer exists before proceeding
    if (!checklistContainer) return;
    
    // Create section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';
    sectionHeader.textContent = section.name;
    sectionHeader.style.fontWeight = 'bold';
    sectionHeader.style.marginTop = '10px';
    sectionHeader.style.marginBottom = '5px';
    
    checklistContainer.appendChild(sectionHeader);
    
    // Create section items
    section.items.forEach(item => {
      // Ensure checklistContainer exists before proceeding
      if (!checklistContainer) return;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'checklist-item';
      
      // Create item name
      const itemName = document.createElement('span');
      itemName.textContent = item.name;
      itemName.style.fontSize = '12px';
      
      itemElement.appendChild(itemName);
      
      // Add URL link if available
      if (item.url) {
        const urlLink = document.createElement('a');
        urlLink.href = item.url;
        urlLink.textContent = '📄';
        urlLink.title = 'View documentation';
        urlLink.target = '_blank';
        urlLink.style.marginLeft = '5px';
        urlLink.style.textDecoration = 'none';
        
        itemElement.appendChild(urlLink);
      }
      
      checklistContainer.appendChild(itemElement);
    });
  });
} 