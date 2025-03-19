// Add Jest type declarations
declare const describe: (description: string, specDefinitions: () => void) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const expect: any;
declare const jest: any;

import { ThemeManager } from '../../src/utils/theme';
import { storageManager } from '../../src/utils/storage';

// Mock the storage manager
jest.mock('../../src/utils/storage', () => ({
  storageManager: {
    getOptions: jest.fn(),
  },
}));

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let mockElement: HTMLElement;
  let mockMatchMedia: jest.Mock;
  
  // Setup before each test
  beforeEach(() => {
    // Create a fresh ThemeManager for each test
    themeManager = new ThemeManager();
    
    // Create a mock element to apply theme to
    mockElement = document.createElement('div');
    
    // Mock matchMedia
    mockMatchMedia = jest.fn();
    window.matchMedia = mockMatchMedia as any;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('getCurrentTheme', () => {
    test('returns light theme when user preference is light', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'light' });
      
      // Execute
      const theme = await themeManager.getCurrentTheme();
      
      // Verify
      expect(theme).toBe('light');
      expect(storageManager.getOptions).toHaveBeenCalledTimes(1);
    });
    
    test('returns dark theme when user preference is dark', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'dark' });
      
      // Execute
      const theme = await themeManager.getCurrentTheme();
      
      // Verify
      expect(theme).toBe('dark');
      expect(storageManager.getOptions).toHaveBeenCalledTimes(1);
    });
    
    test('detects theme from GitHub when preference is auto', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'auto' });
      
      // Mock GitHub's theme attribute on the html element
      document.documentElement.setAttribute('data-color-mode', 'dark');
      
      // Execute
      const theme = await themeManager.getCurrentTheme();
      
      // Verify
      expect(theme).toBe('dark');
      expect(storageManager.getOptions).toHaveBeenCalledTimes(1);
      
      // Cleanup
      document.documentElement.removeAttribute('data-color-mode');
    });
    
    test('falls back to system preferences when GitHub theme is not set', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'auto' });
      
      // Mock system preferences to prefer dark mode
      mockMatchMedia.mockImplementation((query) => {
        return {
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
        };
      });
      
      // Execute
      const theme = await themeManager.getCurrentTheme();
      
      // Verify
      expect(theme).toBe('dark');
      expect(storageManager.getOptions).toHaveBeenCalledTimes(1);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
    
    test('defaults to light theme when no preferences are detected', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'auto' });
      
      // Mock system preferences to not prefer dark mode
      mockMatchMedia.mockImplementation((query) => {
        return {
          matches: false,
          media: query,
        };
      });
      
      // Execute
      const theme = await themeManager.getCurrentTheme();
      
      // Verify
      expect(theme).toBe('light');
      expect(storageManager.getOptions).toHaveBeenCalledTimes(1);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
  
  describe('applyTheme', () => {
    test('applies light theme to the element', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'light' });
      
      // Execute
      await themeManager.applyTheme(mockElement);
      
      // Verify
      expect(mockElement.classList.contains('checkmate-theme-light')).toBe(true);
      expect(mockElement.classList.contains('checkmate-theme-dark')).toBe(false);
    });
    
    test('applies dark theme to the element', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'dark' });
      
      // Execute
      await themeManager.applyTheme(mockElement);
      
      // Verify
      expect(mockElement.classList.contains('checkmate-theme-dark')).toBe(true);
      expect(mockElement.classList.contains('checkmate-theme-light')).toBe(false);
    });
    
    test('replaces existing theme classes on the element', async () => {
      // Setup
      (storageManager.getOptions as jest.Mock).mockResolvedValue({ theme: 'dark' });
      mockElement.classList.add('checkmate-theme-light');
      
      // Execute
      await themeManager.applyTheme(mockElement);
      
      // Verify
      expect(mockElement.classList.contains('checkmate-theme-dark')).toBe(true);
      expect(mockElement.classList.contains('checkmate-theme-light')).toBe(false);
    });
  });
}); 