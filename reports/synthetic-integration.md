# A8 Synthetic Canary Integration Guide

## Overview

The A8 Synthetic Canary is a continuous monitoring system that verifies the health and functionality of the Sherlock Multi-Agent Data Scientist dashboard. It runs automated end-to-end tests every 6 hours using Playwright to ensure the application remains operational.

## Architecture

### Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (CRON)                    │
│                      Every 6 Hours                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Synthetic Test Execution                       │
│  - Start backend services (docker-compose)                  │
│  - Start dashboard dev server                               │
│  - Run Playwright tests                                     │
│  - Capture traces on failure                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ✅ Success                  ❌ Failure
         │                           │
         │                           ▼
         │              ┌───────────────────────────┐
         │              │  Upload Artifacts         │
         │              │  - trace.zip              │
         │              │  - screenshots            │
         │              │  - videos                 │
         │              └──────────┬────────────────┘
         │                         │
         │                         ▼
         │              ┌───────────────────────────┐
         │              │  Send Notifications       │
         │              │  - Slack webhook          │
         │              │  - Custom webhook         │
         │              └───────────────────────────┘
         │                         │
         └─────────────┬───────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Workflow End  │
              └────────────────┘
```

## Test Tenant Configuration

**IMPORTANT:** The synthetic tests use a dedicated test tenant to avoid mutating production data.

### Environment Variables

```bash
# Dashboard URL (default: http://localhost:3000)
DASHBOARD_URL=http://localhost:3000

# Test tenant identifier
TEST_TENANT=synthetic-canary-test

# Backend service URLs (if using separate test environment)
ORCHESTRATOR_URL=http://localhost:8000
EDA_AGENT_URL=http://localhost:8001
REFINERY_AGENT_URL=http://localhost:8005
ML_AGENT_URL=http://localhost:8002
```

### Test Data Isolation

The synthetic tests are designed to be **READ-ONLY** and do not create, modify, or delete any data. They only:
- Load the dashboard UI
- Verify UI elements are present and functional
- Navigate between tabs
- Type in input fields (without submitting)
- Verify health status indicators

No data operations (uploads, workflow executions, database modifications) are performed.

## Webhook Integration

### Slack Webhook Setup

1. **Create a Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Sherlock Synthetic Canary"
   - Select your workspace

2. **Enable Incoming Webhooks**
   - Navigate to "Incoming Webhooks" in the left sidebar
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select the channel for notifications (e.g., #sherlock-alerts)
   - Copy the webhook URL

3. **Configure GitHub Secret**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Paste your webhook URL
   - Click "Add secret"

### Slack Message Format

The workflow sends rich notifications to Slack on test failures:

```json
{
  "text": "🚨 A8 Synthetic Canary Test Failed",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Synthetic Canary Alert"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Test Run:* 123\n*Workflow:* A8 Synthetic Canary Tests\n*Status:* Failed\n*Branch:* main"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "<https://github.com/org/repo/actions/runs/123|View Artifacts & Traces>"
      }
    }
  ]
}
```

### Custom Webhook Integration

For non-Slack integrations (PagerDuty, Datadog, custom systems):

1. **Configure GitHub Secret**
   - Name: `WEBHOOK_URL`
   - Value: Your webhook endpoint URL

2. **Webhook Payload Format**

```json
{
  "event": "synthetic_canary_failed",
  "run_id": "123456789",
  "run_number": "42",
  "workflow": "A8 Synthetic Canary Tests",
  "repository": "DeepExtrema/Sherlock-Multiagent-Data-Scientist",
  "branch": "main",
  "artifact_url": "https://github.com/org/repo/actions/runs/123456789",
  "timestamp": "2025-10-13T10:00:00Z"
}
```

3. **Example Integrations**

#### PagerDuty

```bash
# Set WEBHOOK_URL to PagerDuty Events API v2
WEBHOOK_URL=https://events.pagerduty.com/v2/enqueue

# Modify the workflow to include routing_key in payload:
{
  "routing_key": "YOUR_PAGERDUTY_ROUTING_KEY",
  "event_action": "trigger",
  "payload": {
    "summary": "Synthetic Canary Test Failed",
    "severity": "error",
    "source": "GitHub Actions",
    "custom_details": { ... }
  }
}
```

#### Datadog

```bash
# Set WEBHOOK_URL to Datadog webhook endpoint
WEBHOOK_URL=https://webhooks.datadoghq.com/v1/webhooks/YOUR_KEY

# Payload is automatically formatted for Datadog
```

#### Custom REST API

```bash
# Set WEBHOOK_URL to your custom endpoint
WEBHOOK_URL=https://your-monitoring-system.com/api/alerts

# The workflow sends a POST request with JSON payload
# Implement your handler to process the alert
```

## Artifact Management

### On Test Failure

The workflow automatically uploads the following artifacts:

1. **trace.zip**
   - Playwright traces for debugging
   - Screenshots at failure points
   - Network activity logs
   - Console logs

2. **test-results/**
   - Full test results
   - HTML report
   - JSON results

3. **synthetic-results/**
   - Aggregated results across runs
   - Performance metrics

### Accessing Artifacts

1. Go to the failed workflow run in GitHub Actions
2. Scroll to the "Artifacts" section at the bottom
3. Download `trace.zip` or `trace-{run_id}`
4. Extract and open traces in Playwright Trace Viewer:

```bash
# Extract the zip
unzip trace.zip

