# Purpose & Surface Map: Sherlock Multiagent Data Scientist

## MVP Purpose

**Sherlock is an end-to-end, orchestrator-driven data science platform that enables users to perform exploratory data analysis, data quality validation, feature engineering, and model training through microservices agents coordinated by a master orchestrator with real-time observability.**

---

## Feature & User Journey Mapping

| Journey | Primary Files | Entry Command | Data Dependencies | Risk |
|---------|--------------|---------------|-------------------|------|
| **1. Upload & Load Dataset** | `mcp-server/master_orchestrator_api.py` (POST /datasets/upload)<br>`mcp-server/eda_agent.py` (POST /load_data)<br>`mcp-server/data_sources/` | `curl -X POST http://localhost:8000/datasets/upload -F "file=@data.csv" -F "name=my_dataset"`<br>OR<br>`python start_master_orchestrator.py` (then API call) | MongoDB (optional), Local filesystem | **M** - File upload validation needed; supports CSV, Parquet |
| **2. Exploratory Data Analysis (EDA)** | `mcp-server/eda_agent.py` (/basic_info, /statistical_summary, /missing_data_analysis, /detect_outliers)<br>`mcp-server/server.py` (MCP tools)<br>`docs/USER_GUIDE.md` | `python start_eda_service.py`<br>Service: http://localhost:8001<br>Health: http://localhost:8001/health | Redis (caching), Dataset loaded in memory | **M** - Large datasets may cause memory issues; 10k row sampling used for correlations |
| **3. Data Quality Validation** | `mcp-server/refinery_agent.py` (POST /execute)<br>Actions: check_schema_consistency, check_missing_values, check_distributions, check_drift<br>`mcp-server/REFINERY_AGENT_GUIDE.md`<br>`mcp-server/dq/` modules | `python -m uvicorn refinery_agent:app --port 8005`<br>OR via orchestrator workflow | Evidently library, Dataset files | **L** - Read-only operations; comprehensive validation framework |
| **4. Feature Engineering Pipeline** | `mcp-server/refinery_agent.py` (feature engineering actions)<br>`mcp-server/fe/` modules<br>Actions: basic_impute_missing_values, basic_scale_numeric_features, basic_encode_categorical_features | Via POST /execute to http://localhost:8005<br>Dual-mode operation (data_quality vs feature_engineering) | Scikit-learn pipelines, Feature metadata | **M** - Transformation logic; mode validation prevents accidental transforms |
| **5. Model Training & Evaluation** | `mcp-server/ml_agent.py` (POST /train_validation_test, /class_imbalance, /baseline_sanity)<br>`mcp-server/ML_WORKFLOW_GUIDE.md`<br>`mcp-server/mlruns/` (MLflow) | `python -m uvicorn ml_agent:app --port 8002`<br>Service: http://localhost:8002 | MLflow backend, Training datasets, Scikit-learn | **H** - Model persistence, hyperparameter tuning; GPU/CPU resource management |
| **6. Workflow Orchestration** | `mcp-server/master_orchestrator_api.py` (POST /workflows/start, GET /runs/{run_id}/status)<br>`mcp-server/orchestrator/workflow_manager.py`<br>`mcp-server/orchestrator/` (agent_registry, sla_monitor) | `python start_master_orchestrator.py`<br>API: http://localhost:8000<br>Docs: http://localhost:8000/docs | MongoDB (run persistence), Redis (locks), Kafka (events) | **M** - Deadlock monitoring, graceful cancellation; task dependencies managed |
| **7. Real-time Observability Dashboard** | `dashboard-ui/src/` (React SPA)<br>`dashboard-ui/package.json`<br>Backend: WebSocket `/ws/events` | `cd dashboard-ui && npm run dev`<br>UI: http://localhost:3000 | FastAPI WebSocket, Kafka events stream, Recent runs API | **M** - WebSocket connection stability; event streaming from Kafka |

---

## Runnable Surfaces & Entrypoints

### Core Services (Microservices Architecture)

| Service | Entrypoint Script | Port | Health Check | Description |
|---------|------------------|------|-------------|-------------|
| **Master Orchestrator** | `mcp-server/start_master_orchestrator.py`<br>OR `python master_orchestrator_api.py` | 8000 | `/health` | Workflow coordination, task dispatch, artifact management |
| **EDA Agent** | `mcp-server/start_eda_service.py`<br>OR `python eda_agent.py` | 8001 | `/health` | Data loading, statistical analysis, visualization, outlier detection |
| **Refinery Agent** | `python -m uvicorn refinery_agent:app --port 8005`<br>OR via Docker | 8005 | `/health` | Data quality validation, feature engineering, drift detection |
| **ML Agent** | `python -m uvicorn ml_agent:app --port 8002` | 8002 | `/health` | Model training, cross-validation, baseline checks, experiment tracking |
| **MCP Server** | `mcp-server/server.py` (MCP protocol)<br>OR `python launch_server.py` | N/A | N/A | Claude Desktop integration for conversational data analysis |
| **Dashboard UI** | `cd dashboard-ui && npm run dev` | 3000 | N/A | React-based real-time monitoring interface |

### Infrastructure Dependencies

