import { ErrorCategory, ExtensionError } from '../types';

/**
 * Creates a standardized error object for consistent error handling
 * 
 * @param category - The category of the error
 * @param message - User-friendly error message
 * @param details - Optional details (e.g., original error, context)
 * @param suggestions - Optional array of recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns A structured error object
 */
export function createError(
  category: ErrorCategory,
  message: string,
  details?: unknown,
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  return {
    category,
    message,
    details,
    timestamp: Date.now(),
    suggestions: suggestions || getDefaultSuggestions(category),
    recoverable
  };
}

/**
 * Get default suggestions based on error category
 * 
 * @param category - The error category
 * @returns Array of suggestions
 */
function getDefaultSuggestions(category: ErrorCategory): string[] {
  switch (category) {
    case ErrorCategory.TEMPLATE:
      return [
        'Check that the template URL is correct and accessible',
        'Try loading the default template instead',
        'Check your internet connection',
        'Try again later'
      ];
    case ErrorCategory.STORAGE:
      return [
        'Try reloading the extension',
        'Clear browser cache and try again',
        'Check your browser storage permissions'
      ];
    case ErrorCategory.GITHUB:
      return [
        'Make sure you are on a valid GitHub page',
        'Try refreshing the page',
        'Ensure you have access to this repository'
      ];
    case ErrorCategory.NETWORK:
      return [
        'Check your internet connection',
        'Ensure the URL is accessible from your network',
        'Try again later'
      ];
    case ErrorCategory.YAML:
      return [
        'Ensure the YAML syntax is correct',
        'Check the template format against documentation',
        'Try using the default template instead'
      ];
    default:
      return ['Refresh the page and try again', 'Restart the extension'];
  }
}

/**
 * Logs an error to the console in a standardized format
 * 
 * @param error - The error to log
 */
export function logError(error: ExtensionError): void {
  console.error(`[Checkmate Error][${error.category}] ${error.message}`, error.details || '');
}

/**
 * Handles a template-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns Template error object
 */
export function handleTemplateError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.TEMPLATE, message, details, suggestions, recoverable);
  logError(error);
  return error;
}

/**
 * Handles a storage-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns Storage error object
 */
export function handleStorageError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.STORAGE, message, details, suggestions, recoverable);
  logError(error);
  return error;
}

/**
 * Handles a GitHub-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns GitHub error object
 */
export function handleGitHubError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.GITHUB, message, details, suggestions, recoverable);
  logError(error);
  return error;
}

/**
 * Handles a network-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns Network error object
 */
export function handleNetworkError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.NETWORK, message, details, suggestions, recoverable);
  logError(error);
  return error;
}

/**
 * Handles YAML parsing errors
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns YAML parsing error object
 */
export function handleYamlError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.YAML, message, details, suggestions, recoverable);
  logError(error);
  return error;
}

/**
 * Handles an unknown or general error
 * 
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Optional recovery suggestions
 * @param recoverable - Whether the error is recoverable
 * @returns Unknown error object
 */
export function handleUnknownError(
  message: string, 
  details?: unknown, 
  suggestions?: string[],
  recoverable: boolean = false
): ExtensionError {
  const error = createError(ErrorCategory.UNKNOWN, message, details, suggestions, recoverable);
  logError(error);
  return error;
} 