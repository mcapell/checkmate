# Checkmate - GitHub Code Review Checklist

A browser extension that provides customizable checklists for code reviews on GitHub pull request pages. This extension helps you track your progress through code reviews using templated checklists with persistent state.

## Features

- Load YAML templates from configurable remote URLs
- Sidebar interface within GitHub pull request pages
- Collapsible/expandable sections for organization
- Three-state checklist items (unchecked, checked, needs attention)
- State persistence per pull request
- Light/dark theme support

## Documentation

- [User Guide](docs/USER_GUIDE.md) - Installation and usage instructions
- [Developer Documentation](docs/DEVELOPER.md) - Development setup and code overview

## Project Structure

```
/
├── src/                           # Source code
│   ├── background/                # Background script for extension
│   ├── content/                   # Content script for GitHub integration
│   ├── popup/                     # Simple popup for non-PR pages
│   ├── utils/                     # Utility functions
│   │   ├── dom-helpers.ts         # DOM manipulation helpers
│   │   ├── error-handler.ts       # Error handling utilities
│   │   └── github-utils.ts        # GitHub page interaction utilities
│   └── types/                     # TypeScript type definitions
├── tests/                         # Test files
│   ├── unit/                      # Unit tests
│   └── e2e/                       # End-to-end tests
├── public/                        # Static assets
│   ├── manifest.json              # Extension manifest
│   └── icons/                     # Extension icons
├── docs/                          # Documentation
├── scripts/                       # Build and utility scripts
```

## Installation

See the [User Guide](docs/USER_GUIDE.md) for detailed installation instructions.

### Quick Install

#### For Chrome:
1. Download the latest `checkmate-chrome.zip` from the [Releases](https://github.com/mcapell/checkmate/releases) page
2. Extract the ZIP file
3. Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
4. Select the extracted folder

#### For Firefox:
1. Download the latest `checkmate-firefox.xpi` from the [Releases](https://github.com/mcapell/checkmate/releases) page
2. Go to `about:addons` in Firefox
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded `.xpi` file

## Development

### Prerequisites

- Node.js
- npm

### Setup

1. Clone the repository
   ```
   git clone https://github.com/mcapell/checkmate.git
   cd checkmate
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the extension
   ```
   npm run build
   ```

4. For development with live reloading
   ```
   npm run dev
   ```

### Testing

Run unit tests:
```
npm test
```

For more information on development, see the [Developer Documentation](docs/DEVELOPER.md).

## Data Models

### Template Structure
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

### State Structure
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

## License

MIT 