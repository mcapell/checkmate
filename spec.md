# Code Review Checklist Extension - Developer Specification

## Project Overview
A browser extension for GitHub that provides customizable checklists for code reviews on pull request pages. The extension allows users to track their progress through code reviews using templated checklists with persistent state.

## Requirements

### Functional Requirements

1. **Template Loading**
   - Load YAML templates from configurable remote URLs
   - Default template URL: https://github.com/mcapell/checkmate/templates/pullrequest.yaml
   - Support for section-based organization of checklist items
   - Support for documentation links on individual items

2. **User Interface**
   - Browser extension icon in toolbar to trigger the checklist
   - Sidebar interface that appears within GitHub pull request pages
   - Collapsible/expandable sections with:
     - Click-to-toggle section headers
     - Dedicated expand/collapse buttons
     - "Back to top" navigation at section end
   - Three-state checklist items:
     - Unchecked (default)
     - Checked (completed)
     - Needs attention (flagged)
   - Dynamic section showing all "needs attention" items
   - Clickable documentation links for items that provide them

3. **State Management**
   - Persist checklist state per pull request
   - Unique identifier based on repository and PR number
   - "Restart review" functionality to reload template and reset state
   - State persistence between browser sessions

4. **Configuration**
   - Dark/light theme preference setting
   - Configurable default template URL

### Non-Functional Requirements

1. **Browser Compatibility**
   - Primary: Firefox
   - Secondary: Chrome

2. **Performance**
   - Sidebar should load within 1 second
   - State changes should be saved immediately
   - Template loading should show loading indicator if taking >500ms

3. **Security**
   - Minimal permissions model
   - No sensitive data collection

## Technical Architecture

### Extension Structure
```
/
├── src/
│   ├── background/
│   │   └── background.ts       # Background script for extension
│   ├── content/
│   │   ├── content.ts          # Content script for GitHub integration
│   │   ├── sidebar.ts          # Sidebar UI implementation
│   │   └── github-utils.ts     # GitHub page interaction utilities
│   ├── popup/
│   │   ├── popup.html          # Simple popup for non-PR pages
│   │   └── popup.ts            # Popup logic
│   ├── options/
│   │   ├── options.html        # Options page
│   │   └── options.ts          # Options page logic
│   ├── utils/
│   │   ├── storage.ts          # Storage API wrapper
│   │   ├── template.ts         # Template loading and parsing
│   │   └── error-handler.ts    # Error handling utilities
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── public/
│   ├── manifest.json           # Extension manifest
│   ├── icons/                  # Extension icons
│   └── default-template.yaml   # Fallback template
├── tests/
│   ├── unit/                   # Unit tests
│   └── e2e/                    # End-to-end tests
├── package.json
├── tsconfig.json
└── README.md
```


### Data Models

#### Template Structure
```typescript
interface ChecklistTemplate {
  sections: Section[];
}

interface Section {
  name: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  name: string;
  url?: string;
}
```


#### State Structure
```typescript
interface ChecklistState {
  items: Record<string, ItemState>;
  sections: Record<string, boolean>; // true = expanded, false = collapsed
  lastUpdated: number; // timestamp
  templateUrl: string;
  templateVersion?: string;
}

interface ItemState {
  checked: boolean;
  needsAttention: boolean;
}
```


### Key Components

1. **Background Script**
   - Initializes extension
   - Handles browser action clicks
   - Manages cross-context communication

2. **Content Script**
   - Detects GitHub pull request pages
   - Extracts repository and PR information
   - Injects and manages sidebar UI
   - Communicates with background script

3. **Storage Manager**
   - Wraps WebExtension Storage API
   - Handles saving/loading checklist states
   - Implements error handling for storage operations

4. **Template Manager**
   - Fetches YAML templates from remote URLs
   - Parses and validates template structure
   - Provides fallback mechanisms for template errors

5. **Sidebar UI**
   - Renders checklist based on template and state
   - Handles user interactions (check/uncheck, flagging, section toggling)
   - Displays error messages when needed
   - Provides "restart review" functionality

6. **Options Page**
   - Allows configuration of theme preference
   - Allows setting default template URL

### API Interfaces

#### Storage API
```typescript
interface StorageManager {
  saveChecklistState(prId: string, state: ChecklistState): Promise<void>;
  getChecklistState(prId: string): Promise<ChecklistState | null>;
  clearChecklistState(prId: string): Promise<void>;
  saveOptions(options: ExtensionOptions): Promise<void>;
  getOptions(): Promise<ExtensionOptions>;
}
```


#### Template API
```typescript
interface TemplateManager {
  fetchTemplate(url: string): Promise<ChecklistTemplate>;
  parseTemplate(yamlContent: string): ChecklistTemplate;
  getDefaultTemplate(): ChecklistTemplate;
}
```

## Implementation Details

### Browser Extension APIs
- `browser.storage.local` (with polyfill for Chrome compatibility)
- `browser.runtime` for background communication
- `browser.tabs` for tab management
- `browser.browserAction` for toolbar icon

### GitHub Integration
- Content script runs on `https://github.com/*` URLs
- Detects pull request pages via URL pattern matching
- Extracts repository and PR information from URL:
  - Pattern: `https://github.com/{owner}/{repo}/pull/{number}`
  - ID format: `{owner}/{repo}#{number}`

### Error Handling Strategy
1. **Template Loading Errors**
   - Display specific error in sidebar
   - Show retry button
   - Log detailed error to console
   - Fallback to built-in default template if available

2. **YAML Parsing Errors**
   - Show parsing error details with line numbers if possible
   - Provide guidance on fixing common YAML issues
   - Fallback to previous valid template if available

3. **Storage Errors**
   - Display warning about potential data loss
   - Provide clear user action if applicable
   - Attempt to use in-memory state as temporary fallback

### State Management
- Use unique PR identifier as storage key
- Save state changes immediately after user interaction
- Load state when sidebar is opened
- Clear state when "restart review" is clicked

## Development Guidelines

### Technology Stack
- TypeScript for type safety
- Minimal external dependencies
- esbuild for bundling (lightweight and fast)

### Coding Standards
- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Document public APIs and complex functions
- Use semantic HTML and ARIA attributes for accessibility

### Testing Plan

#### Unit Tests
- Template parsing and validation
- Storage operations
- State management logic
- URL parsing and PR identification

#### Integration Tests
- Template loading from remote URLs
- GitHub page detection
- Sidebar injection and rendering
- State persistence between sessions

#### Manual Testing Checklist
- Extension works on Firefox (primary)
- Extension works on Chrome (secondary)
- All UI elements render correctly
- State persists between browser restarts
- Error messages are clear and actionable
- Theme switching works correctly

## Implementation Phases

### Phase 1 (MVP)
- Basic extension structure
- GitHub PR page detection
- Template loading from remote URL
- Sidebar UI with check/uncheck functionality
- Section toggling
- State persistence
- Basic error handling

### Phase 2
- "Needs attention" state implementation
- Dynamic section for flagged items
- Section navigation improvements
- Theme support (light/dark)

### Phase 3
- Multiple template support
- UI refinements
- Performance optimizations

## Permissions Required
1. Access to GitHub URLs (`https://github.com/*`)
2. Storage permission (`storage`)
3. Network access for template fetching

## Deployment Considerations
- Initially published as a GitHub repository
- Code should be structured to facilitate future browser store submissions
- Include clear installation instructions for manual installation
