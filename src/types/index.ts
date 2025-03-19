/**
 * Core data structure definitions for the Checkmate extension
 */

/**
 * Template Structures
 */
export interface ChecklistTemplate {
  sections: Section[];
}

export interface Section {
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  name: string;
  url?: string;
}

/**
 * State Structures
 */
export interface ChecklistState {
  items: Record<string, ItemState>;
  sections: Record<string, boolean>; // true = expanded, false = collapsed
  lastUpdated: number; // timestamp
  templateUrl: string;
  templateVersion?: string;
}

export interface ItemState {
  checked: boolean;
  needsAttention: boolean;
}

/**
 * Extension Configuration
 */
export interface ExtensionOptions {
  /** Default template URL to use */
  defaultTemplateUrl: string;
  /** Theme preference (light or dark) */
  theme: 'light' | 'dark' | 'auto';
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