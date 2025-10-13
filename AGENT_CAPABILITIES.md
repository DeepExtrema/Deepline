# Agent Capabilities Guide

## Overview

Sherlock provides a multi-agent system for end-to-end data science workflows. Each agent specializes in different aspects of the data science pipeline, from exploratory analysis to feature engineering to machine learning model training. This guide provides a comprehensive overview of all available agents and their capabilities.

## Quick Reference

| Agent | Purpose | Key Actions |
|-------|---------|-------------|
| **EDA Agent** | Exploratory Data Analysis | Data loading, statistics, visualization, outlier detection |
| **Refinery Agent** | Data Quality & Feature Engineering | Quality checks, drift detection, feature transformation, encoding |
| **Model Agent** | Machine Learning | Model training, evaluation, hyperparameter tuning, experiment tracking |
| **Custom Agent** | Custom Operations | Script execution, API calls, custom processing |

---

## EDA Agent (Exploratory Data Analysis)

**Purpose:** Load, analyze, and visualize datasets to understand data characteristics and quality.

**Port:** 8001  
**URL:** `http://localhost:8001`

### Available Actions

#### 1. `analyze`
Comprehensive exploratory data analysis including statistics, distributions, and correlations.

**Use Cases:**
- Initial data exploration
- Understanding variable distributions
- Identifying patterns and relationships

**Example:**
```json
{
  "agent": "eda",
  "action": "analyze",
  "args": {
    "data_path": "customer_data.csv",
    "include_correlations": true,
    "include_distributions": true
  }
}
```

#### 2. `clean`
Data cleaning operations including missing value handling and outlier detection.

**Use Cases:**
- Remove or impute missing values
- Detect and handle outliers
- Basic data quality improvements

**Example:**
```json
{
  "agent": "eda",
  "action": "clean",
  "args": {
    "data_path": "customer_data.csv",
    "handle_missing": "drop",
    "outlier_method": "iqr"
  }
}
```

#### 3. `transform`
Basic data transformations and type conversions.

**Use Cases:**
- Type conversions
- Basic feature transformations
- Data normalization

**Example:**
```json
{
  "agent": "eda",
  "action": "transform",
  "args": {
    "data_path": "customer_data.csv",
    "transformations": {
      "date_column": "datetime",
      "price": "float"
    }
  }
}
```

#### 4. `explore`
Interactive data exploration with statistical summaries.

**Use Cases:**
- Quick data overview
- Column statistics
- Data profiling

**Example:**
```json
{
  "agent": "eda",
  "action": "explore",
  "args": {
    "data_path": "customer_data.csv",
    "generate_profile": true
  }
}
```

#### 5. `preprocess`
Preprocessing pipeline for ML-ready data.

**Use Cases:**
- Prepare data for modeling
- Standard preprocessing workflows
- Train/test splits

**Example:**
```json
{
  "agent": "eda",
  "action": "preprocess",
  "args": {
    "data_path": "customer_data.csv",
    "target_column": "churn",
    "test_size": 0.2
  }
}
```

---

## Refinery Agent (Data Quality & Feature Engineering)

**Purpose:** Ensure data quality through validation checks and perform sophisticated feature engineering transformations.

**Port:** 8005  
**URL:** `http://localhost:8005`

The Refinery Agent operates in two distinct modes:
- **Data Quality Mode:** Read-only validation and analysis
- **Feature Engineering Mode:** Transformative operations

### Data Quality Actions (Read-Only)

#### 1. `check_schema_consistency`
Validate data schema against expected structure.

**Use Cases:**
- Verify column presence and types
- Ensure data contract compliance
- Schema validation in pipelines

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_schema_consistency",
  "args": {
    "data_path": "customer_data.csv",
    "expected_schema": {
      "columns": ["customer_id", "age", "purchase_amount", "churn"]
    }
  }
}
```

#### 2. `check_missing_values`
Analyze missing data patterns and severity.

**Use Cases:**
- Identify columns with high missing rates
- Detect systematic missingness
- Determine imputation strategies

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_missing_values",
  "args": {
    "data_path": "customer_data.csv",
    "threshold": 0.5
  }
}
```

