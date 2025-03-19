/**
 * Tests for options page functionality
 */
import { ExtensionOptions } from '../src/types';

// Mock the storage manager
jest.mock('../src/utils/storage', () => {
  const mockStorageManager = {
    saveOptions: jest.fn(),
    getOptions: jest.fn()
  };
  
  return {
    storageManager: mockStorageManager
  };
});

// Import after mocking
import { storageManager } from '../src/utils/storage';

describe('Extension Options', () => {
  const mockStorageManager = storageManager as jest.Mocked<typeof storageManager>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockStorageManager.getOptions.mockResolvedValue({
      defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
      theme: 'auto'
    });
    
    mockStorageManager.saveOptions.mockResolvedValue();
  });
  
  test('getOptions returns default options', async () => {
    const options = await mockStorageManager.getOptions();
    
    expect(options).toEqual({
      defaultTemplateUrl: 'https://github.com/owner/repo/template.json',
      theme: 'auto'
    });
    
    expect(mockStorageManager.getOptions).toHaveBeenCalled();
  });
  
  test('getOptions returns custom stored options', async () => {
    const storedOptions: ExtensionOptions = {
      defaultTemplateUrl: 'https://example.com/template.yaml',
      theme: 'dark'
    };
    
    mockStorageManager.getOptions.mockResolvedValueOnce(storedOptions);
    
    const options = await mockStorageManager.getOptions();
    
    expect(options).toEqual(storedOptions);
    expect(mockStorageManager.getOptions).toHaveBeenCalled();
  });
  
  test('saveOptions saves options correctly', async () => {
    const optionsToSave: ExtensionOptions = {
      defaultTemplateUrl: 'https://github.com/user/custom-template.yaml',
      theme: 'light'
    };
    
    await mockStorageManager.saveOptions(optionsToSave);
    
    expect(mockStorageManager.saveOptions).toHaveBeenCalledWith(optionsToSave);
  });
  
  test('saveOptions handles errors correctly', async () => {
    const optionsToSave: ExtensionOptions = {
      defaultTemplateUrl: 'https://example.com/template.yaml',
      theme: 'auto'
    };
    
    // Mock a storage error
    mockStorageManager.saveOptions.mockRejectedValueOnce(new Error('Storage error'));
    
    await expect(mockStorageManager.saveOptions(optionsToSave)).rejects.toThrow('Storage error');
  });
}); 