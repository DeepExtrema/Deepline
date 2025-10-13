# Selector Adoption Report

## Overview
This document tracks the adoption of `data-testid` attributes across the Deepline Dashboard UI components. These test IDs are essential for reliable end-to-end testing and automation.

## Current Status
**Last Updated:** 2025-10-13  
**Adoption Rate:** 0% (0/117 elements)

## Component Status

### ✅ Fully Adopted Components
None yet.

### ⚠️ Partially Adopted Components
None yet.

### ❌ Not Adopted Components
All components need `data-testid` attributes added.

---

## TODO: Components Requiring data-testid Attributes

### 1. Header Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~29-66  
**Component:** `Header`

#### Required Changes:

```javascript
// TODO: Add data-testid to header container
<header className="header" data-testid="header-container">
  <div className="header-inner">
    <div className="header-left">
      // TODO: Add data-testid to brand logo
      <h1 className="brand" data-testid="brand-logo">DEEPLINE</h1>
      <nav className="nav">
        {agents.map(agent => (
          <button
            key={agent.id}
            onClick={() => setActiveTab(agent.id)}
            className={`nav-item ${activeTab === agent.id ? 'active' : ''}`}
            // TODO: Add data-testid for each navigation button
            data-testid={`nav-${agent.id}`}
          >
            <agent.icon className="nav-icon" />
            <span>{agent.label}</span>
          </button>
        ))}
      </nav>
    </div>
    <div className="header-right">
      // TODO: Add data-testid to system status
      <div className="system-status" data-testid="system-status">
        // TODO: Add data-testid to status dot
        <div className="status-dot healthy" data-testid="status-dot" />
        <span>System Healthy</span>
      </div>
    </div>
  </div>
</header>
```

---

### 2. ConsolePanel Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~68-122  
**Component:** `ConsolePanel`

#### Required Changes:

```javascript
return (
  // TODO: Add data-testid to console container
  <div className="console-container" data-testid="console-container">
    // TODO: Add data-testid to console header
    <div className="console-header" data-testid="console-header">
      <Terminal className="console-icon" />
      <h2>Console</h2>
    </div>
    // TODO: Add data-testid to console output
    <div className="console-output" data-testid="console-output">
      {consoleOutput.map(output => (
        // TODO: Add data-testid to each console line
        <div key={output.id} className={`console-line ${output.type}`} data-testid="console-line">
          {output.message}
        </div>
      ))}
      {lastResult && (
        <div className="console-line success" data-testid="console-line">
          {typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult, null, 2)}
        </div>
      )}
    </div>
    <div className="console-input">
      // TODO: Add data-testid to console prompt input
      <input
        type="text"
        value={nlPrompt}
        onChange={(e) => setNlPrompt(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        className="console-prompt"
        placeholder="Ask Deepline to analyze your data..."
        disabled={busy}
        data-testid="console-prompt"
      />
      // TODO: Add data-testid to submit button
      <button
        onClick={handleSubmit}
        disabled={busy || !nlPrompt.trim()}
        className="console-submit"
        data-testid="console-submit"
      >
        <Play className="console-submit-icon" />
      </button>
    </div>
  </div>
)
```

---

### 3. DatasetsPanel Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~124-219  
**Component:** `DatasetsPanel`

#### Required Changes:

```javascript
return (
  // TODO: Add data-testid to datasets container
  <div className="datasets-container" data-testid="datasets-container">
    // TODO: Add data-testid to datasets header
    <div className="datasets-header" data-testid="datasets-header">
      <Database className="datasets-icon" />
      <h2>Datasets</h2>
    </div>
    
    <div className="datasets-upload">
      {!datasets?.datasets?.length ? (
        // TODO: Add data-testid to upload area
        <div className="upload-area" data-testid="upload-area">
          <Upload className="upload-icon" />
          <div className="upload-text">No datasets uploaded</div>
          // TODO: Add data-testid to file upload input
          <input
            type="file"
            id="file-upload"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="upload-input"
            data-testid="file-upload-input"
          />
          // TODO: Add data-testid to upload button label
          <label htmlFor="file-upload" className="upload-button" data-testid="upload-button">
            Upload Dataset
          </label>
        </div>
      ) : (
        <div className="upload-controls">
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="file-input"
            data-testid="file-upload-input"
          />
          // TODO: Add data-testid to dataset name input
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="dataset name"
            className="name-input"
            data-testid="dataset-name-input"
          />
          <button
            className="upload-btn"
            onClick={() => file && onUpload(file, name)}
            disabled={!file}
            data-testid="upload-button"
          >
            <Upload className="upload-btn-icon" />
            Upload
          </button>
        </div>
      )}
    </div>

    {datasets?.datasets?.length > 0 && (
      // TODO: Add data-testid to datasets list
      <div className="datasets-list" data-testid="datasets-list">
        <div className="datasets-table">
          <div className="dataset-row dataset-header">
            <div>Name</div>
            <div>Rows×Cols</div>
            <div>Memory</div>
          </div>
          {datasets.datasets.map((d, i) => (
            // TODO: Add data-testid to each dataset row
            <div key={i} className="dataset-row" data-testid="dataset-row">
              <div className="dataset-name">{d.name}</div>
              <div className="dataset-shape">{d.shape?.[0]} × {d.shape?.[1]}</div>
              <div className="dataset-memory">{d.memory_usage}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    // TODO: Add data-testid to resource usage section
    <div className="resource-usage" data-testid="resource-usage">
      <h3 className="resource-header">
        <HardDrive className="resource-icon" />
        System Resources
      </h3>
      <div className="resource-metrics">
        // TODO: Add data-testid to CPU metric
        <div className="resource-metric" data-testid="resource-metric-cpu">
          <div className="metric-label">CPU Usage</div>
          <div className="metric-value cpu">23%</div>
          <div className="metric-bar">
            <div className="metric-fill cpu-fill" style={{ width: '23%' }} />
          </div>
        </div>
        // TODO: Add data-testid to memory metric
        <div className="resource-metric" data-testid="resource-metric-memory">
          <div className="metric-label">Memory</div>
          <div className="metric-value memory">67%</div>
          <div className="metric-bar">
            <div className="metric-fill memory-fill" style={{ width: '67%' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
)
```

