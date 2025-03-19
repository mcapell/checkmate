/**
 * DOM Environment Mock
 * Creates a simulated DOM environment for GitHub pages
 */

interface DOMEnvironmentOptions {
  isGitHubPR?: boolean;
  hasReviewSection?: boolean;
}

export function mockDOMEnvironment(options: DOMEnvironmentOptions = {}) {
  const {
    isGitHubPR = false,
    hasReviewSection = true
  } = options;
  
  // Setup document body
  document.body.innerHTML = '';
  
  // If it's a GitHub PR page, create the necessary DOM structure
  if (isGitHubPR) {
    // Set up location mock
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://github.com/owner/repo/pull/123',
        pathname: '/owner/repo/pull/123'
      },
      writable: true
    });
    
    // Create PR page structure
    const prHeader = document.createElement('div');
    prHeader.classList.add('gh-header-title');
    prHeader.innerHTML = '<span class="js-issue-title">Test Pull Request</span>';
    document.body.appendChild(prHeader);
    
    // Add PR sidebar
    const prSidebar = document.createElement('div');
    prSidebar.classList.add('js-discussion');
    document.body.appendChild(prSidebar);
    
    // Add PR review section if needed
    if (hasReviewSection) {
      const reviewSection = document.createElement('div');
      reviewSection.classList.add('pull-request-review-menu');
      document.body.appendChild(reviewSection);
    }
  } else {
    // Non-PR page
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://github.com/owner/repo',
        pathname: '/owner/repo'
      },
      writable: true
    });
    
    const nonPrContent = document.createElement('div');
    nonPrContent.textContent = 'This is not a PR page';
    document.body.appendChild(nonPrContent);
  }
  
  // Helper to clean up the DOM
  const cleanup = () => {
    document.body.innerHTML = '';
  };
  
  return {
    cleanup
  };
} 