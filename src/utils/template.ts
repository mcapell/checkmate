import * as yaml from 'js-yaml';
import { ChecklistTemplate, ErrorCategory, ExtensionError, Section, ChecklistItem } from '../types';

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
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      
      const yamlContent = await response.text();
      return this.parseTemplate(yamlContent);
    } catch (error) {
      throw this.createError(
        'Failed to fetch template from URL',
        error instanceof Error ? error.message : String(error)
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
      const parsedYaml = yaml.load(yamlContent);
      
      if (!this.validateTemplate(parsedYaml)) {
        throw new Error('Invalid template structure');
      }
      
      return parsedYaml;
    } catch (error) {
      throw this.createError(
        'Failed to parse template',
        error instanceof Error ? error.message : String(error)
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
      return await this.fetchTemplate(chrome.runtime.getURL(this.defaultTemplatePath));
    } catch (error) {
      throw this.createError(
        'Failed to load default template',
        error instanceof Error ? error.message : String(error)
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
  
  /**
   * Create a template-related error
   */
  private createError(message: string, details?: unknown): ExtensionError {
    return {
      category: ErrorCategory.TEMPLATE,
      message,
      details,
      timestamp: Date.now()
    };
  }
}

// Export a singleton instance
export const templateManager = new DefaultTemplateManager(); 