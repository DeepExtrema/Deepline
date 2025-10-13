/**
 * E2E Tests: Authentication Flow
 * Tests signup and login functionality
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Authentication Flow', () => {
  // Use a fresh browser context for each test
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('should successfully signup a new user', async ({ page, request }) => {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      fullName: 'Test User Signup',
      password: 'TestPassword123!',
      role: 'viewer'
    };

    // Navigate to signup page
    await page.goto('/signup');

    // Wait for form to be visible
    await expect(page.getByTestId(testIds.auth.signupForm)).toBeVisible();

    // Fill signup form using test IDs
    await page.getByTestId(testIds.auth.signupUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.signupEmail).fill(testUser.email);
    await page.getByTestId(testIds.auth.signupFullName).fill(testUser.fullName);
    await page.getByTestId(testIds.auth.signupPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.signupRole).selectOption(testUser.role);

    // Submit form
    await page.getByTestId(testIds.auth.signupSubmit).click();

    // Wait for navigation or success message
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Verify user is logged in (e.g., user menu is visible)
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();
  });

  test('should show validation errors on invalid signup', async ({ page }) => {
    await page.goto('/signup');

    // Submit empty form
    await page.getByTestId(testIds.auth.signupSubmit).click();

    // Check for validation errors
    await expect(page.getByTestId(testIds.auth.signupError)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page, request }) => {
    // First, ensure user exists via API
    const testUser = TEST_USERS.userA;
    
    await request.post(`${API_BASE_URL}/auth/signup`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.fullName,
        password: testUser.password,
        role: testUser.role
      },
      failOnStatusCode: false // User might already exist
    });

    // Navigate to login page
    await page.goto('/login');

    // Wait for form to be visible
    await expect(page.getByTestId(testIds.auth.loginForm)).toBeVisible();

    // Fill login form
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);

    // Submit form
    await page.getByTestId(testIds.auth.loginSubmit).click();

    // Wait for successful navigation
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Verify user is logged in
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();
  });

  test('should show error on invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.getByTestId(testIds.auth.loginUsername).fill('invaliduser');
    await page.getByTestId(testIds.auth.loginPassword).fill('wrongpassword');

    // Submit form
    await page.getByTestId(testIds.auth.loginSubmit).click();

    // Check for error message
    await expect(page.getByTestId(testIds.auth.loginError)).toBeVisible();
    await expect(page.getByTestId(testIds.auth.loginError)).toContainText(/incorrect|invalid|failed/i);
  });

  test('should complete full signup -> login flow', async ({ page, request }) => {
    const testUser = {
      username: `flowtest_${Date.now()}`,
      email: `flowtest_${Date.now()}@example.com`,
      fullName: 'Flow Test User',
      password: 'FlowTest123!',
      role: 'data_engineer'
    };

    // Step 1: Signup
    await page.goto('/signup');
    await page.getByTestId(testIds.auth.signupUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.signupEmail).fill(testUser.email);
    await page.getByTestId(testIds.auth.signupFullName).fill(testUser.fullName);
    await page.getByTestId(testIds.auth.signupPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.signupRole).selectOption(testUser.role);
    await page.getByTestId(testIds.auth.signupSubmit).click();

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Step 2: Logout
    await page.getByTestId(testIds.auth.userMenu).click();
    await page.getByTestId(testIds.auth.logoutBtn).click();

    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Step 3: Login again
    await page.getByTestId(testIds.auth.loginUsername).fill(testUser.username);
    await page.getByTestId(testIds.auth.loginPassword).fill(testUser.password);
    await page.getByTestId(testIds.auth.loginSubmit).click();

    // Verify successful login
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();
  });

  test('should maintain session across page reloads', async ({ page, request }) => {
    // Login first
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

    // Reload page
    await page.reload();

    // Verify still logged in
    await expect(page.getByTestId(testIds.auth.userMenu)).toBeVisible();
  });
});