| Component | Start Command | Required By | Notes |
|-----------|--------------|-------------|-------|
| **MongoDB** | `docker-compose up -d mongodb` | Master Orchestrator | Run persistence, task history |
| **Redis** | `docker-compose up -d redis` | All agents | Caching, distributed locks, translation queue |
| **Kafka** | `docker-compose up -d kafka` | Master Orchestrator, Dashboard | Event streaming, task routing |
| **Nginx** (Optional) | `docker-compose up -d nginx` | Production deployment | Load balancing, reverse proxy |

### Docker Deployment

```bash
# Start all services with infrastructure
cd mcp-server
docker-compose up -d

# Production deployment
python production_deployment.py
```

**Docker Compose Files:**
- `mcp-server/docker-compose.yml` - Full multi-service deployment
- `mcp-server/docker-compose.local.yml` - Local development variant
- `docker-compose.yml` (root) - Simplified deployment

### Scripts & Utilities

| Script | Purpose | Usage |
|--------|---------|-------|
| `mcp-server/install_orchestrator.py` | Setup dependencies, create directories, verify infrastructure | `python install_orchestrator.py` |
| `mcp-server/production_deployment.py` | Production-ready deployment with monitoring | `python production_deployment.py` |
| `mcp-server/connectivity_tester.py` | Test inter-service connectivity | `python connectivity_tester.py` |
| `mcp-server/verify_setup.py` | Verify Python dependencies and configuration | `python verify_setup.py` |
| `mcp-server/bug_hunter.py` | Diagnostic tool for troubleshooting | `python bug_hunter.py` |
| `mcp-server/test_*.py` | Test suites (pytest) | `pytest test_refinery_e2e.py` |

---

## Data Dependencies & Flow

```
User → Master Orchestrator (8000)
         ↓
      Kafka Events
         ↓
    ┌────┴────┬────────┬─────────┐
    ↓         ↓        ↓         ↓
EDA Agent  Refinery  ML Agent  Dashboard
  (8001)    (8005)   (8002)    (3000)
    ↓         ↓        ↓         ↓
  Redis    MongoDB   MLflow   WebSocket
```

**Key Data Stores:**
- **MongoDB**: `deepline` database - workflow runs, task status, artifacts metadata
- **Redis**: Caching layer, distributed locks, translation queue (`translation:q`)
- **MLflow**: `mcp-server/mlruns/` - experiment tracking, model registry
- **Local Filesystem**: 
  - `artifacts/` - workflow artifacts (reports, visualizations)
  - `snapshots/` - data versioning
  - `mcp-server/data_sources/` - uploaded datasets

**Configuration:**
- Primary: `mcp-server/config.yaml` (comprehensive settings)
- Environment: `.env` files (production deployment)
- Claude Desktop: `claude_desktop_config.json` (MCP integration)

---

## Risk Assessment Summary

| Risk Level | Count | Mitigation Strategy |
|------------|-------|-------------------|
| **High (H)** | 1 | Model training - Resource quotas in `resource-quota.yaml`, GPU/CPU agent routing |
| **Medium (M)** | 5 | Multiple agents - Health checks, deadlock monitoring, graceful cancellation, SLA monitoring |
| **Low (L)** | 1 | Data quality - Read-only operations, comprehensive validation |

---

## Assumptions & Uncertainties

### Assumptions (<20% uncertainty):
1. **Primary use case**: Data scientists performing end-to-end analysis workflows via API/UI
2. **Deployment target**: Single-node or small-cluster deployment with Docker Compose
3. **Data scale**: Datasets up to 100k rows (configurable: `max_rows_processed: 100000`)
4. **Concurrency**: 1 workflow at a time (configurable: `max_concurrent_workflows: 1`)
5. **Authentication**: Development mode - production deployment includes API key support

### Uncertainties Identified:
1. **Missing Mission Definition Module** (mentioned in COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md) - No implementation found in codebase
2. **Data Governance Implementation** - Configuration exists but enforcement unclear
3. **Kafka/MongoDB fallback behavior** - System continues with reduced functionality (per CONNECTIVITY_TEST_REPORT.md)
4. **Multi-tenant support** - Not implemented; roadmap item per README.md
5. **Hybrid API translation** - LLM integration unclear; references Claude/Llama2 but implementation incomplete

---

## Architecture Principles

1. **Microservices**: Each agent is independently deployable FastAPI service
2. **Async-first**: Non-blocking translation, background task processing
3. **Resilience**: Deadlock detection, automatic retry with exponential backoff, graceful cancellation
4. **Observability**: OpenTelemetry integration, Kafka event streams, health endpoints
5. **Configuration-driven**: YAML-based tuning, environment variable overrides
6. **License Model**: Hybrid Apache 2.0 (clients/SDKs) + BUSL 1.1 (server core)

---

## Next Steps for Users

1. **Quick Start**: Follow `docs/INSTALLATION.md` for Windows/Linux setup
2. **First Workflow**: Upload CSV → Run EDA → Generate quality report (see `docs/EXAMPLES.md`)
3. **Configuration**: Tune thresholds in `config.yaml` per `docs/CONFIGURATION.md`
4. **Advanced**: Build custom workflows with DSL or natural language API
5. **Production**: Use `production_deployment.py` for containerized deployment

---

*Report generated: 2025-10-13*  
*Repository: DeepExtrema/Sherlock-Multiagent-Data-Scientist*  
*Version: 2.1.0*
