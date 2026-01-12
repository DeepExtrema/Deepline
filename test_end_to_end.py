#!/usr/bin/env python3
"""
End-to-End Test for Sherlock System
Demonstrates complete workflow from dataset creation to analysis.
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print(f"{'=' * 80}\n")

def test_health():
    """Test health endpoint."""
    print_section("1. Health Check")
    response = requests.get(f"{BASE_URL}/health")
    data = response.json()
    print(f"✓ Service Status: {data['status']}")
    print(f"✓ Service Name: {data['service']}")
    print(f"✓ Version: {data['version']}")
    print(f"✓ Timestamp: {data['timestamp']}")
    return response.status_code == 200

def test_create_dataset():
    """Test dataset creation."""
    print_section("2. Create Sample Dataset")
    response = requests.post(
        f"{BASE_URL}/datasets/create",
        params={"name": "customer_data", "rows": 150, "columns": 6}
    )
    data = response.json()
    print(f"✓ Dataset Name: {data['name']}")
    print(f"✓ Rows: {data['rows']}")
    print(f"✓ Columns: {data['columns']}")
    print(f"✓ Column Names: {', '.join(data['column_names'])}")
    print(f"\n  Preview (first 3 rows):")
    for i, row in enumerate(data['preview'][:3], 1):
        print(f"    Row {i}: {json.dumps(row, indent=6)}")
    return response.status_code == 200

def test_list_datasets():
    """Test listing datasets."""
    print_section("3. List All Datasets")
    response = requests.get(f"{BASE_URL}/datasets")
    data = response.json()
    print(f"✓ Total Datasets: {len(data['datasets'])}")
    for ds in data['datasets']:
        print(f"  - {ds['name']}: {ds['rows']} rows, {ds['columns']} columns")
    return response.status_code == 200

def test_get_dataset():
    """Test getting dataset details."""
    print_section("4. Get Dataset Details")
    response = requests.get(f"{BASE_URL}/datasets/customer_data")
    data = response.json()
    print(f"✓ Dataset: {data['name']}")
    print(f"✓ Shape: {data['rows']} rows × {data['columns']} columns")
    print(f"\n  Data Types:")
    for col, dtype in data['dtypes'].items():
        print(f"    - {col}: {dtype}")
    print(f"\n  Statistics Summary:")
    stats = data['statistics']
    if 'feature_2' in stats:
        print(f"    feature_2 mean: {stats['feature_2']['mean']:.4f}")
        print(f"    feature_2 std: {stats['feature_2']['std']:.4f}")
    return response.status_code == 200

def test_start_workflow():
    """Test starting a workflow."""
    print_section("5. Start Data Analysis Workflow")
    workflow_data = {
        "run_name": "customer_analysis",
        "tasks": [
            {
                "agent": "eda_agent",
                "action": "load_data",
                "args": {"name": "customer_data"}
            },
            {
                "agent": "eda_agent",
                "action": "analyze",
                "args": {"name": "customer_data"}
            }
        ]
    }

    response = requests.post(f"{BASE_URL}/workflows/start", json=workflow_data)
    data = response.json()
    print(f"✓ Workflow Name: {data['run_name']}")
    print(f"✓ Run ID: {data['run_id']}")
    print(f"✓ Status: {data['status']}")
    print(f"✓ Created: {data['created_at']}")

    print(f"\n  Task Results:")
    for i, task in enumerate(data['tasks'], 1):
        print(f"\n    Task {i}: {task['task']}")
        print(f"      Status: {task['status']}")
        if 'result' in task:
            print(f"      Result: {json.dumps(task['result'], indent=10)[:200]}...")

    return response.status_code == 200, data['run_id']

def test_list_workflows():
    """Test listing workflows."""
    print_section("6. List All Workflows")
    response = requests.get(f"{BASE_URL}/workflows")
    data = response.json()
    print(f"✓ Total Workflows: {len(data['workflows'])}")
    for wf in data['workflows']:
        print(f"  - {wf['run_name']} ({wf['run_id']}): {wf['status']}")
    return response.status_code == 200

def test_get_workflow(run_id):
    """Test getting workflow details."""
    print_section("7. Get Workflow Details")
    response = requests.get(f"{BASE_URL}/workflows/{run_id}")
    data = response.json()
    print(f"✓ Workflow: {data['run_name']}")
    print(f"✓ Run ID: {data['run_id']}")
    print(f"✓ Status: {data['status']}")
    print(f"✓ Tasks Completed: {len(data['tasks'])}")
    return response.status_code == 200

def test_stats():
    """Test system statistics."""
    print_section("8. System Statistics")
    response = requests.get(f"{BASE_URL}/stats")
    data = response.json()
    print(f"✓ Total Datasets: {data['total_datasets']}")
    print(f"✓ Total Workflows: {data['total_workflows']}")
    print(f"✓ Completed Workflows: {data['completed_workflows']}")
    print(f"✓ Timestamp: {data['timestamp']}")
    return response.status_code == 200

def main():
    """Run all end-to-end tests."""
    print(f"\n{'*' * 80}")
    print(f"{'*' * 80}")
    print(f"  SHERLOCK END-TO-END FUNCTIONAL TEST")
    print(f"  Testing complete workflow: Dataset → Analysis → Results")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'*' * 80}")
    print(f"{'*' * 80}")

    results = []
    run_id = None

    try:
        # Run all tests
        results.append(("Health Check", test_health()))
        results.append(("Create Dataset", test_create_dataset()))
        results.append(("List Datasets", test_list_datasets()))
        results.append(("Get Dataset Details", test_get_dataset()))

        success, run_id = test_start_workflow()
        results.append(("Start Workflow", success))

        results.append(("List Workflows", test_list_workflows()))
        if run_id:
            results.append(("Get Workflow Details", test_get_workflow(run_id)))

        results.append(("System Statistics", test_stats()))

        # Print summary
        print_section("TEST SUMMARY")
        passed = sum(1 for _, result in results if result)
        total = len(results)

        print(f"Tests Passed: {passed}/{total}")
        print(f"\nDetailed Results:")
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status}  {name}")

        if passed == total:
            print(f"\n{'🎉 ' * 20}")
            print(f"  ALL TESTS PASSED! System is running end-to-end! ")
            print(f"{'🎉 ' * 20}\n")
            return 0
        else:
            print(f"\n⚠️  Some tests failed. Please check the logs.\n")
            return 1

    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {BASE_URL}")
        print(f"   Make sure the server is running with: python3 simple_server.py")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