#### 3. `check_distributions`
Analyze statistical distributions of features.

**Use Cases:**
- Detect skewed distributions
- Identify transformation needs
- Assess normality

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_distributions",
  "args": {
    "data_path": "customer_data.csv"
  }
}
```

#### 4. `check_duplicates`
Detect duplicate rows or values.

**Use Cases:**
- Find exact duplicates
- Identify near-duplicates
- Data quality validation

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_duplicates",
  "args": {
    "data_path": "customer_data.csv",
    "subset": ["customer_id", "transaction_date"]
  }
}
```

#### 5. `check_leakage`
Detect potential data leakage issues.

**Use Cases:**
- Identify features with perfect correlation to target
- Find temporal leakage
- Prevent overfitting

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_leakage",
  "args": {
    "data_path": "customer_data.csv",
    "target_col": "churn"
  }
}
```

#### 6. `check_drift`
Detect data drift between reference and current data.

**Use Cases:**
- Monitor production data quality
- Detect distribution shifts
- Validate model assumptions

**Example:**
```json
{
  "agent": "refinery",
  "action": "check_drift",
  "args": {
    "current_data_path": "current_data.csv",
    "reference_data_path": "training_data.csv"
  }
}
```

#### 7. `comprehensive_quality_report`
Generate a complete data quality report.

**Use Cases:**
- Initial data assessment
- Quality gate in pipelines
- Comprehensive data profiling

**Example:**
```json
{
  "agent": "refinery",
  "action": "comprehensive_quality_report",
  "args": {
    "data_path": "customer_data.csv",
    "target_col": "churn"
  }
}
```

### Feature Engineering Actions (Transformative)

#### 8. `assign_feature_roles`
Automatically detect and assign roles to features (numeric, categorical, datetime, text).

**Use Cases:**
- Initialize feature engineering pipeline
- Automatic feature type detection
- Set up transformations

**Example:**
```json
{
  "agent": "refinery",
  "action": "assign_feature_roles",
  "args": {
    "data_path": "customer_data.csv",
    "target_col": "churn",
    "run_id": "run_001"
  }
}
```

#### 9. `basic_impute_missing_values`
Fill missing values using basic strategies.

**Use Cases:**
- Mean/median imputation
- Mode imputation for categorical
- Forward/backward fill

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_impute_missing_values",
  "args": {
    "run_id": "run_001",
    "strategy": "auto"
  }
}
```

#### 10. `advanced_impute_missing_values`
Advanced imputation using ML models (KNN, iterative).

**Use Cases:**
- Sophisticated missing value handling
- Multivariate imputation
- High-quality imputations

**Example:**
```json
{
  "agent": "refinery",
  "action": "advanced_impute_missing_values",
  "args": {
    "run_id": "run_001",
    "method": "knn",
    "n_neighbors": 5
  }
}
```

#### 11. `basic_scale_numeric_features`
Normalize or standardize numeric features.

**Use Cases:**
- Standard scaling (z-score)
- Min-max normalization
- Robust scaling

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_scale_numeric_features",
  "args": {
    "run_id": "run_001",
    "method": "standard"
  }
}
```

#### 12. `basic_encode_categorical_features`
Encode categorical variables using standard techniques.

**Use Cases:**
- One-hot encoding
- Label encoding
- Ordinal encoding

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_encode_categorical_features",
  "args": {
    "run_id": "run_001",
    "strategy": "auto"
  }
}
```

#### 13. `advanced_encode_categorical_features`
Advanced encoding techniques (target encoding, weight of evidence).

**Use Cases:**
- Target encoding for high-cardinality
- Weight of evidence encoding
- Feature hashing

