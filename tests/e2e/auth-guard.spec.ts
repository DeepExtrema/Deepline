/**
 * E2E Tests: Auth Guard and Redirects
 * Tests protected routes and authentication guards
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Auth Guard and Redirects', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should redirect unauthenticated user to login from protected route', async ({ page }) => {
    // Try to access protected dashboard
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user to login from data sources', async ({ page }) => {
    await page.goto('/data/sources');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user to login from workflows', async ({ page }) => {
    await page.goto('/workflows');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow access to protected routes after login', async ({ page, request }) => {
    const testUser = TEST_USERS.userA;
    
    // Ensure user exists
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

    // Login
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Now try to access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();

    await page.goto('/data/sources');
    await expect(page).toHaveURL(/\/data\/sources/);
  });

  test('should redirect to originally requested URL after login', async ({ page, request }) => {
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

    // Try to access a protected route
    await page.goto('/workflows');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Login
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    // Should be redirected back to originally requested URL
    await page.waitForURL(/\/workflows/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/workflows/);
  });

  test('should not allow logged-in user to access login page', async ({ page, request }) => {
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

    // Login
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Try to access login page again
    await page.goto('/login');

    // Should be redirected to dashboard/home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should not allow logged-in user to access signup page', async ({ page, request }) => {
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

    // Login
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Try to access signup page
    await page.goto('/signup');

    // Should be redirected to dashboard/home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/signup/);
  });

  test('should clear auth state after logout', async ({ page, request }) => {
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

    // Login
    await page.goto('/login');
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Logout
    await page.getByTestId(testIds.auth.userMenu).click();
    await page.getByTestId(testIds.auth.logoutBtn).click();

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login again
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
