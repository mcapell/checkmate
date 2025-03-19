import { DefaultTemplateManager } from '../../src/utils/template';
import { ChecklistTemplate, ErrorCategory } from '../../src/types';
import * as yaml from 'js-yaml';
import { Template, Section, ChecklistItem } from '../../src/types';
import { templateManager } from '../../src/utils/template-manager';

// Helper function for test assertions
function fail(message: string): never {
  throw new Error(message);
}

// Simple mocks for browser APIs
const fetchMock = jest.fn();
const getURLMock = jest.fn();

// Setup mocks
beforeAll(() => {
  // @ts-ignore - Mocking fetch
  global.fetch = fetchMock;
  
  // @ts-ignore - Mocking chrome
  global.chrome = {
    runtime: {
      getURL: getURLMock,
      // Add required chrome.runtime properties to satisfy TypeScript
      connect: jest.fn(),
      connectNative: jest.fn(),
      getBackgroundPage: jest.fn(),
      getManifest: jest.fn(),
      getPackageDirectoryEntry: jest.fn(),
      getPlatformInfo: jest.fn(),
      getSelfMessage: jest.fn(),
      id: '',
      lastError: null,
      onConnect: { addListener: jest.fn() } as any,
      onConnectExternal: { addListener: jest.fn() } as any,
      onInstalled: { addListener: jest.fn() } as any,
      onMessage: { addListener: jest.fn() } as any,
      onMessageExternal: { addListener: jest.fn() } as any,
      onRestartRequired: { addListener: jest.fn() } as any,
      onStartup: { addListener: jest.fn() } as any,
      onSuspend: { addListener: jest.fn() } as any,
      onSuspendCanceled: { addListener: jest.fn() } as any,
      onUpdateAvailable: { addListener: jest.fn() } as any,
      reload: jest.fn(),
      requestUpdateCheck: jest.fn(),
      restartAfterDelay: jest.fn(),
      sendMessage: jest.fn(),
      sendNativeMessage: jest.fn(),
      setUninstallURL: jest.fn()
    }
  } as any;
});

