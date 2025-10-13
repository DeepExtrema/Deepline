#!/usr/bin/env node
/**
 * Contract Validation Script
 * 
 * Validates that:
 * 1. UI test ID contract (contracts/ui-test-ids.json) is valid JSON
 * 2. API schema contract (contracts/api-schema.yaml) is valid YAML/OpenAPI
 * 3. All referenced files exist
 * 4. Contract structure follows expected format
 * 
 * Exit codes:
 * 0 - All validations passed
 * 1 - Validation failures detected
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log('='.repeat(60), colors.blue);
}

// Validation results
const validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

/**
 * Validate UI Test IDs Contract
 */
function validateUITestIDsContract() {
  logSection('Validating UI Test IDs Contract');
  
  const contractPath = path.join(__dirname, '..', 'contracts', 'ui-test-ids.json');
  
  // Check file exists
  if (!fs.existsSync(contractPath)) {
    logError(`Contract file not found: ${contractPath}`);
    validationResults.failed++;
    validationResults.errors.push('ui-test-ids.json not found');
    return false;
  }
  
  logSuccess(`Contract file found: ${contractPath}`);
  
  // Parse JSON
  let contract;
  try {
    const content = fs.readFileSync(contractPath, 'utf8');
    contract = JSON.parse(content);
    logSuccess('Contract is valid JSON');
    validationResults.passed++;
  } catch (error) {
    logError(`Failed to parse JSON: ${error.message}`);
    validationResults.failed++;
    validationResults.errors.push('Invalid JSON in ui-test-ids.json');
    return false;
  }
  
  // Validate structure
  if (!contract.screens || typeof contract.screens !== 'object') {
    logError('Contract missing required "screens" object');
    validationResults.failed++;
    validationResults.errors.push('Invalid structure: missing screens object');
    return false;
  }
  
  logSuccess(`Contract contains ${Object.keys(contract.screens).length} screen(s)`);
  
  // Validate each screen
  let totalElements = 0;
  let requiredElements = 0;
  const duplicateIds = new Set();
  const allIds = new Set();
  
  for (const [screenName, screen] of Object.entries(contract.screens)) {
    if (!screen.elements || !Array.isArray(screen.elements)) {
      logError(`Screen "${screenName}" missing elements array`);
      validationResults.failed++;
      validationResults.errors.push(`Invalid screen: ${screenName}`);
      continue;
    }
    
    logInfo(`  Screen: ${screenName} (${screen.elements.length} elements)`);
    totalElements += screen.elements.length;
    
    for (const element of screen.elements) {
      if (!element.id) {
        logWarning(`    Element in ${screenName} missing "id" field`);
        validationResults.warnings++;
        continue;
      }
      
      if (allIds.has(element.id)) {
        duplicateIds.add(element.id);
      }
      allIds.add(element.id);
      
      if (element.required) {
        requiredElements++;
      }
      
      // Validate selector format
      if (!element.selector || !element.selector.includes('data-testid')) {
        logWarning(`    Element "${element.id}" has invalid selector format`);
        validationResults.warnings++;
      }
    }
  }
  
  if (duplicateIds.size > 0) {
    logWarning(`Found ${duplicateIds.size} duplicate test ID(s): ${Array.from(duplicateIds).join(', ')}`);
    validationResults.warnings += duplicateIds.size;
  }
  
  logInfo(`Total elements: ${totalElements}`);
  logInfo(`Required elements: ${requiredElements}`);
  logInfo(`Optional elements: ${totalElements - requiredElements}`);
  
  validationResults.passed++;
  return true;
}

/**
 * Validate API Schema Contract
 */