**Example:**
```json
{
  "agent": "refinery",
  "action": "advanced_encode_categorical_features",
  "args": {
    "run_id": "run_001",
    "method": "target",
    "smoothing": 1.0
  }
}
```

#### 14. `basic_generate_datetime_features`
Extract datetime components (year, month, day, hour).

**Use Cases:**
- Extract temporal features
- Generate cyclical features
- Holiday indicators

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_generate_datetime_features",
  "args": {
    "run_id": "run_001",
    "country": "US"
  }
}
```

#### 15. `basic_vectorise_text_features`
Convert text to numerical vectors using TF-IDF or embeddings.

**Use Cases:**
- Text feature extraction
- Document embeddings
- Sentiment features

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_vectorise_text_features",
  "args": {
    "run_id": "run_001",
    "model": "tfidf",
    "max_features": 5000
  }
}
```

#### 16. `basic_generate_interactions`
Create polynomial feature interactions.

**Use Cases:**
- Feature combinations
- Polynomial features
- Interaction terms

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_generate_interactions",
  "args": {
    "run_id": "run_001",
    "max_degree": 2
  }
}
```

#### 17. `feature_interactions`
Advanced feature interaction generation.

**Use Cases:**
- Automatic interaction discovery
- Domain-specific interactions
- Complex feature combinations

**Example:**
```json
{
  "agent": "refinery",
  "action": "feature_interactions",
  "args": {
    "run_id": "run_001",
    "method": "auto",
    "top_k": 20
  }
}
```

#### 18. `basic_select_features`
Select important features using statistical methods.

**Use Cases:**
- Feature selection for modeling
- Dimensionality reduction
- Remove redundant features

**Example:**
```json
{
  "agent": "refinery",
  "action": "basic_select_features",
  "args": {
    "run_id": "run_001",
    "method": "correlation",
    "k": 50
  }
}
```

#### 19. `advanced_feature_selection`
Advanced feature selection using ML models (SHAP, permutation importance).

**Use Cases:**
- Model-based feature selection
- SHAP value analysis
- Recursive feature elimination

**Example:**
```json
{
  "agent": "refinery",
  "action": "advanced_feature_selection",
  "args": {
    "run_id": "run_001",
    "method": "shap_top_k",
    "k": 100
  }
}
```

#### 20. `execute_feature_pipeline`
Execute complete feature engineering pipeline.

**Use Cases:**
- End-to-end feature engineering
- Reproducible transformations
- Pipeline orchestration

**Example:**
```json
{
  "agent": "refinery",
  "action": "execute_feature_pipeline",
  "args": {
    "data_path": "customer_data.csv",
    "run_id": "run_001"
  }
}
```

#### 21. `save_fe_pipeline`
Save feature engineering pipeline for reuse.

**Use Cases:**
- Pipeline persistence
- Deployment preparation
- Inference-time transformations

**Example:**
```json
{
  "agent": "refinery",
  "action": "save_fe_pipeline",
  "args": {
    "run_id": "run_001"
  }
}
```

#### 22. `pipeline_persistence`
Advanced pipeline persistence with versioning and enhanced tracking capabilities.

**Use Cases:**
- Pipeline versioning with metadata
- Advanced persistence strategies
- Production deployment with full audit trail

**Example:**
```json
{
  "agent": "refinery",
  "action": "pipeline_persistence",
  "args": {
    "run_id": "run_001",
    "version": "1.0",
    "metadata": {
      "author": "data_scientist",
      "description": "Customer churn feature pipeline"
    }
  }
}
```

---

## Model Agent (Machine Learning)

**Purpose:** Train, evaluate, and manage machine learning models with comprehensive experiment tracking.

**Port:** 8002  
**URL:** `http://localhost:8002`

### Class Imbalance & Sampling

#### 1. `analyze_class_imbalance`
Quantify class imbalance and recommend sampling strategies.

**Use Cases:**
- Detect imbalanced datasets
- Choose sampling strategy
- Evaluate imbalance severity

