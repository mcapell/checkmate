# Checkmate - GitHub Code Review Checklist

## User Guide

### Table of Contents
1. [Installation](#installation)
   - [Chrome Installation](#chrome-installation)
   - [Firefox Installation](#firefox-installation)
   - [Manual Installation](#manual-installation)
2. [Usage Guide](#usage-guide)
   - [Accessing the Checklist](#accessing-the-checklist)
   - [Using the Checklist](#using-the-checklist)
   - [Item States](#item-states)
   - [Section Management](#section-management)
3. [Configuration Options](#configuration-options)
   - [Theme Preferences](#theme-preferences)
   - [Template URL](#template-url)
4. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Error Messages](#error-messages)
   - [Reporting Bugs](#reporting-bugs)

## Installation

### Chrome Installation

1. Download the latest Chrome extension package (`checkmate-chrome.zip`) from the [Releases](https://github.com/mcapell/checkmate/releases) page.
2. Extract the ZIP file to a folder of your choice.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the top-right corner.
5. Click the "Load unpacked" button and select the extracted folder.
6. The extension will now be installed and the icon will appear in your browser toolbar.

### Firefox Installation

1. Download the latest Firefox extension package (`checkmate-firefox.xpi`) from the [Releases](https://github.com/mcapell/checkmate/releases) page.
2. Open Firefox and navigate to `about:addons`.
3. Click the gear icon and select "Install Add-on From File...".
4. Select the downloaded `.xpi` file.
5. Click "Add" when prompted.
6. The extension will now be installed and the icon will appear in your browser toolbar.

### Manual Installation

If you prefer to build the extension from source:

1. Clone the repository:
   ```
   git clone https://github.com/mcapell/checkmate.git
   cd checkmate
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in developer mode:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked" and select the `dist` folder.
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and select the `manifest.json` file in the `dist` folder.

## Usage Guide

### Accessing the Checklist

1. Navigate to any GitHub pull request page (URL format: `https://github.com/{owner}/{repo}/pull/{number}`).
2. The checklist sidebar will automatically appear on the right side of the page.
3. If the sidebar is not visible, click the extension icon in your browser toolbar.

### Using the Checklist

The checklist is divided into sections, each containing related review items:

1. **Loading a Template**: By default, the extension loads a template from the configured template URL. If no template is configured, a default template is used.
2. **Checking Items**: Click the checkbox next to an item to mark it as checked.
3. **Flagging Items**: Click an item's label to toggle the "needs attention" flag.
4. **Restarting a Review**: Click the "Restart Review" button at the top of the sidebar to reset all checkboxes to their initial state.

### Item States

Each checklist item can be in one of three states:

- **Unchecked**: The item has not been reviewed.
- **Checked**: The item has been reviewed and is satisfactory.
- **Needs Attention**: The item has been reviewed but requires attention or follow-up.

Items flagged as "needs attention" will be highlighted and also appear in a special "Needs Attention" section at the top of the checklist.

### Section Management

- **Expanding/Collapsing**: Click a section header or the expand/collapse button next to it to toggle the visibility of its contents.
- **Navigation**: Use the "Back to Top" link at the end of each section to quickly return to the top of the sidebar.

## Configuration Options

To access the configuration options:

1. Right-click the extension icon in your browser toolbar.
2. Select "Options" or "Extension options" from the menu.

### Theme Preferences

You can choose between three theme options:

- **Light**: Always use light theme.
- **Dark**: Always use dark theme.
- **Auto**: Match the theme to your GitHub theme preference.

### Template URL

You can specify a custom template URL to load your own checklist template:

1. Enter the full URL to a YAML file that follows the required template format.
2. Click "Save" to apply the changes.
3. The new template will be loaded the next time you open a pull request page.

#### Template Format

Templates must be in YAML format and follow this structure:

```yaml
sections:
  - name: "Section Name"
    items:
      - name: "Checklist item 1"
        url: "https://documentation.link" # Optional
      - name: "Checklist item 2"
```

## Troubleshooting

### Common Issues

#### Sidebar Not Appearing

- Ensure you're on a GitHub pull request page.
- Try refreshing the page.
- Check that the extension is enabled in your browser's extension settings.
- Click the extension icon in your browser toolbar to toggle the sidebar.

#### Template Loading Errors

- Verify that your template URL is correct and accessible.
- Ensure your template follows the correct YAML format.
- Check that your template URL is served with appropriate CORS headers.

#### State Not Saving

- Ensure your browser allows storage for the extension.
- Check if you're using private/incognito browsing mode, which may restrict storage.

### Error Messages

#### "Failed to load template"

- Check that the template URL is valid and accessible.
- Verify your internet connection.
- Ensure the template server allows cross-origin requests.

#### "Invalid template format"

- Check your template's YAML syntax.
- Verify that your template matches the required structure.

### Reporting Bugs

If you encounter a bug or issue that isn't covered in this guide:

1. Check the [GitHub Issues](https://github.com/mcapell/checkmate/issues) to see if it's already reported.
2. If not, create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser version and OS
   - Screenshot(s) if applicable 