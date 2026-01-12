#!/usr/bin/env python3
"""
Simple Standalone Server for Sherlock - End-to-End Demo
Demonstrates basic workflow functionality without complex dependencies.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import pandas as pd
import numpy as np
from datetime import datetime
import json
import os

# Initialize FastAPI app
app = FastAPI(
    title="Sherlock Simple API",
    description="Simplified API for end-to-end demonstration",
    version="2.1.0"
)

# In-memory storage
workflows = {}
datasets = {}

# Models
class Task(BaseModel):
    agent: str
    action: str
    args: Dict[str, Any]

class WorkflowRequest(BaseModel):
    run_name: str
    tasks: List[Task]

class DatasetInfo(BaseModel):
    name: str
    rows: int
    columns: int
    column_names: List[str]

# Health endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Sherlock Simple API",
        "version": "2.1.0",
        "timestamp": datetime.now().isoformat()
    }

# Dataset endpoints
@app.post("/datasets/create")
async def create_dataset(name: str, rows: int = 100, columns: int = 5):
    """Create a sample dataset for demonstration."""
    try:
        # Generate sample data
        data = {}
        for i in range(columns):
            if i == 0:
                data[f"id"] = list(range(rows))
            elif i % 2 == 0:
                data[f"feature_{i}"] = np.random.randn(rows)
            else:
                data[f"category_{i}"] = np.random.choice(['A', 'B', 'C'], rows)

        df = pd.DataFrame(data)
        datasets[name] = df

        return {
            "name": name,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "preview": json.loads(df.head().to_json(orient='records'))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/datasets")
async def list_datasets():
    """List all available datasets."""
    return {
        "datasets": [
            {
                "name": name,
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": list(df.columns)
            }
            for name, df in datasets.items()
        ]
    }

@app.get("/datasets/{name}")
async def get_dataset(name: str):
    """Get dataset information."""
    if name not in datasets:
        raise HTTPException(status_code=404, detail=f"Dataset {name} not found")

    df = datasets[name]
    return {
        "name": name,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "preview": json.loads(df.head(10).to_json(orient='records')),
        "statistics": json.loads(df.describe().to_json())
    }

# Workflow endpoints
@app.post("/workflows/start")
async def start_workflow(workflow: WorkflowRequest):
    """Start a workflow execution."""
    run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        results = []
        for task in workflow.tasks:
            if task.agent == "eda_agent":
                if task.action == "load_data":
                    dataset_name = task.args.get("name", "sample_data")
                    if dataset_name not in datasets:
                        # Create sample dataset if it doesn't exist
                        df = pd.DataFrame({
                            'id': range(100),
                            'value': np.random.randn(100),
                            'category': np.random.choice(['A', 'B', 'C'], 100)
                        })
                        datasets[dataset_name] = df

                    df = datasets[dataset_name]
                    results.append({
                        "task": "load_data",
                        "status": "completed",
                        "result": {
                            "dataset": dataset_name,
                            "rows": len(df),
                            "columns": len(df.columns)
                        }
                    })

                elif task.action == "analyze":
                    dataset_name = task.args.get("name", "sample_data")
                    if dataset_name in datasets:
                        df = datasets[dataset_name]
                        results.append({
                            "task": "analyze",
                            "status": "completed",
                            "result": {
                                "dataset": dataset_name,
                                "shape": df.shape,
                                "missing_values": df.isnull().sum().to_dict(),
                                "statistics": json.loads(df.describe().to_json())
                            }
                        })
                    else:
                        results.append({
                            "task": "analyze",
                            "status": "failed",
                            "error": f"Dataset {dataset_name} not found"
                        })

        workflows[run_id] = {
            "run_name": workflow.run_name,
            "run_id": run_id,
            "status": "completed",
            "tasks": results,
            "created_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat()
        }

        return workflows[run_id]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workflows")
async def list_workflows():
    """List all workflows."""
    return {"workflows": list(workflows.values())}

@app.get("/workflows/{run_id}")
async def get_workflow(run_id: str):
    """Get workflow status and results."""
    if run_id not in workflows:
        raise HTTPException(status_code=404, detail=f"Workflow {run_id} not found")
    return workflows[run_id]

# Stats endpoint
@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    return {
        "total_datasets": len(datasets),
        "total_workflows": len(workflows),
        "completed_workflows": sum(1 for w in workflows.values() if w["status"] == "completed"),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Starting Sherlock Simple API Server...")
    print("📍 Service URL: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("=" * 60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
