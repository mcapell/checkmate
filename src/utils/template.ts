import * as yaml from 'js-yaml';
import { ChecklistTemplate, ErrorCategory, ExtensionError, Section, ChecklistItem } from '../types';
import { handleTemplateError, handleNetworkError, handleYamlError } from './error-handler';

/**
 * Interface for template management operations
 */
export interface TemplateManager {
  /**
   * Fetch a template from a URL
   */
  fetchTemplate(url: string): Promise<ChecklistTemplate>;
  
  /**
   * Parse YAML content into a template object
   */
  parseTemplate(yamlContent: string): ChecklistTemplate;
  
  /**
   * Get the default template
   */
  getDefaultTemplate(): Promise<ChecklistTemplate>;
  
  /**
   * Validate a template structure
   */
  validateTemplate(template: unknown): template is ChecklistTemplate;
}

/**
 * Implementation of the TemplateManager interface
 */
export class DefaultTemplateManager implements TemplateManager {
  private readonly defaultTemplatePath = '/default-template.yaml';
  
  /**
   * Fetch a template from a URL
   * 
   * @param url Template URL to fetch
   * @returns Parsed template
   * @throws ExtensionError if fetch fails or template is invalid
   */
  async fetchTemplate(url: string): Promise<ChecklistTemplate> {
    try {
      console.log(`Fetching template from URL: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw handleNetworkError(
          `Failed to fetch template: ${response.statusText}`,
          { url, status: response.status, statusText: response.statusText },
          [
            'Check that the URL is correct and accessible',
            'Verify your internet connection',
            'Try again later'
          ],
          true
        );
      }
      
      const yamlContent = await response.text();
      return this.parseTemplate(yamlContent);
    } catch (error) {
      // If it's already an ExtensionError, re-throw it
      if ((error as ExtensionError).category) {
        throw error;
      }
      
      // Otherwise, create a network error
      throw handleNetworkError(
        'Failed to fetch template from URL',
        { url, error: error instanceof Error ? error.message : String(error) },
        [
          'Check that the URL is correct and accessible',
          'Verify your internet connection',
          'Try the default template instead'
        ],
        true
      );
    }
  }
  
  /**
   * Parse YAML content into a template object
   * 
   * @param yamlContent YAML string to parse
   * @returns Parsed template
   * @throws ExtensionError if parsing fails or template is invalid
   */
  parseTemplate(yamlContent: string): ChecklistTemplate {
    try {
      console.log('Parsing YAML content...');
      let parsedYaml;
      
      try {
        // First, try to parse the YAML content
        parsedYaml = yaml.load(yamlContent);
      } catch (yamlError) {
        // If YAML parsing fails, throw a YAML-specific error
        throw handleYamlError(
          'Failed to parse template YAML',
          { 
            error: yamlError instanceof Error ? yamlError.message : String(yamlError),
            content: yamlContent.substring(0, 100) + '...' 
          },
          [
            'The template YAML syntax is invalid',
            'Check for indentation or format errors',
            'Try using the default template instead'
          ],
          false
        );
      }
      
      // After parsing, validate the template structure
      if (!this.validateTemplate(parsedYaml)) {
        throw handleTemplateError(
          'Invalid template structure',
          { content: yamlContent.substring(0, 100) + '...' },
          [
            'The template format is incorrect',
            'Check that the template contains sections and items',
            'Try using the default template instead'
          ],
          false
        );
      }
      
      console.log('Successfully parsed template');
      return parsedYaml;
    } catch (error) {
      // If it's already an ExtensionError (from the inner catches), re-throw it
      if ((error as ExtensionError).category) {
        throw error;
      }
      
      // Otherwise, create a template error for unexpected issues
      throw handleTemplateError(
        'Failed to parse template',
        { error: error instanceof Error ? error.message : String(error) },
        [
          'The template format may be incorrect',
          'Try using the default template instead'
        ],
        false
      );
    }
  }
  
  /**
   * Get the default template
   * 
   * @returns Default template
   * @throws ExtensionError if default template cannot be loaded
   */
  async getDefaultTemplate(): Promise<ChecklistTemplate> {
    try {
      const templateUrl = chrome.runtime.getURL(this.defaultTemplatePath);
      console.log('Loading default template from:', templateUrl);
      const template = await this.fetchTemplate(templateUrl);
      console.log('Successfully loaded default template');
      return template;
    } catch (error) {
      console.error('Error loading default template:', error);
      
      // If it's already an ExtensionError, enhance it with recovery instructions
      if ((error as ExtensionError).category) {
        const extensionError = error as ExtensionError;
        extensionError.message = 'Failed to load default template: ' + extensionError.message;
        extensionError.suggestions = [
          'Reload the extension',
          'Check the extension installation',
          'If the problem persists, reinstall the extension'
        ];
        extensionError.recoverable = false;
        throw extensionError;
      }
      
      // Otherwise, create a template error
      throw handleTemplateError(
        'Failed to load default template',
        { error: error instanceof Error ? error.message : String(error) },
        [
          'Reload the extension',
          'Check the extension installation',
          'If the problem persists, reinstall the extension'
        ],
        false
      );
    }
  }
  
  /**
   * Validate a template structure
   * 
   * @param template Object to validate
   * @returns True if the template is valid
   */
  validateTemplate(template: unknown): template is ChecklistTemplate {
    if (!template || typeof template !== 'object') {
      return false;
    }
    
    const templateCandidate = template as Partial<ChecklistTemplate>;
    
    // Check if sections array exists
    if (!Array.isArray(templateCandidate.sections)) {
      return false;
    }
    
    // Validate each section
    return templateCandidate.sections.every(section => this.isValidSection(section));
  }
  
  /**
   * Validate a section structure
   * 
   * @param section Section to validate
   * @returns True if the section is valid
   */
  private isValidSection(section: unknown): section is Section {
    if (!section || typeof section !== 'object') {
      return false;
    }
    
    const sectionCandidate = section as Partial<Section>;
    
    // Check if section has a name
    if (typeof sectionCandidate.name !== 'string' || !sectionCandidate.name) {
      return false;
    }
    
    // Check if items array exists
    if (!Array.isArray(sectionCandidate.items)) {
      return false;
    }
    
    // Validate each item
    return sectionCandidate.items.every(item => this.isValidChecklistItem(item));
  }
  
  /**
   * Validate a checklist item
   * 
   * @param item Item to validate
   * @returns True if the item is valid
   */
  private isValidChecklistItem(item: unknown): item is ChecklistItem {
    if (!item || typeof item !== 'object') {
      return false;
    }
    
    const itemCandidate = item as Partial<ChecklistItem>;
    
    // Check if item has a name
    if (typeof itemCandidate.name !== 'string' || !itemCandidate.name) {
      return false;
    }
    
    // URL is optional, but if present must be a string
    if (itemCandidate.url !== undefined && typeof itemCandidate.url !== 'string') {
      return false;
    }
    
    return true;
  }
}

// Export a singleton instance
export const templateManager = new DefaultTemplateManager(); 