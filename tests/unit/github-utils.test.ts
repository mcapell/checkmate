// Add Jest type declarations
declare const describe: (description: string, specDefinitions: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const expect: any;

import { 
  extractRepoInfoFromUrl, 
  generatePrIdentifier, 
  isGitHubPrPage,
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

    test('returns invalid info for non-GitHub URL', () => {
      const url = 'https://example.com/some-page';
      const result = extractRepoInfoFromUrl(url);
      
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

    test('returns false for repo URL', () => {
      const url = 'https://github.com/mcapell/checkmate';
      expect(isGitHubPrPage(url)).toBe(false);
    });

    test('returns false for non-GitHub URL', () => {
      const url = 'https://example.com/some-page';
      expect(isGitHubPrPage(url)).toBe(false);
    });
  });
}); 