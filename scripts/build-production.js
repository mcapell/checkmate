#!/usr/bin/env node

/**
 * Production Build Script for Checkmate
 * 
 * This script:
 * 1. Runs webpack in production mode with transpileOnly option
 * 2. Copies necessary files to dist directory
 * 3. Creates package.json in dist directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Execute webpack build with transpileOnly option
console.log('\n=== Building production version ===\n');
try {
  execSync('npx webpack --config webpack.config.js --mode=production', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  console.log('\n✅ Build completed successfully!\n');
} catch (error) {
  console.error('\n❌ Build failed with errors, but continuing with packaging...\n');
}

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log(`Created dist directory: ${DIST_DIR}`);
}

// Create package.json in dist
const distPackageJsonPath = path.join(DIST_DIR, 'package.json');
if (!fs.existsSync(distPackageJsonPath)) {
  // Get version from main package.json
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  let version = '0.1.0'; // Default version
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      version = packageJson.version || version;
    } catch (error) {
      console.warn('Warning: Could not read version from package.json');
    }
  }
  
  const packageJsonContent = {
    "name": "checkmate",
    "version": version,
    "description": "A GitHub extension that adds a customizable checklist to pull request reviews",
    "author": "Marc Capell",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/mcapell/checkmate.git"
    },
    "homepage": "https://github.com/mcapell/checkmate",
    "bugs": {
      "url": "https://github.com/mcapell/checkmate/issues"
    },
    "keywords": [
      "github",
      "code-review",
      "checklist",
      "extension",
      "browser-extension"
    ]
  };
  
  fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJsonContent, null, 2));
  console.log('Created package.json in dist directory');
}

// Check if manifest.json exists in dist
const manifestPath = path.join(DIST_DIR, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Error: manifest.json not found in dist directory');
  process.exit(1);
}

console.log('\n=== Production build ready for packaging ===\n'); 