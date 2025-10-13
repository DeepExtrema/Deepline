# Sherlock – The End‑to‑End Data Science Powerhouse

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/License-Apache%202.0%20%7C%20BUSL%201.1-green.svg)](LICENSE.md)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/DeepExtrema/Sherlock)
[![Version](https://img.shields.io/badge/Version-2.1.0-orange.svg)](https://github.com/DeepExtrema/Sherlock/releases)

**Version**: 2.1.0  
**Status**: Production ready with deadlock monitoring and graceful cancellation support  
**Last updated**: January 2024 (see [CHANGELOG.md](CHANGELOG.md) for release notes).

Imagine turning raw data into insights and models in minutes—no code required. Sherlock isn't just an orchestration tool; it's your complete Data Science studio. Start with drag‑and‑drop EDA, where the EDA Agent handles data loading, statistics, missing‑data analysis, outlier detection and stunning, publication‑ready visualisations. Move seamlessly into feature engineering, with configurable pipelines that transform, encode and select the best features—all through an intuitive interface. Finally, fire up model training via built‑in, no‑code workflows that leverage the Data Science engine to train and evaluate models on the fly.

At its core, Sherlock harnesses a Master Orchestrator that orchestrates every task—dispatching them to specialist agents and tracking progress. A Hybrid API lets you describe workflows in plain language and watch them transform into executable pipelines, while deadlock monitors and graceful cancellation keep long-running jobs resilient and safe. Your work is visualised in real time through the observability dashboard, delivering live charts and event streams.

Whether you're a data enthusiast or a seasoned data scientist, Sherlock makes the entire journey—from EDA to feature engineering to model training—feel like magic.

## 🚀 **Quick Start**

**New to Sherlock?** Check out the **[Agent Capabilities Guide](AGENT_CAPABILITIES.md)** to see what tasks you can accomplish with each agent:
- 📊 **EDA Agent** - Explore and visualize your data
- 🔧 **Refinery Agent** - Ensure data quality and engineer features
- 🤖 **Model Agent** - Train and evaluate ML models
- ⚙️ **Custom Agent** - Run custom scripts and integrations

## 🏗️ **Architecture Overview**

The system follows a modular microservices design with these core components:

- **Master Orchestrator** – a FastAPI service that manages workflow definitions, dispatches tasks to specialist agents and tracks their execution. It exposes a REST API for dataset uploads, workflow creation and artifact retrieval.

- **EDA Agent** – a microservice providing advanced data loading, statistical summaries, missing‑data analysis, outlier detection and publication‑ready visualisation. It is built on FastAPI and integrates with Pandas, NumPy, scikit‑learn and Redis for caching.

- **Hybrid API** – an asynchronous translation service that converts natural‑language requests into a domain‑specific language (DSL) for workflow execution. It enables non‑blocking translation, token‑based polling, Redis‑backed queuing and comprehensive validation of user input.

- **Deadlock Monitor & Graceful Cancellation** – a background service that scans for stuck workflows, cancels them safely and provides API endpoints for manual cancellation.

- **Observability Dashboard** – a React/Node.js application providing real‑time charts, recent run status and live event streaming. The dashboard connects to the FastAPI backend via REST and WebSockets and depends on Kafka and MongoDB.

Together, these components form a scalable microservices architecture capable of orchestrating complex data‑science workflows while providing real‑time monitoring and robust error handling.

### **🧱 System Architecture**

```
┌───────────────────────────────┐    ┌────────────────────────────────┐
│            Clients            │    │        Observability UI        │
│  (CLI, SDKs, React dashboard) │    │    (React + Recharts)          │
└────────────────┬──────────────┘    └────────────────┬───────────────┘
                 │   REST / WebSocket                 │
╔════════════════▼════════════════════╗               │
║      API Layer – FastAPI app        ║               │
║  • /workflows/dsl   – DSL executor  ║               │
║  • /workflows/translate – async NL  ║               │
║  • /translation/{token} – polling   ║               │
║  • /runs/{id}/cancel – cancellation ║               │
╚═══════════════╤═════════════════════╝               │
                │ validated DSL                       │
                ▼                                     │
╔═══════════════════════════════════════════════════════╗
║         Master Orchestrator Service (FastAPI)         ║
║  • Workflow management, scheduling & tracking         ║
║  • Interfaces with agents via REST                    ║
║  • Persists runs & tasks in MongoDB                   ║
║  • Publishes events to Kafka                          ║
║  • Integrates deadlock monitor & SLA monitor          ║
╚═══════════════╤═══════════════════════════════════════╝
                │ task requests / events (Kafka)        
                ▼
        ┌────────────────────────┬────────────────────────┬─────────────────┐
        │ EDA Agent (FastAPI)    │   Future agents (FE,   │ Drift Detectors │
        │ • Data loading         │     ML, Model serving) │  (Evidently)    │
        │ • Statistical analysis │                        │                 │
        │ • Visualisation        │                        │                 │
        │ • Outlier detection    │                        │                 │
        └────────────────────────┴────────────────────────┴─────────────────┘
```

Additional infrastructure includes MongoDB (for run persistence), Redis (for caching and concurrency control) and Kafka (for inter‑service messaging). The dashboard communicates with the backend via REST and WebSocket endpoints.

## ✨ **Key Features**

- **Hybrid API with async translation** – submit natural language descriptions of workflows and retrieve a token for asynchronous translation. Poll for results via the `/translation/{token}` endpoint and execute DSL workflows through `/workflows/dsl`.

- **Intelligent scheduling** – the Master Orchestrator prioritises tasks based on urgency and resource availability and supports retries and concurrency limits.

- **Exploratory Data Analysis** – the EDA Agent provides detailed dataset summaries, correlation matrices, missing‑data visualisation and outlier detection using IQR, Isolation Forest and Local Outlier Factor methods. It generates high‑quality visualisations (300 DPI PNG) ready for publications.

- **Deadlock monitoring and graceful cancellation** – automatic detection of stuck workflows with configurable thresholds (default: 15 minutes per task, 1 hour per workflow) and APIs to cancel or force‑cancel runs.

- **Real‑time observability** – live event streams, recent runs view and performance charts through the dashboard.

- **Containerized deployment** – Dockerfile and docker‑compose.yml enable multi‑service deployments with Nginx load balancing and automatic health checks.

- **Security & monitoring** – input sanitization, CORS, rate limiting, API key support and comprehensive health endpoints.

## 🛠️ **Tech Stack & Dependencies**

Sherlock relies on modern Python and JavaScript ecosystems. Below are the primary dependencies and their minimum versions (for a complete lockfile with hashes see `mcp‑server/requirements.lock`).

| Category | Key packages (min version) |
|----------|---------------------------|
| **Core framework** | `mcp[cli] ≥ 1.10.1`, `pydantic ≥ 2.11.7` |
| **Data processing & analysis** | `pandas ≥ 2.2.0`, `numpy ≥ 2.1.0`, `pyarrow ≥ 20.0.0` |
| **Machine learning** | `scikit‑learn ≥ 1.7.0`, `scipy ≥ 1.15.0`, `pyod ≥ 2.0.5` |
| **Data quality & profiling** | `evidently ≥ 0.7.9`, `pandas‑profiling ≥ 3.2.0`, `missingno ≥ 0.5.2` |
| **Visualisation** | `matplotlib ≥ 3.10.0`, `seaborn ≥ 0.13.0`, `plotly ≥ 5.24.0` |
| **Server & API** | `fastapi ≥ 0.104.0`, `uvicorn[standard] ≥ 0.24.0`, `httpx ≥ 0.25.0` |
| **Messaging & database** | `confluent‑kafka ≥ 2.3.0`, `motor ≥ 3.3.0`, `pymongo ≥ 4.6.0` |
| **Caching & storage** | `redis ≥ 5.0.0`, `aioredis ≥ 2.0.0` |
| **Configuration & utilities** | `pyyaml ≥ 6.0.1`, `python‑multipart ≥ 0.0.6` |
| **Resilience & rate limiting** | `tenacity ≥ 8.2.0`, `slowapi ≥ 0.1.9` |
| **Security & validation** | `bleach ≥ 6.1.0`, `validators ≥ 0.22.0` |
| **LLM & guardrails (optional)** | `guardrails‑ai ≥ 0.5.0`, `openai ≥ 1.0.0` |
| **Front‑end** | Node.js 18+, React 18, Recharts for charts |

### **Prerequisites:**

- **Python 3.13+** (3.12+ is supported on Windows)
- **Node.js 18+** for the React dashboard
- **Docker & Docker Compose** to run MongoDB, Kafka, Redis and the containerised services
- **Git** for version control

## 🧑‍💻 **Installation & Setup**

Follow these steps to get Sherlock running on your machine. Detailed Windows‑specific instructions are available in [docs/INSTALLATION.md](docs/INSTALLATION.md).

### **1. Clone the repository**
```bash
git clone https://github.com/DeepExtrema/Sherlock.git
cd Sherlock
```

### **2. Start infrastructure services**
Sherlock relies on MongoDB, Redis and Kafka. The repository provides a `docker‑compose.yml` in `mcp‑server/` to spin these up quickly.

```bash
cd mcp-server
docker-compose up -d
```

This will launch the databases and message queue needed by the orchestrator and EDA agent. You can monitor the containers via `docker-compose ps`.

### **3. Set up a Python environment**
Create a virtual environment and install the Python dependencies. Use Python 3.13+ to ensure compatibility. For example:

```bash
# create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# install backend dependencies
pip install -r requirements-python313.txt
```

The `requirements-python313.txt` file specifies compatible versions across the Data Science, machine learning and web frameworks.

### **4. Install Node.js dependencies (dashboard)**
If you wish to run the real‑time dashboard, install the front‑end dependencies and start the development server:

```bash
cd dashboard/dashboard-frontend
npm install
npm start
```

This will run the React app on port 3000 by default.

### **5. Run the backend services**
In separate terminals (or using process manager scripts), launch the Master Orchestrator and EDA Agent:

```bash
# Master Orchestrator (port 8000)
python start_master_orchestrator.py

# EDA Agent (port 8001)
python start_eda_service.py
```

The services will be available at:

- **Master Orchestrator**: http://localhost:8000 – API root & health check
- **EDA Agent**: http://localhost:8001 – EDA API and docs
- **Dashboard UI**: http://localhost:3000 – front‑end interface

Alternatively you can use Docker Compose to build and run all services together:

```bash
docker-compose up -d
```

This will build the containers, expose ports 80/443 via Nginx and run health checks.

### **6. Configuration**
Sherlock reads configuration from `mcp-server/config.yaml`, environment variables and command‑line arguments. The YAML file defines data processing limits, quality thresholds, outlier detection parameters, visualisation settings and logging options.

You can override these defaults by editing `config.yaml` or setting environment variables such as `Sherlock_OUTPUT_DIR`, `Sherlock_LOG_LEVEL` and `Sherlock_MAX_WORKERS`. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for detailed explanations and tuning examples.

## 🏃‍♂️ **Usage**

### **Upload a dataset**
Use the Master Orchestrator's dataset upload endpoint to add a CSV file:

```bash
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_dataset.csv" \
  -F "name=my_dataset"
```

### **Start a workflow**
Define a workflow with a list of tasks (agent, action and arguments) and send it to the orchestrator:

```bash
curl -X POST "http://localhost:8000/workflows/start" \
  -H "Content-Type: application/json" \
  -d '{
        "run_name": "eda_analysis",
        "tasks": [
          {
            "agent": "eda_agent",
            "action": "load_data",
            "args": {"path": "your_dataset.csv", "name": "my_dataset"}
          },
          {
            "agent": "eda_agent",
            "action": "create_visualization",
            "args": {"name": "my_dataset", "chart_type": "correlation"}
          }
        ]
      }'
```

The response will include a `run_id` that can be used to poll status via `GET /runs/{run_id}/status` or fetch artefacts via `GET /runs/{run_id}/artifacts`.

### **Use the Hybrid API**
To translate natural language into DSL asynchronously:

```bash
# Submit translation request
curl -X POST "http://localhost:8000/workflows/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Create a workflow that processes data and generates reports"}'

# Poll translation status
curl "http://localhost:8000/translation/{token}"
```

Once the translation is completed you will receive a DSL description of the workflow, which can be executed via `POST /workflows/dsl`.

### **Explore the API**
Each FastAPI service exposes interactive API documentation at `/docs` (Swagger UI) and `/redoc`. The main endpoints are listed in `mcp-server/PRODUCTION_DEPLOYMENT_SUMMARY.md`.

### **Observability dashboard**
Navigate to http://localhost:3000 to open the React dashboard. It provides real‑time charts of event activity, recent runs and a live feed of Kafka events.

## ⚙️ **Customisation & Extension**

The platform is built with extensibility in mind:

- **Add new agents**: implement a FastAPI microservice with the desired functionality, register its URL in `master_orchestrator_api.get_agent_url` and define tasks referencing the new agent.

- **Tune analysis**: adjust thresholds and sample sizes in `config.yaml` or override via environment variables.

- **Add visualisations or metrics**: extend the EDA Agent functions and update the API models in `eda_agent.py`.

- **Scale services**: deploy multiple instances behind the provided Nginx load balancer and use Docker/Kubernetes for orchestration.

## 📄 **License**

Sherlock uses a hybrid licensing model to balance open innovation with sustainability:

- **Apache 2.0** for SDKs, client libraries, examples and documentation – commercial use, modification and redistribution are permitted.

- **Business Source License 1.1 (BUSL)** for the core server – free for non‑commercial use; commercial use or redistribution requires a licence agreement. The BUSL portion automatically converts to Apache 2.0 three years after release.

For full terms see [LICENSE.md](LICENSE.md), [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-BUSL](LICENSE-BUSL). If you plan to build a commercial product or deploy Sherlock for customers, please contact the maintainers at **licensing@Sherlock.ai**.

## 🤝 **Contributing**

We welcome contributions from the community! To get started:

1. **Fork this repository** and clone your fork locally
2. **Create a virtual environment** and install development dependencies (`pip install -r requirements-python313.txt` plus `pytest`, `black`, `ruff`, `mypy`)
3. **Create a feature branch** (`git checkout -b feature/your-feature`)
4. **Write clear, well‑tested code** and adhere to the PEP 8 style. Use Black for formatting, Ruff for linting and MyPy for type checking
5. **Run tests** using pytest and ensure all tests pass before submitting a pull request
6. **Submit a PR** with a clear description and reference any related issues or features

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines on code style, commit message format, testing strategy and the PR checklist.

## 📚 **Documentation & Examples**

Sherlock includes extensive documentation in the `docs/` directory:

- **[Agent Capabilities Guide](AGENT_CAPABILITIES.md)** – comprehensive guide to all available agents and their tasks/actions
- **[Installation Guide](docs/INSTALLATION.md)** – step‑by‑step setup instructions including Windows‑specific steps and verification procedures
- **[Configuration Guide](docs/CONFIGURATION.md)** – description of the YAML configuration and environment variables with tuning tips
- **[Examples & Use Cases](docs/EXAMPLES.md)** – a collection of practical workflows and advanced scenarios to try out
- **[Hybrid API Documentation](docs/HYBRID_API.md)** – full specification of the async translation API including request/response formats
- **[Connectivity Test Report](docs/CONNECTIVITY_TEST_REPORT.md)** – record of a comprehensive connectivity test demonstrating 100% success and highlighting fallback mechanisms for missing infrastructure

Refer to these documents to deepen your understanding of the system.

## 🛠️ **Troubleshooting & Support**

Common issues and fixes are documented in the various guides:

- **WebSocket or API failures**: ensure that the backend services are running on the correct ports and that CORS settings permit your client origin
- **Missing data or charts not rendering**: verify MongoDB connectivity and that Kafka topics contain events
- **Port conflicts**: change the port arguments when launching uvicorn or set the PORT environment variable for React

For further assistance, please open an issue on the GitHub repository or start a discussion. License questions should be directed to **Sherlockanalytics@gmail.com**.

## 📌 **Roadmap**

Upcoming features and enhancements include JWT authentication, advanced rate limiting, real‑time notifications, machine‑learning model agents, enhanced monitoring, Kubernetes deployment and multi‑tenant support. See [CHANGELOG.md](CHANGELOG.md) for a history of changes and planned features.

## 🧾 **Acknowledgements**

Sherlock builds upon open‑source libraries such as FastAPI, Pandas, scikit‑learn, NumPy and many others. We thank their maintainers and contributors for their efforts. The project also draws inspiration from best practices in modern Data Science and data engineering.

---

**© 2024 Sherlock. All rights reserved.**  
*Building the future of data analytics through sustainable open source innovation.*
