# CI/CD Test Configuration Guide

**Generated:** 2025-10-13
**Purpose:** Configure test runs for different environments

## Test Categories

### Required Tests (CI/CD Pipeline)
Tests that must pass before merging:
```bash
# Run all tests except quarantined ones
pytest -m "not quarantine"

# Or explicitly run only unit tests
pytest -m "unit"
```

### Quarantined Tests (Nightly Builds)
Tests that are temporarily excluded from required checks:
```bash
# Run only quarantined tests
pytest -m "quarantine"
```

### Integration Tests
Tests requiring external services:
```bash
# Run integration tests (requires services to be running)
pytest -m "integration"
```

## GitHub Actions Configuration

### Pull Request Checks
```yaml
name: PR Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run required tests
        run: pytest -m "not quarantine"
```

### Nightly Build
```yaml
name: Nightly Tests
on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run all tests including quarantined
        run: pytest -m "quarantine"
```

## Test Markers Reference

| Marker | Purpose | CI/CD | Nightly |
|--------|---------|-------|---------|
| `unit` | Unit tests, no external deps | ✅ | ✅ |
| `integration` | Requires external services | ⚠️ | ✅ |
| `e2e` | End-to-end workflow tests | ⚠️ | ✅ |
| `quarantine` | Temporarily excluded | ❌ | ✅ |
| `slow` | Long-running tests | ⚠️ | ✅ |

## Quarantine Process

When a test is marked as quarantined:

1. **Add marker in test file:**
```python
# @quarantine - Reason: Missing pandas dependency
@pytest.mark.quarantine
@pytest.mark.skip(reason="Quarantined: Missing pandas dependency")
async def test_something():
    pass
```

2. **Document in flake-log.md**
   - Root cause of failure
   - Time spent debugging
   - Residual risks

3. **Track for resolution**
   - Create issue for fixing
   - Add to technical debt backlog
   - Review in sprint planning

## Re-enabling Quarantined Tests

Before removing quarantine:

1. Fix the underlying issue
2. Verify test passes locally
3. Run test 5 times to ensure stability
4. Remove `@quarantine` marker
5. Update flake-log.md with resolution

## Current Status

See `/reports/flake-log.md` for current test status and quarantined tests.
