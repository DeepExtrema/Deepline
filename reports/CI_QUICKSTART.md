# CI/CD Quick Start Guide

## Overview
The CI/CD pipeline automatically runs on every push to `main` or `develop` branches and on pull requests.

## What Gets Tested

### ✅ Frontend (dashboard-ui)
- **Install**: `npm ci`
- **Build**: `npm run build`
- **Artifacts**: Build output saved for 7 days

### ✅ Backend (mcp-server)
- **Python Versions**: 3.12 and 3.13
- **Install**: From requirements.txt or requirements-python313.txt
- **Lint**: Ruff, Black, MyPy (non-blocking)
- **Tests**: pytest on test_refinery_basic.py and test_ml_agent.py

### ✅ E2E Tests
- **Services**: MongoDB, Kafka, Zookeeper, Redis (via Docker Compose)
- **Tests**: test_refinery_e2e.py, test_iris_e2e.py
- **Logs**: Saved for 7 days on failure

### ✅ Contract Validation
- **Script**: `scripts/validate-contracts.js`
- **Validates**: Config files, API schemas, Python contracts

## Viewing CI Results

1. Go to the repository on GitHub
2. Click the "Actions" tab
3. Select the "CI" workflow
4. Click on a specific run to see details

## CI Badge

The README.md now shows the CI status:

[![CI Status](https://github.com/DeepExtrema/Sherlock-Multiagent-Data-Scientist/workflows/CI/badge.svg)](https://github.com/DeepExtrema/Sherlock-Multiagent-Data-Scientist/actions/workflows/ci.yml)

- 🟢 Green = All checks passed
- 🔴 Red = Some checks failed
- ⚪ Gray = No recent runs

## Running Tests Locally

### Frontend
```bash
cd dashboard-ui
npm install
npm run build
```

### Backend
```bash
cd mcp-server
pip install -r requirements-python313.txt  # or requirements.txt
pip install pytest pytest-asyncio black ruff mypy
pytest test_refinery_basic.py -v
pytest test_ml_agent.py -v
```

### With Docker Services
```bash
# Start services
docker-compose -f docker-compose.ci.yml up -d

# Wait for services to be healthy
sleep 30

# Run E2E tests
cd mcp-server
pytest test_refinery_e2e.py -v

# Stop services
docker-compose -f docker-compose.ci.yml down -v
```

### Contract Validation
```bash
# Requires Node.js and Python dependencies
node scripts/validate-contracts.js
```

## Troubleshooting

### "Services not healthy"
- Increase wait time: `sleep 60` instead of `sleep 30`
- Check Docker logs: `docker-compose -f docker-compose.ci.yml logs`

### "Cache not working"
- Clear GitHub Actions cache in repository settings
- Verify lockfile hasn't been corrupted

### "Tests timeout"
- Increase timeout in workflow: Add `timeout-minutes: 30` to job

### "Artifacts not found"
- Check path in workflow matches actual output location
- Verify files are created before upload step

## Adding Playwright Tests

When ready to add browser tests:

1. Install Playwright in dashboard-ui:
   ```bash
   cd dashboard-ui
   npm install -D @playwright/test
   npx playwright install
   ```

2. Enable Playwright job in `.github/workflows/ci.yml`:
   ```yaml
   playwright-e2e:
     if: true  # Change from 'false'
   ```

3. Add test script to dashboard-ui/package.json:
   ```json
   "test:e2e": "playwright test"
   ```

## Required Checks for Branch Protection

Configure these in GitHub Settings → Branches:

1. ✅ frontend
2. ✅ backend (3.12)
3. ✅ backend (3.13)
4. ✅ e2e-tests
5. ✅ contract-validation
6. ✅ ci-success

See [ci-notes.md](./ci-notes.md) for detailed branch protection setup.

## Performance Tips

### Faster CI Runs
- Keep dependencies minimal
- Use caching effectively
- Run tests in parallel where possible
- Skip optional checks on draft PRs

### Efficient Caching
- npm: Cached by package-lock.json hash
- pip: Cached by requirements.txt hash
- Playwright: Cached by package-lock.json hash

### Parallel Jobs
- Frontend and Backend run simultaneously
- Multiple Python versions test in parallel
- Playwright shards split work across 4 workers

## Need Help?

- 📖 Full documentation: [ci-notes.md](./ci-notes.md)
- 🐛 Report issues: GitHub Issues
- 💬 Ask questions: GitHub Discussions
