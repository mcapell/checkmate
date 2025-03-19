#!/usr/bin/env node

/**
 * Release Build Script for Checkmate
 * 
 * This script:
 * 1. Builds the extension in production mode
 * 2. Creates browser-specific packages (ZIP for Chrome, XPI for Firefox)
 * 3. Performs basic verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PACKAGE_DIR = path.join(ROOT_DIR, 'packages');
const MANIFEST_PATH = path.join(DIST_DIR, 'manifest.json');

// Package filenames
const CHROME_PACKAGE = 'checkmate-chrome.zip';
const FIREFOX_PACKAGE = 'checkmate-firefox.xpi';

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Logs a message with a given color
 */
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Logs a section header
 */
function logSection(title) {
  console.log('\n' + COLORS.cyan + '='.repeat(80) + COLORS.reset);
  console.log(COLORS.cyan + ' ' + title + COLORS.reset);
  console.log(COLORS.cyan + '='.repeat(80) + COLORS.reset);
}

/**
 * Creates directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, COLORS.blue);
  }
}

/**
 * Runs a shell command and returns the output
 */
function runCommand(command, description = null) {
  if (description) {
    log(`\n${description}...`, COLORS.blue);
  }
  
  try {
    log(`Running command: ${command}`, COLORS.blue);
    const output = execSync(command, { 
      cwd: ROOT_DIR, 
      stdio: 'inherit', // Change to inherit to see real-time output
      encoding: 'utf8'
    });
    return output;
  } catch (error) {
    log(`Error running command: ${command}`, COLORS.red);
    log(`Error code: ${error.status}`, COLORS.red);
    log(`Error message: ${error.message}`, COLORS.red);
    if (error.stderr) {
      log(`Error details: ${error.stderr.toString()}`, COLORS.red);
    }
    throw error;
  }
}

/**
 * Reads extension version from manifest.json
 */
function getExtensionVersion() {
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return manifest.version;
  } catch (error) {
    log('Error reading version from manifest.json', COLORS.red);
    log(error.message, COLORS.red);
    throw error;
  }
}

/**
 * Creates a ZIP package for Chrome
 */
function createChromePackage(version) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(PACKAGE_DIR, CHROME_PACKAGE);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      log(`Chrome package created: ${outputPath} (${archive.pointer()} bytes)`, COLORS.green);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      log(`Error creating Chrome package: ${err.message}`, COLORS.red);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(DIST_DIR, false);
    archive.finalize();
  });
}

/**
 * Creates an XPI package for Firefox
 */
function createFirefoxPackage(version) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(PACKAGE_DIR, FIREFOX_PACKAGE);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      log(`Firefox package created: ${outputPath} (${archive.pointer()} bytes)`, COLORS.green);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      log(`Error creating Firefox package: ${err.message}`, COLORS.red);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(DIST_DIR, false);
    archive.finalize();
  });
}

/**
 * Runs basic verification checks on the packages
 */
function verifyPackages(chromePath, firefoxPath) {
  log('\nVerifying packages...', COLORS.blue);
  
  // Check file sizes
  const chromeSize = fs.statSync(chromePath).size;
  const firefoxSize = fs.statSync(firefoxPath).size;
  
  log(`Chrome package size: ${(chromeSize / 1024).toFixed(2)} KB`, COLORS.green);
  log(`Firefox package size: ${(firefoxSize / 1024).toFixed(2)} KB`, COLORS.green);
  
  // Check if the sizes are reasonable
  if (chromeSize < 10000 || firefoxSize < 10000) {
    log('Warning: Package sizes seem too small. Check content.', COLORS.yellow);
  }
  
  // Additional verification could be added here
  // For example, unzipping the packages and checking for required files
}

/**
 * Main build process
 */
async function build() {
  try {
    logSection('CHECKMATE RELEASE BUILD');
    
    // Ensure package directory exists
    ensureDirectoryExists(PACKAGE_DIR);
    
    // Clean existing packages
    const existingPackages = [
      path.join(PACKAGE_DIR, CHROME_PACKAGE),
      path.join(PACKAGE_DIR, FIREFOX_PACKAGE)
    ];
    
    existingPackages.forEach(packagePath => {
      if (fs.existsSync(packagePath)) {
        fs.unlinkSync(packagePath);
        log(`Removed existing package: ${packagePath}`, COLORS.blue);
      }
    });
    
    // Build production version using our specialized build script
    log("\nBuilding production version...", COLORS.blue);
    runCommand('node scripts/build-production.js', 'Building production version');
    
    // Get version number
    const version = getExtensionVersion();
    log(`Building packages for version ${version}`, COLORS.blue);
    
    // Create packages
    const chromePath = await createChromePackage(version);
    const firefoxPath = await createFirefoxPackage(version);
    
    // Verify packages
    verifyPackages(chromePath, firefoxPath);
    
    logSection('BUILD COMPLETED SUCCESSFULLY');
    log(`Packages created in: ${PACKAGE_DIR}`, COLORS.green);
    log(`  - Chrome: ${CHROME_PACKAGE}`, COLORS.green);
    log(`  - Firefox: ${FIREFOX_PACKAGE}`, COLORS.green);
    
  } catch (error) {
    logSection('BUILD FAILED');
    log(error.message, COLORS.red);
    process.exit(1);
  }
}

// Execute the build process
build(); 