**Example:**
```json
{
  "agent": "model",
  "action": "analyze_class_imbalance",
  "args": {
    "data_path": "customer_data.csv",
    "target_column": "churn"
  }
}
```

#### 2. `apply_sampling_strategy`
Apply resampling techniques to balance classes.

**Available Strategies:**
- `smote`: Synthetic Minority Over-sampling Technique
- `adasyn`: Adaptive Synthetic Sampling
- `borderline_smote`: Borderline SMOTE
- `random_under`: Random Under-sampling
- `tomek_links`: Tomek Links cleaning
- `smoteenn`: SMOTE + Edited Nearest Neighbors
- `smotetomek`: SMOTE + Tomek Links

**Example:**
```json
{
  "agent": "model",
  "action": "apply_sampling_strategy",
  "args": {
    "data_path": "customer_data.csv",
    "target_column": "churn",
    "sampling_strategy": "smote"
  }
}
```

#### 3. `quantify_imbalance`
Calculate imbalance metrics (G-mean, prevalence).

**Use Cases:**
- Measure class distribution
- Track imbalance over time
- Compare datasets

**Example:**
```json
{
  "agent": "model",
  "action": "quantify_imbalance",
  "args": {
    "data_path": "customer_data.csv",
    "target_column": "churn"
  }
}
```

### Model Training & Evaluation

#### 4. `train_model`
Train a machine learning model with specified algorithm.

**Supported Algorithms:**
- `decision_tree`: Decision Tree Classifier
- `random_forest`: Random Forest Classifier
- `gradient_boosting`: Gradient Boosting Classifier
- `knn`: K-Nearest Neighbors
- `naive_bayes`: Gaussian Naive Bayes
- `logistic_regression`: Logistic Regression
- `svm`: Support Vector Machine

**Example:**
```json
{
  "agent": "model",
  "action": "train_model",
  "args": {
    "experiment_id": "exp_001",
    "model_type": "random_forest",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 10,
      "class_weight": "balanced"
    }
  }
}
```

#### 5. `cross_validate`
Perform k-fold cross-validation.

**Use Cases:**
- Evaluate model stability
- Detect overfitting
- Choose best model

**Example:**
```json
{
  "agent": "model",
  "action": "cross_validate",
  "args": {
    "experiment_id": "exp_001",
    "model_type": "random_forest",
    "cv_folds": 5,
    "split_strategy": "stratified"
  }
}
```

#### 6. `evaluate_model`
Comprehensive model evaluation with multiple metrics.

**Metrics Provided:**
- Accuracy, Precision, Recall, F1-score
- ROC AUC, Average Precision
- Cohen's Kappa, Matthews Correlation
- Confusion Matrix
- Classification Report

**Example:**
```json
{
  "agent": "model",
  "action": "evaluate_model",
  "args": {
    "experiment_id": "exp_001",
    "model_id": "model_rf_001"
  }
}
```

#### 7. `hyperparameter_tune`
Optimize hyperparameters using grid search or random search.

**Use Cases:**
- Find best hyperparameters
- Improve model performance
- Automated optimization

**Example:**
```json
{
  "agent": "model",
  "action": "hyperparameter_tune",
  "args": {
    "experiment_id": "exp_001",
    "model_type": "random_forest",
    "search_space": {
      "n_estimators": [50, 100, 200],
      "max_depth": [5, 10, 20]
    },
    "search_method": "grid"
  }
}
```

#### 8. `detect_overfitting`
Analyze train vs validation performance to detect overfitting.

**Use Cases:**
- Identify overfitting
- Guide regularization
- Validate model generalization

**Example:**
```json
{
  "agent": "model",
  "action": "detect_overfitting",
  "args": {
    "experiment_id": "exp_001",
    "model_id": "model_rf_001"
  }
}
```

### Baseline & Sanity Checks

#### 9. `run_baseline_models`
Train simple baseline models for comparison.

