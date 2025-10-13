#!/usr/bin/env python3
"""
Comprehensive Test Script for ML Agent Fixes
Tests all the improvements made to the ML Agent.
"""

import asyncio
import json
import time
import httpx
import pandas as pd
from pathlib import Path
import logging
import pytest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLAgentFixTester:
    """Test all the ML Agent fixes and improvements."""
    
    def __init__(self):
        self.base_url = "http://localhost:8002"
        self.http_client = httpx.AsyncClient(timeout=30)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def test_health_endpoint(self):
        """Test the improved health endpoint."""
        print("🔍 Testing Health Endpoint...")
        try:
            response = await self.http_client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check passed")
                print(f"   - Status: {data.get('status')}")
                print(f"   - Version: {data.get('version')}")
                print(f"   - App Name: {data.get('app_name')}")
                print(f"   - MLflow Available: {data.get('mlflow_available')}")
                print(f"   - Storage Healthy: {data.get('storage_healthy')}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    async def test_metrics_endpoint(self):
        """Test the Prometheus metrics endpoint."""
        print("🔍 Testing Metrics Endpoint...")
        try:
            response = await self.http_client.get(f"{self.base_url}/metrics")
            if response.status_code == 200:
                metrics_text = response.text
                print("✅ Metrics endpoint working")
                print(f"   - Content type: {response.headers.get('content-type')}")
                print(f"   - Metrics length: {len(metrics_text)} characters")
                # Check for expected metrics
                if "ml_requests_total" in metrics_text:
                    print("   - ML metrics found")
                if "process_cpu_seconds_total" in metrics_text:
                    print("   - System metrics found")
                return True
            else:
                print(f"❌ Metrics endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Metrics endpoint error: {e}")
            return False
    
    async def test_experiments_endpoint(self):
        """Test the improved experiments endpoint with pagination."""
        print("🔍 Testing Experiments Endpoint...")
        try:
            # Test basic listing
            response = await self.http_client.get(f"{self.base_url}/experiments")
            if response.status_code == 200:
                data = response.json()
                print("✅ Experiments endpoint working")
                print(f"   - Experiments count: {len(data.get('experiments', []))}")
                print(f"   - Pagination info: {data.get('pagination', {})}")
                
                # Test with filters
                response_filtered = await self.http_client.get(
                    f"{self.base_url}/experiments?page=1&size=10"
                )
                if response_filtered.status_code == 200:
                    print("   - Pagination working")
                    return True
                else:
                    print("   - Pagination failed")
                    return False
            else:
                print(f"❌ Experiments endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Experiments endpoint error: {e}")
            return False
    
    async def test_class_imbalance_endpoint(self):
        """Test the class imbalance endpoint with iris dataset."""
        print("🔍 Testing Class Imbalance Endpoint...")
        
        # Check if iris.csv exists
        iris_path = Path("iris.csv")
        if not iris_path.exists():
            print("❌ iris.csv not found")
            return False
        
        try:
            # Test class imbalance analysis
            request_data = {
                "task_id": "test_task_001",
                "data_path": str(iris_path.absolute()),
                "target_column": "species",
                "sampling_strategy": "none",
                "random_state": 42,
                "test_size": 0.2,
                "cv_folds": 5
            }
            
            response = await self.http_client.post(
                f"{self.base_url}/class_imbalance",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Class imbalance analysis successful")
                print(f"   - Task ID: {data.get('task_id')}")
                print(f"   - Step: {data.get('step')}")
                print(f"   - Success: {data.get('success')}")
                if data.get('success'):
                    result = data.get('result', {})
                    print(f"   - Experiment ID: {result.get('experiment_id')}")
                    print(f"   - Imbalance ratio: {result.get('imbalance_metrics', {}).get('imbalance_ratio')}")
                return True
            else:
                print(f"❌ Class imbalance failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Class imbalance error: {e}")
            return False
    
    async def test_training_endpoint(self):
        """Test the training endpoint."""
        print("🔍 Testing Training Endpoint...")
        
        try:
            # Test model training
            request_data = {
                "task_id": "test_task_002",
                "experiment_id": "test_exp_001",
                "model_type": "random_forest",
                "hyperparameters": {
                    "n_estimators": 100,
                    "max_depth": 10
                },
                "split_strategy": "stratified",
                "cv_folds": 5,
                "random_state": 42,
                "early_stopping": False,
                "max_iterations": 1000
            }
            
            response = await self.http_client.post(
                f"{self.base_url}/train_validation_test",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Training successful")
                print(f"   - Task ID: {data.get('task_id')}")
                print(f"   - Step: {data.get('step')}")
                print(f"   - Success: {data.get('success')}")
                if data.get('success'):
                    result = data.get('result', {})
                    print(f"   - Model type: {result.get('model_type')}")
                    print(f"   - Accuracy: {result.get('metrics', {}).get('accuracy')}")
                return True
            else:
                print(f"❌ Training failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Training error: {e}")
            return False
    
    async def test_baseline_endpoint(self):
        """Test the baseline sanity endpoint."""
        print("🔍 Testing Baseline Sanity Endpoint...")
        
        try:
            request_data = {
                "task_id": "test_task_003",
                "experiment_id": "test_exp_001",
                "baseline_models": ["baseline_random", "baseline_majority", "naive_bayes"],
                "leakage_test": True,
                "association_analysis": True,
                "max_rules": 5,
                "min_confidence": 0.5
            }
            
            response = await self.http_client.post(
                f"{self.base_url}/baseline_sanity",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Baseline sanity check successful")
                print(f"   - Task ID: {data.get('task_id')}")
                print(f"   - Step: {data.get('step')}")
                print(f"   - Success: {data.get('success')}")
                return True
            else:
                print(f"❌ Baseline sanity failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Baseline sanity error: {e}")
            return False
    
    async def test_configuration_integration(self):
        """Test that configuration is properly integrated."""
        print("🔍 Testing Configuration Integration...")
        try:
            # Test that the health endpoint returns configuration info
            response = await self.http_client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if "app_name" in data and "version" in data:
                    print("✅ Configuration integration working")
                    print(f"   - App Name: {data.get('app_name')}")
                    print(f"   - Version: {data.get('version')}")
                    return True
                else:
                    print("❌ Configuration not properly integrated")
                    return False
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Configuration integration error: {e}")
            return False
    
    async def test_storage_integration(self):
        """Test that persistent storage is working."""
        print("🔍 Testing Storage Integration...")
        try:
            # Test that experiments endpoint works (uses storage)
            response = await self.http_client.get(f"{self.base_url}/experiments")
            if response.status_code == 200:
                print("✅ Storage integration working")
                print("   - Experiments endpoint accessible")
                print("   - Storage backend operational")
                return True
            else:
                print(f"❌ Storage integration failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Storage integration error: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all tests."""
        print("🚀 Starting ML Agent Fixes Test Suite")
        print("=" * 60)
        
        tests = [
            ("Health Endpoint", self.test_health_endpoint),
            ("Metrics Endpoint", self.test_metrics_endpoint),
            ("Experiments Endpoint", self.test_experiments_endpoint),
            ("Configuration Integration", self.test_configuration_integration),
            ("Storage Integration", self.test_storage_integration),
            ("Class Imbalance", self.test_class_imbalance_endpoint),
            ("Training", self.test_training_endpoint),
            ("Baseline Sanity", self.test_baseline_endpoint),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            try:
                result = await test_func()
                results[test_name] = result
                print(f"   Status: {'✅ PASSED' if result else '❌ FAILED'}")
            except Exception as e:
                print(f"   Status: ❌ ERROR - {e}")
                results[test_name] = False
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! ML Agent fixes are working correctly.")
        else:
            print("⚠️  Some tests failed. Check the issues above.")
        
        return results

@pytest.mark.skip(reason="Requires additional Python packages or external services")
@pytest.mark.skip(reason="Requires additional Python packages or external services")
async def main():
    """Main function."""
    async with MLAgentFixTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 