/**
 * E2E Tests: Authorization
 * Tests that user B is blocked from accessing user A's resources
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Authorization - Resource Access Control', () => {
  let userASourceId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create users and a data source owned by user A
    const userA = TEST_USERS.userA;
    
    // Create user A
    await request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: userA.username,
        email: userA.email,
        full_name: userA.fullName,
        password: userA.password,
        role: userA.role
      },
      failOnStatusCode: false
    });

    // Login as user A
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: userA.username,
        password: userA.password
      }
    });
    const loginData = await loginResponse.json();
    const tokenA = loginData.access_token;

    // Create a data source owned by user A
    const sourceResponse = await request.post(`${API_BASE_URL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
      data: {
        name: `User A Private Source ${Date.now()}`,
        type: 'api',
        config: { url: 'https://usera.example.com/api' }
      }
    });

    if (sourceResponse.ok()) {
      const sourceData = await sourceResponse.json();
      userASourceId = sourceData.source_id;
    }

    // Create user B
    const userB = TEST_USERS.userB;
    await request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: userB.username,
        email: userB.email,
        full_name: userB.fullName,
        password: userB.password,
        role: userB.role
      },
      failOnStatusCode: false
    });
  });

  test('user B should not see user A\'s resources in list', async ({ page, request }) => {
    const userB = TEST_USERS.userB;

    // Login as user B
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(userB.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(userB.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Navigate to data sources
    await page.goto('/data/sources');

    // User A's source should not be visible
    await expect(page.getByTestId(testIds.dataSources.list)).not.toContainText('User A Private Source');
  });

  test('user B should get 403 when trying to access user A\'s resource directly', async ({ request }) => {
    if (!userASourceId) {
      test.skip();
      return;
    }

    const userB = TEST_USERS.userB;

    // Login as user B
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: userB.username,
        password: userB.password
      }
    });
    const loginData = await loginResponse.json();
    const tokenB = loginData.access_token;

    // Try to access user A's resource
    const response = await request.get(`${API_BASE_URL}/data/sources/${userASourceId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    // Should be forbidden
    expect(response.status()).toBe(403);
  });

  test('user B should not be able to edit user A\'s resource', async ({ request }) => {
    if (!userASourceId) {
      test.skip();
      return;
    }

    const userB = TEST_USERS.userB;

    // Login as user B
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: userB.username,
        password: userB.password
      }
    });
    const loginData = await loginResponse.json();
    const tokenB = loginData.access_token;

    // Try to update user A's resource
    const response = await request.put(`${API_BASE_URL}/data/sources/${userASourceId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
      data: {
        name: 'Hacked Name',
        type: 'api',
        config: { url: 'https://hacker.com' }
      }
    });

    // Should be forbidden
    expect(response.status()).toBe(403);
  });

  test('user B should not be able to delete user A\'s resource', async ({ request }) => {
    if (!userASourceId) {
      test.skip();
      return;
    }

    const userB = TEST_USERS.userB;

    // Login as user B
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: userB.username,
        password: userB.password
      }
    });
    const loginData = await loginResponse.json();
    const tokenB = loginData.access_token;

    // Try to delete user A's resource
    const response = await request.delete(`${API_BASE_URL}/data/sources/${userASourceId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    // Should be forbidden
    expect(response.status()).toBe(403);
  });

  test('user A should still be able to access their own resource', async ({ request }) => {
    if (!userASourceId) {
      test.skip();
      return;
    }

    const userA = TEST_USERS.userA;

    // Login as user A
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: userA.username,
        password: userA.password
      }
    });
    const loginData = await loginResponse.json();
    const tokenA = loginData.access_token;

    // Access own resource
    const response = await request.get(`${API_BASE_URL}/data/sources/${userASourceId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });

    // Should be successful
    expect(response.ok()).toBeTruthy();
  });

  test('viewer role should not be able to create resources', async ({ page }) => {
    const userB = TEST_USERS.userB; // viewer role

    // Login as user B (viewer)
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(userB.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(userB.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Navigate to data sources
    await page.goto('/data/sources');

    // Create button should not be visible or should be disabled
    const createBtn = page.getByTestId(testIds.dataSources.createBtn);
    const isVisible = await createBtn.isVisible().catch(() => false);
    
    if (isVisible) {
      // If visible, should be disabled
      await expect(createBtn).toBeDisabled();
    } else {
      // Should not be visible at all
      await expect(createBtn).not.toBeVisible();
    }
  });

  test('admin role should be able to access all resources', async ({ request }) => {
    if (!userASourceId) {
      test.skip();
      return;
    }

    // Create an admin user
    const adminUser = {
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.com`,
      password: 'AdminPass123!',
      role: 'admin'
    };

    await request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: adminUser.username,
        email: adminUser.email,
        full_name: 'Admin User',
        password: adminUser.password,
        role: adminUser.role
      }
    });

    // Login as admin
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: adminUser.username,
        password: adminUser.password
      }
    });
    const loginData = await loginResponse.json();
    const adminToken = loginData.access_token;

    // Admin should be able to access user A's resource
    const response = await request.get(`${API_BASE_URL}/data/sources/${userASourceId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // Should be successful
    expect(response.ok()).toBeTruthy();
  });

  test('should block cross-user workflow access', async ({ request }) => {
    const userA = TEST_USERS.userA;
    const userB = TEST_USERS.userB;

    // Login as user A and create a workflow
    const loginAResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { username: userA.username, password: userA.password }
    });
    const tokenA = (await loginAResponse.json()).access_token;

    const workflowResponse = await request.post(`${API_BASE_URL}/workflows/start`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
      data: {
        run_name: `User A Workflow ${Date.now()}`,
        tasks: [{ agent: 'eda', action: 'analyze', args: {} }]
      }
    });
    
    if (!workflowResponse.ok()) {
      test.skip();
      return;
    }

    const workflowData = await workflowResponse.json();
    const runId = workflowData.run_id;

    // Login as user B
    const loginBResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { username: userB.username, password: userB.password }
    });
    const tokenB = (await loginBResponse.json()).access_token;

    // User B tries to access user A's workflow
    const accessResponse = await request.get(`${API_BASE_URL}/runs/${runId}/status`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    // Should be forbidden
    expect(accessResponse.status()).toBe(403);
  });
});
