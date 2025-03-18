/**
 * Sidebar component for GitHub Code Review Checklist
 * 
 * This module provides the UI for the sidebar that contains the checklist
 */

import { RepoInfo } from '../utils/github-utils';
import { ChecklistTemplate, Section, ChecklistItem, ChecklistState, ItemState } from '../types';
import { templateManager } from '../utils/template';
import { storageManager } from '../utils/storage';
import { generatePrIdentifier } from '../utils/github-utils';

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
  CHECKLIST_ITEM: 'checkmate-checklist-item',
  CHECKLIST_CHECKBOX: 'checkmate-checklist-checkbox',
  CHECKLIST_ITEM_LABEL: 'checkmate-checklist-item-label',
  CHECKLIST_ITEM_DOC_LINK: 'checkmate-checklist-item-doc-link',
  CHECKLIST_LOADING: 'checkmate-checklist-loading',
  CHECKLIST_ERROR: 'checkmate-checklist-error',
  RESTART_BUTTON: 'checkmate-restart-button',
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
   */
  constructor(repoInfo: RepoInfo) {
    this.repoInfo = repoInfo;
    this.container = this.createContainer();
    this.sidebar = this.createSidebar();
    this.content = this.createContent();
    
    this.sidebar.appendChild(this.createHeader());
    this.sidebar.appendChild(this.content);
    this.container.appendChild(this.sidebar);

    // Generate state key for the current PR
    this.stateKey = this.generateStateKey();
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
   * Creates the container element that will hold the sidebar
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = CSS_CLASSES.SIDEBAR_CONTAINER;
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
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => this.hide());
    
    controls.appendChild(restartButton);
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
   * Creates the toggle button to show/hide the sidebar
   */
  private createToggleButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = CSS_CLASSES.SIDEBAR_TOGGLE;
    button.textContent = 'Checkmate';
    button.title = 'Toggle code review checklist';
    button.addEventListener('click', () => this.toggle());
    return button;
  }

  /**
   * Injects the sidebar and toggle button into the GitHub UI
   */
  public inject(): void {
    // Add toggle button to GitHub header actions
    const githubHeader = document.querySelector(`.${CSS_CLASSES.GITHUB_HEADER}`);
    if (githubHeader) {
      githubHeader.appendChild(this.createToggleButton());
    } else {
      console.warn('GitHub header actions not found, toggle button not injected');
    }

    // Add sidebar container to document body
    document.body.appendChild(this.container);
    
    // Load styles
    this.injectStyles();
  }

  /**
   * Injects the CSS for the sidebar
   */
  private injectStyles(): void {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('content/sidebar.css');
    document.head.appendChild(styleLink);
  }

  /**
   * Shows the sidebar
   */
  public show(): void {
    this.container.classList.add(CSS_CLASSES.SIDEBAR_EXPANDED);
    this.container.classList.remove(CSS_CLASSES.SIDEBAR_COLLAPSED);
    this.isVisible = true;
    
    // Load template and state when showing sidebar
    this.loadTemplate();
    
    // Notify background script
    this.notifyVisibilityChange(true);
  }

  /**
   * Hides the sidebar
   */
  public hide(): void {
    this.container.classList.add(CSS_CLASSES.SIDEBAR_COLLAPSED);
    this.container.classList.remove(CSS_CLASSES.SIDEBAR_EXPANDED);
    this.isVisible = false;
    
    // Notify background script
    this.notifyVisibilityChange(false);
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
   * Loads a template and state from storage
   */
  private async loadTemplate(): Promise<void> {
    // Show loading state
    this.renderLoadingState();
    this.isLoading = true;
    this.error = null;

    try {
      // Generate state key for this PR
      this.stateKey = this.generateStateKey();
      
      // Fetch the default template
      console.log('Loading default template from extension resources');
      this.template = await templateManager.getDefaultTemplate();
      console.log('Template loaded successfully:', this.template);
      
      // Load the saved state if available
      await this.loadState();
      
      // Render the template
      this.renderTemplate();
    } catch (error) {
      console.error('Failed to load template:', error);
      this.error = error instanceof Error ? error : new Error(String(error));
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
      const state = await storageManager.getChecklistState();
      
      if (state) {
        this.state = state;
        console.log('Loaded state from storage', state);
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
      await storageManager.saveChecklistState(this.state);
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
  private renderLoadingState(): void {
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
   * Renders an error message in the sidebar
   */
  private renderError(): void {
    const errorElement = document.createElement('div');
    errorElement.className = CSS_CLASSES.CHECKLIST_ERROR;
    errorElement.innerHTML = `
      <h4>Error Loading Checklist</h4>
      <p>${this.error?.message || 'An unknown error occurred'}</p>
      <button>Retry</button>
    `;
    
    // Add retry button functionality
    const retryButton = errorElement.querySelector('button');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.loadTemplate());
    }
    
    this.content.innerHTML = '';
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
    
    // Add header and content to section
    sectionElement.appendChild(header);
    sectionElement.appendChild(content);
    
    // Check if section state exists in saved state
    if (this.state && this.state.sections && this.state.sections[section.name] === false) {
      content.style.display = 'none';
      toggle.innerHTML = '▶';
    }
    
    // Add toggle functionality
    header.addEventListener('click', () => {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
      toggle.innerHTML = content.style.display === 'none' ? '▶' : '▼';
      
      // Update state
      if (this.state && this.state.sections) {
        this.state.sections[section.name] = content.style.display !== 'none';
        this.saveState();
      }
    });
    
    return sectionElement;
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
    if (this.state && this.state.items && this.state.items[itemId]) {
      checkbox.checked = this.state.items[itemId].checked;
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
    
    // Add checkbox change event
    checkbox.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.handleCheckboxChange(item, target.checked);
    });
    
    return itemElement;
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
      if (!this.state.items[itemId]) {
        this.state.items[itemId] = {
          checked: false,
          needsAttention: false
        };
      }
      
      this.state.items[itemId].checked = checked;
      
      // Save state
      this.saveState();
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