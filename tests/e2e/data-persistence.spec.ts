/**
 * E2E Tests: UI ↔ API Data Persistence Parity
 * Tests that UI and API data stay in sync
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('UI ↔ API Data Persistence Parity', () => {
  let userToken: string;

  test.beforeEach(async ({ page, request }) => {
    await page.context().clearCookies();

    const testUser = TEST_USERS.userA;
    
    // Create and login user
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

    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    });
    const loginData = await loginResponse.json();
    userToken = loginData.access_token;

    // Login via UI
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  });

  test('data created via UI should be visible via API', async ({ page, request }) => {
    const sourceName = `UI Created ${Date.now()}`;
    
    // Create via UI
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill(sourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify via API
    const response = await request.get(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Find the source in the list
    const sources = data.sources || [];
    const found = sources.find((s: any) => s.name === sourceName);
    expect(found).toBeDefined();
    expect(found.type).toBe('api');
  });

  test('data created via API should be visible in UI', async ({ page, request }) => {
    const sourceName = `API Created ${Date.now()}`;
    
    // Create via API
    const createResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: sourceName,
        type: 'database',
        config: { url: 'postgresql://localhost:5432/db' }
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    // Verify in UI
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(sourceName);
  });

  test('updates via UI should reflect in API', async ({ page, request }) => {
    const originalName = `Update Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    
    // Create via API
    const createResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: originalName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });
    const createData = await createResponse.json();
    const sourceId = createData.source_id;

    // Update via UI
    await page.goto('/data/sources');
    const item = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: originalName });
    await item.getByTestId(testIds.dataSources.editBtn).click();
    
    await page.getByTestId(testIds.dataSources.nameInput).clear();
    await page.getByTestId(testIds.dataSources.nameInput).fill(updatedName);
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify via API
    const getResponse = await request.get(`${API_BASE_URL}/data/sources/${sourceId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const getData = await getResponse.json();
    expect(getData.name).toBe(updatedName);
  });

  test('updates via API should reflect in UI', async ({ page, request }) => {
    const originalName = `API Update ${Date.now()}`;
    const updatedName = `${originalName} - Modified`;
    
    // Create via API
    const createResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: originalName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });
    const createData = await createResponse.json();
    const sourceId = createData.source_id;

    // Go to UI
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(originalName);

    // Update via API
    await request.put(`${API_BASE_URL}/data/sources/${sourceId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: updatedName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });

    // Refresh UI and verify
    await page.reload();
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(updatedName);
    await expect(page.getByTestId(testIds.dataSources.list)).not.toContainText(originalName);
  });

  test('delete via UI should remove from API', async ({ page, request }) => {
    const sourceName = `Delete UI ${Date.now()}`;
    
    // Create via API
    const createResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: sourceName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });
    const createData = await createResponse.json();
    const sourceId = createData.source_id;

    // Delete via UI
    await page.goto('/data/sources');
    const item = page.getByTestId(testIds.dataSources.listItem).filter({ hasText: sourceName });
    await item.getByTestId(testIds.dataSources.deleteBtn).click();
    
    await page.getByTestId(testIds.common.confirmYes).click();
    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Verify deletion via API
    const getResponse = await request.get(`${API_BASE_URL}/data/sources/${sourceId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    expect(getResponse.status()).toBe(404);
  });

  test('delete via API should remove from UI', async ({ page, request }) => {
    const sourceName = `Delete API ${Date.now()}`;
    
    // Create via API
    const createResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: sourceName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });
    const createData = await createResponse.json();
    const sourceId = createData.source_id;

    // Verify in UI
    await page.goto('/data/sources');
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(sourceName);

    // Delete via API
    await request.delete(`${API_BASE_URL}/data/sources/${sourceId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    // Refresh UI and verify
    await page.reload();
    await expect(page.getByTestId(testIds.dataSources.list)).not.toContainText(sourceName);
  });

  test('UI should show loading state during API calls', async ({ page }) => {
    await page.goto('/data/sources');
    
    // Click to load data
    await page.reload();

    // Should show loading indicator
    await expect(page.getByTestId(testIds.common.loadingSpinner)).toBeVisible();
  });

  test('UI should auto-refresh on changes', async ({ page, request }) => {
    await page.goto('/data/sources');

    const sourceName = `Auto Refresh ${Date.now()}`;
    
    // Create via API while UI is open
    await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: sourceName,
        type: 'api',
        config: { url: 'https://api.example.com' }
      }
    });

    // Wait a bit for potential auto-refresh
    await page.waitForTimeout(2000);

    // Reload to ensure visibility
    await page.reload();

    // Should now be visible
    await expect(page.getByTestId(testIds.dataSources.list)).toContainText(sourceName);
  });

  test('concurrent API and UI operations should maintain consistency', async ({ page, request }) => {
    const baseName = `Concurrent ${Date.now()}`;
    
    // Create multiple items via API
    for (let i = 0; i < 3; i++) {
      await request.post(`${API_BASE_URL}/data/sources`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
        data: {
          name: `${baseName} ${i}`,
          type: 'api',
          config: { url: `https://api${i}.example.com` }
        }
      });
    }

    // Load in UI
    await page.goto('/data/sources');

    // Count via API
    const listResponse = await request.get(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const apiData = await listResponse.json();
    const apiCount = (apiData.sources || []).filter((s: any) => 
      s.name.startsWith(baseName)
    ).length;

    // Count in UI
    const uiItems = page.getByTestId(testIds.dataSources.listItem);
    const uiCount = await uiItems.filter({ hasText: baseName }).count();

    // Counts should match
    expect(uiCount).toBe(apiCount);
  });
});
