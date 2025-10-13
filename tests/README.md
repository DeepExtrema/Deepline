# Tests

This directory contains test suites for the Sherlock project.

## Structure

```
tests/
├── e2e/                    # End-to-end tests with Playwright
│   └── sample.spec.ts      # Sample E2E test
├── integration/            # Integration tests with Vitest
│   └── sample.test.ts      # Sample integration test
├── testcontainers.config.ts # Testcontainers setup
└── README.md
```

## Running Tests

### All Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

### Watch Mode (Integration)
```bash
npm run test:integration:watch
```

## Writing Tests

### E2E Tests (Playwright)

Place files in `tests/e2e/` with `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test';

test('should load page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
```

### Integration Tests (Vitest)

Place files in `tests/integration/` with `.test.ts` extension:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### Using Testcontainers

For isolated integration tests:

```typescript
import {
  startTestContainers,
  stopTestContainers,
  getConnectionUrls
} from '../testcontainers.config';

describe('Integration Test', () => {
  let containers;

  beforeAll(async () => {
    containers = await startTestContainers();
  }, 60000);

  afterAll(async () => {
    await stopTestContainers(containers);
  });

  it('should use containers', async () => {
    const urls = getConnectionUrls(containers);
    // Use urls.mongodb, urls.redis, urls.postgres
  });
});
```

## Configuration

- **Playwright**: `playwright.config.ts` in root
- **Vitest**: `vitest.config.ts` in root
- **Testcontainers**: `tests/testcontainers.config.ts`

See [docs/testing-env.md](../docs/testing-env.md) for complete documentation.
