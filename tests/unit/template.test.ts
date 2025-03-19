import { ChecklistTemplate } from '../../src/types';
import { templateManager } from '../../src/utils/template-manager';

// Simple mocks for browser APIs
const fetchMock = jest.fn();

// Setup mocks
beforeAll(() => {
  // @ts-ignore - Mocking fetch
  global.fetch = fetchMock;
  
  // @ts-ignore - Mocking chrome with type assertion to avoid type errors
  global.chrome = {
    runtime: {
      // Only add the minimum required properties
      getURL: jest.fn(),
      id: ''
    } as any // Use type assertion to avoid TypeScript errors
  };
});

// Reset mocks between tests
beforeEach(() => {
  fetchMock.mockReset();
});

describe('Template Manager', () => {
  describe('loadTemplate', () => {
    test('loads YAML templates correctly', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          sections:
            - name: "General Checks"
              items:
                - name: "Code builds without errors"
                - name: "Tests pass"
            - name: "Performance"
              items:
                - name: "No performance regressions"
        `)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.yaml');
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/template.yaml');
      expect(template).toBeDefined();
      expect(template.sections).toHaveLength(2);
      expect(template.sections[0].name).toBe('General Checks');
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[1].name).toBe('Performance');
      expect(template.sections[1].items).toHaveLength(1);
    });
    
    test('loads Markdown templates correctly', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          # Test Template
          
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
      expect(template.sections).toHaveLength(2);
      expect(template.sections[0].items).toHaveLength(2);
      expect(template.sections[1].items).toHaveLength(1);
    });
    
    test('loads JSON templates correctly', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`{
          "sections": [
            {
              "name": "Code Quality",
              "items": [
                {"name": "Code follows style guidelines"},
                {"name": "No duplicate code"}
              ]
            }
          ]
        }`)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const template = await templateManager.loadTemplate('https://example.com/template.json');
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/template.json');
      expect(template).toBeDefined();
      expect(template.sections).toHaveLength(1);
      expect(template.sections[0].name).toBe('Code Quality');
      expect(template.sections[0].items).toHaveLength(2);
    });
    
    test('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const template = await templateManager.loadTemplate('https://example.com/broken-link.md');
      
      // Should return fallback template
      expect(template).toBeDefined();
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
      expect(template.sections.length).toBeGreaterThan(0);
    });
    
    test('handles invalid YAML content gracefully', async () => {
      const invalidYaml = `
        sections:
          - name: "Invalid Section
            items:
              - This is not proper YAML
      `;
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(invalidYaml)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Should return fallback template instead of throwing
      const template = await templateManager.loadTemplate('https://example.com/invalid.yaml');
      
      expect(template).toBeDefined();
      expect(template.sections.length).toBeGreaterThan(0);
    });
    
    test('handles invalid Markdown content gracefully', async () => {
      const invalidMarkdown = `
        This is just plain text without any sections or items
      `;
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(invalidMarkdown)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Should parse what it can or return a default template
      const template = await templateManager.loadTemplate('https://example.com/invalid.md');
      
      expect(template).toBeDefined();
      expect(template.sections.length).toBeGreaterThan(0);
    });
    
    test('handles invalid JSON content gracefully', async () => {
      const invalidJson = `{
        "sections": [
          {
            "name": "Invalid JSON
            "items": [
              {"name": "This is not valid JSON"}
            ]
          }
        ]
      }`;
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(invalidJson)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Should return fallback template instead of throwing
      const template = await templateManager.loadTemplate('https://example.com/invalid.json');
      
      expect(template).toBeDefined();
      expect(template.sections.length).toBeGreaterThan(0);
    });
  });
}); 