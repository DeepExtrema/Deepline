# CI/CD Pipeline Documentation

## Overview

This document describes the Continuous Integration (CI) pipeline for the Sherlock Multi-agent Data Scientist project. The CI pipeline ensures code quality, runs tests, and validates contracts before code is merged.

## Pipeline Architecture

The CI pipeline is defined in `.github/workflows/ci.yml` and consists of several parallel and sequential jobs:

### Jobs Structure

```
┌─────────────┐     ┌─────────────┐
│  Frontend   │     │   Backend   │
│ Build/Lint  │     │ Build/Test  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   E2E Tests +     │
       │   Services        │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   Contract        │
       │   Validation      │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   CI Success      │
       │   (Gate Check)    │
       └───────────────────┘
```

## Jobs Description

### 1. Frontend Build & Lint
- **Purpose**: Build and validate the React dashboard
- **Node Version**: 18 (LTS)
- **Steps**:
  - Checkout code
  - Setup Node.js with npm cache
  - Install dependencies (`npm ci`)
  - Build application (`npm run build`)
  - Upload build artifacts

### 2. Backend Build & Test
- **Purpose**: Build and test Python services
- **Python Versions**: 3.12 and 3.13 (matrix)
- **Steps**:
  - Checkout code
  - Setup Python with pip cache
  - Install dependencies from requirements files
  - Run linting (Ruff)
  - Run format check (Black)
  - Run type checking (MyPy)
  - Run unit tests (pytest)

### 3. E2E Tests with Services
- **Purpose**: Run end-to-end tests with full service stack
- **Services**: MongoDB, Kafka, Zookeeper, Redis
- **Steps**:
  - Start Docker Compose services (docker-compose.ci.yml)
  - Wait for services to be healthy
  - Run E2E Python tests
  - Upload test logs and results
  - Clean up services

### 4. Playwright E2E Tests (Prepared, Currently Disabled)
- **Purpose**: Browser-based E2E testing (for future use)
- **Sharding**: 4 parallel shards for faster execution
- **Features**:
  - Playwright browser caching
  - Parallel test execution
  - Trace and screenshot upload on failure
- **Status**: Disabled until Playwright is added to the project

### 5. Contract Validation
- **Purpose**: Validate data contracts and API schemas
- **Script**: `scripts/validate-contracts.js`
- **Validates**:
  - Configuration files
  - API schemas
  - Python contract tests
  - Service contracts

### 6. CI Success (Gate Check)
- **Purpose**: Final status check that all required jobs passed
- **Required Jobs**: Frontend, Backend, E2E Tests, Contract Validation
- **Action**: Fails if any required job fails

## Caching Strategy

### Node Modules Cache
```yaml
cache: 'npm'
cache-dependency-path: dashboard-ui/package-lock.json
```
- Automatically caches `node_modules` based on package-lock.json hash
- Significantly speeds up dependency installation

### Python Dependencies Cache
```yaml
cache: 'pip'
cache-dependency-path: |
  mcp-server/requirements.txt
  mcp-server/requirements-python313.txt
```
- Caches pip packages based on requirements files
- Reduces installation time for Python dependencies

### Playwright Browsers Cache
```yaml
path: ~/.cache/ms-playwright
key: playwright-browsers-${{ runner.os }}-${{ hashFiles('dashboard-ui/package-lock.json') }}
```
- Caches Playwright browser binaries
- Only downloads browsers when package-lock.json changes

## Docker Compose Services

The pipeline uses `docker-compose.ci.yml` which defines:

### Services
1. **Zookeeper** (Port 2181)
   - Coordination service for Kafka
   - Health check: Port connectivity

2. **Kafka** (Port 9092)
   - Message broker for event streaming
   - Health check: Broker API versions

3. **MongoDB** (Port 27017)
   - Document database for data storage
   - Health check: Admin ping command

4. **Redis** (Port 6379)
   - In-memory cache and queue
   - Health check: Redis ping

### Health Checks
All services include health checks to ensure they're ready before tests run:
- 10-second interval between checks
- 5-second timeout per check
- 5 retries before marking as unhealthy

## Required Status Checks

### Branch Protection Rules

To enable branch protection on GitHub, configure the following required status checks:

#### Required Checks (Must Pass)
1. ✅ **Frontend Build & Lint** (`frontend`)
2. ✅ **Backend Build & Test** (`backend` - all matrix jobs)
3. ✅ **E2E Tests with Services** (`e2e-tests`)
4. ✅ **Contract Validation** (`contract-validation`)
5. ✅ **CI Success** (`ci-success`)

#### Optional Checks (Can Fail)
- **Playwright E2E Tests** (disabled by default)

### GitHub Branch Protection Configuration

Navigate to: `Settings` → `Branches` → `Branch protection rules` → `main`

#### Recommended Settings:
```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   
   Required status checks:
   ✅ frontend
   ✅ backend (3.12)
   ✅ backend (3.13)
   ✅ e2e-tests
   ✅ contract-validation
   ✅ ci-success

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
   (Administrators: Optional based on team policy)
```

### Setting Up Status Checks via GitHub API

You can also configure branch protection programmatically:

