/**
 * Sidebar component for GitHub Code Review Checklist
 * 
 * This module provides the UI for the sidebar that contains the checklist
 */

import { RepoInfo } from '../utils/github-utils';
import { ChecklistTemplate, Section, ChecklistItem, ChecklistState, ItemState } from '../types';
import { templateManager } from '../utils/template';
import { storageManager } from '../utils/storage';
import { themeManager } from '../utils/theme';
import { generatePrIdentifier } from '../utils/github-utils';

// TypeScript declaration for the Firefox browser API
declare const browser: typeof chrome;

// CSS class names for styling and element selection
const CSS_CLASSES = {
  SIDEBAR_CONTAINER: 'checkmate-sidebar-container',
  SIDEBAR: 'checkmate-sidebar',
  SIDEBAR_HEADER: 'checkmate-sidebar-header',
  SIDEBAR_TITLE: 'checkmate-sidebar-title',
  SIDEBAR_CONTROLS: 'checkmate-sidebar-controls',
  SIDEBAR_CONTENT: 'checkmate-sidebar-content',
  SIDEBAR_TOGGLE: 'checkmate-sidebar-toggle',
  SIDEBAR_EXPANDED: 'checkmate-sidebar-expanded',
  SIDEBAR_COLLAPSED: 'checkmate-sidebar-collapsed',
  GITHUB_HEADER: 'gh-header-actions',
  
  // New CSS classes for checklist elements
  CHECKLIST_SECTION: 'checkmate-checklist-section',
  CHECKLIST_SECTION_HEADER: 'checkmate-checklist-section-header',
  CHECKLIST_SECTION_TITLE: 'checkmate-checklist-section-title',
  CHECKLIST_SECTION_TOGGLE: 'checkmate-checklist-section-toggle',
  CHECKLIST_SECTION_CONTENT: 'checkmate-checklist-section-content',
  CHECKLIST_SECTION_CONTROLS: 'checkmate-checklist-section-controls',
  CHECKLIST_BACK_TO_TOP: 'checkmate-back-to-top',
  CHECKLIST_EXPAND_COLLAPSE_BTN: 'checkmate-expand-collapse-btn',
  CHECKLIST_ITEM: 'checkmate-checklist-item',
  CHECKLIST_CHECKBOX: 'checkmate-checklist-checkbox',
  CHECKLIST_ITEM_LABEL: 'checkmate-checklist-item-label',
  CHECKLIST_ITEM_DOC_LINK: 'checkmate-checklist-item-doc-link',
  CHECKLIST_LOADING: 'checkmate-checklist-loading',
  CHECKLIST_ERROR: 'checkmate-checklist-error',
  RESTART_BUTTON: 'checkmate-restart-button',
  
  // New CSS classes for needs attention state and section
  ITEM_NEEDS_ATTENTION: 'checkmate-item-needs-attention',
  ITEM_STATE_TOGGLE: 'checkmate-item-state-toggle',
  NEEDS_ATTENTION_ICON: 'checkmate-needs-attention-icon',
  NEEDS_ATTENTION_SECTION: 'checkmate-needs-attention-section',
  NEEDS_ATTENTION_HEADER: 'checkmate-needs-attention-header',
  NEEDS_ATTENTION_TITLE: 'checkmate-needs-attention-title',
  NEEDS_ATTENTION_CONTENT: 'checkmate-needs-attention-content',
  NEEDS_ATTENTION_ITEM: 'checkmate-needs-attention-item',
  NEEDS_ATTENTION_LINK: 'checkmate-needs-attention-link',
  NEEDS_ATTENTION_EMPTY: 'checkmate-needs-attention-empty',
};

/**
 * Creates and manages the sidebar component
 */
export class Sidebar {
  private container: HTMLElement;
  private sidebar: HTMLElement;
  private content: HTMLElement;
  private isVisible: boolean = false;
  private repoInfo: RepoInfo;
  private template: ChecklistTemplate | null = null;
  private isLoading: boolean = false;
  private error: Error | null = null;
  private state: ChecklistState | null = null;
  private stateKey: string | null = null;