# View traces
npx playwright show-trace trace.zip
```

### Artifact Retention

- Default retention: **30 days**
- Configure in `.github/workflows/synthetic.yml`:

```yaml
- name: Upload trace artifacts on failure
  uses: actions/upload-artifact@v4
  with:
    retention-days: 30  # Adjust as needed
```

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Run Tests

```bash
# Run all synthetic tests
npm run test:synthetic

# Run with UI mode (interactive)
npm run test:synthetic:ui

# Run in headed mode (see browser)
npm run test:synthetic:headed

# Run specific test file
npx playwright test synthetic/checks/login-view-logout.spec.ts

# Generate HTML report
npx playwright show-report
```

### Debug Failed Tests

```bash
# Run with trace enabled
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/path-to-trace.zip
```

## Monitoring and Alerts

### Success Criteria

Tests are considered successful if:
- Dashboard loads within 10 seconds
- All main UI components are visible
- Navigation between tabs works
- Health status indicators are present
- No JavaScript errors in console

### Failure Scenarios

Tests may fail due to:
- Backend services not responding (500 errors)
- Dashboard not loading (network issues)
- Missing UI elements (frontend bugs)
- JavaScript errors or crashes
- Timeout waiting for elements

### Response Procedures

When you receive a failure alert:

1. **Check the Slack notification** or webhook payload for high-level info
2. **Go to GitHub Actions** and view the failed workflow run
3. **Download trace.zip** artifact
4. **Open trace in Playwright Trace Viewer**:
   ```bash
   npx playwright show-trace trace.zip
   ```
5. **Analyze the failure**:
   - Check screenshots at failure point
   - Review network requests
   - Check console logs
   - Examine the trace timeline
6. **Reproduce locally** if needed:
   ```bash
   npm run test:synthetic:headed
   ```
7. **Fix the issue** and verify with a manual trigger of the workflow

## Schedule Configuration

### Current Schedule

Tests run every 6 hours at:
- 00:00 UTC (midnight)
- 06:00 UTC (6 AM)
- 12:00 UTC (noon)
- 18:00 UTC (6 PM)

### Modifying the Schedule

Edit `.github/workflows/synthetic.yml`:

```yaml
on:
  schedule:
    # Run every 4 hours
    - cron: '0 */4 * * *'
    
    # Run every hour
    - cron: '0 * * * *'
    
    # Run at specific times (9 AM and 5 PM UTC)
    - cron: '0 9,17 * * *'
    
    # Run Monday-Friday at 9 AM UTC
    - cron: '0 9 * * 1-5'
```

## Troubleshooting

### Common Issues

#### 1. Dashboard Not Starting

**Symptoms:** Tests fail immediately with connection errors

**Solution:**
- Check backend services are running
- Verify `docker-compose up` succeeds
- Check port 3000 is not already in use

#### 2. Flaky Tests

**Symptoms:** Tests pass/fail intermittently

**Solution:**
- Increase timeouts in `playwright.config.ts`
- Add explicit wait conditions
- Check for race conditions in the dashboard code

#### 3. Artifacts Not Uploading

**Symptoms:** No trace.zip in artifacts

**Solution:**
- Check test results directory exists
- Verify artifact upload step has correct permissions
- Check GitHub Actions storage quota

#### 4. Webhooks Not Sending

**Symptoms:** Tests fail but no notification received

**Solution:**
- Verify `SLACK_WEBHOOK_URL` or `WEBHOOK_URL` secret is set
- Check webhook URL is valid
- Test webhook manually:
  ```bash
  curl -X POST $WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Test"}'
  ```

## Security Considerations

### Secrets Management

- **Never commit webhook URLs** to the repository
- Use GitHub Secrets for sensitive data
- Rotate webhook URLs periodically
- Limit webhook scope to read-only channels

### Test Isolation

- Use dedicated test tenant
- Do not use production credentials
- Avoid testing create/update/delete operations
- Keep tests read-only to prevent data corruption

### Network Security

- Tests run in GitHub-hosted runners (trusted environment)
- Webhook payloads contain no sensitive data
- Artifacts are scoped to repository contributors

## Maintenance

### Regular Tasks

- **Weekly:** Review test results for patterns
- **Monthly:** Update Playwright and dependencies
- **Quarterly:** Review and update test coverage

### Updating Tests

When dashboard UI changes:

1. Update test selectors in `login-view-logout.spec.ts`
2. Run tests locally to verify
3. Commit changes and push
4. Monitor next scheduled run

### Dependency Updates

```bash
# Update Playwright
npm update @playwright/test

# Update browsers
npm run playwright:install

# Test after updates
npm run test:synthetic
```

## Metrics and Reporting

### Key Metrics

- **Success Rate:** Percentage of passing test runs
- **Mean Time to Detect (MTTD):** Time from failure to alert
- **Mean Time to Resolve (MTTR):** Time from alert to fix
- **Availability:** Percentage of time dashboard is operational

### Viewing Metrics

GitHub Actions provides basic metrics:
- Go to "Actions" tab
- Select "A8 Synthetic Canary Tests" workflow
- View run history and success rate

For advanced metrics, export data using GitHub API:

```bash
# Get workflow runs
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/DeepExtrema/Sherlock-Multiagent-Data-Scientist/actions/workflows/synthetic.yml/runs
```

## References

- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Slack API - Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Cron Expression Reference](https://crontab.guru/)

## Support

For questions or issues with the synthetic canary system:

1. Check this documentation
2. Review existing GitHub Issues
3. Open a new issue with tag `synthetic-canary`
4. Include trace.zip and error logs
