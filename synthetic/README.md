# Synthetic Monitoring Tests

This directory contains synthetic canary tests for monitoring the health and functionality of the Sherlock Multi-Agent Data Scientist dashboard.

## Purpose

Synthetic tests are automated end-to-end tests that run on a schedule (every 6 hours) to:
- Verify the dashboard loads correctly
- Check that all UI components are functional
- Monitor system health indicators
- Detect issues before users encounter them

## Structure

```
synthetic/
├── checks/
│   └── login-view-logout.spec.ts  # Main synthetic canary test
└── README.md                       # This file
```

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npm run playwright:install
```

### Run Tests

```bash
# Run all synthetic tests
npm run test:synthetic

# Run with UI mode (interactive debugging)
npm run test:synthetic:ui

# Run in headed mode (see browser)
npm run test:synthetic:headed
```

## Test Philosophy

These tests follow the **A8 Synthetic Canary** approach:

1. **Read-Only**: Tests never mutate production data
2. **Dedicated Tenant**: Uses a separate test tenant
3. **Fast**: Completes in under 2 minutes
4. **Reliable**: No flaky tests - tests fail only when there's a real issue
5. **Actionable**: Failures provide clear traces and screenshots

## Monitored Checks

The synthetic tests verify:

- ✅ Dashboard loads within 10 seconds
- ✅ DEEPLINE brand/header is visible
- ✅ System status indicators are present
- ✅ All 4 agent navigation tabs work (Orchestrator, EDA, Refinery, ML)
- ✅ Console panel is functional
- ✅ Workflows panel displays correctly
- ✅ Datasets panel displays correctly
- ✅ Background processes panel shows status
- ✅ Health status indicators for agents
- ✅ Page refresh works correctly

## Scheduled Execution

Tests run automatically via GitHub Actions:

- **Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Workflow**: `.github/workflows/synthetic.yml`
- **Notifications**: Slack/webhook on failure (see `/reports/synthetic-integration.md`)

## On Test Failure

When a test fails:

1. **Artifacts are uploaded** to GitHub Actions (trace.zip)
2. **Notifications are sent** via Slack/webhook (if configured)
3. **Traces can be viewed** using Playwright Trace Viewer:

```bash
# Download trace.zip from GitHub Actions artifacts
npx playwright show-trace trace.zip
```

## Adding New Tests

When adding new synthetic tests:

1. Create a new `.spec.ts` file in `checks/`
2. Follow the naming convention: `{feature}-{action}.spec.ts`
3. Keep tests **read-only** - no data mutations
4. Add clear comments documenting what's being tested
5. Use explicit waits and timeouts
6. Test locally before committing

Example:

```typescript
import { test, expect } from '@playwright/test';

test.describe('New Feature Check', () => {
  test('should verify new feature works', async ({ page }) => {
    await page.goto('/');
    // Add test steps...
  });
});
```

## Troubleshooting

### Tests fail locally but pass in CI

- Check backend services are running: `docker-compose up -d`
- Verify dashboard is accessible: `curl http://localhost:3000`
- Check for port conflicts

### Tests are flaky

- Increase timeouts in test configuration
- Add explicit wait conditions: `await expect(element).toBeVisible()`
- Check for race conditions in the application

### Playwright browsers not installed

```bash
npm run playwright:install
```

## Documentation

For detailed documentation, see:
- [Synthetic Integration Guide](/reports/synthetic-integration.md) - Webhook setup, alerts, metrics
- [Playwright Config](../playwright.config.ts) - Test configuration
- [GitHub Workflow](../.github/workflows/synthetic.yml) - CI/CD setup

## Support

For issues or questions:
1. Check the [Synthetic Integration Guide](/reports/synthetic-integration.md)
2. Review traces from failed runs
3. Open a GitHub issue with tag `synthetic-canary`
