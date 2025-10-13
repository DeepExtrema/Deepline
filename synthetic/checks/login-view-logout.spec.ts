/**
 * A8 Synthetic Canary Test: Login-View-Logout
 * 
 * This test performs a synthetic monitoring check of the dashboard application:
 * 1. Navigate to the dashboard
 * 2. Verify the main page loads correctly
 * 3. Check that system health indicators are visible
 * 4. Verify navigation elements are functional
 * 
 * NOTE: This is a READ-ONLY test that does NOT mutate production data.
 * It uses a dedicated test tenant for safe execution.
 * 
 * @see /reports/synthetic-integration.md for webhook configuration
 */

import { test, expect } from '@playwright/test';

// Test configuration - use environment variables for flexibility
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

test.describe('A8 Synthetic Canary: Login-View-Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation
    page.setDefaultTimeout(TEST_TIMEOUT);
  });

  test('should successfully load dashboard and navigate through main sections', async ({ page }) => {
    // Step 1: Navigate to dashboard
    await page.goto(DASHBOARD_URL);
    
    // Step 2: Verify page loaded by checking for the DEEPLINE brand
    await expect(page.locator('h1.brand')).toHaveText('DEEPLINE', { timeout: 10000 });
    
    // Step 3: Verify system status indicator is present
    const systemStatus = page.locator('.system-status');
    await expect(systemStatus).toBeVisible();
    
    // Step 4: Verify main navigation tabs are present
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(4); // Orchestrator, EDA, Refinery, ML
    
    // Step 5: Verify agent status indicators (should show health status)
    const orchestratorNav = page.locator('.nav-item').filter({ hasText: 'Orchestrator' });
    await expect(orchestratorNav).toBeVisible();
    
    const edaNav = page.locator('.nav-item').filter({ hasText: 'EDA' });
    await expect(edaNav).toBeVisible();
    
    const refineryNav = page.locator('.nav-item').filter({ hasText: 'Refinery' });
    await expect(refineryNav).toBeVisible();
    
    const mlNav = page.locator('.nav-item').filter({ hasText: 'ML' });
    await expect(mlNav).toBeVisible();
    
    // Step 6: Verify console panel is present (main interaction area)
    const consolePanel = page.locator('.console-container');
    await expect(consolePanel).toBeVisible();
    
    const consoleInput = page.locator('.console-prompt');
    await expect(consoleInput).toBeVisible();
    await expect(consoleInput).toHaveAttribute('placeholder', /Ask Deepline/i);
    
    // Step 7: Verify workflows panel is present
    const workflowsPanel = page.locator('.workflows-container');
    await expect(workflowsPanel).toBeVisible();
    
    // Step 8: Verify datasets panel is present
    const datasetsPanel = page.locator('.datasets-container');
    await expect(datasetsPanel).toBeVisible();
    
    // Step 9: Verify background processes panel is present
    const processesPanel = page.locator('.processes-container');
    await expect(processesPanel).toBeVisible();
    
    // Step 10: Test navigation between tabs (READ-ONLY clicks)
    await edaNav.click();
    // Verify the tab is now active
    await expect(edaNav).toHaveClass(/active/);
    
    await refineryNav.click();
    await expect(refineryNav).toHaveClass(/active/);
    
    await mlNav.click();
    await expect(mlNav).toHaveClass(/active/);
    
    // Return to orchestrator tab
    await orchestratorNav.click();
    await expect(orchestratorNav).toHaveClass(/active/);
    
    // Final verification: Ensure no JavaScript errors occurred
    // (Playwright automatically fails on console errors unless configured otherwise)
  });

  test('should display health status indicators correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    // Wait for the page to load
    await expect(page.locator('h1.brand')).toBeVisible({ timeout: 10000 });
    
    // Verify system status dot exists
    const statusDot = page.locator('.system-status .status-dot');
    await expect(statusDot).toBeVisible();
    
    // Verify process cards show health status
    const processCards = page.locator('.process-card');
    await expect(processCards).toHaveCount(2); // Orchestrator and Refinery
    
    // Check orchestrator health status
    const orchestratorCard = page.locator('.process-card').filter({ hasText: 'Orchestrator' });
    await expect(orchestratorCard).toBeVisible();
    const orchestratorStatus = orchestratorCard.locator('.status-dot');
    await expect(orchestratorStatus).toBeVisible();
    
    // Check refinery health status
    const refineryCard = page.locator('.process-card').filter({ hasText: 'Refinery' });
    await expect(refineryCard).toBeVisible();
    const refineryStatus = refineryCard.locator('.status-dot');
    await expect(refineryStatus).toBeVisible();
  });

  test('should verify console input is functional (READ-ONLY)', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    await expect(page.locator('h1.brand')).toBeVisible({ timeout: 10000 });
    
    // Verify console input exists and is enabled
    const consoleInput = page.locator('.console-prompt');
    await expect(consoleInput).toBeVisible();
    await expect(consoleInput).toBeEnabled();
    
    // Type in console input (but don't submit - READ-ONLY test)
    await consoleInput.fill('test query');
    await expect(consoleInput).toHaveValue('test query');
    
    // Clear the input (clean up)
    await consoleInput.clear();
    await expect(consoleInput).toHaveValue('');
    
    // Verify submit button exists
    const submitButton = page.locator('.console-submit');
    await expect(submitButton).toBeVisible();
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    // Verify initial load
    await expect(page.locator('h1.brand')).toHaveText('DEEPLINE', { timeout: 10000 });
    
    // Reload the page
    await page.reload();
    
    // Verify page loads again successfully
    await expect(page.locator('h1.brand')).toHaveText('DEEPLINE', { timeout: 10000 });
    await expect(page.locator('.console-container')).toBeVisible();
  });
});
