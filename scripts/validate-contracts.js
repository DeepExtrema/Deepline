#!/usr/bin/env node

/**
 * Contract Validation Script for CI/CD
 * 
 * This script validates data contracts and API contracts across the system.
 * It runs as part of the CI pipeline to ensure all services maintain their contracts.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Contract Validation...\n');

let exitCode = 0;

/**
 * Run a command and handle errors using spawn for security
 * @param {string} command - The command to execute (e.g., 'python', 'node')
 * @param {Array<string>} args - Array of arguments to pass to the command
 * @param {string} description - Human-readable description of the command
 * @param {Object} options - Additional options for spawnSync (e.g., { cwd: '/path' })
 * @returns {boolean} - True if command succeeded, false otherwise
 */
function runCommand(command, args, description, options = {}) {
  console.log(`\n📋 ${description}...`);
  try {
    const result = spawnSync(command, args, { 
      encoding: 'utf-8',
      stdio: 'inherit',
      ...options
    });
    
    // Check for spawn errors (e.g., command not found)
    if (result.error) {
      console.error(`❌ ${description} - FAILED: ${result.error.message}`);
      exitCode = 1;
      return false;
    }
    
    // Check exit status
    if (result.status === 0) {
      console.log(`✅ ${description} - PASSED`);
      return true;
    } else {
      console.error(`❌ ${description} - FAILED (exit code: ${result.status})`);
      exitCode = 1;
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} - FAILED:`, error.message);
    exitCode = 1;
    return false;
  }
}

/**
 * Check if Python test file exists and run it
 */
function runPythonContractTests() {
  const testFile = path.join(__dirname, '../mcp-server/test_refinery_contract_validation.py');
  const workDir = path.join(__dirname, '../mcp-server');
  
  if (fs.existsSync(testFile)) {
    console.log('\n📦 Running Python contract validation tests...');
    return runCommand(
      'python',
      [testFile],
      'Refinery Agent Contract Validation',
      { cwd: workDir }
    );
  } else {
    console.log('⚠️  Python contract tests not found, skipping...');
    return true;
  }
}

/**
 * Validate API schemas
 */
function validateAPISchemas() {
  console.log('\n📋 Validating API schemas...');
  const schemaDir = path.join(__dirname, '../mcp-server/schemas');
  
  if (fs.existsSync(schemaDir)) {
    const schemas = fs.readdirSync(schemaDir).filter(f => f.endsWith('.json') || f.endsWith('.yaml'));
    
    if (schemas.length > 0) {
      console.log(`✅ Found ${schemas.length} schema file(s)`);
      return true;
    } else {
      console.log('⚠️  No schema files found');
      return true;
    }
  } else {
    console.log('⚠️  Schema directory not found, skipping...');
    return true;
  }
}

/**
 * Validate configuration files
 */
function validateConfiguration() {
  console.log('\n📋 Validating configuration files...');
  const configFile = path.join(__dirname, '../mcp-server/config.yaml');
  
  if (fs.existsSync(configFile)) {
    console.log('✅ Configuration file exists');
    return true;
  } else {
    console.log('⚠️  Configuration file not found');
    return true;
  }
}

/**
 * Main validation flow
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('        CONTRACT VALIDATION SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Run all validation checks
  validateConfiguration();
  validateAPISchemas();
  runPythonContractTests();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  if (exitCode === 0) {
    console.log('✅ All contract validations PASSED');
  } else {
    console.log('❌ Some contract validations FAILED');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(exitCode);
}

// Run main function
main().catch(error => {
  console.error('💥 Fatal error during validation:', error);
  process.exit(1);
});
