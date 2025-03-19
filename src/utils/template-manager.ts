/**
 * Template Manager
 * 
 * Responsible for loading and parsing checklist templates.
 */

import { Template, Section, ChecklistItem } from '../types';
import * as YAML from 'js-yaml';

class TemplateManager {
  /**
   * Load a template from a URL
   * @param url URL to load the template from
   * @returns The parsed template
   */
  async loadTemplate(url: string): Promise<Template> {
    try {
      // Fetch the template content
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load template from ${url}: ${response.status} ${response.statusText}`);
      }
      
      // Get the content
      const content = await response.text();
      
      // Determine the format and parse
      if (url.endsWith('.yaml') || url.endsWith('.yml')) {
        return this.parseYAMLTemplate(content);
      } else if (url.endsWith('.json')) {
        return this.parseJSONTemplate(content);
      } else {
        // Default to markdown if no specific format is detected
        return this.parseMarkdownTemplate(content);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      // Return a basic template in case of error
      return this.getFallbackTemplate();
    }
  }
  
  /**
   * Parse a YAML template
   * @param content YAML content
   * @returns Parsed template
   */
  private parseYAMLTemplate(content: string): Template {
    try {
      const parsed = YAML.load(content) as any;
      
      // Validate and convert to Template structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML template: not an object');
      }
      
      return {
        sections: Array.isArray(parsed.sections) 
          ? parsed.sections.map((section: any) => ({
              name: section.title || section.name || 'Untitled Section',
              items: Array.isArray(section.items)
                ? section.items.map((item: any) => ({
                    name: typeof item === 'string' ? item : item.text || item.name || 'Untitled Item',
                    required: item.required || false
                  }))
                : []
            }))
          : []
      };
    } catch (error) {
      console.error('Error parsing YAML template:', error);
      return this.getFallbackTemplate();
    }
  }
  
  /**
   * Parse a JSON template
   * @param content JSON content
   * @returns Parsed template
   */
  private parseJSONTemplate(content: string): Template {
    try {
      const parsed = JSON.parse(content);
      
      // Validate and convert to Template structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON template: not an object');
      }
      
      return {
        sections: Array.isArray(parsed.sections) 
          ? parsed.sections.map((section: any) => ({
              name: section.title || section.name || 'Untitled Section',
              items: Array.isArray(section.items)
                ? section.items.map((item: any) => ({
                    name: typeof item === 'string' ? item : item.text || item.name || 'Untitled Item',
                    required: item.required || false
                  }))
                : []
            }))
          : []
      };
    } catch (error) {
      console.error('Error parsing JSON template:', error);
      return this.getFallbackTemplate();
    }
  }
  
  /**
   * Parse a Markdown template
   * @param content Markdown content
   * @returns Parsed template
   */
  private parseMarkdownTemplate(content: string): Template {
    try {
      // Split into lines
      const lines = content.split('\n').map(line => line.trim());
      
      // Extract title (first # heading)
      const titleLine = lines.find(line => line.startsWith('# '));
      const templateTitle = titleLine ? titleLine.substring(2).trim() : 'Code Review Checklist';
      
      // Parse sections (## headings) and items (- [ ] items)
      const sections: Section[] = [];
      let currentSection: Section | null = null;
      
      lines.forEach(line => {
        // New section
        if (line.startsWith('## ')) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            name: line.substring(3).trim(),
            items: []
          };
        } 
        // Checklist item
        else if (line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('- [X]')) {
          if (!currentSection) {
            // Create default section if no section was found yet
            currentSection = {
              name: 'General',
              items: []
            };
          }
          
          const isChecked = line.startsWith('- [x]') || line.startsWith('- [X]');
          const itemText = line.substring(5).trim();
          
          currentSection.items.push({
            name: itemText,
            required: false // Markdown doesn't support required flag directly
          });
        }
      });
      
      // Add the last section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // If no sections were found, create a default section with an item for the content
      if (sections.length === 0) {
        sections.push({
          name: 'General',
          items: [
            {
              name: 'Review the content',
              required: false
            }
          ]
        });
      }
      
      return {
        sections
      };
    } catch (error) {
      console.error('Error parsing Markdown template:', error);
      return this.getFallbackTemplate();
    }
  }
  
  /**
   * Get a fallback template in case loading fails
   * @returns A basic fallback template
   */
  private getFallbackTemplate(): Template {
    return {
      sections: [
        {
          name: 'Functionality',
          items: [
            { name: 'Code works as expected', required: true },
            { name: 'Edge cases are handled', required: false }
          ]
        },
        {
          name: 'Code Quality',
          items: [
            { name: 'Code follows style guidelines', required: false },
            { name: 'Code is well documented', required: false }
          ]
        },
        {
          name: 'Security',
          items: [
            { name: 'Input validation is in place', required: true },
            { name: 'Sensitive data is handled securely', required: true }
          ]
        }
      ]
    };
  }
}

export const templateManager = new TemplateManager(); 