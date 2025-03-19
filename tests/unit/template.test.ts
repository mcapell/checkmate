import { DefaultTemplateManager } from '../../src/utils/template';
import { ChecklistTemplate, ErrorCategory } from '../../src/types';
import * as yaml from 'js-yaml';

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