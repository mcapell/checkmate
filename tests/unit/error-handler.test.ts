import { 
  createError, 
  handleTemplateError, 
  handleStorageError, 
  handleGitHubError,
  handleNetworkError,
  handleYamlError,
  handleUnknownError
} from '../../src/utils/error-handler';
import { ErrorCategory } from '../../src/types';

describe('Error Handler', () => {
  beforeEach(() => {
    // Spy on console.error to prevent test output clutter
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createError', () => {
    it('should create a properly formatted error object', () => {
      const error = createError(
        ErrorCategory.TEMPLATE, 
        'Test error message', 
        { detail: 'test' }, 
        ['suggestion1', 'suggestion2'], 
        true
      );

      expect(error).toMatchObject({
        category: ErrorCategory.TEMPLATE,
        message: 'Test error message',
        details: { detail: 'test' },
        suggestions: ['suggestion1', 'suggestion2'],
        recoverable: true
      });
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe('number');
    });

    it('should use default suggestions when none are provided', () => {
      const error = createError(ErrorCategory.STORAGE, 'Storage error');
      
      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.length).toBeGreaterThan(0);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('Error type handlers', () => {
    it('should create template errors with correct category', () => {
      const error = handleTemplateError('Template error');
      expect(error.category).toBe(ErrorCategory.TEMPLATE);
      expect(error.message).toBe('Template error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should create storage errors with correct category', () => {
      const error = handleStorageError('Storage error');
      expect(error.category).toBe(ErrorCategory.STORAGE);
      expect(error.message).toBe('Storage error');
    });

    it('should create GitHub errors with correct category', () => {
      const error = handleGitHubError('GitHub error');
      expect(error.category).toBe(ErrorCategory.GITHUB);
      expect(error.message).toBe('GitHub error');
    });

    it('should create network errors with correct category', () => {
      const error = handleNetworkError('Network error');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.message).toBe('Network error');
    });

    it('should create YAML errors with correct category', () => {
      const error = handleYamlError('YAML error');
      expect(error.category).toBe(ErrorCategory.YAML);
      expect(error.message).toBe('YAML error');
    });

    it('should create unknown errors with correct category', () => {
      const error = handleUnknownError('Unknown error');
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.message).toBe('Unknown error');
    });
  });

  describe('Error handling with custom suggestions', () => {
    it('should accept custom recovery suggestions', () => {
      const customSuggestions = ['Custom suggestion 1', 'Custom suggestion 2'];
      const error = handleTemplateError('Template error', null, customSuggestions);
      
      expect(error.suggestions).toEqual(customSuggestions);
    });

    it('should set recoverable flag when provided', () => {
      const error = handleNetworkError('Network error', null, undefined, true);
      expect(error.recoverable).toBe(true);
    });
  });
}); 