import { ErrorCategory, ExtensionError } from '../types';

/**
 * Creates a standardized error object for consistent error handling
 * 
 * @param category - The category of the error
 * @param message - User-friendly error message
 * @param details - Optional details (e.g., original error, context)
 * @returns A structured error object
 */
export function createError(
  category: ErrorCategory,
  message: string,
  details?: unknown
): ExtensionError {
  return {
    category,
    message,
    details,
    timestamp: Date.now(),
  };
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
 * @returns Template error object
 */
export function handleTemplateError(message: string, details?: unknown): ExtensionError {
  const error = createError(ErrorCategory.TEMPLATE, message, details);
  logError(error);
  return error;
}

/**
 * Handles a storage-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @returns Storage error object
 */
export function handleStorageError(message: string, details?: unknown): ExtensionError {
  const error = createError(ErrorCategory.STORAGE, message, details);
  logError(error);
  return error;
}

/**
 * Handles a GitHub-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @returns GitHub error object
 */
export function handleGitHubError(message: string, details?: unknown): ExtensionError {
  const error = createError(ErrorCategory.GITHUB, message, details);
  logError(error);
  return error;
}

/**
 * Handles a network-related error
 * 
 * @param message - Error message
 * @param details - Error details
 * @returns Network error object
 */
export function handleNetworkError(message: string, details?: unknown): ExtensionError {
  const error = createError(ErrorCategory.NETWORK, message, details);
  logError(error);
  return error;
}

/**
 * Handles an unknown or general error
 * 
 * @param message - Error message
 * @param details - Error details
 * @returns Unknown error object
 */
export function handleUnknownError(message: string, details?: unknown): ExtensionError {
  const error = createError(ErrorCategory.UNKNOWN, message, details);
  logError(error);
  return error;
} 