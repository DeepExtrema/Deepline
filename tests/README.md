# A6 Integration & Contract Tests

This directory contains schema conformance tests and integration tests for the Sherlock Multi-Agent Data Scientist API.

## Directory Structure

```
tests/
├── contracts/           # API contract conformance tests
│   ├── agent-endpoints.test.ts
│   ├── workflow-endpoints.test.ts
│   └── dsl-schema.test.ts
├── integration/         # Integration tests for critical logic
│   ├── validation-logic.test.ts
│   └── transformation-logic.test.ts
├── test-helpers.ts      # Shared test utilities
└── README.md           # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Contract Tests Only (requires live API server)
```bash
npm run test:contracts
```

### Integration Tests Only (no server required)
```bash
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Categories

### Contract Tests (`tests/contracts/`)

Schema conformance tests that call live endpoints and validate responses against contracts/API schemas.

- **agent-endpoints.test.ts**: Tests all agent-related endpoints
  - GET /agents - Agent matrix retrieval
  - GET /agents/{agent_name} - Individual agent info
  - GET /agents/{agent_name}/actions - Agent actions list
  - POST /agents/validate - Agent-action validation
  - GET /agents/names - List of agent names

- **workflow-endpoints.test.ts**: Tests workflow-related endpoints
  - POST /workflows/translate - Natural language translation
  - GET /translation/{token} - Translation status polling
  - POST /workflows/dsl - Direct DSL execution
  - POST /workflows/suggest - Workflow suggestions

- **dsl-schema.test.ts**: Tests DSL schema validation
  - Schema structure validation
  - Valid/invalid DSL examples
  - Schema constraint validation

### Integration Tests (`tests/integration/`)

Unit/integration tests for critical pure logic (validation, transformations).

- **validation-logic.test.ts**: Tests validation functions
  - Workflow name validation
  - Priority validation
  - Task dependency validation
  - Natural language validation
  - Agent-action validation

- **transformation-logic.test.ts**: Tests data transformations
  - YAML ↔ JSON transformations
  - Request normalization
  - Response transformation
  - Status transformation
  - Error response transformation

## Configuration

### Environment Variables

- `API_BASE_URL`: Base URL for the API (default: `http://localhost:8001`)

Example:
```bash
API_BASE_URL=http://localhost:8001 npm run test:contracts
```

### Test Timeouts

Tests have appropriate timeouts configured:
- Default test timeout: 60 seconds
- Hook timeout: 60 seconds

## Test Execution Time

Total test suite runtime is optimized to be < 2 minutes:
- Integration tests: ~0.5 seconds
- Contract tests: ~15-30 seconds (with live server)
- Total: < 2 minutes

## Prerequisites

### For Integration Tests
- No prerequisites (pure logic tests)

### For Contract Tests
- API server must be running at `API_BASE_URL`
- Server must be healthy and responsive
- Endpoints must match the expected contract

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```bash
# Start services (if needed)
docker-compose up -d

# Wait for services to be ready
./wait-for-it.sh localhost:8001 --timeout=60

# Run tests
npm test

# Cleanup
docker-compose down
```

## Minimal Mocks Philosophy

Following the constraint of minimal mocks:
- Contract tests use live API endpoints (or local server)
- Integration tests test pure logic without mocks
- Prefer Testcontainers for infrastructure when needed

## Test Coverage

Current test coverage:
- ✅ Agent endpoints contract validation
- ✅ Workflow endpoints contract validation
- ✅ DSL schema validation
- ✅ Validation logic (workflow names, priorities, dependencies, etc.)
- ✅ Transformation logic (YAML/JSON, request/response)

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Keep tests focused and independent
3. Use descriptive test names
4. Add tests to appropriate directory (contracts vs integration)
5. Ensure tests run in < 2 minutes total
6. Document any new test dependencies

## Troubleshooting

### Contract tests failing

1. Check if API server is running:
   ```bash
   curl http://localhost:8001/agents
   ```

2. Verify environment variables:
   ```bash
   echo $API_BASE_URL
   ```

3. Check server logs for errors

### Integration tests failing

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Check TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```

## Related Documentation

- See `/reports/contract-issues.md` for any contract validation issues found
- See main `README.md` for overall project documentation
- See `mcp-server/schemas/dsl_schema.json` for DSL schema definition