**Baseline Models:**
- Random prediction
- Majority class prediction
- Naive Bayes
- Simple decision tree

**Example:**
```json
{
  "agent": "model",
  "action": "run_baseline_models",
  "args": {
    "experiment_id": "exp_001",
    "baseline_models": ["baseline_random", "baseline_majority", "naive_bayes"]
  }
}
```

#### 10. `detect_leakage`
Test for data leakage by shuffling target variable.

**Use Cases:**
- Verify no information leakage
- Validate feature engineering
- Ensure model validity

**Example:**
```json
{
  "agent": "model",
  "action": "detect_leakage",
  "args": {
    "experiment_id": "exp_001"
  }
}
```

#### 11. `association_analysis`
Analyze feature-target correlations.

**Use Cases:**
- Identify strong predictors
- Detect potential leakage
- Guide feature selection

**Example:**
```json
{
  "agent": "model",
  "action": "association_analysis",
  "args": {
    "experiment_id": "exp_001",
    "max_rules": 10,
    "min_confidence": 0.5
  }
}
```

#### 12. `sanity_checks`
Run comprehensive sanity checks on data and model.

**Use Cases:**
- Validate data quality
- Check model assumptions
- Ensure reasonable results

**Example:**
```json
{
  "agent": "model",
  "action": "sanity_checks",
  "args": {
    "experiment_id": "exp_001"
  }
}
```

### Experiment Tracking

#### 13. `log_experiment`
Log experiment details to MLflow.

**Use Cases:**
- Track experiment metadata
- Record parameters
- Document experiments

**Example:**
```json
{
  "agent": "model",
  "action": "log_experiment",
  "args": {
    "experiment_id": "exp_001",
    "experiment_name": "customer_churn_v1",
    "tags": {
      "business_unit": "marketing",
      "priority": "high"
    }
  }
}
```

#### 14. `track_metrics`
Log metrics to experiment tracking system.

**Use Cases:**
- Record model performance
- Track training progress
- Compare experiments

**Example:**
```json
{
  "agent": "model",
  "action": "track_metrics",
  "args": {
    "experiment_id": "exp_001",
    "metrics": {
      "accuracy": 0.85,
      "f1_score": 0.82
    }
  }
}
```

#### 15. `save_artifacts`
Save model artifacts and visualizations.

**Use Cases:**
- Persist trained models
- Store plots and reports
- Enable model deployment

**Example:**
```json
{
  "agent": "model",
  "action": "save_artifacts",
  "args": {
    "experiment_id": "exp_001",
    "artifact_path": "./artifacts/exp_001"
  }
}
```

#### 16. `register_model`
Register model in model registry for deployment.

**Use Cases:**
- Model versioning
- Deployment preparation
- Production tracking

**Example:**
```json
{
  "agent": "model",
  "action": "register_model",
  "args": {
    "experiment_id": "exp_001",
    "model_name": "customer_churn_rf",
    "model_version": "1.0"
  }
}
```

#### 17. `ensure_reproducibility`
Generate reproducibility hash and save context.

**Use Cases:**
- Ensure reproducible results
- Audit trail
- Experiment replication

**Example:**
```json
{
  "agent": "model",
  "action": "ensure_reproducibility",
  "args": {
    "experiment_id": "exp_001"
  }
}
```

---

## Custom Agent

**Purpose:** Execute custom scripts, API calls, and specialized processing tasks.

### Available Actions

#### 1. `execute`
Execute custom code or scripts.

**Use Cases:**
- Run custom Python scripts
- Execute business logic
- Custom data processing

**Example:**
```json
{
  "agent": "custom",
  "action": "execute",
  "args": {
    "script_path": "custom_processing.py",
    "params": {
      "input_file": "data.csv",
      "output_file": "processed.csv"
    }
  }
}
```

#### 2. `process`
Generic processing operation.

**Use Cases:**
- Custom transformations
- Business-specific logic
- Integration points

