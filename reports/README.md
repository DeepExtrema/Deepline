# A7 Debug & Flake Fixer Documentation

This directory contains tools and reports for the A7 Debug & Flake Fixer process.

## Overview

The Debug & Flake Fixer helps maintain test quality by:
1. Classifying test failures by root cause
2. Applying minimal fixes to tests
3. Quarantining problematic tests
4. Generating comprehensive reports

## Tools

### 1. debug_flake_fixer.py

**Purpose:** Analyze all test files and classify failures

**Usage:**
```bash
cd mcp-server
python3 debug_flake_fixer.py
```

**What it does:**
- Runs all test files in the mcp-server directory
- Classifies each failure by cause:
  - `selector_mismatch`: Wrong element selectors (UI/API tests)
  - `timing`: Race conditions, timeouts
  - `data_isolation`: Test data conflicts
  - `external_dependency`: Missing packages or services
  - `real_bug`: Actual bugs in code
  - `unknown`: Not yet classified
- Generates reports in `/reports/`

**Output:**
- `/reports/flake-log.md`: Detailed failure analysis
- `/reports/app-change-suggestions.md`: Required application code changes

### 2. apply_test_fixes.py

**Purpose:** Apply fixes to test files based on analysis

**Usage:**
```bash
cd mcp-server
python3 apply_test_fixes.py
```

**What it does:**
- Reads the flake-log.md report
- Applies appropriate fixes to test files:
  - Adds `@pytest.mark.skip` decorators for external dependencies
  - Adds `@pytest.mark.quarantine` markers for problematic tests
- Makes minimal changes to test files

**Safety:** Changes are surgical - only adds necessary imports and decorators

### 3. pytest.ini

**Purpose:** Configure pytest for the project

**Features:**
- Defines custom markers (quarantine, integration, unit, e2e, slow)
- Configures test discovery patterns
- Sets output options
- Documents how to exclude quarantined tests

## Reports

### flake-log.md

**Contents:**
- Summary statistics (total, failed, fixed, quarantined)
- Detailed analysis by failure cause
- Residual risks
- Time to fix for resolved issues

**Use cases:**
- Understand test suite health
- Track quarantined tests
- Identify patterns in failures

### ci-cd-test-configuration.md

**Contents:**
- Guide for CI/CD integration
- Example GitHub Actions workflows
- Test marker reference
- Quarantine process documentation

**Use cases:**
- Set up CI/CD pipelines
- Configure nightly builds
- Understand test categorization

### app-change-suggestions.md

**Contents:**
- Required changes to application code
- Issues that cannot be fixed in tests alone
- Recommendations with rationale

**Use cases:**
- Track technical debt
- Plan sprint work
- Communicate with development team

## Workflow

### Initial Analysis

1. Run the debug flake fixer:
```bash
cd mcp-server
python3 debug_flake_fixer.py
```

2. Review the generated reports in `/reports/`

3. Apply fixes to test files:
```bash
python3 apply_test_fixes.py
```

### Quarantine Process

**When to quarantine:**
- Test fails after 2 consecutive fix attempts
- Issue requires significant refactoring
- External dependency is temporarily unavailable

**How to quarantine:**
1. The fixer automatically quarantines after 2 failed fixes
2. Or manually add markers:
```python
# @quarantine - Reason: Description of why quarantined
@pytest.mark.quarantine
@pytest.mark.skip(reason="Quarantined: Description")
def test_something():
    pass
```

3. Document in flake-log.md

**Running quarantined tests:**
```bash
# Run only quarantined tests
pytest -m quarantine

# Exclude quarantined tests (for CI/CD)
pytest -m "not quarantine"
```

### Re-enabling Tests

Before removing quarantine:
1. Fix the underlying issue
2. Run test 5 times to verify stability
3. Remove `@quarantine` marker and comment
4. Update flake-log.md with resolution
5. Run full test suite to ensure no regressions

## CI/CD Integration

### Pull Request Checks

```yaml
# .github/workflows/pr-tests.yml
name: PR Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          cd mcp-server
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd mcp-server
          pytest -m "not quarantine" -v
```

### Nightly Builds

```yaml
# .github/workflows/nightly.yml
name: Nightly Tests
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  test-all:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          cd mcp-server
          pip install -r requirements.txt
      - name: Run all tests
        run: |
          cd mcp-server
          pytest -v
      - name: Run quarantined tests
        run: |
          cd mcp-server
          pytest -m quarantine -v
        continue-on-error: true
```

## Current Status

**Last Run:** 2025-10-13
**Total Tests:** 7
**Passing:** 2 (test_refinery_basic.py, test_refinery_edge_cases.py)
**Skipped:** 5 (missing Python packages: pandas, httpx)
**Quarantined:** 0

**Action Items:**
1. Install missing dependencies (pandas, httpx, numpy)
2. Set up external services for integration tests
3. Configure CI/CD pipelines using provided examples

## Maintenance

### Regular Tasks

**Weekly:**
- Review quarantined tests
- Check if fixes are available
- Update flake-log.md with progress

**Monthly:**
- Run full analysis with debug_flake_fixer.py
- Review test suite health metrics
- Update documentation

**After Major Changes:**
- Re-run analysis
- Update test markers as needed
- Ensure CI/CD still works

## Best Practices

1. **Minimal Changes:** Only fix what's necessary
2. **Document Everything:** Use comments and reports
3. **Test Isolation:** Each test should be independent
4. **Clear Markers:** Use descriptive quarantine reasons
5. **Regular Cleanup:** Don't let quarantined tests accumulate
6. **Communication:** Share reports with the team

## Support

For issues or questions:
1. Check the flake-log.md for detailed error information
2. Review ci-cd-test-configuration.md for CI/CD setup
3. Check app-change-suggestions.md for required code changes
4. Create an issue in the repository

## References

- [pytest documentation](https://docs.pytest.org/)
- [pytest markers](https://docs.pytest.org/en/stable/how-to/mark.html)
- [CI/CD best practices](https://github.com/actions/starter-workflows)
