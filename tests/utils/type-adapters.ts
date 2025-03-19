/**
 * Type Adapter Utilities for Testing
 * 
 * This file contains utilities to adapt between different type definitions
 * that exist in the codebase. This helps resolve conflicts between the
 * old and new type definitions during testing.
 */

import { 
  ChecklistItem as NewChecklistItem, 
  Section as NewSection,
  Template as NewTemplate,
  ChecklistTemplate,
  ChecklistItemState as NewChecklistItemState,
  ChecklistState as NewChecklistState,
  StorageState as NewStorageState,
  ItemState
} from '../../src/types';

/**
 * Legacy type definitions for backward compatibility
 */
export interface LegacySection {
  name: string;
  items: LegacyChecklistItem[];
}

export interface LegacyChecklistItem {
  name: string;
  url?: string;
  required?: boolean;
}

export interface LegacyChecklistItemState {
  checked: boolean;
  needsAttention: boolean;
  notes?: string;
}

export interface LegacyChecklistState {
  items: Record<string, LegacyChecklistItemState>;
  sections: Record<string, boolean>;
  lastUpdated: number;
  templateUrl: string;
  templateVersion: string;
}

/**
 * Adapter for old-style templates used in DefaultTemplateManager tests
 * Converts between name-based items (DefaultTemplateManager) and text-based items (templateManager)
 */
export function adaptDefaultTemplateToTemplateManager(oldTemplate: ChecklistTemplate): NewTemplate {
  return {
    title: 'Code Review Checklist', // Default title since ChecklistTemplate doesn't have one
    sections: oldTemplate.sections.map(section => adaptSection(section))
  };
}

/**
 * Adapter for old-style sections used in DefaultTemplateManager tests
 */
export function adaptSection(oldSection: any): NewSection {
  return {
    title: oldSection.name || 'Unnamed Section',
    items: Array.isArray(oldSection.items) 
      ? oldSection.items.map((item: any) => adaptChecklistItem(item))
      : []
  };
}

/**
 * Adapter for old-style checklist items used in DefaultTemplateManager tests
 */
export function adaptChecklistItem(oldItem: any): NewChecklistItem {
  if (!oldItem) return { text: 'Unknown Item' };
  
  return {
    text: oldItem.name || 'Unknown Item',
    required: oldItem.required || false,
    // Preserve any other properties that might be present
    ...(oldItem.url ? { url: oldItem.url } : {})
  };
}

/**
 * Adapter for new style ChecklistItemState to legacy ItemState
 */
export function adaptChecklistItemStateToItemState(state: NewChecklistItemState): ItemState {
  return {
    checked: state.checked,
    needsAttention: false // Default value, as new type doesn't have this property
  };
}

/**
 * Adapter for legacy ItemState to new ChecklistItemState
 */
export function adaptItemStateToChecklistItemState(state: ItemState): NewChecklistItemState {
  return {
    checked: state.checked,
    notes: '' // Default value, as old type doesn't have this property
  };
}

/**
 * Adapter for new-style sections to legacy sections
 */
export function adaptNewSectionToLegacy(section: NewSection): LegacySection {
  return {
    name: section.title,
    items: section.items.map(item => ({
      name: item.text,
      required: item.required,
      // Add url property if it exists in the original item
      ...(item as any).url ? { url: (item as any).url } : {}
    }))
  };
}

/**
 * Adapter for new style Template to legacy ChecklistTemplate
 */
export function adaptNewTemplateToLegacyTemplate(template: NewTemplate): { sections: LegacySection[] } {
  return {
    sections: template.sections.map(section => adaptNewSectionToLegacy(section))
  };
}

/**
 * Create a mock for the legacy ChecklistState
 */
export function createMockLegacyState(): LegacyChecklistState {
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