**Example:**
```json
{
  "agent": "custom",
  "action": "process",
  "args": {
    "operation": "custom_transform",
    "data": "input_data.csv"
  }
}
```

#### 3. `run_script`
Run a standalone script.

**Example:**
```json
{
  "agent": "custom",
  "action": "run_script",
  "args": {
    "script": "analysis_script.py"
  }
}
```

#### 4. `call_api`
Make external API calls.

**Use Cases:**
- Integrate external services
- Fetch external data
- Webhook notifications

**Example:**
```json
{
  "agent": "custom",
  "action": "call_api",
  "args": {
    "endpoint": "https://api.example.com/data",
    "method": "POST",
    "payload": {"key": "value"}
  }
}
```

---

## Complete Workflow Examples

### Example 1: End-to-End Data Science Pipeline

```json
{
  "run_name": "customer_churn_analysis",
  "tasks": [
    {
      "agent": "eda",
      "action": "explore",
      "args": {"data_path": "customer_data.csv"}
    },
    {
      "agent": "refinery",
      "action": "comprehensive_quality_report",
      "args": {"data_path": "customer_data.csv", "target_col": "churn"}
    },
    {
      "agent": "refinery",
      "action": "assign_feature_roles",
      "args": {
        "data_path": "customer_data.csv",
        "target_col": "churn",
        "run_id": "churn_001"
      }
    },
    {
      "agent": "refinery",
      "action": "execute_feature_pipeline",
      "args": {
        "data_path": "customer_data.csv",
        "run_id": "churn_001"
      }
    },
    {
      "agent": "model",
      "action": "analyze_class_imbalance",
      "args": {
        "data_path": "customer_data.csv",
        "target_column": "churn"
      }
    },
    {
      "agent": "model",
      "action": "train_model",
      "args": {
        "experiment_id": "exp_churn_001",
        "model_type": "random_forest"
      }
    },
    {
      "agent": "model",
      "action": "evaluate_model",
      "args": {
        "experiment_id": "exp_churn_001"
      }
    }
  ]
}
```

### Example 2: Data Quality Assessment

```json
{
  "run_name": "data_quality_check",
  "tasks": [
    {
      "agent": "refinery",
      "action": "check_schema_consistency",
      "args": {"data_path": "production_data.csv"}
    },
    {
      "agent": "refinery",
      "action": "check_missing_values",
      "args": {"data_path": "production_data.csv"}
    },
    {
      "agent": "refinery",
      "action": "check_duplicates",
      "args": {"data_path": "production_data.csv"}
    },
    {
      "agent": "refinery",
      "action": "check_drift",
      "args": {
        "current_data_path": "production_data.csv",
        "reference_data_path": "training_data.csv"
      }
    }
  ]
}
```

### Example 3: Model Experimentation

```json
{
  "run_name": "model_comparison",
  "tasks": [
    {
      "agent": "model",
      "action": "run_baseline_models",
      "args": {"experiment_id": "exp_001"}
    },
    {
      "agent": "model",
      "action": "train_model",
      "args": {
        "experiment_id": "exp_001",
        "model_type": "random_forest"
      }
    },
    {
      "agent": "model",
      "action": "train_model",
      "args": {
        "experiment_id": "exp_001",
        "model_type": "gradient_boosting"
      }
    },
    {
      "agent": "model",
      "action": "train_model",
      "args": {
        "experiment_id": "exp_001",
        "model_type": "logistic_regression"
      }
    },
    {
      "agent": "model",
      "action": "register_model",
      "args": {
        "experiment_id": "exp_001",
        "model_name": "best_model"
      }
    }
  ]
}
```

---

## API Integration

### Using the Master Orchestrator

