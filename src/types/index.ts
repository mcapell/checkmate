/**
 * Type definitions for the GitHub Code Review Checklist extension
 */

/**
 * Extension options
 */
export interface ExtensionOptions {
  defaultTemplateUrl: string;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Template Structures
 */
export interface ChecklistTemplate {
  sections: Section[];
}

/**
 * Template section
 */
export interface Section {
  name: string;
  items: ChecklistItem[];
}

/**
 * Checklist item
 */
export interface ChecklistItem {
  name: string;
  url?: string;
  required?: boolean;
}

/**
 * Item state
 */
export interface ItemState {
  checked: boolean;
  needsAttention: boolean;
  notes?: string;
}

/**
 * Checklist state for a PR
 */
export interface ChecklistState {
  items: Record<string, ItemState>;
  sections: Record<string, boolean>;
  lastUpdated: number;
  templateUrl: string;
  templateVersion?: string;
}

/**
 * Storage state for all PRs
 */
export interface StorageState {
  [prUrl: string]: ChecklistState;
}

/**
 * PR information
 */
export interface PRInfo {
  owner: string;
  repo: string;
  prNumber: number;
}

/**
 * Error Types
 */
export enum ErrorCategory {
  TEMPLATE = 'template',
  STORAGE = 'storage',
  GITHUB = 'github',
  NETWORK = 'network',
  YAML = 'yaml',
  UNKNOWN = 'unknown'
}

export interface ExtensionError {
  category: ErrorCategory;
  message: string;
  details?: unknown;
  timestamp: number;
  suggestions?: string[];
  recoverable?: boolean;
}

/**
 * UI State
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  operation?: string;
}

// Legacy types for backwards compatibility - can be removed later
export type Template = ChecklistTemplate; 