function validateAPISchemaContract() {
  logSection('Validating API Schema Contract');
  
  const contractPath = path.join(__dirname, '..', 'contracts', 'api-schema.yaml');
  
  // Check file exists
  if (!fs.existsSync(contractPath)) {
    logError(`Contract file not found: ${contractPath}`);
    validationResults.failed++;
    validationResults.errors.push('api-schema.yaml not found');
    return false;
  }
  
  logSuccess(`Contract file found: ${contractPath}`);
  
  // Basic YAML validation (check if it's readable and has expected structure)
  let content;
  try {
    content = fs.readFileSync(contractPath, 'utf8');
    logSuccess('Contract file is readable');
    validationResults.passed++;
  } catch (error) {
    logError(`Failed to read file: ${error.message}`);
    validationResults.failed++;
    validationResults.errors.push('Failed to read api-schema.yaml');
    return false;
  }
  
  // Basic structure validation (simple text search, no YAML parser dependency)
  const requiredSections = [
    'openapi:',
    'info:',
    'paths:',
    'components:',
    'schemas:',
  ];
  
  let missingSection = false;
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      logError(`Missing required section: ${section}`);
      validationResults.failed++;
      missingSection = true;
    }
  }
  
  if (!missingSection) {
    logSuccess('All required OpenAPI sections present');
    validationResults.passed++;
  }
  
  // Count endpoints
  const pathMatches = content.match(/^\s{2}\/[^:]+:/gm) || [];
  logInfo(`Found ${pathMatches.length} API endpoint(s)`);
  
  // Check for key endpoints
  const keyEndpoints = [
    '/health',
    '/datasets',
    '/workflows/start',
    '/load_data',
    '/execute',
    '/class_imbalance',
  ];
  
  for (const endpoint of keyEndpoints) {
    if (content.includes(`  ${endpoint}:`)) {
      logInfo(`  ✓ ${endpoint}`);
    } else {
      logWarning(`  ? ${endpoint} not found`);
      validationResults.warnings++;
    }
  }
  
  validationResults.passed++;
  return true;
}

/**
 * Validate Directory Structure
 */
function validateDirectoryStructure() {
  logSection('Validating Directory Structure');
  
  const requiredDirs = [
    path.join(__dirname, '..', 'contracts'),
    path.join(__dirname, '..', 'reports'),
    path.join(__dirname, '..', 'scripts'),
  ];
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      logSuccess(`Directory exists: ${path.relative(path.join(__dirname, '..'), dir)}`);
      validationResults.passed++;
    } else {
      logError(`Directory missing: ${path.relative(path.join(__dirname, '..'), dir)}`);
      validationResults.failed++;
      validationResults.errors.push(`Missing directory: ${path.basename(dir)}`);
    }
  }
}

/**
 * Validate Selector Adoption Report
 */
function validateSelectorAdoptionReport() {
  logSection('Validating Selector Adoption Report');
  
  const reportPath = path.join(__dirname, '..', 'reports', 'selector-adoption.md');
  
  if (!fs.existsSync(reportPath)) {
    logError(`Report file not found: ${reportPath}`);
    validationResults.failed++;
    validationResults.errors.push('selector-adoption.md not found');
    return false;
  }
  
  logSuccess(`Report file found: ${reportPath}`);
  
  const content = fs.readFileSync(reportPath, 'utf8');
  
  // Check for required sections
  const requiredSections = [
    '# Selector Adoption Report',
    '## TODO: Components Requiring data-testid Attributes',
    'dashboard-ui/src/main.jsx',
  ];
  
  let missingSection = false;
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      logWarning(`Report missing expected section: ${section}`);
      validationResults.warnings++;
      missingSection = true;
    }
  }
  
  if (!missingSection) {
    logSuccess('All expected sections present in report');
    validationResults.passed++;
  }
  
  // Count TODO items
  const todoCount = (content.match(/\/\/ TODO:/g) || []).length;
  logInfo(`Found ${todoCount} TODO comment(s) in report`);
  
  validationResults.passed++;
  return true;
}

/**
 * Main validation function
 */
function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.cyan);
  log('║         Contract Validation Script                       ║', colors.cyan);
  log('║         Deepline Multi-Agent Data Scientist              ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  // Run all validations
  validateDirectoryStructure();
  validateUITestIDsContract();
  validateAPISchemaContract();
  validateSelectorAdoptionReport();
  
  // Print summary
  logSection('Validation Summary');
  
  log(`Passed:   ${validationResults.passed}`, colors.green);
  log(`Failed:   ${validationResults.failed}`, colors.red);
  log(`Warnings: ${validationResults.warnings}`, colors.yellow);
  
  if (validationResults.errors.length > 0) {
    log('\nErrors:', colors.red);
    validationResults.errors.forEach(error => {
      log(`  • ${error}`, colors.red);
    });
  }
  
  console.log('');
  
  if (validationResults.failed > 0) {
    logError('❌ Contract validation FAILED');
    process.exit(1);
  } else if (validationResults.warnings > 0) {
    logWarning('⚠️  Contract validation PASSED with warnings');
    process.exit(0);
  } else {
    logSuccess('✅ All contract validations PASSED');
    process.exit(0);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = {
  validateUITestIDsContract,
  validateAPISchemaContract,
  validateDirectoryStructure,
  validateSelectorAdoptionReport,
};
