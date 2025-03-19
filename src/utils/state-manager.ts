/**
 * State Manager
 * 
 * Handles saving and loading checklist state.
 */

import { ChecklistState, StorageState, ChecklistItemState } from '../types';
import { storageManager } from './storage';

// Define a type for the custom event
interface ItemStateChangeEvent {
  itemId: string;
  checked: boolean;
  notes: string;
  timestamp: number;
  prUrl: string;
}

class StateManager {
  /**
   * Load saved state for a specific PR
   * @param prUrl The URL of the PR to load state for
   */
  async loadState(prUrl: string): Promise<void> {
    try {
      // Get stored checklist state
      const storedState = await storageManager.getChecklistState() || {};
      const prState = storedState[prUrl];
      
      if (!prState || !prState.items) {
        console.log('No saved state found for this PR');
        return;
      }
      
      // Restore each item's state
      Object.entries(prState.items).forEach(([itemId, state]) => {
        this.restoreItemState(itemId, state as ChecklistItemState);
      });
      
      console.log('State restored successfully');
    } catch (error) {
      console.error('Error loading checklist state:', error);
    }
  }
  
  /**
   * Restore a single item's state
   * @param itemId ID of the item to restore
   * @param state State to restore
   */
  private restoreItemState(itemId: string, state: ChecklistItemState): void {
    // Find the checkbox and notes elements
    const checkbox = document.getElementById(itemId) as HTMLInputElement;
    const notesElement = document.getElementById(`notes-${itemId}`) as HTMLTextAreaElement;
    
    // Update checkbox state if found
    if (checkbox && checkbox.type === 'checkbox') {
      checkbox.checked = state.checked;
    }
    
    // Update notes if found
    if (notesElement && notesElement.tagName === 'TEXTAREA') {
      notesElement.value = state.notes || '';
    }
  }
  
  /**
   * Save state for a specific PR
   * @param prUrl The URL of the PR to save state for
   * @param items The items state to save
   */
  async saveState(prUrl: string, items: Record<string, ChecklistItemState>): Promise<void> {
    try {
      // Get existing state first
      const existingState = await storageManager.getChecklistState() || {};
      
      // Create updated state
      const updatedState: StorageState = {
        ...existingState,
        [prUrl]: {
          items,
          timestamp: Date.now()
        }
      };
      
      // Save the updated state
      await storageManager.saveChecklistState(updatedState);
      
      console.log('State saved successfully');
    } catch (error) {
      console.error('Error saving checklist state:', error);
    }
  }
  
  /**
   * Initialize event listeners for state changes
   */
  init(): void {
    // Listen for item state changes
    document.addEventListener('item-state-changed', ((event: CustomEvent<ItemStateChangeEvent>) => {
      const { itemId, checked, notes, prUrl } = event.detail;
      
      // Get current state for this PR
      storageManager.getChecklistState().then(storedState => {
        const safeStoredState = storedState || {};
        const prState = safeStoredState[prUrl] || { items: {}, timestamp: Date.now() };
        
        // Update the item's state
        const updatedItems = {
          ...prState.items,
          [itemId]: { checked, notes }
        };
        
        // Save the updated state
        this.saveState(prUrl, updatedItems);
      });
    }) as EventListener);
  }
}

export const stateManager = new StateManager();

// Initialize listeners
stateManager.init(); 