  /**
   * Creates a new sidebar instance
   * 
   * @param repoInfo - Repository information for the current PR
   * @param initialTemplate - Optional initial template to use
   */
  constructor(repoInfo: RepoInfo, initialTemplate?: ChecklistTemplate) {
    this.repoInfo = repoInfo;
    this.container = this.createContainer();
    this.sidebar = this.createSidebar();
    this.content = this.createContent();
    
    this.sidebar.appendChild(this.createHeader());
    this.sidebar.appendChild(this.content);
    this.container.appendChild(this.sidebar);

    // Set the initial template if provided
    if (initialTemplate) {
      this.template = initialTemplate;
    }

    // Generate state key for the current PR
    this.stateKey = this.generateStateKey();
    
    // Initialize the sidebar
    this.initialize();
  }

  /**
   * Get the repository owner
   */
  public getRepoOwner(): string {
    return this.repoInfo.owner;
  }

  /**
   * Get the repository name
   */
  public getRepoName(): string {
    return this.repoInfo.repo;
  }

  /**
   * Get the PR number
   */
  public getPrNumber(): number | undefined {
    return this.repoInfo.prNumber;
  }

  /**
   * Returns whether the sidebar is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Creates the container element that will hold the sidebar
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = CSS_CLASSES.SIDEBAR_CONTAINER;
    container.classList.add(CSS_CLASSES.SIDEBAR_COLLAPSED);
    return container;
  }

  /**
   * Creates the sidebar element
   */
  private createSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = CSS_CLASSES.SIDEBAR;
    return sidebar;
  }

  /**
   * Creates the header element with title and controls
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = CSS_CLASSES.SIDEBAR_HEADER;

    // Add title
    const title = document.createElement('h3');
    title.className = CSS_CLASSES.SIDEBAR_TITLE;
    title.textContent = 'Checkmate';
    header.appendChild(title);

    // Add controls
    const controls = document.createElement('div');
    controls.className = CSS_CLASSES.SIDEBAR_CONTROLS;
    
    // Restart button
    const restartButton = document.createElement('button');
    restartButton.className = CSS_CLASSES.RESTART_BUTTON;
    restartButton.textContent = 'Restart Review';
    restartButton.title = 'Reset checklist state';
    restartButton.addEventListener('click', () => this.resetState());
    
    // Options button
    const optionsButton = document.createElement('button');
    optionsButton.className = CSS_CLASSES.RESTART_BUTTON; // Reuse the same styling as restart button
    optionsButton.textContent = '⚙️ Options';
    optionsButton.title = 'Open options page';
    optionsButton.addEventListener('click', () => {
      try {
        // Send message to background script to open options page
        chrome.runtime.sendMessage({ action: 'openOptionsPage' }, (response) => {
          if (!response || !response.success) {
            console.error('Failed to open options page:', response?.error || 'Unknown error');
          }
        });
      } catch (error) {
        console.error('Error sending message to open options page:', error);
      }
    });
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => this.hide());
    
    controls.appendChild(restartButton);
    controls.appendChild(optionsButton);
    controls.appendChild(closeButton);
    header.appendChild(controls);

    return header;
  }

  /**
   * Creates the content container for the checklist
   */
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = CSS_CLASSES.SIDEBAR_CONTENT;
    return content;
  }

  /**
   * Create the toggle button for the sidebar
   */
  private createToggleButton(): HTMLElement {
    const toggleButton = document.createElement('button');
    toggleButton.className = CSS_CLASSES.SIDEBAR_TOGGLE;
    toggleButton.title = 'Toggle code review checklist';
    toggleButton.innerHTML = '📋';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '80px';
    toggleButton.style.right = '0';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.background = '#2ea44f'; // GitHub green
    toggleButton.style.color = '#ffffff';
    toggleButton.style.border = '1px solid #2c974b';
    toggleButton.style.borderRight = 'none';
    toggleButton.style.borderRadius = '4px 0 0 4px';
    toggleButton.style.padding = '8px 10px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '16px';
    toggleButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
    
    toggleButton.addEventListener('click', () => this.toggle());
    return toggleButton;
  }
  
  /**
   * Initialize the sidebar and load template data
   */
  private async initialize(): Promise<void> {
    try {
      // Apply the theme based on user preferences
      await this.applyTheme();
      
      // Load template only if we don't already have one
      if (!this.template) {
        await this.loadTemplate();
      } else {
        console.log('Using pre-loaded template:', this.template);
        // Still need to load saved state
        await this.loadState();
        // Render the template
        this.renderTemplate();
      }
    } catch (error) {
      console.error('Failed to initialize sidebar:', error);
    }
  }
  
  /**
   * Apply theme based on user preference
   */
  private async applyTheme(): Promise<void> {
    try {
      await themeManager.applyTheme(this.container);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  /**
   * Inject the sidebar into the page
   */
  public inject(): void {
    // Inject the sidebar container only
    document.body.appendChild(this.container);
    
    // No longer inject toggle button into GitHub UI
    
    // Inject the custom styles
    this.injectStyles();
  }
  
  /**
   * Inject the CSS styles for the sidebar
   */
  private injectStyles(): void {
    // Load CSS files from extension resources
    const sidebarStyles = chrome.runtime.getURL('content/sidebar.css');
    const themeStyles = chrome.runtime.getURL('styles/theme.css');
    
    // Create link elements for styles
    const addStylesheet = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      // Add error handler for Firefox which might have issues with certain resources
      link.onerror = () => {
        console.error(`Failed to load stylesheet: ${href}`);
        // Try alternate approach - inject styles as inline styles
        this.injectStylesAlternative(href);
      };
      
      document.head.appendChild(link);
    };
    
    addStylesheet(themeStyles);
    addStylesheet(sidebarStyles);
  }
  
  /**
   * Alternative method to inject styles when normal loading fails
   * (Used primarily for Firefox compatibility)
   */
  private injectStylesAlternative(styleUrl: string): void {
    try {
      // Fetch the CSS content directly
      fetch(styleUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch stylesheet: ${styleUrl}`);
          }
          return response.text();
        })
        .then(cssText => {
          // Create a style element and inject the CSS content
          const style = document.createElement('style');
          style.textContent = cssText;
          document.head.appendChild(style);
          console.log(`Successfully injected styles from ${styleUrl} as inline styles`);
        })
        .catch(error => {
          console.error('Error injecting alternative styles:', error);
        });
    } catch (error) {
      console.error('Failed to inject alternative styles:', error);
    }
  }

  /**
   * Shows the sidebar
   */
  public show(): void {
    // Use a timeout to ensure DOM updates happen after Firefox fully processes the UI
    setTimeout(() => {
      this.container.classList.remove(CSS_CLASSES.SIDEBAR_COLLAPSED);
      this.container.classList.add(CSS_CLASSES.SIDEBAR_EXPANDED);
      this.isVisible = true;
      
      // Firefox-specific workaround to ensure style updates are applied
      if (navigator.userAgent.includes('Firefox')) {
        // Force a reflow to ensure Firefox applies the styles correctly
        this.container.style.display = 'none';
        this.container.offsetHeight; // Trigger a reflow
        this.container.style.display = '';
        
        // Log for debugging
        console.log('Firefox workaround applied for sidebar show()');
      }
      
      // Only load template if we don't already have one
      if (!this.template) {
        this.loadTemplate();
      }
      
      // Notify background script
      this.notifyVisibilityChange(true);
    }, 0);
  }

  /**
   * Hides the sidebar
   */
  public hide(): void {
    // Use a timeout to ensure DOM updates happen after Firefox fully processes the UI
    setTimeout(() => {
      this.container.classList.remove(CSS_CLASSES.SIDEBAR_EXPANDED);
      this.container.classList.add(CSS_CLASSES.SIDEBAR_COLLAPSED);
      this.isVisible = false;
      
      // Firefox-specific workaround to ensure style updates are applied
      if (navigator.userAgent.includes('Firefox')) {
        // Force a reflow to ensure Firefox applies the styles correctly
        this.container.style.display = 'none';
        this.container.offsetHeight; // Trigger a reflow
        this.container.style.display = '';
        
        // Log for debugging
        console.log('Firefox workaround applied for sidebar hide()');
      }
      
      // Notify background script
      this.notifyVisibilityChange(false);
    }, 0);
  }

  /**
   * Toggles the sidebar visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Notifies the background script about sidebar visibility changes
   */
  private notifyVisibilityChange(isVisible: boolean): void {
    chrome.runtime.sendMessage({
      action: 'sidebarVisibilityChanged',
      data: {
        isVisible,
        repoInfo: this.repoInfo
      }
    });
  }

  /**
   * Updates the content of the sidebar
   * 
   * @param content - HTML content to display in the sidebar
   */
  public setContent(content: string): void {
    this.content.innerHTML = content;
  }

  /**
   * Generates a unique state key based on the PR identifier
   * @returns A unique key for storing the state of this PR
   */
  private generateStateKey(): string | null {
    const prIdentifier = generatePrIdentifier(this.repoInfo);
    if (!prIdentifier) {
      console.error('Failed to generate state key: Invalid PR identifier');
      return null;
    }
    return `checkmate_state_${prIdentifier}`;
  }

  /**
   * Loads the template and state
   * This fetches the template from storage or default
   */
  private async loadTemplate(): Promise<void> {
    // Show loading state
    this.renderLoading();
    this.isLoading = true;
    this.error = null;

    try {
      // Generate state key for this PR
      this.stateKey = this.generateStateKey();
      
      // Get options to check if there's a custom template URL
      const options = await storageManager.getOptions();
      console.log('Options loaded:', options);
      
      if (options && options.defaultTemplateUrl) {
        // Load from custom URL
        console.log(`Attempting to load template from custom URL: ${options.defaultTemplateUrl}`);
        try {
          this.template = await templateManager.fetchTemplate(options.defaultTemplateUrl);
          console.log('Successfully loaded template from custom URL:', options.defaultTemplateUrl);
        } catch (templateError) {
          console.error('Error loading custom template:', templateError);
          // Fall back to default template if custom template fails
          console.log('Falling back to default template...');
          this.template = await templateManager.getDefaultTemplate();
        }
      } else {
        // Fetch the default template
        console.log('No custom URL found, loading default template');
        this.template = await templateManager.getDefaultTemplate();
      }
      
      console.log('Template loaded successfully:', this.template);
      
      // Load the saved state if available
      await this.loadState();
      
      // Render the template
      this.renderTemplate();
    } catch (error) {
      console.error('Failed to load template:', error);
      
      // Create a more user-friendly error
      if (error instanceof Error) {
        // Check for known error types and provide better messages
        if (error.message.includes('network') || error.message.includes('fetch')) {
          this.error = new Error(`Failed to load template: Network error. Please check your internet connection.`);
        } else if (error.message.includes('YAML') || error.message.includes('parse')) {
          this.error = new Error(`Failed to load template: Invalid template format. Please contact the extension developer.`);
        } else if (error.message.includes('storage')) {
          this.error = new Error(`Failed to load template: Storage error. Please try clearing your browser cache.`);
        } else {
          this.error = error;
        }
      } else {
        this.error = new Error(String(error));
      }
      
      this.renderError();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Loads the checklist state from storage
   */
  private async loadState(): Promise<void> {
    if (!this.stateKey) {
      this.stateKey = this.generateStateKey();
      if (!this.stateKey) {
        console.warn('Unable to generate state key, cannot load state');
        return;
      }
    }

    try {
      console.log('Loading state for key:', this.stateKey);
      const storageState = await storageManager.getChecklistState();
      
      if (storageState && this.stateKey in storageState) {
        this.state = storageState[this.stateKey];
        console.log('Loaded state from storage', this.state);
      } else {
        console.log('No existing state found, initializing new state');
        // Initialize new state if none exists
        this.initializeState();
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      // If loading fails, initialize a new state
      this.initializeState();
    }
  }

  /**
   * Initializes a new empty state
   */
  private initializeState(): void {
    if (!this.template) {
      console.warn('Cannot initialize state: Template not loaded');
      return;
    }

    const items: Record<string, ItemState> = {};
    const sections: Record<string, boolean> = {};

    // Initialize items with unchecked state
    this.template.sections.forEach(section => {
      sections[section.name] = true; // Default to expanded
      section.items.forEach(item => {
        const itemId = this.generateItemId(item);
        items[itemId] = {
          checked: false,
          needsAttention: false
        };
      });
    });

    this.state = {
      items,
      sections,
      lastUpdated: Date.now(),
      templateUrl: '', // Will be set when we implement template versioning
    };

    console.log('Initialized new state', this.state);
  }

  /**
   * Saves the current state to storage
   */
  private async saveState(): Promise<void> {
    if (!this.state || !this.stateKey) {
      console.warn('No state or state key available, cannot save state');
      return;
    }

    try {
      // Update last updated timestamp
      this.state.lastUpdated = Date.now();
      
      // Get current storage state or initialize empty object
      const storageState = await storageManager.getChecklistState() || {};
      
      // Update the specific PR state
      storageState[this.stateKey] = this.state;
      
      // Save the entire storage state
      await storageManager.saveChecklistState(storageState);
      console.log('Saved state to storage', this.state);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Resets the checklist state to all unchecked
   */
  private async resetState(): Promise<void> {
    try {
      this.initializeState();
      await this.saveState();
      this.renderTemplate();
      console.log('State reset successfully');
    } catch (error) {
      console.error('Failed to reset state:', error);
    }
  }

  /**
   * Renders the loading state in the sidebar
   */
  private renderLoading(): void {
    const loadingElement = document.createElement('div');
    loadingElement.className = CSS_CLASSES.CHECKLIST_LOADING;
    loadingElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-loader spin">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <p>Loading checklist...</p>
    `;
    this.content.innerHTML = '';
    this.content.appendChild(loadingElement);
  }

  /**
   * Renders an error message with a retry button
   */
  private renderError(): void {
    // Clear existing content
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }
    
    // Create error container
    const errorElement = document.createElement('div');
    errorElement.className = CSS_CLASSES.CHECKLIST_ERROR;
    errorElement.innerHTML = `
      <h4>Error Loading Checklist</h4>
      <p>${this.error?.message || 'An unknown error occurred'}</p>
      <button class="checkmate-retry-button">Retry</button>
    `;
    
    // Add a retry button
    const retryButton = errorElement.querySelector('button');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.clearContent();
        this.loadTemplate();
      });
    }
    
    this.content.appendChild(errorElement);
  }

  /**
   * Renders the template in the sidebar
   */
  private renderTemplate(): void {
    if (!this.template) {
      this.renderError();
      return;
    }
    
    // Clear existing content
    this.content.innerHTML = '';
    
    // Render the needs attention section
    this.renderNeedsAttentionSection();
    
    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();
    
    // Render each section
    this.template.sections.forEach(section => {
      fragment.appendChild(this.createSection(section));
    });
    
    // Add the fragment to the content
    this.content.appendChild(fragment);
  }

  /**
   * Creates a section element
   */
  private createSection(section: Section): HTMLElement {
    const sectionElement = document.createElement('div');
    sectionElement.className = CSS_CLASSES.CHECKLIST_SECTION;
    sectionElement.id = `checkmate-section-${this.generateSectionId(section)}`;
    
    // Create header
    const header = document.createElement('div');
    header.className = CSS_CLASSES.CHECKLIST_SECTION_HEADER;
    
    // Create title
    const title = document.createElement('h4');
    title.className = CSS_CLASSES.CHECKLIST_SECTION_TITLE;
    title.textContent = section.name;
    
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.className = CSS_CLASSES.CHECKLIST_SECTION_TOGGLE;
    toggle.innerHTML = '▼';
    toggle.title = 'Toggle section visibility';
    
    // Add title and toggle to header
    header.appendChild(title);
    header.appendChild(toggle);
    
    // Create content container
    const content = document.createElement('div');
    content.className = CSS_CLASSES.CHECKLIST_SECTION_CONTENT;
    
    // Render each item
    section.items.forEach(item => {
      content.appendChild(this.createChecklistItem(item));
    });
    
    // Create section controls
    const controls = document.createElement('div');
    controls.className = CSS_CLASSES.CHECKLIST_SECTION_CONTROLS;
    
    // Create Back to Top link
    const backToTop = document.createElement('a');
    backToTop.className = CSS_CLASSES.CHECKLIST_BACK_TO_TOP;
    backToTop.textContent = 'Back to top';
    backToTop.href = '#';
    backToTop.title = 'Scroll to top of the checklist';
    backToTop.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg> Back to top';
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      this.content.scrollTop = 0;
    });
    
    // Create expand/collapse button
    const expandCollapseBtn = document.createElement('button');
    expandCollapseBtn.className = CSS_CLASSES.CHECKLIST_EXPAND_COLLAPSE_BTN;
    expandCollapseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>';
    expandCollapseBtn.title = 'Collapse section';
    
    // Add the controls to the content
    controls.appendChild(backToTop);
    controls.appendChild(expandCollapseBtn);
    content.appendChild(controls);
    
    // Add header and content to section
    sectionElement.appendChild(header);
    sectionElement.appendChild(content);
    
    // Check if section state exists in saved state
    const isExpanded = this.getSectionExpandedState(section.name);
    this.updateSectionVisibility(content, toggle, expandCollapseBtn, isExpanded);
    
    // Add toggle functionality to header
    header.addEventListener('click', (e) => {
      // Prevent triggering if the click is on the toggle button itself
      if (e.target === toggle) return;
      
      const newExpandedState = content.style.display !== 'none';
      this.toggleSectionVisibility(content, toggle, expandCollapseBtn, newExpandedState);
    });
    
    // Add toggle functionality to toggle button
    toggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click from also firing
      const newExpandedState = content.style.display !== 'none';
      this.toggleSectionVisibility(content, toggle, expandCollapseBtn, newExpandedState);
    });
    
    // Add toggle functionality to expand/collapse button
    expandCollapseBtn.addEventListener('click', () => {
      const newExpandedState = content.style.display !== 'none';
      this.toggleSectionVisibility(content, toggle, expandCollapseBtn, newExpandedState);
    });
    
    return sectionElement;
  }
  
  /**
   * Toggles the visibility of a section and updates the state
   */
  private toggleSectionVisibility(
    content: HTMLElement, 
    headerToggle: HTMLElement, 
    expandCollapseBtn: HTMLElement, 
    isCurrentlyExpanded: boolean
  ): void {
    this.updateSectionVisibility(content, headerToggle, expandCollapseBtn, !isCurrentlyExpanded);
    
    // Get the section name from the parent section element
    const sectionElement = content.closest(`.${CSS_CLASSES.CHECKLIST_SECTION}`);
    if (sectionElement) {
      const sectionTitle = sectionElement.querySelector(`.${CSS_CLASSES.CHECKLIST_SECTION_TITLE}`);
      if (sectionTitle && sectionTitle.textContent && this.state && this.state.sections) {
        // Update the state with the new expanded state
        this.state.sections[sectionTitle.textContent] = !isCurrentlyExpanded;
        this.saveState();
      }
    }
  }
  
  /**
   * Updates the section visibility UI elements
   */
  private updateSectionVisibility(
    content: HTMLElement, 
    headerToggle: HTMLElement, 
    expandCollapseBtn: HTMLElement, 
    isExpanded: boolean
  ): void {
    // Update with CSS classes instead of inline styles
    if (isExpanded) {
      content.classList.add('checkmate-section-expanded');
      content.classList.remove('checkmate-section-collapsed');
      content.style.display = 'block';
    } else {
      content.classList.remove('checkmate-section-expanded');
      content.classList.add('checkmate-section-collapsed');
      content.style.display = 'none';
    }
    
    headerToggle.innerHTML = isExpanded ? '▼' : '▶';
    
    // Update expand/collapse button
    if (isExpanded) {
      expandCollapseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg> Collapse';
      expandCollapseBtn.title = 'Collapse section';
    } else {
      expandCollapseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg> Expand';
      expandCollapseBtn.title = 'Expand section';
    }
    
    // Hide the controls div when collapsed
    const controlsDiv = content.querySelector(`.${CSS_CLASSES.CHECKLIST_SECTION_CONTROLS}`) as HTMLElement;
    if (controlsDiv) {
      controlsDiv.style.display = isExpanded ? 'flex' : 'none';
    }
    
    // Force a reflow for Firefox to properly render content
    if (navigator.userAgent.includes('Firefox') && isExpanded) {
      // The following line forces a reflow by getting the computed style
      window.getComputedStyle(content).getPropertyValue('display');
      // Give Firefox a moment to render properly
      setTimeout(() => {
        // Ensure scroll height is captured properly
        const sectionHeight = content.scrollHeight;
        content.style.maxHeight = sectionHeight + 'px';
        console.log(`Firefox: Setting section height to ${sectionHeight}px`);
      }, 0);
    }
  }
  
  /**
   * Gets the expanded state of a section from saved state
   */
  private getSectionExpandedState(sectionName: string): boolean {
    if (this.state && this.state.sections && sectionName in this.state.sections) {
      return this.state.sections[sectionName];
    }
    return true; // Default to expanded if no state exists
  }
  
  /**
   * Generates a unique ID for a section
   */
  private generateSectionId(section: Section): string {
    // Create a simple hash from the section name to use as ID
    return section.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Creates a checklist item with checkbox
   */
  private createChecklistItem(item: ChecklistItem): HTMLElement {
    const itemElement = document.createElement('div');
    itemElement.className = CSS_CLASSES.CHECKLIST_ITEM;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = CSS_CLASSES.CHECKLIST_CHECKBOX;
    checkbox.id = `checkmate-item-${this.generateItemId(item)}`;
    
    // Set checkbox state from saved state
    const itemId = this.generateItemId(item);
    const itemState = this.getItemState(itemId);
    checkbox.checked = itemState.checked;
    
    // Apply needs attention styling if needed
    if (itemState.needsAttention) {
      itemElement.classList.add(CSS_CLASSES.ITEM_NEEDS_ATTENTION);
    }
    
    // Create label
    const label = document.createElement('label');
    label.className = CSS_CLASSES.CHECKLIST_ITEM_LABEL;
    label.htmlFor = checkbox.id;
    label.textContent = item.name;
    
    // Add checkbox and label to item
    itemElement.appendChild(checkbox);
    itemElement.appendChild(label);
    
    // Add documentation link if available
    if (item.url) {
      const docLink = document.createElement('a');
      docLink.className = CSS_CLASSES.CHECKLIST_ITEM_DOC_LINK;
      docLink.href = item.url;
      docLink.target = '_blank';
      docLink.title = 'View documentation';
      docLink.innerHTML = '📄';
      
      itemElement.appendChild(docLink);
    }
    
    // Add state toggle button (ensure Firefox compatibility)
    const stateToggle = document.createElement('button');
    stateToggle.type = 'button'; // Explicitly set type for better cross-browser support
    stateToggle.className = CSS_CLASSES.ITEM_STATE_TOGGLE;
    stateToggle.title = 'Toggle needs attention';
    
    // Set appropriate icon based on current state
    this.updateToggleButtonIcon(stateToggle, itemState.needsAttention);
    
    // Add state toggle event
    stateToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent event bubbling
      this.toggleItemNeedsAttention(item);
      
      // Update UI
      const newState = this.getItemState(itemId);
      if (newState.needsAttention) {
        itemElement.classList.add(CSS_CLASSES.ITEM_NEEDS_ATTENTION);
      } else {
        itemElement.classList.remove(CSS_CLASSES.ITEM_NEEDS_ATTENTION);
      }
      
      this.updateToggleButtonIcon(stateToggle, newState.needsAttention);
      
      // Update the needs attention section
      this.renderNeedsAttentionSection();
    });
    
    // Ensure the button is always visible
    stateToggle.style.display = 'flex';
    
    itemElement.appendChild(stateToggle);
    
    // Add checkbox change event
    checkbox.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.handleCheckboxChange(item, target.checked);
    });
    
    return itemElement;
  }
  
  /**
   * Updates the toggle button icon based on the needs attention state
   */
  private updateToggleButtonIcon(button: HTMLElement, needsAttention: boolean): void {
    // Clear existing content
    button.innerHTML = '';
    
    // Create a span to hold the icon (more reliable than innerHTML)
    const iconSpan = document.createElement('span');
    iconSpan.textContent = needsAttention ? '⚠️' : '🔍';
    iconSpan.style.fontSize = '18px';
    
    // Append the span to the button
    button.appendChild(iconSpan);
    
    // Update class
    if (needsAttention) {
      button.classList.add(CSS_CLASSES.NEEDS_ATTENTION_ICON);
    } else {
      button.classList.remove(CSS_CLASSES.NEEDS_ATTENTION_ICON);
    }
  }
  
  /**
   * Toggles the "needs attention" state for an item
   */
  private toggleItemNeedsAttention(item: ChecklistItem): void {
    if (this.state) {
      const itemId = this.generateItemId(item);
      const itemState = this.getItemState(itemId);
      
      // Toggle needs attention state
      itemState.needsAttention = !itemState.needsAttention;
      
      // Save state
      this.saveState();
    }
  }
  
  /**
   * Gets the state of an item, initializing it if it doesn't exist
   */
  private getItemState(itemId: string): ItemState {
    if (!this.state) {
      return { checked: false, needsAttention: false };
    }
    
    if (!this.state.items[itemId]) {
      this.state.items[itemId] = {
        checked: false,
        needsAttention: false
      };
    }
    
    return this.state.items[itemId];
  }

  /**
   * Generates a unique ID for a checklist item
   */
  private generateItemId(item: ChecklistItem): string {
    // Create a simple hash from the item name to use as ID
    return item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Handles checkbox change events
   */
  private handleCheckboxChange(item: ChecklistItem, checked: boolean): void {
    console.log(`Item "${item.name}" ${checked ? 'checked' : 'unchecked'}`);
    
    // Update state
    if (this.state) {
      const itemId = this.generateItemId(item);
      const itemState = this.getItemState(itemId);
      
      itemState.checked = checked;
      
      // Save state
      this.saveState();
      
      // Update the needs attention section as it might need to change
      this.renderNeedsAttentionSection();
    }
  }

  /**
   * Renders the "Needs Attention" section that displays all items marked for attention
   */
  private renderNeedsAttentionSection(): void {
    // First, remove any existing needs attention section
    const existingSection = this.content.querySelector(`.${CSS_CLASSES.NEEDS_ATTENTION_SECTION}`);
    if (existingSection) {
      existingSection.remove();
    }

    // Check if we have any items that need attention
    if (!this.state || !this.template) {
      return;
    }

    // Find all items that need attention
    const needsAttentionItems: { item: ChecklistItem; section: Section }[] = [];
    
    this.template.sections.forEach(section => {
      section.items.forEach(item => {
        const itemId = this.generateItemId(item);
        const itemState = this.getItemState(itemId);
        
        if (itemState.needsAttention) {
          needsAttentionItems.push({ item, section });
        }
      });
    });
    
    // Create needs attention section
    const sectionElement = document.createElement('div');
    sectionElement.className = CSS_CLASSES.NEEDS_ATTENTION_SECTION;
    
    // Create header
    const header = document.createElement('div');
    header.className = CSS_CLASSES.NEEDS_ATTENTION_HEADER;
    
    const title = document.createElement('h3');
    title.className = CSS_CLASSES.NEEDS_ATTENTION_TITLE;
    title.textContent = `Needs Attention (${needsAttentionItems.length})`;
    
    header.appendChild(title);
    sectionElement.appendChild(header);
    
    // Create content
    const content = document.createElement('div');
    content.className = CSS_CLASSES.NEEDS_ATTENTION_CONTENT;
    
    if (needsAttentionItems.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = CSS_CLASSES.NEEDS_ATTENTION_EMPTY;
      emptyMessage.textContent = 'No items currently need attention';
      content.appendChild(emptyMessage);
    } else {
      // Add items that need attention
      needsAttentionItems.forEach(({ item, section }) => {
        const itemElement = document.createElement('div');
        itemElement.className = CSS_CLASSES.NEEDS_ATTENTION_ITEM;
        
        const itemLink = document.createElement('a');
        itemLink.className = CSS_CLASSES.NEEDS_ATTENTION_LINK;
        itemLink.textContent = `${section.name}: ${item.name}`;
        
        // Generate an id for the original item that we can scroll to
        const originalItemId = `checkmate-item-${this.generateItemId(item)}`;
        
        // Add click handler to scroll to the original item
        itemLink.addEventListener('click', () => {
          const originalItem = document.getElementById(originalItemId);
          if (originalItem) {
            originalItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the item briefly
            originalItem.parentElement?.classList.add('highlight');
            setTimeout(() => {
              originalItem.parentElement?.classList.remove('highlight');
            }, 2000);
          }
        });
        
        itemElement.appendChild(itemLink);
        content.appendChild(itemElement);
      });
    }
    
    sectionElement.appendChild(content);
    
    // Insert the needs attention section at the top of the content
    if (this.content.firstChild) {
      this.content.insertBefore(sectionElement, this.content.firstChild);
    } else {
      this.content.appendChild(sectionElement);
    }
  }

  /**
   * Clears the sidebar content
   */
  private clearContent(): void {
    // Remove all child elements from the content
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }
  }

  /**
   * Cleans up event listeners and DOM elements
   */
  public destroy(): void {
    // Remove sidebar container
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Remove toggle button
    const toggleButton = document.querySelector(`.${CSS_CLASSES.SIDEBAR_TOGGLE}`);
    if (toggleButton && toggleButton.parentNode) {
      toggleButton.parentNode.removeChild(toggleButton);
    }
  }
} 