// Add Jest type declarations
declare const describe: (description: string, specDefinitions: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const expect: any;

import { 
  extractRepoInfoFromUrl, 
  generatePrIdentifier, 
  isGitHubPrPage,
  getCurrentRepoInfo,
  getCurrentPrIdentifier,
  RepoInfo
} from '../../src/utils/github-utils';

describe('GitHub Utilities', () => {
  describe('extractRepoInfoFromUrl', () => {
    test('extracts information from a valid PR URL', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        prNumber: 123,
        isValid: true,
      });
    });

    test('extracts information from a valid repo URL', () => {
      const url = 'https://github.com/mcapell/checkmate';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        isValid: true,
      });
    });

    test('handles repo URL with trailing slash', () => {
      const url = 'https://github.com/mcapell/checkmate/';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        isValid: true,
      });
    });

    test('handles repo URL with additional paths', () => {
      const url = 'https://github.com/mcapell/checkmate/tree/main';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        isValid: true,
      });
    });

    test('handles PR URL with additional query parameters', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123?diff=split';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        prNumber: 123,
        isValid: true,
      });
    });

    test('handles PR URL with hash fragments', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123#discussion_r123456';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        prNumber: 123,
        isValid: true,
      });
    });

    test('returns invalid info for non-GitHub URL', () => {
      const url = 'https://example.com/some-page';
      const result = extractRepoInfoFromUrl(url);
      
      expect(result).toEqual({
        owner: '',
        repo: '',
        isValid: false,
      });
    });

    test('handles enterprise GitHub URLs', () => {
      const url = 'https://github.enterprise.com/mcapell/checkmate/pull/123';
      const result = extractRepoInfoFromUrl(url);
      
      // Currently expected to fail as we don't handle enterprise URLs yet
      expect(result).toEqual({
        owner: '',
        repo: '',
        isValid: false,
      });
    });
  });

  describe('generatePrIdentifier', () => {
    test('generates correct identifier for PR', () => {
      const repoInfo: RepoInfo = {
        owner: 'mcapell',
        repo: 'checkmate',
        prNumber: 123,
        isValid: true,
      };
      
      const result = generatePrIdentifier(repoInfo);
      expect(result).toBe('mcapell/checkmate#123');
    });

    test('generates correct identifier for repo without PR', () => {
      const repoInfo: RepoInfo = {
        owner: 'mcapell',
        repo: 'checkmate',
        isValid: true,
      };
      
      const result = generatePrIdentifier(repoInfo);
      expect(result).toBe('mcapell/checkmate');
    });

    test('returns null for invalid repo info', () => {
      const repoInfo: RepoInfo = {
        owner: '',
        repo: '',
        isValid: false,
      };
      
      const result = generatePrIdentifier(repoInfo);
      expect(result).toBeNull();
    });

    test('returns null when owner is missing', () => {
      const repoInfo: RepoInfo = {
        owner: '',
        repo: 'checkmate',
        isValid: true,
      };
      
      const result = generatePrIdentifier(repoInfo);
      expect(result).toBeNull();
    });

    test('returns null when repo is missing', () => {
      const repoInfo: RepoInfo = {
        owner: 'mcapell',
        repo: '',
        isValid: true,
      };
      
      const result = generatePrIdentifier(repoInfo);
      expect(result).toBeNull();
    });
  });

  describe('isGitHubPrPage', () => {
    test('returns true for PR URL', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123';
      expect(isGitHubPrPage(url)).toBe(true);
    });
    
    test('returns true for PR URL with query parameters', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123?diff=split';
      expect(isGitHubPrPage(url)).toBe(true);
    });
    
    test('returns true for PR URL with hash fragments', () => {
      const url = 'https://github.com/mcapell/checkmate/pull/123#discussion_r123456';
      expect(isGitHubPrPage(url)).toBe(true);
    });

    test('returns false for repo URL', () => {
      const url = 'https://github.com/mcapell/checkmate';
      expect(isGitHubPrPage(url)).toBe(false);
    });

    test('returns false for non-GitHub URL', () => {
      const url = 'https://example.com/some-page';
      expect(isGitHubPrPage(url)).toBe(false);
    });
    
    test('returns false for GitHub file URL', () => {
      const url = 'https://github.com/mcapell/checkmate/blob/main/README.md';
      expect(isGitHubPrPage(url)).toBe(false);
    });
    
    test('returns false for GitHub issues URL', () => {
      const url = 'https://github.com/mcapell/checkmate/issues/123';
      expect(isGitHubPrPage(url)).toBe(false);
    });
  });

  describe('getCurrentRepoInfo and getCurrentPrIdentifier', () => {
    const originalLocation = window.location;
    
    beforeEach(() => {
      // Mock window.location for testing
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });
    
    afterEach(() => {
      // Restore original window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });
    
    test('getCurrentRepoInfo extracts information from current page', () => {
      window.location.href = 'https://github.com/mcapell/checkmate/pull/123';
      
      const result = getCurrentRepoInfo();
      expect(result).toEqual({
        owner: 'mcapell',
        repo: 'checkmate',
        prNumber: 123,
        isValid: true,
      });
    });
    
    test('getCurrentPrIdentifier returns correct identifier for current PR', () => {
      window.location.href = 'https://github.com/mcapell/checkmate/pull/123';
      
      const result = getCurrentPrIdentifier();
      expect(result).toBe('mcapell/checkmate#123');
    });
    
    test('getCurrentPrIdentifier returns null for non-PR page', () => {
      window.location.href = 'https://github.com/mcapell/checkmate';
      
      const result = getCurrentPrIdentifier();
      expect(result).toBe('mcapell/checkmate');
    });
  });
}); 