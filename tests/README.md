# E2E Test Suite

This directory contains end-to-end tests for the Sherlock Multiagent Data Scientist platform using Playwright.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

### Test Specs
- `auth.spec.ts` - Authentication (signup, login)
- `auth-guard.spec.ts` - Route protection and redirects
- `crud.spec.ts` - Create, read, update, delete operations
- `validation.spec.ts` - Form validation and error handling
- `authz.spec.ts` - Authorization and access control
- `data-persistence.spec.ts` - UI ↔ API data consistency
- `session.spec.ts` - Logout and session management

### Supporting Files
- `../contracts/ui-test-ids.json` - Test ID selectors
- `../scripts/seed-test-env.ts` - Test data seeding utilities
- `../playwright.config.ts` - Playwright configuration
- `../reports/e2e-coverage.md` - Coverage documentation

## Test Patterns

### Using Test IDs
```typescript
import testIds from '../../contracts/ui-test-ids.json';

// Good - use data-testid
await page.getByTestId(testIds.auth.loginUsername).fill('user');

// Bad - don't use text or CSS selectors
await page.locator('input[name="username"]').fill('user');
```

### Browser Context
Each test gets a fresh browser context:
```typescript
test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});
```

### API Requests
Use the request fixture for API calls:
```typescript
test('should create via API', async ({ request }) => {
  const response = await request.post('/api/endpoint', {
    data: { ... }
  });
  expect(response.ok()).toBeTruthy();
});
```

### Seeded Test Users
```typescript
import { TEST_USERS } from '../../scripts/seed-test-env';

const testUser = TEST_USERS.userA; // admin role
const viewer = TEST_USERS.userB;   // viewer role
```

## Environment Variables

```bash
# API endpoint
export API_BASE_URL=http://localhost:8000

# UI endpoint
export BASE_URL=http://localhost:3000

# CI mode
export CI=true
```

## CI Configuration

Tests are optimized for CI environments:
- 1 retry on failure
- Single worker for stability
- Artifacts (screenshots, videos, traces) on failure
- Multiple report formats (HTML, JSON, JUnit)

## Debugging

### Debug Mode
```bash
# Open Playwright Inspector
npm run test:e2e:debug

# Run specific test
npx playwright test tests/e2e/auth.spec.ts --debug
```

### View Traces
```bash
# Generate and view trace
npx playwright show-trace test-results/.../trace.zip
```

### Screenshots and Videos
Automatically captured on failure in `test-results/artifacts/`

## Best Practices

1. **No Fixed Sleeps** - Use `await` and Playwright's auto-wait
2. **Isolated Tests** - Each test should be independent
3. **Clean State** - Clear cookies/storage between tests
4. **Meaningful Names** - Test names should describe what they test
5. **Error Messages** - Use descriptive assertions
6. **Test IDs** - Always use data-testid attributes

## Troubleshooting

### Timeouts
- Increase timeout in `playwright.config.ts`
- Check if services are running
- Verify network connectivity

### Flaky Tests
- Check for race conditions
- Ensure proper waits for elements
- Verify test isolation

### Element Not Found
- Verify test ID exists in UI
- Check contracts/ui-test-ids.json
- Use Playwright Inspector to debug selectors

## Contributing

When adding new tests:
1. Follow existing patterns
2. Add test IDs to contracts/ui-test-ids.json
3. Update e2e-coverage.md
4. Test locally before committing
5. Ensure tests pass in CI

## Coverage Report

See `../reports/e2e-coverage.md` for detailed coverage information.

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test logs and traces
- Consult team documentation
