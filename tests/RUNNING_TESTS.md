# Running A6 Integration & Contract Tests

This guide explains how to run the test suite for the Sherlock Multi-Agent Data Scientist API.

## Prerequisites

### For All Tests
```bash
# Install dependencies
npm install
```

### For Contract Tests (Additional Requirements)
- API server running at `http://localhost:8001` (or custom URL via `API_BASE_URL` env var)
- Server must be healthy and responsive

## Quick Start

### Run All Integration Tests (No Server Required)
```bash
npm run test:integration
```

**Expected output:**
```
✓ tests/integration/validation-logic.test.ts (23 tests)
✓ tests/integration/transformation-logic.test.ts (19 tests)
Test Files  2 passed (2)
Tests  42 passed (42)
Duration  ~500ms
```

### Run DSL Schema Tests (No Server Required)
```bash
npx vitest run tests/contracts/dsl-schema.test.ts
```

**Expected output:**
```
✓ tests/contracts/dsl-schema.test.ts (18 tests)
Test Files  1 passed (1)
Tests  18 passed (18)
Duration  ~400ms
```

### Run Contract Tests with Live Server
```bash
# Start the API server first (in another terminal)
cd mcp-server
python master_orchestrator_api.py

# Then run contract tests
npm run test:contracts
```

### Run All Tests (No Server Required)
```bash
npm test
```

This runs integration tests and DSL schema tests (60 tests total).

### Run All Tests (Including Contract Endpoints - Server Required)
```bash
npm run test:all
```

This runs all tests including contract endpoint tests that require a live API server.

## Test Execution Times

| Test Suite | Tests | Duration | Server Required |
|------------|-------|----------|-----------------|
| Integration Tests | 42 | ~500ms | ❌ No |
| DSL Schema Tests | 18 | ~400ms | ❌ No |
| Agent Endpoints Tests | 15 | ~10-15s | ✅ Yes (pending) |
| Workflow Endpoints Tests | 15 | ~15-30s | ✅ Yes (pending) |
| **Total (Implemented)** | **60** | **< 1 sec** | **No** |
| **Total (With Server)** | **~90** | **< 2 min** | **Partial** |

## Environment Configuration

### API Base URL
Set the API base URL for contract tests:

```bash
# Default
npm run test:contracts

# Custom URL
API_BASE_URL=http://localhost:8001 npm run test:contracts

# Production URL
API_BASE_URL=https://api.example.com npm run test:contracts
```

### Test Timeouts
Configured in `vitest.config.ts`:
- Test timeout: 60 seconds
- Hook timeout: 60 seconds

## Starting the API Server

### Option 1: Local Python Server
```bash
cd mcp-server
python master_orchestrator_api.py
```

### Option 2: Docker Compose
```bash
docker-compose up -d
# Wait for services to be ready
sleep 10
```

### Option 3: Docker (Individual Service)
```bash
docker run -p 8001:8001 sherlock-api:latest
```

## Verifying Server is Ready

```bash
# Check health endpoint
curl http://localhost:8001/agents

# Expected: JSON response with agent matrix
```

## Test Reports

After running tests, check:
- `/reports/contract-issues.md` - Contract validation issues (if any)
- Console output - Detailed test results

## Common Issues

### Issue: "ECONNREFUSED" error
**Cause:** API server is not running  
**Solution:** Start the API server before running contract tests

### Issue: "Timeout" errors
**Cause:** Server is slow to respond or not healthy  
**Solution:** 
- Check server logs
- Increase timeout in `vitest.config.ts`
- Verify server health endpoint

### Issue: "404 Not Found" errors
**Cause:** API endpoint paths don't match expected routes  
**Solution:**
- Verify server version matches expected API
- Check endpoint paths in test files
- Update `API_BASE_URL` if needed

### Issue: Tests pass locally but fail in CI
**Cause:** Server not ready when tests start  
**Solution:**
- Add wait-for-it script
- Use health check polling
- Add sleep before tests

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Run Tests
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
        run: npm install
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Start API server
        run: |
          docker-compose up -d
          sleep 10
      
      - name: Run contract tests
        run: npm run test:contracts
        env:
          API_BASE_URL: http://localhost:8001
      
      - name: Stop services
        run: docker-compose down
```

## Continuous Watch Mode

For development, run tests in watch mode:

```bash
npm run test:watch
```

This will:
- Watch for file changes
- Re-run affected tests automatically
- Show test results in real-time

## Debug Mode

To debug failing tests:

```bash
# Run a specific test file
npx vitest run tests/contracts/agent-endpoints.test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/vitest run
```

## Test Coverage

To generate test coverage report:

```bash
npx vitest run --coverage
```

## Next Steps

1. ✅ Integration tests are ready to run
2. ✅ DSL schema tests are ready to run
3. ⏸️ Contract tests ready but need API server
4. 📝 Start API server and run contract tests
5. 📝 Review `/reports/contract-issues.md` for findings

## Support

For issues or questions:
- Check test logs for detailed error messages
- Review `/tests/README.md` for test documentation
- Review `/reports/contract-issues.md` for known issues
- Check API server logs for server-side issues
