#!/usr/bin/env node

/**
 * Package Verification Script for Checkmate
 * 
 * This script:
 * 1. Extracts the built extension packages
 * 2. Validates key files exist
 * 3. Verifies basic functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const CHROME_PACKAGE = path.join(PACKAGES_DIR, 'checkmate-chrome.zip');
const FIREFOX_PACKAGE = path.join(PACKAGES_DIR, 'checkmate-firefox.xpi');
const TEMP_DIR = path.join(ROOT_DIR, 'tmp-verify');

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
 * Logs a message with color
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
 * Cleans up temporary directory
 */
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    try {
      execSync(`rm -rf ${TEMP_DIR}`);
      log('Cleaned up temporary directory', COLORS.blue);
    } catch (error) {
      log(`Error cleaning up temporary directory: ${error.message}`, COLORS.red);
    }
  }
}

/**
 * Extracts and verifies a package
 */
function verifyPackage(packagePath, packageType) {
  log(`\nVerifying ${packageType} package...`, COLORS.blue);
  
  if (!fs.existsSync(packagePath)) {
    log(`❌ ${packageType} package not found at ${packagePath}`, COLORS.red);
    return false;
  }
  
  // Extract package
  const extractDir = path.join(TEMP_DIR, packageType);
  ensureDirectoryExists(extractDir);
  
  try {
    const zip = new AdmZip(packagePath);
    zip.extractAllTo(extractDir, true);
    log(`Extracted ${packageType} package to ${extractDir}`, COLORS.blue);
  } catch (error) {
    log(`❌ Failed to extract ${packageType} package: ${error.message}`, COLORS.red);
    return false;
  }
  
  // Verify key files
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.js',
    'options.js',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(extractDir, file);
    if (!fs.existsSync(filePath)) {
      log(`❌ Required file missing: ${file}`, COLORS.red);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    log(`✅ All required files present in ${packageType} package`, COLORS.green);
  } else {
    return false;
  }
  
  // Verify manifest.json
  try {
    const manifestPath = path.join(extractDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check for essential manifest properties
    const requiredProps = ['name', 'version', 'manifest_version', 'permissions', 'content_scripts'];
    let missingProps = [];
    
    for (const prop of requiredProps) {
      if (!manifest[prop]) {
        missingProps.push(prop);
      }
    }
    
    if (missingProps.length === 0) {
      log(`✅ Manifest contains all required properties`, COLORS.green);
    } else {
      log(`❌ Manifest missing required properties: ${missingProps.join(', ')}`, COLORS.red);
      return false;
    }
    
    // Firefox-specific checks
    if (packageType === 'firefox') {
      if (!manifest.browser_specific_settings || !manifest.browser_specific_settings.gecko) {
        log(`⚠️ Firefox package is missing browser_specific_settings.gecko`, COLORS.yellow);
      }
    }
    
  } catch (error) {
    log(`❌ Failed to verify manifest.json: ${error.message}`, COLORS.red);
    return false;
  }
  
  log(`✅ ${packageType} package verification passed`, COLORS.green);
  return true;
}

/**
 * Main verification function
 */
async function verify() {
  try {
    logSection('CHECKMATE PACKAGE VERIFICATION');
    
    // Clean up any previous verification
    cleanup();
    
    // Ensure temp directory exists
    ensureDirectoryExists(TEMP_DIR);
    
    // Verify Chrome package
    const chromeValid = verifyPackage(CHROME_PACKAGE, 'chrome');
    
    // Verify Firefox package
    const firefoxValid = verifyPackage(FIREFOX_PACKAGE, 'firefox');
    
    // Final result
    logSection('VERIFICATION RESULTS');
    
    if (chromeValid && firefoxValid) {
      log('✅ All packages passed verification!', COLORS.green);
      return 0;
    } else {
      log('❌ Some packages failed verification.', COLORS.red);
      
      if (!chromeValid) {
        log('   - Chrome package has issues', COLORS.red);
      }
      
      if (!firefoxValid) {
        log('   - Firefox package has issues', COLORS.red);
      }
      
      return 1;
    }
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, COLORS.red);
    return 1;
  } finally {
    // Clean up
    cleanup();
  }
}

// Run verification and exit with appropriate code
verify().then(exitCode => {
  process.exit(exitCode);
}); 