describe('DefaultTemplateManager', () => {
  let templateManager: DefaultTemplateManager;
  
  beforeEach(() => {
    templateManager = new DefaultTemplateManager();
    
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Default mock implementations
    fetchMock.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('')
    });
    
    getURLMock.mockReturnValue('chrome://extension/default-template.yaml');
  });
  
  describe('parseTemplate', () => {
    it('should parse valid YAML into a ChecklistTemplate', () => {
      // Arrange
      const validYaml = `
sections:
  - name: Test Section
    items:
      - name: Test Item 1
      - name: Test Item 2
        url: https://example.com
`;
      
      // Act
      const result = templateManager.parseTemplate(validYaml);
      
      // Assert
      expect(result).toEqual({
        sections: [
          {
            name: 'Test Section',
            items: [
              { name: 'Test Item 1' },
              { name: 'Test Item 2', url: 'https://example.com' }
            ]
          }
        ]
      });
    });
    
    it('should throw an error for invalid YAML', () => {
      // Arrange
      const invalidYaml = `
sections:
  - name: Test Section
    items:
      - name: Test Item 1
  invalid indentation
`;
      
      // Act & Assert
      expect(() => templateManager.parseTemplate(invalidYaml)).toThrow();
      try {
        templateManager.parseTemplate(invalidYaml);
      } catch (error: any) {
        expect(error.category).toBe(ErrorCategory.YAML);
        expect(error.message).toContain('Failed to parse template YAML');
      }
    });
    
    it('should throw an error for YAML that does not match the template structure', () => {
      // Arrange
      const invalidStructureYaml = `
wrongKey:
  - name: Test Section
`;
      
      // Act & Assert
      expect(() => templateManager.parseTemplate(invalidStructureYaml)).toThrow();
      try {
        templateManager.parseTemplate(invalidStructureYaml);
      } catch (error: any) {
        expect(error.category).toBe(ErrorCategory.TEMPLATE);
        expect(error.message).toContain('Invalid template structure');
      }
    });
  });
  
  describe('validateTemplate', () => {
    it('should return true for valid template structures', () => {
      // Arrange
      const validTemplate: ChecklistTemplate = {
        sections: [
          {
            name: 'Valid Section',
            items: [
              { name: 'Valid Item' }
            ]
          }
        ]
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(validTemplate)).toBe(true);
    });
    
    it('should return false for non-object templates', () => {
      // Act & Assert
      expect(templateManager.validateTemplate(null)).toBe(false);
      expect(templateManager.validateTemplate(undefined)).toBe(false);
      expect(templateManager.validateTemplate('string')).toBe(false);
      expect(templateManager.validateTemplate(123)).toBe(false);
    });
    
    it('should return false if sections is not an array', () => {
      // Arrange
      const invalidTemplate = {
        sections: 'not an array'
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(invalidTemplate)).toBe(false);
    });
    
    it('should return false if a section has no name', () => {
      // Arrange
      const invalidTemplate = {
        sections: [
          {
            // Missing name
            items: [{ name: 'Item' }]
          }
        ]
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(invalidTemplate)).toBe(false);
    });
    
    it('should return false if a section has no items array', () => {
      // Arrange
      const invalidTemplate = {
        sections: [
          {
            name: 'Section',
            items: 'not an array'
          }
        ]
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(invalidTemplate)).toBe(false);
    });
    
    it('should return false if an item has no name', () => {
      // Arrange
      const invalidTemplate = {
        sections: [
          {
            name: 'Section',
            items: [
              { /* missing name */ }
            ]
          }
        ]
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(invalidTemplate)).toBe(false);
    });
    
    it('should return false if an item has a non-string url', () => {
      // Arrange
      const invalidTemplate = {
        sections: [
          {
            name: 'Section',
            items: [
              { name: 'Item', url: 123 }
            ]
          }
        ]
      };
      
      // Act & Assert
      expect(templateManager.validateTemplate(invalidTemplate)).toBe(false);
    });
  });
  
  describe('fetchTemplate', () => {
    it('should fetch and parse a template from URL', async () => {
      // Arrange
      const validYaml = `
sections:
  - name: Fetched Section
    items:
      - name: Fetched Item
`;
      fetchMock.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(validYaml)
      });
      
      // Act
      const result = await templateManager.fetchTemplate('https://example.com/template.yaml');
      
      // Assert
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/template.yaml');
      expect(result).toEqual({
        sections: [
          {
            name: 'Fetched Section',
            items: [
              { name: 'Fetched Item' }
            ]
          }
        ]
      });
    });
    
    it('should throw error on failed fetch', async () => {
      // Arrange
      fetchMock.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });
      
      // Act & Assert
      try {
        await templateManager.fetchTemplate('https://example.com/not-found.yaml');
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.message).toContain('Failed to fetch template');
        expect(error.recoverable).toBe(true);
      }
    });
    
    it('should throw error on network failure', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Network error'));
      
      // Act & Assert
      try {
        await templateManager.fetchTemplate('https://example.com/error.yaml');
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.message).toContain('Failed to fetch template from URL');
        expect(error.recoverable).toBe(true);
      }
    });
  });
  
  describe('getDefaultTemplate', () => {
    it('should fetch the default template', async () => {
      // Arrange
      const validYaml = `
sections:
  - name: Default Section
    items:
      - name: Default Item
`;
      fetchMock.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(validYaml)
      });
      
      // Act
      const result = await templateManager.getDefaultTemplate();
      
      // Assert
      expect(getURLMock).toHaveBeenCalledWith('/default-template.yaml');
      expect(fetchMock).toHaveBeenCalledWith('chrome://extension/default-template.yaml');
      expect(result).toEqual({
        sections: [
          {
            name: 'Default Section',
            items: [
              { name: 'Default Item' }
            ]
          }
        ]
      });
    });
    
    it('should throw error if default template cannot be loaded', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Failed to load'));
      
      // Act & Assert
      try {
        await templateManager.getDefaultTemplate();
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.message).toContain('Failed to load default template');
        // The default template loading errors should not be recoverable
        expect(error.recoverable).toBe(false);
      }
    });
  });
});

