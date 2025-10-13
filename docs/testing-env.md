# Testing Environment Guide

This guide explains how to set up and run tests locally and in CI for the Sherlock project.

## Overview

The testing infrastructure includes:
- **Docker Compose CI**: Containerized test dependencies (PostgreSQL, MongoDB, Redis, Kafka)
- **Testcontainers**: Isolated integration test environments
- **Playwright**: End-to-end UI tests
- **Vitest**: Integration tests
- **Seed Script**: Idempotent test data seeding

## Prerequisites

### Local Development
- Node.js 18+ and npm
- Docker and Docker Compose
- TypeScript (`npm install -g typescript`)

### CI Environment
- Docker and Docker Compose
- Node.js environment

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Test Environment

This command starts all required services and seeds the test database:

```bash
npm run test:setup
```

This will:
1. Start Docker Compose services (MongoDB, PostgreSQL, Redis, Kafka)
2. Wait for all services to be healthy
3. Run the seed script to populate test data
4. Install Playwright browsers

### 3. Run Tests

#### Run All Tests
```bash
npm test
```

#### Run E2E Tests Only
```bash
npm run test:e2e
```

#### Run Integration Tests Only
```bash
npm run test:integration
```

## Test Environment Components

### Docker Compose CI (`docker-compose.ci.yml`)

Provides containerized services for testing:

- **PostgreSQL**: Test database on port 5432
  - User: `testuser`
  - Password: `testpass`
  - Database: `sherlock_test`

- **MongoDB**: Document store on port 27017
  - User: `testuser`
  - Password: `testpass`
  - Database: `sherlock_test`

- **Redis**: Cache and queue on port 6379
  - No authentication for test environment

- **Kafka**: Message broker on port 9092
  - Single broker configuration
  - Auto-create topics enabled

All services include health checks and use tmpfs for fast I/O.

### Test Data Seeder (`scripts/seed-test-env.ts`)

An idempotent seeder that creates:

1. **Admin User**
   - Username: `admin`
   - Email: `admin@test.com`
   - Password: `admin123`
   - Role: `admin`

2. **Test User**
   - Username: `testuser`
   - Email: `test@test.com`
   - Password: `test123`
   - Role: `user`

3. **Sample Dataset**
   - Name: `test-dataset`
   - 5 rows with columns: id, name, value, category

4. **Sample Workflow**
   - Name: `test-workflow`
   - Basic load and analyze steps

The seeder is **idempotent** - running it multiple times won't create duplicates.

### Testcontainers Configuration

For integration tests that need isolated environments, use Testcontainers:

```typescript
import {
  startTestContainers,
  stopTestContainers,
  getConnectionUrls
} from '../testcontainers.config';

describe('My Integration Test', () => {
  let containers;

  beforeAll(async () => {
    containers = await startTestContainers();
  }, 60000);

  afterAll(async () => {
    await stopTestContainers(containers);
  });

  it('should test with isolated containers', async () => {
    const urls = getConnectionUrls(containers);
    // Use urls.mongodb, urls.redis, urls.postgres
  });
});
```

## Running Tests Locally

### Start Services Manually

```bash
docker compose -f docker-compose.ci.yml up -d
```

### Check Service Health

```bash
docker compose -f docker-compose.ci.yml ps
```

All services should show "healthy" status.

### Seed Test Data

```bash
npm run seed:test
```

### Run E2E Tests with UI

```bash
npx playwright test --ui
```

### Run Integration Tests with Coverage

```bash
npm run test:integration -- --coverage
```

### Stop Services

```bash
docker compose -f docker-compose.ci.yml down -v
```

The `-v` flag removes volumes for a clean state.

## Running Tests in CI

The CI pipeline should:

1. **Setup Phase**
   ```bash
   npm run test:setup
   ```

2. **Test Phase**
   ```bash
   npm test
   ```

3. **Teardown Phase** (optional, CI usually handles this)
   ```bash
   docker compose -f docker-compose.ci.yml down -v
   ```

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test environment
        run: npm run test:setup
        
      - name: Run tests
        run: npm test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            playwright-report/
            coverage/
```

## Environment Variables

### Test Environment Variables

```bash
# MongoDB
MONGO_URL=mongodb://testuser:testpass@localhost:27017
MONGO_DB_NAME=sherlock_test

# PostgreSQL
POSTGRES_URL=postgresql://testuser:testpass@localhost:5432/sherlock_test

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Base URL for E2E tests
BASE_URL=http://localhost:3000
```

## Troubleshooting

### Services won't start

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check for port conflicts:
   ```bash
   lsof -i :5432 -i :6379 -i :27017 -i :9092
   ```

3. Clean up old containers:
   ```bash
   docker compose -f docker-compose.ci.yml down -v
   docker system prune -f
   ```

### Tests timeout

1. Increase test timeout in `vitest.config.ts`:
   ```typescript
   testTimeout: 120000, // 2 minutes
   ```

2. Increase Playwright timeout in `playwright.config.ts`:
   ```typescript
   timeout: 60000, // 1 minute per test
   ```

### Seed script fails

1. Ensure MongoDB is healthy:
   ```bash
   docker compose -f docker-compose.ci.yml ps mongo-test
   ```

2. Check MongoDB logs:
   ```bash
   docker compose -f docker-compose.ci.yml logs mongo-test
   ```

3. Test connection manually:
   ```bash
   mongosh mongodb://testuser:testpass@localhost:27017/sherlock_test
   ```

### Playwright browser not found

```bash
npx playwright install --with-deps chromium
```

## Best Practices

### 1. Isolation
- Each test should be independent
- Use unique test data identifiers
- Clean up after tests

### 2. Idempotency
- Tests should produce the same results when run multiple times
- Use upserts instead of inserts in seed scripts
- Clear state between test runs

### 3. Performance
- Use tmpfs for test databases
- Run tests in parallel when possible
- Skip Playwright browser downloads in pure backend tests

### 4. CI Optimization
- Cache node_modules
- Use test:setup only once per pipeline
- Reuse containers across test suites

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
