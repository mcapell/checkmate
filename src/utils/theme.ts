/**
 * Theme management utilities for GitHub Code Review Checklist
 * Handles theme application based on user preferences and GitHub environment
 */

import { storageManager } from './storage';

// Theme types supported by the extension
export type ThemeType = 'light' | 'dark' | 'auto';

// CSS class names for theme application
const THEME_CLASSES = {
  LIGHT: 'checkmate-theme-light',
  DARK: 'checkmate-theme-dark',
};

/**
 * Theme manager class for managing theme preferences and application
 */
export class ThemeManager {
  /**
   * Apply theme based on user preference to the specified element
   * @param element - The DOM element to apply the theme to
   */
  async applyTheme(element: HTMLElement): Promise<void> {
    const theme = await this.getCurrentTheme();
    this.setElementTheme(element, theme);
  }

  /**
   * Get the current effective theme based on user preference and system settings
   * If 'auto' is selected, uses GitHub's theme or system preference
   */
  async getCurrentTheme(): Promise<'light' | 'dark'> {
    try {
      const options = await storageManager.getOptions();
      
      if (options && options.theme === 'light') {
        return 'light';
      } else if (options && options.theme === 'dark') {
        return 'dark';
      } else {
        // Auto mode or undefined: detect from GitHub's theme setting or system preference
        return this.detectTheme();
      }
    } catch (error) {
      console.error('Error getting theme preference:', error);
      // Default to light theme on error
      return 'light';
    }
  }

  /**
   * Detect the current theme from GitHub's theme setting or system preference
   */
  private detectTheme(): 'light' | 'dark' {
    // Check for GitHub's theme attribute on html or body element
    const htmlElement = document.documentElement;
    
    // First try GitHub's color mode
    if (htmlElement.getAttribute('data-color-mode') === 'dark') {
      return 'dark';
    } else if (htmlElement.getAttribute('data-color-mode') === 'light') {
      return 'light';
    }
    
    // If GitHub's theme is not explicitly set, check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light mode
    return 'light';
  }

  /**
   * Set theme classes on a DOM element
   * @param element - The element to apply theme classes to
   * @param theme - The theme to apply
   */
  private setElementTheme(element: HTMLElement, theme: 'light' | 'dark'): void {
    // Remove any existing theme classes
    element.classList.remove(THEME_CLASSES.LIGHT, THEME_CLASSES.DARK);
    
    // Add the appropriate theme class
    if (theme === 'light') {
      element.classList.add(THEME_CLASSES.LIGHT);
    } else {
      element.classList.add(THEME_CLASSES.DARK);
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager(); 