describe('Template Manager', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.resetAllMocks();
    
    // Clear any cached data
    jest.restoreAllMocks();
  });
  
  describe('Template Loading', () => {
    beforeEach(() => {
      // Mock fetch API
      global.fetch = jest.fn();
    });
    
    test('loads template from URL', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(
          `# Test Template
          
          ## Section 1
          - [ ] Item 1
          - [ ] Item 2
          
          ## Section 2
          - [ ] Item 3
          `
        )
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.md');
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/template.md');
      expect(template).toBeDefined();
      expect(template.title).toBe('Test Template');
      expect(template.sections).toHaveLength(2);
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[1].items).toHaveLength(1);
    });
    
    test('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const template = await templateManager.loadTemplate('https://example.com/broken-link.md');
      
      // Should return fallback template
      expect(template).toBeDefined();
      expect(template.title).toBe('Code Review Checklist');
      expect(template.sections.length).toBeGreaterThan(0);
    });
    
    test('handles HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/not-found.md');
      
      // Should return fallback template
      expect(template).toBeDefined();
      expect(template.title).toBe('Code Review Checklist');
      expect(template.sections.length).toBeGreaterThan(0);
    });
  });
  
  describe('Template Parsing', () => {
    test('parses Markdown template correctly', async () => {
      const markdown = `
        # My Checklist
        
        ## Code Quality
        - [ ] Code follows style guidelines
        - [ ] Documentation is updated
        
        ## Security
        - [ ] Input validation is in place
        - [ ] Authentication is properly implemented
      `;
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(markdown)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.md');
      
      expect(template.title).toBe('My Checklist');
      expect(template.sections).toHaveLength(2);
      
      // Check sections
      expect(template.sections[0].title).toBe('Code Quality');
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[0].items[0].text).toBe('Code follows style guidelines');
      
      expect(template.sections[1].title).toBe('Security');
      expect(template.sections[1].items).toHaveLength(2);
      expect(template.sections[1].items[1].text).toBe('Authentication is properly implemented');
    });
    
    test('parses YAML template correctly', async () => {
      const yaml = `
        title: YAML Checklist
        sections:
          - title: Best Practices
            items:
              - text: Follow SOLID principles
              - text: Write unit tests
          - title: Performance
            items:
              - text: Optimize database queries
              - text: Cache expensive operations
      `;
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(yaml)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.yaml');
      
      expect(template.title).toBe('YAML Checklist');
      expect(template.sections).toHaveLength(2);
      
      // Check sections
      expect(template.sections[0].title).toBe('Best Practices');
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[0].items[0].text).toBe('Follow SOLID principles');
      
      expect(template.sections[1].title).toBe('Performance');
      expect(template.sections[1].items).toHaveLength(2);
      expect(template.sections[1].items[1].text).toBe('Cache expensive operations');
    });
    
    test('parses JSON template correctly', async () => {
      const json = JSON.stringify({
        title: "JSON Checklist",
        sections: [
          {
            title: "Documentation",
            items: [
              { text: "Update README" },
              { text: "Document API changes" }
            ]
          },
          {
            title: "Testing",
            items: [
              { text: "Write unit tests" },
              { text: "Perform integration testing" }
            ]
          }
        ]
      });
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(json)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.json');
      
      expect(template.title).toBe('JSON Checklist');
      expect(template.sections).toHaveLength(2);
      
      // Check sections
      expect(template.sections[0].title).toBe('Documentation');
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[0].items[0].text).toBe('Update README');
      
      expect(template.sections[1].title).toBe('Testing');
      expect(template.sections[1].items).toHaveLength(2);
      expect(template.sections[1].items[1].text).toBe('Perform integration testing');
    });
    
    test('handles invalid templates gracefully', async () => {
      const invalidTemplates = [
        'Not a valid template',
        '{ "title": "Broken JSON" ',
        '- title: Broken YAML',
        '# Just a title without sections',
      ];
      
      for (const content of invalidTemplates) {
        const mockResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(content)
        };
        
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
        
        const template = await templateManager.loadTemplate('https://example.com/broken-template');
        
        // Should return fallback template
        expect(template).toBeDefined();
        expect(template.title).toBe('Code Review Checklist');
        expect(template.sections.length).toBeGreaterThan(0);
      }
    });
  });
}); 