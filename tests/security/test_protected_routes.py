#!/usr/bin/env python3
"""
Protected Routes Security Tests

Tests for:
- Unauthenticated access prevention
- Data leakage on unauthorized access
- Authorization checks on protected endpoints
- Role-based access control enforcement
"""

import pytest
import httpx
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add mcp-server to path for imports
mcp_server_path = Path(__file__).parent.parent.parent / "mcp-server"
sys.path.insert(0, str(mcp_server_path))

# Import with proper path handling
import importlib.util
spec = importlib.util.spec_from_file_location("authentication", mcp_server_path / "security" / "authentication.py")
auth_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth_module)

get_current_user = auth_module.get_current_user
get_current_active_user = auth_module.get_current_active_user
require_role = auth_module.require_role
auth_manager = auth_module.auth_manager
TokenData = auth_module.TokenData
SECRET_KEY = auth_module.SECRET_KEY
ALGORITHM = auth_module.ALGORITHM


# Helper function to create test tokens
def create_test_token(username: str, role: str) -> str:
    """Helper to create JWT tokens for testing"""
    import jwt
    from datetime import datetime, timedelta
    token_data = {
        "sub": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)


# Mock protected endpoints for testing
def create_test_app():
    """Create a test FastAPI app with protected routes"""
    app = FastAPI()

    @app.get("/public")
    async def public_endpoint():
        """Public endpoint - no authentication required"""
        return {"message": "public", "data": "anyone can see this"}

    @app.get("/protected")
    async def protected_endpoint(current_user: TokenData = Depends(get_current_user)):
        """Protected endpoint - authentication required"""
        return {
            "message": "protected",
            "user": current_user.username,
            "data": "sensitive information"
        }

    @app.get("/admin-only")
    async def admin_only_endpoint(current_user: TokenData = Depends(get_current_user)):
        """Admin-only endpoint - requires admin role"""
        if current_user.role != "admin":
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin role required"
            )
        return {
            "message": "admin only",
            "data": "confidential admin data",
            "secrets": ["api_key_123", "db_password_456"]
        }

    @app.get("/user/{user_id}/data")
    async def user_data_endpoint(
        user_id: str,
        current_user: TokenData = Depends(get_current_user)
    ):
        """User data endpoint - demonstrates IDOR vulnerability if not checked"""
        # Simulate user-specific data
        user_database = {
            "alice": {"email": "alice@example.com", "ssn": "123-45-6789"},
            "bob": {"email": "bob@example.com", "ssn": "987-65-4321"},
        }
        
        # IDOR prevention: check if requesting user matches resource owner
        if current_user.username != user_id and current_user.role != "admin":
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other user's data"
            )
        
        return {
            "user_id": user_id,
            "data": user_database.get(user_id, {})
        }

    return app