**Start a workflow:**
```bash
curl -X POST "http://localhost:8000/workflows/start" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

**Check workflow status:**
```bash
curl "http://localhost:8000/runs/{run_id}/status"
```

**Get workflow artifacts:**
```bash
curl "http://localhost:8000/runs/{run_id}/artifacts"
```

### Query Agent Capabilities

**List all agents:**
```bash
curl "http://localhost:8000/api/agents"
```

**Get agent actions:**
```bash
curl "http://localhost:8000/api/agents/{agent_name}/actions"
```

**Validate agent-action combination:**
```bash
curl -X POST "http://localhost:8000/api/agents/validate" \
  -H "Content-Type: application/json" \
  -d '{"agent": "eda", "action": "analyze"}'
```

---

## Best Practices

### 1. Data Quality First
Always run data quality checks before feature engineering or modeling:
```
refinery/comprehensive_quality_report → refinery/check_drift → proceed to FE
```

### 2. Progressive Complexity
Start simple and add complexity as needed:
```
EDA → Basic FE → Baseline Models → Advanced FE → Advanced Models
```

### 3. Experiment Tracking
Always use experiment IDs for reproducibility:
```
model/log_experiment → model/train_model → model/save_artifacts
```

### 4. Validation at Each Step
Validate outputs before proceeding to next step:
```
Check data quality → Validate transformations → Verify model performance
```

### 5. Use Run IDs
For feature engineering pipelines, maintain run IDs for context:
```
refinery/assign_feature_roles (run_id) → 
refinery/execute_feature_pipeline (run_id) →
refinery/save_fe_pipeline (run_id)
```

---

## Configuration

Agent URLs and settings are configured in `mcp-server/config.yaml`:

```yaml
workflow_engine:
  agent_urls:
    eda_agent: "http://localhost:8001"
    ml_agent: "http://localhost:8002"
    refinery_agent: "http://localhost:8005"
  enabled_agents: ["eda_agent", "ml_agent", "refinery_agent"]
```

---

## Monitoring & Observability

### Health Checks
All agents expose health endpoints:
```bash
curl http://localhost:8001/health  # EDA Agent
curl http://localhost:8002/health  # Model Agent
curl http://localhost:8005/health  # Refinery Agent
```

### Metrics
Prometheus metrics available at `/metrics` on each agent:
- Request counts and durations
- Error rates
- Active experiments/pipelines

### MLflow UI
View experiment tracking:
```bash
# MLflow UI available at http://localhost:5000
mlflow ui
```

---

## Troubleshooting

### Common Issues

**1. Agent Not Available**
- Check agent is running: `curl http://localhost:8001/health`
- Verify agent URL in config.yaml
- Check Docker containers: `docker-compose ps`

**2. Invalid Action**
- Verify action exists: `curl http://localhost:8000/api/agents/{agent}/actions`
- Check action name spelling
- Review agent capabilities in this guide

**3. Missing Dependencies**
- Install required packages: `pip install -r requirements.txt`
- Check Python version: `python --version` (3.13+ required)

**4. Data Not Found**
- Verify file paths are absolute or relative to agent working directory
- Check file permissions
- Ensure data is uploaded via Master Orchestrator

---

## Additional Resources

- **[Master Orchestrator API Guide](mcp-server/master_orchestrator_api.py)** - Complete API documentation
- **[Refinery Agent Guide](mcp-server/REFINERY_AGENT_GUIDE.md)** - Detailed Refinery documentation
- **[ML Workflow Guide](mcp-server/ML_WORKFLOW_GUIDE.md)** - ML agent deep dive
- **[Configuration Guide](docs/CONFIGURATION.md)** - System configuration options
- **[Installation Guide](docs/INSTALLATION.md)** - Setup instructions

---

## Getting Help

- **GitHub Issues:** https://github.com/DeepExtrema/Sherlock-Multiagent-Data-Scientist/issues
- **Documentation:** Check the `docs/` directory for detailed guides
- **API Documentation:** Access Swagger UI at `http://localhost:8000/docs`

---

**Last Updated:** January 2024  
**Version:** 2.1.0
