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
 * Checklist template
 */
export interface Template {
  title: string;
  sections: Section[];
}

/**
 * Template section
 */
export interface Section {
  title: string;
  items: ChecklistItem[];
}

/**
 * Checklist item
 */
export interface ChecklistItem {
  text: string;
  required?: boolean;
}

/**
 * Checklist item state
 */
export interface ChecklistItemState {
  checked: boolean;
  notes: string;
}

/**
 * Checklist state for a PR
 */
export interface ChecklistState {
  items: Record<string, ChecklistItemState>;
  timestamp: number;
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
 * Core data structure definitions for the Checkmate extension
 */

/**
 * Template Structures
 */
export interface ChecklistTemplate {
  sections: Section[];
}

export interface ItemState {
  checked: boolean;
  needsAttention: boolean;
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