/**
 * Sidebar component for GitHub Code Review Checklist
 * 
 * This module provides the UI for the sidebar that contains the checklist
 */

import { RepoInfo } from '../utils/github-utils';

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
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => this.hide());
    
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