class TestProtectedRoutes:
    """Test protected route access control"""

    def setup_method(self):
        """Set up test fixtures"""
        self.app = create_test_app()
        self.client = TestClient(self.app)

    def test_public_endpoint_no_auth_required(self):
        """Test that public endpoints are accessible without authentication"""
        response = self.client.get("/public")
        assert response.status_code == 200
        assert response.json()["message"] == "public"

    def test_protected_endpoint_requires_auth(self):
        """Test that protected endpoints reject unauthenticated requests"""
        response = self.client.get("/protected")
        # Should return 403 or 401 for missing authentication
        assert response.status_code in [401, 403]

    def test_protected_endpoint_no_data_leakage(self):
        """Test that protected endpoints don't leak sensitive data without auth"""
        response = self.client.get("/protected")
        response_data = response.json()
        
        # Ensure no sensitive information is leaked in error response
        assert "sensitive information" not in str(response_data)
        assert "user" not in response_data or response_data.get("user") is None

    def test_protected_endpoint_with_valid_token(self):
        """Test that protected endpoints work with valid authentication"""
        # Create a valid token for test user
        token = create_test_token("test_user", "viewer")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.client.get("/protected", headers=headers)
        
        assert response.status_code == 200
        assert response.json()["user"] == "test_user"
        assert "sensitive information" in response.json()["data"]

    def test_admin_endpoint_rejects_non_admin(self):
        """Test that admin endpoints reject non-admin users"""
        # Create a token for regular user
        token = create_test_token(
            "regular_user",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.client.get("/admin-only", headers=headers)
        
        # Should be forbidden for non-admin
        assert response.status_code == 403
        assert "admin" in response.json()["detail"].lower()

    def test_admin_endpoint_no_secrets_leakage_on_forbidden(self):
        """Test that admin endpoints don't leak secrets to non-admin users"""
        # Create a token for regular user
        token = create_test_token(
            "regular_user",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.client.get("/admin-only", headers=headers)
        response_data = response.json()
        
        # Ensure no secrets leaked in error response
        assert "api_key" not in str(response_data)
        assert "password" not in str(response_data)
        assert "secrets" not in response_data

    def test_admin_endpoint_allows_admin(self):
        """Test that admin endpoints work for admin users"""
        # Create a token for admin user
        token = create_test_token(
            "admin_user",
            "admin"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.client.get("/admin-only", headers=headers)
        
        assert response.status_code == 200
        assert "secrets" in response.json()


class TestIDORPrevention:
    """Test Insecure Direct Object Reference (IDOR) prevention"""

    def setup_method(self):
        """Set up test fixtures"""
        self.app = create_test_app()
        self.client = TestClient(self.app)

    def test_user_cannot_access_other_user_data(self):
        """Test that users cannot access other users' data (IDOR prevention)"""
        # Create a token for Alice
        token = create_test_token(
            "alice",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access Bob's data
        response = self.client.get("/user/bob/data", headers=headers)
        
        # Should be forbidden
        assert response.status_code == 403
        assert "cannot access" in response.json()["detail"].lower()

    def test_user_can_access_own_data(self):
        """Test that users can access their own data"""
        # Create a token for Alice
        token = create_test_token(
            "alice",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access own data
        response = self.client.get("/user/alice/data", headers=headers)
        
        assert response.status_code == 200
        assert response.json()["user_id"] == "alice"
        assert "email" in response.json()["data"]

    def test_no_pii_leakage_on_unauthorized_access(self):
        """Test that PII is not leaked when IDOR attempt is blocked"""
        # Create a token for Alice
        token = create_test_token(
            "alice",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access Bob's data
        response = self.client.get("/user/bob/data", headers=headers)
        response_data = response.json()
        
        # Ensure no PII leaked in error response
        assert "ssn" not in str(response_data)
        assert "123-45-6789" not in str(response_data)
        assert "987-65-4321" not in str(response_data)
        assert "@example.com" not in str(response_data)

    def test_admin_can_access_any_user_data(self):
        """Test that admin users can access any user's data"""
        # Create a token for admin
        token = create_test_token(
            "admin",
            "admin"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access another user's data
        response = self.client.get("/user/alice/data", headers=headers)
        
        assert response.status_code == 200
        assert response.json()["user_id"] == "alice"

    def test_sequential_id_enumeration_prevention(self):
        """Test that sequential ID enumeration doesn't leak user existence"""
        # Create a token for a user
        token = create_test_token(
            "alice",
            "viewer"
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to enumerate users
        test_users = ["user1", "user2", "user3", "nonexistent"]
        
        for user_id in test_users:
            response = self.client.get(f"/user/{user_id}/data", headers=headers)
            
            # All unauthorized access should return same error
            # Don't distinguish between "user doesn't exist" and "access denied"
            if user_id != "alice":
                assert response.status_code == 403
                # Error message should be generic
                assert "cannot access" in response.json()["detail"].lower()


class TestDataLeakagePrevention:
    """Test data leakage prevention in error responses"""

    def setup_method(self):
        """Set up test fixtures"""
        self.app = create_test_app()
        self.client = TestClient(self.app)

    def test_error_responses_no_stack_trace(self):
        """Test that error responses don't include stack traces"""
        response = self.client.get("/protected")
        response_text = response.text.lower()
        
        # Ensure no stack trace leaked
        assert "traceback" not in response_text
        assert "file \"" not in response_text
        assert "line " not in response_text

    def test_error_responses_no_internal_paths(self):
        """Test that error responses don't reveal internal file paths"""
        response = self.client.get("/protected")
        response_text = response.text.lower()
        
        # Ensure no file paths leaked
        assert "/home/" not in response_text
        assert "/usr/" not in response_text
        assert "/var/" not in response_text
        assert "c:\\" not in response_text

    def test_error_responses_no_database_info(self):
        """Test that error responses don't reveal database information"""
        response = self.client.get("/protected")
        response_text = response.text.lower()
        
        # Ensure no database info leaked
        assert "sql" not in response_text
        assert "database" not in response_text
        assert "mongodb" not in response_text
        assert "redis" not in response_text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
