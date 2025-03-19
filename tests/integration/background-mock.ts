/**
 * Mock version of the background script for testing
 */

// Mock implementation of isGitHubPrPage
export async function isGitHubPrPage(tabId: number): Promise<boolean> {
  return true;
} 