```bash
# Replace {owner}, {repo}, and {token} with your values
curl -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token {token}" \
  https://api.github.com/repos/{owner}/{repo}/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "frontend",
        "backend (3.12)",
        "backend (3.13)",
        "e2e-tests",
        "contract-validation",
        "ci-success"
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true
    },
    "restrictions": null
  }'
```

## Artifact Retention

### Artifacts Uploaded
1. **Frontend Build** (7 days)
   - Built static files from `dashboard-ui/dist/`

2. **E2E Test Logs** (7 days)
   - Test execution logs
   - Test results from pytest

3. **Playwright Traces** (7 days, on failure)
   - Browser execution traces
   - Debugging information

4. **Playwright Screenshots** (7 days, on failure)
   - Screenshots of test failures
   - Visual regression evidence

5. **Contract Validation Results** (30 days)
   - Contract validation reports
   - Schema validation results

## Triggers

### Push Events
```yaml
branches: [ main, develop ]
```
- Runs on every push to `main` or `develop` branches

### Pull Request Events
```yaml
branches: [ main, develop ]
```
- Runs on pull requests targeting `main` or `develop`

## Multi-Package Support

### Node.js LTS Matrix
The project uses Node.js 18 (LTS). If the project becomes a monorepo with multiple packages requiring different Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20]
```

### Python Version Matrix
Currently tests against Python 3.12 and 3.13:

```yaml
strategy:
  matrix:
    python-version: ['3.12', '3.13']
```

## Adding Playwright Tests

When you're ready to add Playwright tests:

1. **Install Playwright**:
   ```bash
   cd dashboard-ui
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Create test configuration**:
   ```javascript
   // playwright.config.js
   export default {
     testDir: './tests',
     fullyParallel: true,
     workers: process.env.CI ? 1 : undefined,
     use: {
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },
   };
   ```

3. **Enable in CI**:
   Change `if: false` to `if: true` in the `playwright-e2e` job

4. **Add test scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test"
     }
   }
   ```

## Performance Optimization

### Parallel Execution
- Frontend and Backend jobs run in parallel
- Playwright tests use 4 shards for parallel execution
- Backend tests run on multiple Python versions simultaneously

### Caching
- npm dependencies cached per lockfile
- pip packages cached per requirements files
- Playwright browsers cached per package version

### Service Startup
- Docker Compose services start once and are reused
- Health checks prevent tests from running on unhealthy services
- Services shut down after tests complete

## Troubleshooting

### Common Issues

#### 1. Services Not Healthy
**Symptom**: E2E tests fail because services aren't ready

**Solution**:
```yaml
# Increase wait time in workflow
sleep 60  # Instead of sleep 30
```

#### 2. Cache Not Working
**Symptom**: Dependencies install slowly on every run

**Solution**:
```bash
# Verify cache key matches lockfile
cache-dependency-path: dashboard-ui/package-lock.json
```

#### 3. Tests Timeout
**Symptom**: Tests exceed time limits

**Solution**:
```yaml
# Add timeout to job
timeout-minutes: 30
```

#### 4. Artifacts Not Found
**Symptom**: Upload fails with no files found

**Solution**:
```yaml
if-no-files-found: ignore  # or 'warn' instead of 'error'
```

## Maintenance

### Regular Tasks
- Review and update Node.js LTS version quarterly
- Update Python versions when new releases are stable
- Review artifact retention policies monthly
- Update Docker images to latest stable versions
- Monitor cache hit rates and adjust keys if needed

### Updating Dependencies
```bash
# Update npm dependencies
cd dashboard-ui && npm update

# Update Python dependencies
cd mcp-server && pip install --upgrade -r requirements.txt

# Update Docker images
docker-compose -f docker-compose.ci.yml pull
```

## Future Enhancements

### Planned Additions
1. **Code Coverage Reporting**
   - Integrate Codecov or Coveralls
   - Set minimum coverage thresholds

2. **Performance Testing**
   - Add Lighthouse CI for frontend performance
   - Add load testing for backend APIs

3. **Security Scanning**
   - Add Snyk or Dependabot for dependency scanning
   - Add SAST (Static Application Security Testing)

4. **Deployment Pipeline**
   - Add staging deployment job
   - Add production deployment with approval gates

5. **Notification Integration**
   - Slack notifications for failures
   - GitHub commit status updates

## Badge Configuration

The CI status badge has been added to the README.md file:

```markdown
[![CI Status](https://github.com/DeepExtrema/Sherlock-Multiagent-Data-Scientist/workflows/CI/badge.svg)](https://github.com/DeepExtrema/Sherlock-Multiagent-Data-Scientist/actions/workflows/ci.yml)
```

This badge shows:
- ✅ Green: All checks passing
- ❌ Red: Some checks failing
- ⚪ Gray: No recent runs or pending

## Support

For questions or issues with the CI pipeline:
1. Check GitHub Actions logs for detailed error messages
2. Review this document for troubleshooting steps
3. Open an issue on the repository
4. Contact the development team

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Playwright Documentation](https://playwright.dev/)
- [pytest Documentation](https://docs.pytest.org/)
