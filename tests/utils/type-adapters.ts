/**
 * Type Adapter Utilities for Testing
 * 
 * This file contains utilities to adapt between different type definitions
 * that exist in the codebase. This helps resolve conflicts between the
 * old and new type definitions during testing.
 */

import { 
  ChecklistItem,
  Section,
  ChecklistTemplate,
  ItemState,
  ChecklistState,
  StorageState,
} from '../../src/types';

/**
 * Legacy type definitions for backward compatibility
 */
export interface LegacySection {
  title: string;
  items: LegacyChecklistItem[];
}

export interface LegacyChecklistItem {
  text: string;
  url?: string;
  required?: boolean;
}

export interface LegacyItemState {
  checked: boolean;
  notes: string;
}

export interface LegacyChecklistState {
  items: Record<string, LegacyItemState>;
  timestamp: number;
}

/**
 * Adapter for old-style templates used in DefaultTemplateManager tests
 * Converts between name-based items (DefaultTemplateManager) and text-based items (templateManager)
 */
export function adaptDefaultTemplateToTemplateManager(oldTemplate: ChecklistTemplate): ChecklistTemplate {
  return {
    sections: oldTemplate.sections.map(section => adaptSection(section))
  };
}

/**
 * Adapter for old-style sections used in DefaultTemplateManager tests
 */
export function adaptSection(oldSection: any): Section {
  return {
    name: oldSection.title || oldSection.name || 'Unnamed Section',
    items: Array.isArray(oldSection.items) 
      ? oldSection.items.map((item: any) => adaptChecklistItem(item))
      : []
  };
}

/**
 * Adapter for old-style checklist items used in DefaultTemplateManager tests
 */
export function adaptChecklistItem(oldItem: any): ChecklistItem {
  if (!oldItem) return { name: 'Unknown Item' };
  
  return {
    name: oldItem.text || oldItem.name || 'Unknown Item',
    required: oldItem.required || false,
    // Preserve any other properties that might be present
    ...(oldItem.url ? { url: oldItem.url } : {})
  };
}

/**
 * Adapter for new style ItemState to legacy ItemState
 */
export function adaptItemStateToLegacyItemState(state: ItemState): LegacyItemState {
  return {
    checked: state.checked,
    notes: state.notes || ''
  };
}

/**
 * Adapter for legacy ItemState to new ItemState
 */
export function adaptLegacyItemStateToItemState(state: LegacyItemState): ItemState {
  return {
    checked: state.checked,
    needsAttention: false, // Default value as legacy doesn't have this field
    notes: state.notes
  };
}

/**
 * Adapter for new-style sections to legacy sections
 */
export function adaptSectionToLegacySection(section: Section): LegacySection {
  return {
    title: section.name,
    items: section.items.map(item => ({
      text: item.name,
      required: item.required,
      // Add url property if it exists in the original item
      ...(item.url ? { url: item.url } : {})
    }))
  };
}

/**
 * Adapter for new style ChecklistTemplate to legacy format
 */
export function adaptTemplateToLegacyFormat(template: ChecklistTemplate): { sections: LegacySection[] } {
  return {
    sections: template.sections.map(section => adaptSectionToLegacySection(section))
  };
}

/**
 * Create a mock for the ChecklistState
 */
export function createMockChecklistState(): ChecklistState {
  return {
    items: {
      'item-1': { checked: true, needsAttention: false, notes: 'Test note' },
      'item-2': { checked: false, needsAttention: true, notes: '' }
    },
    sections: { 'section1': true, 'section2': false },
    lastUpdated: Date.now(),
    templateUrl: 'https://github.com/owner/repo/template.json',
    templateVersion: '1.0.0'
  };
}

/**
 * Mock the BrowserStorageManager class for unit tests
 */
export class MockBrowserStorageManager {
  private storage: Record<string, any> = {};

  async getChecklistState() {
    return this.storage['checklistState'] || null;
  }

  async saveChecklistState(state: any) {
    this.storage['checklistState'] = state;
    return;
  }

  async getOptions() {
    return this.storage['options'] || {
      defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
      theme: 'auto'
    };
  }

  async saveOptions(options: any) {
    this.storage['options'] = options;
    return;
  }

  async clearStorage() {
    this.storage = {};
    return;
  }

  /**
   * Special method for testing: set mock state directly
   */
  setMockState(key: string, value: any): void {
    this.storage[key] = value;
  }
} 