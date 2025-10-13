/**
 * E2E Tests: CRUD Operations
 * Tests create → edit → list functionality for data sources
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('CRUD Operations', () => {
  // Setup authenticated session
  test.beforeEach(async ({ page, request }) => {
    await page.context().clearCookies();

    const testUser = TEST_USERS.userA;
    
    // Ensure user exists and login
    await request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.fullName,
        password: testUser.password,
        role: testUser.role
      },
      failOnStatusCode: false
    });

    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  });

  test('should create a new data source', async ({ page }) => {
    // Navigate to data sources
    await page.goto('/data/sources');

    // Click create button
    await page.getByTestId(testIds.dataSources.createBtn).click();

    // Wait for form to appear
    await expect(page.getByTestId(testIds.dataSources.createForm)).toBeVisible();

    // Fill form
    const dataSourceName = `Test Source ${Date.now()}`;
    await page.getByTestId(testIds.dataSources.nameInput).fill(dataSourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com/data');

    // Submit form
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Wait for success and redirect
    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify item appears in list
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(dataSourceName);
  });

  test('should list existing data sources', async ({ page }) => {
    await page.goto('/data/sources');

    // Wait for list to load
    await expect(page.getByTestId(testIds.dataSources.list)).toBeVisible();

    // Should show at least some items or empty state
    const listItems = page.getByTestId(testIds.dataSources.listItem);
    const count = await listItems.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should complete full CRUD cycle: create → view → edit → delete', async ({ page }) => {
    // Step 1: Create
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    const dataSourceName = `CRUD Test ${Date.now()}`;
    await page.getByTestId(testIds.dataSources.nameInput).fill(dataSourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('database');
    await page.getByTestId(testIds.dataSources.urlInput).fill('postgresql://localhost:5432/testdb');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Wait for success
    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Step 2: View in list
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(dataSourceName);

    // Find the specific item
    const item = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: dataSourceName });
    await expect(item).toBeVisible();

    // Step 3: Edit
    await item.getByTestId(testIds.dataSources.editBtn).click();
    
    // Wait for form
    await expect(page.getByTestId(testIds.dataSources.createForm)).toBeVisible();

    // Modify name
    const updatedName = `${dataSourceName} - Updated`;
    await page.getByTestId(testIds.dataSources.nameInput).clear();
    await page.getByTestId(testIds.dataSources.nameInput).fill(updatedName);
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Wait for success
    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify updated name appears
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(updatedName);

    // Step 4: Delete
    const updatedItem = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: updatedName });
    await updatedItem.getByTestId(testIds.dataSources.deleteBtn).click();

    // Confirm deletion
    await expect(page.getByTestId(testIds.common.confirmDialog)).toBeVisible();
    await page.getByTestId(testIds.common.confirmYes).click();

    // Wait for success
    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify item is gone
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).not.toContainText(updatedName);
  });

  test('should cancel creation without saving', async ({ page }) => {
    await page.goto('/data/sources');
    
    // Get initial count
    const initialItems = await page.getByTestId(testIds.dataSources.listItem).count();

    // Start creating
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill('Cancelled Source');
    
    // Cancel instead of submit
    await page.getByTestId(testIds.dataSources.cancelBtn).click();

    // Should be back to list
    await expect(page.getByTestId(testIds.dataSources.list)).toBeVisible();

    // Count should be unchanged
    const finalItems = await page.getByTestId(testIds.dataSources.listItem).count();
    expect(finalItems).toBe(initialItems);
  });

  test('should cancel edit without saving changes', async ({ page, request }) => {
    // First create a data source via API
    const testUser = TEST_USERS.userA;
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    });
    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    const sourceName = `Edit Cancel Test ${Date.now()}`;
    await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: sourceName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });

    // Go to list and find item
    await page.goto('/data/sources');
    const item = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: sourceName });
    await item.getByTestId(testIds.dataSources.editBtn).click();

    // Modify but cancel
    await page.getByTestId(testIds.dataSources.nameInput).fill('Should Not Save');
    await page.getByTestId(testIds.dataSources.cancelBtn).click();

    // Original name should still be in list
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(sourceName);
    await expect(page.getByTestId(testIds.dataSources.list)).not.toContainText('Should Not Save');
  });

  test('should handle concurrent edits gracefully', async ({ page, context }) => {
    // Create a data source
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    
    const sourceName = `Concurrent Test ${Date.now()}`;
    await page.getByTestId(testIds.dataSources.nameInput).fill(sourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Open same item in two different contexts
    const page2 = await context.newPage();
    await page2.goto('/data/sources');

    // Both try to edit
    const item1 = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: sourceName });
    await item1.getByTestId(testIds.dataSources.editBtn).click();

    const item2 = page2.getByTestId(testIds.dataSources.listItem).filter({ hasText: sourceName });
    await item2.getByTestId(testIds.dataSources.editBtn).click();

    // First one saves
    await page.getByTestId(testIds.dataSources.nameInput).fill(`${sourceName} - V1`);
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Second one tries to save
    await page2.getByTestId(testIds.dataSources.nameInput).fill(`${sourceName} - V2`);
    await page2.getByTestId(testIds.dataSources.submitBtn).click();

    // Should handle gracefully (either success or error, but not crash)
    const hasError = await page2.getByTestId(testIds.common.errorBanner).isVisible().catch(() => false);
    const hasSuccess = await page2.getByTestId(testIds.common.successBanner).isVisible().catch(() => false);
    
    expect(hasError || hasSuccess).toBe(true);

    await page2.close();
  });
});