---

### 4. WorkflowsPanel Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~221-282  
**Component:** `WorkflowsPanel`

#### Required Changes:

```javascript
return (
  // TODO: Add data-testid to workflows container
  <div className="workflows-container" data-testid="workflows-container">
    // TODO: Add data-testid to workflows header
    <div className="workflows-header" data-testid="workflows-header">
      <Activity className="workflows-icon" />
      <h2>Workflows</h2>
    </div>
    <div className="workflows-content">
      {(runs?.runs ?? []).slice().reverse().slice(0, 6).map((workflow) => (
        // TODO: Add data-testid to each workflow card
        <div key={workflow.run_id} className="workflow-card" data-testid="workflow-card">
          <div className="workflow-info">
            <div className="workflow-meta">
              // TODO: Add data-testid to workflow ID
              <div className="workflow-id" data-testid="workflow-id">
                {workflow.run_id.substring(0, 8)}...
              </div>
              // TODO: Add data-testid to workflow status
              <div className={`workflow-status ${getStatusColor(workflow.status)}`} data-testid="workflow-status">
                {workflow.status}
              </div>
            </div>
            // TODO: Add data-testid to workflow name
            <div className="workflow-name" data-testid="workflow-name">
              Run {workflow.run_id.substring(0, 12)}...
            </div>
          </div>
          <div className="workflow-progress">
            // TODO: Add data-testid to progress bar container
            {getProgressBar(Math.round(workflow.progress), workflow.status)}
            // TODO: Add data-testid to progress text
            <span className="progress-text" data-testid="progress-text">
              {Math.round(workflow.progress)}%
            </span>
          </div>
        </div>
      ))}
      {!runs?.runs?.length && (
        // TODO: Add data-testid to no workflows message
        <div className="no-workflows" data-testid="no-workflows">
          <Activity className="no-workflows-icon" />
          <span>No workflows running</span>
        </div>
      )}
    </div>
  </div>
)
```

**Note:** The `getProgressBar` function also needs updating:

```javascript
const getProgressBar = (progress, status) => {
  const isRunning = status === 'RUNNING'
  return (
    // TODO: Add data-testid to progress container
    <div className="progress-container" data-testid="workflow-progress-bar">
      <div className={`progress-bar ${getStatusColor(status)} ${isRunning ? 'animate' : ''}`} 
           style={{ width: `${progress}%` }} />
    </div>
  )
}
```

---

### 5. ProcessesPanel Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~284-361  
**Component:** `ProcessesPanel`

#### Required Changes:

```javascript
return (
  // TODO: Add data-testid to processes container
  <div className="processes-container" data-testid="processes-container">
    // TODO: Add data-testid to processes header
    <div className="processes-header" data-testid="processes-header">
      <Cpu className="processes-icon" />
      <h2>Background Processes</h2>
    </div>
    <div className="processes-content">
      // TODO: Add data-testid to orchestrator process card
      <div className="process-card" data-testid="process-card-orchestrator">
        <div className="process-header">
          <h4>Orchestrator</h4>
          // TODO: Add data-testid to process status
          <div className="process-status" data-testid="process-status">
            // TODO: Add data-testid to status dot
            <div className={`status-dot ${!!orchestrator?.healthy ? 'healthy' : 'unhealthy'}`} 
                 data-testid="process-status-dot" />
            <span className={!!orchestrator?.healthy ? 'status-healthy' : 'status-unhealthy'}>
              {!!orchestrator?.healthy ? 'healthy' : 'unhealthy'}
            </span>
          </div>
        </div>
        <div className="process-details">
          <div>Agents: {Object.keys(orchestrator?.agents || {}).length}</div>
          <div className="process-time">
            Started: {orchestrator?.timestamp ? new Date(orchestrator.timestamp).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>

      // TODO: Add data-testid to refinery process card
      <div className="process-card" data-testid="process-card-refinery">
        <div className="process-header">
          <h4>Refinery</h4>
          <div className="process-status" data-testid="process-status">
            <div className={`status-dot ${!!refinery?.healthy ? 'healthy' : 'unhealthy'}`} 
                 data-testid="process-status-dot" />
            <span className={!!refinery?.healthy ? 'status-healthy' : 'status-unhealthy'}>
              {!!refinery?.healthy ? 'healthy' : 'unhealthy'}
            </span>
          </div>
        </div>
        <div className="process-details">
          <div>FE Module: <span className={refinery?.fe_module_enabled ? 'status-enabled' : 'status-disabled'}>
            {refinery?.fe_module_enabled ? 'enabled' : 'disabled'}
          </span></div>
          <div>Available: <span className={refinery?.fe_module_available ? 'status-enabled' : 'status-disabled'}>
            {String(!!refinery?.fe_module_available)}
          </span></div>
        </div>
      </div>
    </div>

    // TODO: Add data-testid to telemetry section
    <div className="telemetry-section" data-testid="telemetry-section">
      <div className="telemetry-header">
        <TrendingUp className="telemetry-icon" />
        <h3>EDA Telemetry</h3>
      </div>
      // TODO: Add data-testid to telemetry table
      <div className="telemetry-table" data-testid="telemetry-table">
        <div className="telemetry-row telemetry-header-row">
          <div>Operation</div>
          <div>Count</div>
          <div>Errors</div>
        </div>
        {edaOps.map((o) => (
          // TODO: Add data-testid to each telemetry row
          <div key={o.op} className="telemetry-row" data-testid="telemetry-row">
            <div>{o.op}</div>
            <div className="telemetry-count">{o.count}</div>
            <div className={`telemetry-errors ${o.errors ? 'has-errors' : 'no-errors'}`}>{o.errors}</div>
          </div>
        ))}
        {!edaOps.length && (
          <div className="telemetry-empty">No telemetry data</div>
        )}
      </div>
    </div>
  </div>
)
```

---

### 6. App Component (`dashboard-ui/src/main.jsx`)

**File:** `dashboard-ui/src/main.jsx`  
**Lines:** ~452-467  
**Component:** `App`

#### Required Changes:

```javascript
return (
  // TODO: Add data-testid to app container
  <div className="app" data-testid="app-container">
    <Header orchestrator={orcHealth} eda={edaHealth} refinery={refineryHealth} ml={mlHealth} />
    // TODO: Add data-testid to main layout
    <div className="main-layout" data-testid="main-layout">
      // TODO: Add data-testid to main content area
      <div className="main-content" data-testid="main-content">
        <ConsolePanel onSubmitPrompt={handleSubmitPrompt} lastResult={lastResult} busy={busy} />
        <WorkflowsPanel runs={runs} startBasicInfo={handleStartBasicInfo} />
      </div>
      // TODO: Add data-testid to sidebar
      <div className="sidebar" data-testid="sidebar">
        <ProcessesPanel orchestrator={orcHealth} eda={edaHealth} refinery={refineryHealth} />
        <DatasetsPanel datasets={datasets} onUpload={handleUpload} />
      </div>
    </div>
  </div>
)
```

---

## Summary of Changes Required

| Component | File | Total Elements | Priority |
|-----------|------|----------------|----------|
| Header | `dashboard-ui/src/main.jsx` | 8 | High |
| ConsolePanel | `dashboard-ui/src/main.jsx` | 6 | High |
| DatasetsPanel | `dashboard-ui/src/main.jsx` | 11 | High |
| WorkflowsPanel | `dashboard-ui/src/main.jsx` | 9 | High |
| ProcessesPanel | `dashboard-ui/src/main.jsx` | 9 | Medium |
| App | `dashboard-ui/src/main.jsx` | 4 | High |
| **TOTAL** | | **47** | |

---

## Implementation Guidelines

1. **Naming Convention**: Use kebab-case for test IDs (e.g., `data-testid="console-submit"`)
2. **Uniqueness**: Ensure each test ID is unique within its screen/component
3. **Descriptiveness**: Test IDs should clearly describe the element's purpose
4. **Dynamic IDs**: For repeated elements (lists, cards), append index or unique identifier
5. **Consistency**: Follow the contract defined in `contracts/ui-test-ids.json`

## Testing Recommendations

After adding data-testid attributes:

1. Validate all test IDs are present using the validation script
2. Write E2E tests using Playwright or Cypress targeting these test IDs
3. Ensure test IDs don't change unless the component is fundamentally restructured
4. Document any new test IDs in the contract file

## Next Steps

1. ✅ Contract authored in `contracts/ui-test-ids.json`
2. ⚠️ UI implementation pending - Add data-testid attributes to components
3. ⚠️ E2E test suite pending - Create tests using these test IDs
4. ⚠️ CI validation pending - Run validation script in CI/CD pipeline

---

**Note:** This is a contract-only document. UI modifications should be made separately as part of the implementation phase.
