# Checkmate - Developer Documentation

## Table of Contents
1. [Code Structure Overview](#code-structure-overview)
2. [Development Setup](#development-setup)
3. [Building the Extension](#building-the-extension)
4. [Testing](#testing)
5. [Browser Compatibility](#browser-compatibility)
6. [Contribution Guidelines](#contribution-guidelines)
7. [Architecture and Design Decisions](#architecture-and-design-decisions)
8. [Release Process](#release-process)

## Code Structure Overview

```
/
├── src/                           # Source code
│   ├── background/                # Background script for extension
│   │   └── background.ts          # Main background script
│   ├── content/                   # Content script for GitHub integration
│   │   ├── content.ts             # Content script entry point
│   │   ├── sidebar.ts             # Sidebar UI component
│   │   └── sidebar-manager.ts     # Manages sidebar instances
│   ├── popup/                     # Simple popup for non-PR pages
│   │   ├── popup.html             # Popup HTML
│   │   ├── popup.ts               # Popup logic
│   │   └── popup.css              # Popup styles
│   ├── options/                   # Extension options
│   │   ├── options.html           # Options page HTML
│   │   ├── options.ts             # Options page logic
│   │   └── options.css            # Options page styles
│   ├── utils/                     # Utility functions
│   │   ├── dom-helpers.ts         # DOM manipulation helpers
│   │   ├── error-handler.ts       # Error handling utilities
│   │   ├── github-utils.ts        # GitHub page interaction utilities
│   │   ├── state-manager.ts       # State persistence manager
│   │   ├── template-manager.ts    # Template loading and parsing
│   │   └── storage.ts             # Storage API wrapper
│   ├── styles/                    # Shared styles
│   │   └── theme.css              # Theme definitions
│   └── types/                     # TypeScript type definitions
│       └── index.ts               # Type declarations
├── tests/                         # Test files
│   ├── unit/                      # Unit tests
│   │   ├── error-handler.test.ts  # Error handler tests
│   │   ├── github-utils.test.ts   # GitHub utilities tests
│   │   ├── storage.test.ts        # Storage tests
│   │   ├── template.test.ts       # Template parsing tests
│   │   └── theme.test.ts          # Theme tests
│   ├── integration/               # Integration tests
│   │   ├── communication.test.ts  # Cross-context communication tests
│   │   ├── initialization.test.ts # Extension initialization tests
│   │   └── template-state.test.ts # Template and state tests
│   ├── e2e/                       # End-to-end tests
│   │   └── extension.test.ts      # Full extension tests
│   ├── options.test.ts            # Options page tests
│   └── utils/                     # Test utilities
│       └── type-adapters.ts       # Type adapters for testing
├── public/                        # Static assets
│   ├── manifest.json              # Extension manifest
│   ├── default-template.yaml      # Default checklist template
│   └── icons/                     # Extension icons
├── dist/                          # Build output (generated)
├── docs/                          # Documentation
├── scripts/                       # Build and utility scripts
├── jest.config.js                 # Jest configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Webpack configuration
├── package.json                   # Project dependencies and scripts
└── README.md                      # Project overview
```

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mcapell/checkmate.git
   cd checkmate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development mode:
   ```bash
   npm run dev
   ```

This will build the extension and watch for changes, rebuilding automatically when files are modified.

### Development Flow

1. Make changes to the source code in the `src` directory
2. If you're running `npm run dev`, the extension will rebuild automatically
3. Reload the extension in your browser:
   - Chrome: Click the reload button on the chrome://extensions page
   - Firefox: Click the reload button on the about:debugging#/runtime/this-firefox page

## Building the Extension

### Development Build

```bash
npm run build
```

This will create a development build in the `dist` directory with source maps and unminified code.

### Production Build

```bash
npm run build:prod
```

This will create a production build in the `dist` directory with minified code and no source maps.

### Creating Browser Packages

```bash
npm run package
```

This will create browser-specific packages in the `packages` directory:
- `checkmate-chrome.zip` for Chrome
- `checkmate-firefox.xpi` for Firefox

## Testing

### Running All Tests

```bash
npm test
```

### Running Specific Test Suites

```bash
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run end-to-end tests
```

### Continuous Testing

```bash
npm run test:watch
```

This will run tests in watch mode, re-running tests when files change.

### Test Coverage

```bash
npm run test:coverage
```

This will run tests with coverage reporting and generate a coverage report in the `coverage` directory.

## Browser Compatibility

The extension is developed with cross-browser compatibility in mind, targeting:

- Firefox (primary)
- Chrome (secondary)

We use the WebExtension API with polyfills where necessary to ensure consistent behavior across browsers.

### Browser-Specific Code

When browser-specific behavior is needed, we use feature detection rather than browser detection where possible. In cases where browser-specific code is unavoidable, it's isolated in specific modules and clearly documented.

## Contribution Guidelines

### Code Style

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Document public APIs and complex functions
- Use semantic HTML and ARIA attributes for accessibility

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure tests pass (`npm test`)
5. Commit your changes with meaningful commit messages
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request against the `main` branch

### Commit Message Format

Use conventional commit messages format:

```
type(scope): brief description

Longer explanation if needed
```

Where `type` is one of:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or fixing tests
- `chore`: Changes to build process or auxiliary tools

### Code Review Process

- All code changes require review
- Reviewers should focus on:
  - Correctness
  - Test coverage
  - Code quality
  - Documentation
  - Adherence to style guidelines

## Architecture and Design Decisions

### State Management

The extension uses a simple state management pattern:
- Each PR has its own state identified by a unique key
- State is persisted to browser storage
- Changes are saved immediately after user interaction

### Template Loading

Templates are loaded from remote URLs and parsed as YAML:
- Default template is embedded in the extension
- Custom templates can be configured via options
- Failed template loads fall back to the default template

### UI Architecture

The content script injects a sidebar into GitHub pull request pages:
- Sidebar is created and managed by the `Sidebar` class
- Each section and item is created dynamically based on the template
- Event listeners manage user interactions

### Error Handling

We use a centralized error handling system:
- Errors are categorized (template, storage, network, etc.)
- User-facing error messages are friendly and provide guidance
- Developer-facing errors include detailed information for debugging

## Release Process

### Versioning

We follow semantic versioning:
- `MAJOR.MINOR.PATCH`
- Major: Incompatible API changes
- Minor: Backward-compatible functionality
- Patch: Backward-compatible bug fixes

### Release Steps

1. Update version in `package.json` and `manifest.json`
2. Update CHANGELOG.md with changes since last release
3. Create a production build (`npm run build:prod`)
4. Create browser packages (`npm run package`)
5. Test the packages in both Firefox and Chrome
6. Tag the release in git (`git tag v1.0.0`)
7. Push the tag (`git push origin v1.0.0`)
8. Create a GitHub release with release notes
9. Attach the browser packages to the GitHub release 