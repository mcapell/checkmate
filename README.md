# Checkmate - GitHub Code Review Checklist

A browser extension that provides customizable checklists for code reviews on GitHub pull request pages. This extension helps you track your progress through code reviews using templated checklists with persistent state.

## Features

- Load YAML templates from configurable remote URLs
- Sidebar interface within GitHub pull request pages
- Collapsible/expandable sections for organization
- Three-state checklist items (unchecked, checked, needs attention)
- State persistence per pull request
- Light/dark theme support

## Project Structure

```
/
├── src/
│   ├── background/          # Background script for extension
│   ├── content/             # Content script for GitHub integration
│   ├── popup/               # Simple popup for non-PR pages
│   ├── utils/               # Utility functions
│   │   ├── dom-helpers.ts   # DOM manipulation helpers
│   │   ├── error-handler.ts # Error handling utilities
│   │   └── github-utils.ts  # GitHub page interaction utilities
│   └── types/               # TypeScript type definitions
├── tests/
│   ├── unit/                # Unit tests
│   └── e2e/                 # End-to-end tests
├── public/
│   ├── manifest.json        # Extension manifest
│   └── icons/               # Extension icons
```

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