# Deepline Contracts

This directory contains contract definitions for the Deepline Multi-Agent Data Scientist system.

## Contents

### 1. UI Test IDs Contract (`ui-test-ids.json`)

A comprehensive enumeration of all UI screens and critical elements with their designated `data-testid` attributes.

**Purpose:**
- Provides a single source of truth for UI test selectors
- Enables reliable E2E testing with Playwright, Cypress, or similar tools
- Documents the structure of the UI for test automation

**Structure:**
```json
{
  "screens": {
    "ScreenName": {
      "description": "Description of the screen",
      "elements": [
        {
          "id": "test-id-name",
          "description": "What this element is",
          "selector": "[data-testid='test-id-name']",
          "required": true
        }
      ]
    }
  }
}
```

**Statistics:**
- 6 screens defined
- 47 UI elements documented
- 46 required elements
- 1 optional element

**Screens:**
1. **Header** - Main navigation header with agent tabs
2. **ConsolePanel** - Natural language console interface
3. **DatasetsPanel** - Dataset management and upload
4. **WorkflowsPanel** - Workflow execution monitoring
5. **ProcessesPanel** - Background processes and health
6. **App** - Root application structure

### 2. API Schema Contract (`api-schema.yaml`)

OpenAPI 3.0.3 specification documenting all REST API endpoints across the microservices architecture.

**Purpose:**
- Defines request/response types for all API endpoints
- Enables API client generation and validation
- Documents the complete API surface for integration

**Coverage:**
- **Master Orchestrator** (port 8000): 11 endpoints
- **EDA Agent** (port 8001): 8 endpoints
- **Refinery Agent** (port 8005): 3 endpoints
- **ML Agent** (port 8002): 5 endpoints
- **Total:** 25+ endpoints documented

**Key Endpoints:**

| Service | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Orchestrator | `/workflows/start` | POST | Start new workflow |
| Orchestrator | `/datasets/upload` | POST | Upload dataset |
| Orchestrator | `/runs/{run_id}/status` | GET | Get run status |
| EDA | `/load_data` | POST | Load dataset into memory |
| EDA | `/basic_info` | POST | Get dataset info |
| EDA | `/statistical_summary` | POST | Compute statistics |
| EDA | `/create_visualization` | POST | Generate charts |
| Refinery | `/execute` | POST | Execute DQ/FE task |
| ML | `/class_imbalance` | POST | Handle imbalance |
| ML | `/baseline_sanity` | POST | Train baseline models |

**Schemas:**
The contract defines comprehensive request/response schemas including:
- `WorkflowRequest` / `WorkflowResponse`
- `LoadDataRequest` / `LoadDataResponse`
- `TaskRequest` / `TaskResponse`
- `MLResponse`
- And 20+ more schemas

## Validation

Use the validation script to ensure contracts are valid:

```bash
node scripts/validate-contracts.js
```

The validation script checks:
- ✅ JSON/YAML validity
- ✅ Required structure present
- ✅ No duplicate test IDs
- ✅ All expected sections exist
- ✅ File references are correct

## Usage

### For Frontend Developers

Use the UI test IDs contract when adding `data-testid` attributes:

```javascript
// ❌ Before
<button className="console-submit" onClick={handleSubmit}>
  Submit
</button>

// ✅ After (following contract)
<button 
  className="console-submit" 
  onClick={handleSubmit}
  data-testid="console-submit"
>
  Submit
</button>
```

See `/reports/selector-adoption.md` for a complete TODO list.

### For QA/Test Engineers

Use test IDs from the contract in your E2E tests:

```javascript
// Playwright example
await page.getByTestId('console-prompt').fill('load iris dataset');
await page.getByTestId('console-submit').click();
await expect(page.getByTestId('console-output')).toContainText('Success');
```

### For Backend Developers

Use the API schema when implementing or consuming endpoints:

```python
# The contract documents that /load_data expects:
{
  "path": str,      # Required
  "name": str,      # Required
  "file_type": str  # Optional, one of: csv, xlsx, json
}

# And returns:
{
  "name": str,
  "rows": int,
  "cols": int,
  "dtypes": dict,
  "memory_usage": str,
  "sample_preview": list
}
```

### For API Consumers

Generate API clients from the OpenAPI schema:

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i contracts/api-schema.yaml \
  -g typescript-axios \
  -o client/typescript

# Generate Python client
openapi-generator-cli generate \
  -i contracts/api-schema.yaml \
  -g python \
  -o client/python
```

## CI/CD Integration

Add contract validation to your CI pipeline:

```yaml
# .github/workflows/contracts.yml
name: Validate Contracts
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Validate contracts
        run: node scripts/validate-contracts.js
```

## Maintaining Contracts

### When to Update UI Test IDs Contract:

1. **New component added** - Add screen definition with elements
2. **Element added to existing component** - Add to elements array
3. **Element removed** - Remove from contract (breaking change)
4. **Test ID renamed** - Update `id` field (breaking change)

### When to Update API Schema Contract:

1. **New endpoint added** - Add path definition with method
2. **Endpoint modified** - Update request/response schemas
3. **Endpoint deprecated** - Mark with `deprecated: true`
4. **Schema changed** - Update component schemas (may be breaking)

### Versioning:

Both contracts follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes (renamed IDs, removed endpoints)
- **Minor** (1.0.0 → 1.1.0): New additions (new elements, new endpoints)
- **Patch** (1.0.0 → 1.0.1): Clarifications, typo fixes (non-breaking)

## Related Documentation

- `/reports/selector-adoption.md` - TODO list for UI test ID adoption
- `/dashboard-ui/src/main.jsx` - Main UI component source
- `/mcp-server/` - Backend service implementations

## Support

For questions about contracts:
1. Check the validation script output for errors
2. Review related code in `/dashboard-ui` or `/mcp-server`
3. See `/reports/selector-adoption.md` for implementation guidance

---

**Last Updated:** 2025-10-13  
**Contract Version:** 1.0.0
