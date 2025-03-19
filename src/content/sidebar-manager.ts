/**
 * Sidebar Manager
 * 
 * Responsible for creating, managing, and updating the sidebar UI
 */

import { storageManager } from '../utils/storage';
import { Template, ChecklistItem, Section, PRInfo } from '../types';

/**
 * Manages the sidebar UI for the extension
 */
class SidebarManager {
  private sidebar: HTMLElement | null = null;
  private sidebarContent: HTMLElement | null = null;
  
  /**
   * Create and inject the sidebar into the DOM
   * @param template The template to use for rendering
   * @param prInfo Information about the current PR
   */
  async createSidebar(template: Template, prInfo: PRInfo): Promise<void> {
    if (this.sidebar) {
      // Sidebar already exists, just update content
      this.renderContent(template);
      return;
    }
    
    console.log('Creating sidebar with template:', template);
    
    // Get user preferences
    const options = await storageManager.getOptions();
    
    // Create sidebar container
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'github-code-review-checklist-sidebar';
    this.sidebar.className = `theme-${options.theme || 'auto'}`;
    
    // Create sidebar header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Code Review Checklist';
    header.appendChild(title);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'sidebar-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close sidebar');
    closeButton.addEventListener('click', () => this.setSidebarVisibility(false));
    header.appendChild(closeButton);
    
    this.sidebar.appendChild(header);
    
    // Create content container
    this.sidebarContent = document.createElement('div');
    this.sidebarContent.className = 'sidebar-content';
    this.sidebar.appendChild(this.sidebarContent);
    
    // Render the template content
    this.renderContent(template);
    
    // Add the sidebar to the page
    const targetElement = document.querySelector('.js-discussion, .repository-content');
    if (targetElement) {
      targetElement.appendChild(this.sidebar);
    } else {
      document.body.appendChild(this.sidebar);
    }
    
    // Listen for theme changes
    document.addEventListener('options-changed', (e: any) => {
      if (e.detail?.theme && this.sidebar) {
        // Remove existing theme classes
        this.sidebar.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        // Add new theme class
        this.sidebar.classList.add(`theme-${e.detail.theme}`);
      }
    });
    
    // Set initially visible
    this.setSidebarVisibility(true);
  }
  
  /**
   * Render the template content in the sidebar
   * @param template The template to render
   */
  renderContent(template: Template): void {
    if (!this.sidebarContent) return;
    
    // Clear existing content
    this.sidebarContent.innerHTML = '';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = template.title || 'Code Review Checklist';
    this.sidebarContent.appendChild(title);
    
    // Render each section
    template.sections.forEach((section: Section, sectionIndex: number) => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'checklist-section';
      sectionElement.id = `section-${sectionIndex}`;
      
      // Add section title
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = section.title;
      sectionElement.appendChild(sectionTitle);
      
      // Render items in this section
      section.items.forEach((item: ChecklistItem, itemIndex: number) => {
        // Create unique ID for the item
        const itemId = `${section.title.toLowerCase().replace(/\s+/g, '-')}-item-${itemIndex + 1}`;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'checklist-item';
        itemElement.dataset.itemId = itemId;
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = itemId;
        checkbox.addEventListener('change', () => this.handleItemStateChange(itemId, checkbox.checked));
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = itemId;
        label.textContent = item.text;
        
        // Create notes section
        const notes = document.createElement('textarea');
        notes.id = `notes-${itemId}`;
        notes.placeholder = 'Add notes...';
        notes.rows = 2;
        notes.addEventListener('input', () => this.handleItemNotesChange(itemId, notes.value));
        
        // Append all elements
        itemElement.appendChild(checkbox);
        itemElement.appendChild(label);
        itemElement.appendChild(notes);
        
        sectionElement.appendChild(itemElement);
      });
      
      if (this.sidebarContent) {
        this.sidebarContent.appendChild(sectionElement);
      }
    });
    
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.textContent = 'Copy Summary';
    saveButton.addEventListener('click', () => this.copySummaryToClipboard());
    this.sidebarContent.appendChild(saveButton);
  }
  
  /**
   * Handle state change for a checklist item
   * @param itemId ID of the changed item
   * @param checked Whether the item is checked
   */
  handleItemStateChange(itemId: string, checked: boolean): void {
    // Get the notes for this item
    const notesElement = document.getElementById(`notes-${itemId}`) as HTMLTextAreaElement;
    const notes = notesElement ? notesElement.value : '';
    
    // Save the state update
    this.saveItemState(itemId, checked, notes);
  }
  
  /**
   * Handle notes change for a checklist item
   * @param itemId ID of the item
   * @param notes New notes content
   */
  handleItemNotesChange(itemId: string, notes: string): void {
    // Get checkbox state
    const checkbox = document.getElementById(itemId) as HTMLInputElement;
    const checked = checkbox ? checkbox.checked : false;
    
    // Save the state update
    this.saveItemState(itemId, checked, notes);
  }
  
  /**
   * Save the state of a checklist item
   * @param itemId ID of the item
   * @param checked Whether the item is checked
   * @param notes Notes for the item
   */
  saveItemState(itemId: string, checked: boolean, notes: string): void {
    // Create a custom event to notify state manager
    const event = new CustomEvent('item-state-changed', {
      detail: {
        itemId,
        checked,
        notes,
        timestamp: Date.now(),
        prUrl: window.location.href
      }
    });
    
    // Dispatch the event for the state manager to handle
    document.dispatchEvent(event);
  }
  
  /**
   * Generate and copy a summary of checklist state to clipboard
   */
  copySummaryToClipboard(): void {
    // Get all checklist items
    const items = document.querySelectorAll('.checklist-item');
    let summary = '# Code Review Summary\n\n';
    
    // Current section being processed
    let currentSection = '';
    
    // Process each item
    items.forEach(item => {
      // Get the section title
      const sectionElement = item.closest('.checklist-section');
      const sectionTitle = sectionElement?.querySelector('h3')?.textContent || '';
      
      // If new section, add section header
      if (sectionTitle && sectionTitle !== currentSection) {
        currentSection = sectionTitle;
        summary += `## ${currentSection}\n\n`;
      }
      
      // Get item details
      const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const label = item.querySelector('label')?.textContent || '';
      const notes = (item.querySelector('textarea') as HTMLTextAreaElement)?.value || '';
      
      // Add item to summary
      const status = checkbox.checked ? '✅' : '❌';
      summary += `- ${status} ${label}\n`;
      
      // Add notes if present
      if (notes.trim()) {
        summary += `  - Notes: ${notes.trim()}\n`;
      }
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy summary:', err);
    });
  }
  
  /**
   * Set the visibility of the sidebar
   * @param visible Whether the sidebar should be visible
   */
  setSidebarVisibility(visible: boolean): void {
    if (!this.sidebar) return;
    
    if (visible) {
      this.sidebar.classList.add('visible');
      this.sidebar.classList.remove('hidden');
    } else {
      this.sidebar.classList.remove('visible');
      this.sidebar.classList.add('hidden');
    }
  }
  
  /**
   * Toggle the sidebar visibility
   * @returns The new visibility state
   */
  toggleSidebar(): boolean {
    if (!this.sidebar) return false;
    
    const isVisible = this.sidebar.classList.contains('visible');
    this.setSidebarVisibility(!isVisible);
    return !isVisible;
  }
}

export const sidebarManager = new SidebarManager(); 