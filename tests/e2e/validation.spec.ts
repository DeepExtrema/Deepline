/**
 * E2E Tests: Validation and Error UX
 * Tests form validation and error handling
 */

import { test, expect } from '@playwright/test';
import testIds from '../../contracts/ui-test-ids.json';
import { TEST_USERS } from '../../scripts/seed-test-env';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Validation and Error UX', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.context().clearCookies();

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
  });

  test('should show validation error for empty required fields', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    // Submit without filling any fields
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should show validation errors
    await expect(page.getByTestId(testIds.dataSources.validationError)).toBeVisible();
  });

  test('should validate name field is not empty', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    // Fill only type and URL, leave name empty
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should show validation error
    await expect(page.getByTestId(testIds.dataSources.validationError)).toBeVisible();
  });

  test('should validate URL format for API sources', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    await page.getByTestId(testIds.dataSources.nameInput).fill('Test Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('not-a-valid-url');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should show validation error
    await expect(page.getByTestId(testIds.dataSources.validationError)).toBeVisible();
  });

  test('should show error for duplicate names', async ({ page, request }) => {
    const sourceName = `Duplicate Test ${Date.now()}`;
    
    // Create first source via UI
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill(sourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    await expect(page.getByTestId(testIds.common.successBanner)).toBeVisible();

    // Try to create another with same name
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill(sourceName);
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api2.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should show error
    await expect(page.getByTestId(testIds.common.errorBanner)).toBeVisible();
  });

  test('should show inline validation errors as user types', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    // Type invalid URL
    await page.getByTestId(testIds.dataSources.nameInput).fill('Test');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('invalid');
    
    // Blur to trigger validation
    await page.getByTestId(testIds.dataSources.nameInput).click();

    // Should show inline validation error
    await expect(page.getByTestId(testIds.dataSources.validationError)).toBeVisible();
  });

  test('should clear validation errors when corrected', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();

    // Submit empty form to trigger errors
    await page.getByTestId(testIds.dataSources.submitBtn).click();
    await expect(page.getByTestId(testIds.dataSources.validationError)).toBeVisible();

    // Fill fields correctly
    await page.getByTestId(testIds.dataSources.nameInput).fill('Valid Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');

    // Errors should be cleared
    await expect(page.getByTestId(testIds.dataSources.validationError)).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Simulate API error by intercepting request
    await context.route('**/data/sources', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });

    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill('Test Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should show error message
    await expect(page.getByTestId(testIds.common.errorBanner)).toBeVisible();
    await expect(page.getByTestId(testIds.common.errorBanner)).toContainText(/error|failed/i);
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    
    await page.getByTestId(testIds.dataSources.nameInput).fill('Test Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');

    // Click submit and immediately check for loading state
    const submitPromise = page.getByTestId(testIds.dataSources.submitBtn).click();
    
    // Loading spinner should appear
    await expect(page.getByTestId(testIds.common.loadingSpinner)).toBeVisible();
    
    await submitPromise;
  });

  test('should disable submit button during submission', async ({ page }) => {
    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    
    await page.getByTestId(testIds.dataSources.nameInput).fill('Test Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');

    const submitBtn = page.getByTestId(testIds.dataSources.submitBtn);
    await submitBtn.click();
    
    // Button should be disabled during submission
    await expect(submitBtn).toBeDisabled();
  });

  test('should handle network timeout gracefully', async ({ page, context }) => {
    // Simulate network timeout
    await context.route('**/data/sources', route => {
      // Delay response indefinitely to simulate timeout
      return new Promise(() => {});
    });

    await page.goto('/data/sources');
    await page.getByTestId(testIds.dataSources.createBtn).click();
    await page.getByTestId(testIds.dataSources.nameInput).fill('Test Source');
    await page.getByTestId(testIds.dataSources.typeSelect).selectOption('api');
    await page.getByTestId(testIds.dataSources.urlInput).fill('https://api.example.com');
    await page.getByTestId(testIds.dataSources.submitBtn).click();

    // Should eventually show timeout error
    await expect(page.getByTestId(testIds.common.errorBanner)).toBeVisible({ timeout: 15000 });
  });

  test('should validate email format in signup', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/signup');

    await page.getByTestId(testIds.auth.signupUsername).fill('testuser');
    await page.getByTestId(testIds.auth.signupEmail).fill('invalid-email');
    await page.getByTestId(testIds.auth.signupFullName).fill('Test User');
    await page.getByTestId(testIds.auth.signupPassword).fill('Password123!');
    await page.getByTestId(testIds.auth.signupRole).selectOption('viewer');
    await page.getByTestId(testIds.auth.signupSubmit).click();

    // Should show validation error
    await expect(page.getByTestId(testIds.auth.signupError)).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/signup');

    await page.getByTestId(testIds.auth.signupUsername).fill('testuser');
    await page.getByTestId(testIds.auth.signupEmail).fill('test@example.com');
    await page.getByTestId(testIds.auth.signupFullName).fill('Test User');
    await page.getByTestId(testIds.auth.signupPassword).fill('weak');  // Too short/weak
    await page.getByTestId(testIds.auth.signupRole).selectOption('viewer');
    await page.getByTestId(testIds.auth.signupSubmit).click();

    // Should show validation error
    await expect(page.getByTestId(testIds.auth.signupError)).toBeVisible();
  });
});
