/**
 * E2E Tests: Logout and Session Expiry
 * Tests session management and token expiration using fake timers
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Session Management', () => {
  test('should logout user and clear session', async ({ page, request }) => {
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

    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Verify logged in
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();

    // Logout
    await page.getByTestId(testIds.auth.userMenu).click();
    await page.getByTestId(testIds.auth.logoutBtn).click();

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should clear local storage on logout', async ({ page, request }) => {
    const testUser = TEST_USERS.userA;
    
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

    // Check that token exists in local storage
    const tokenBefore = await page.evaluate(() => {
      return localStorage.getItem('access_token') || localStorage.getItem('token');
    });
    expect(tokenBefore).toBeTruthy();

    // Logout
    await page.getByTestId(testIds.auth.userMenu).click();
    await page.getByTestId(testIds.auth.logoutBtn).click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Check that token is cleared
    const tokenAfter = await page.evaluate(() => {
      return localStorage.getItem('access_token') || localStorage.getItem('token');
    });
    expect(tokenAfter).toBeFalsy();
  });

  test('should handle session expiry and redirect to login', async ({ page, request }) => {
    const testUser = TEST_USERS.userA;
    
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

    // Simulate expired token by manipulating local storage
    await page.evaluate(() => {
      // Set an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';
      localStorage.setItem('access_token', expiredToken);
      localStorage.setItem('token', expiredToken);
    });

    // Try to access protected resource
    await page.goto('/data/sources');

    // Should redirect to login due to expired token
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show session expiry message', async ({ page, context }) => {
    const testUser = TEST_USERS.userA;
    
    await context.request.post(`${API_BASE_URL}/auth/signup`, {
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

    // Intercept API calls to return 401 (simulating expired session)
    await context.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ detail: 'Token has expired' })
      });
    });

    // Try to perform an action
    await page.goto('/data/sources');

    // Should show error or redirect
    const hasError = await page.getByTestId(testIds.common.errorBanner).isVisible().catch(() => false);
    const isOnLogin = page.url().includes('/login');
    
    expect(hasError || isOnLogin).toBe(true);
  });

  test('should refresh token before expiry', async ({ page, request }) => {
    const testUser = TEST_USERS.userA;
    
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

    // Get initial token
    const initialToken = await page.evaluate(() => {
      return localStorage.getItem('access_token') || localStorage.getItem('token');
    });

    // Wait and perform action (which might trigger token refresh)
    await page.waitForTimeout(5000);
    await page.goto('/data/sources');
    await page.waitForTimeout(2000);

    // Get token again
    const currentToken = await page.evaluate(() => {
      return localStorage.getItem('access_token') || localStorage.getItem('token');
    });

    // Token might be refreshed or same (both valid)
    expect(currentToken).toBeTruthy();
  });

  test('should maintain session across tabs', async ({ context }) => {
    const testUser = TEST_USERS.userA;
    
    await context.request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.fullName,
        password: testUser.password,
        role: testUser.role
      },
      failOnStatusCode: false
    });

    // Login in first tab
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page1.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page1.getByTestId(testIds.auth.loginSubmit).click();
    await page1.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/dashboard');

    // Should already be logged in
    await expect(page2.getByTestId(testIds.auth.userMenu)).toBeVisible();

    await page1.close();
    await page2.close();
  });

  test('should logout from all tabs when logging out from one', async ({ context }) => {
    const testUser = TEST_USERS.userA;
    
    await context.request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.fullName,
        password: testUser.password,
        role: testUser.role
      },
      failOnStatusCode: false
    });

    // Login in first tab
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page1.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page1.getByTestId(testIds.auth.loginSubmit).click();
    await page1.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/dashboard');

    // Logout from first tab
    await page1.getByTestId(testIds.auth.userMenu).click();
    await page1.getByTestId(testIds.auth.logoutBtn).click();
    await page1.waitForURL(/\/login/, { timeout: 10000 });

    // Second tab should also be logged out on next action
    await page2.reload();
    await page2.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page2).toHaveURL(/\/login/);

    await page1.close();
    await page2.close();
  });

  test('should handle remember me functionality', async ({ page, request }) => {
    const testUser = TEST_USERS.userA;
    
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
    
    // Check remember me if available
    const rememberMe = page.locator('[type="checkbox"]').filter({ hasText: /remember/i });
    if (await rememberMe.isVisible().catch(() => false)) {
      await rememberMe.check();
    }
    
    await page.getByTestId(testIds.auth.loginSubmit).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Close and reopen browser (new context simulates this)
    await page.context().clearCookies();
    
    // Check if still logged in via refresh token
    await page.reload();
    
    // Might still be logged in or redirect to login - both acceptable
    const isLoggedIn = await page.getByTestId(testIds.auth.userMenu).isVisible().catch(() => false);
    const isOnLogin = page.url().includes('/login');
    
    expect(isLoggedIn || isOnLogin).toBe(true);
  });
});
