#!/usr/bin/env python3
"""
Authentication Security Tests

Tests for:
- JWT token validation
- Authentication bypass prevention
- Token expiration handling
- Invalid token rejection
"""

import pytest
import httpx
import jwt
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add mcp-server to path for imports
mcp_server_path = Path(__file__).parent.parent.parent / "mcp-server"
sys.path.insert(0, str(mcp_server_path))

# Import security module
try:
    from security.authentication import (
        AuthenticationManager,
        SecureConfig,
        SECRET_KEY,
        ALGORITHM,
        TokenData,
    )
except ImportError as e:
    # Fallback for running tests from different locations
    import importlib.util
    spec = importlib.util.spec_from_file_location("authentication", mcp_server_path / "security" / "authentication.py")
    auth_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auth_module)
    AuthenticationManager = auth_module.AuthenticationManager
    SecureConfig = auth_module.SecureConfig
    SECRET_KEY = auth_module.SECRET_KEY
    ALGORITHM = auth_module.ALGORITHM
    TokenData = auth_module.TokenData


class TestAuthenticationSecurity:
    """Test authentication security features"""

    def setup_method(self):
        """Set up test fixtures"""
        self.auth_manager = AuthenticationManager()
        self.secret_key = SECRET_KEY

    def test_valid_token_authentication(self):
        """Test that valid tokens are accepted"""
        # Create a valid token
        token_data = {
            "sub": "test_user",
            "role": "viewer",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(token_data, self.secret_key, algorithm=ALGORITHM)
        
        # Verify token
        decoded = self.auth_manager.verify_token(token)
        assert decoded.username == "test_user"
        assert decoded.role == "viewer"

    def test_expired_token_rejection(self):
        """Test that expired tokens are rejected"""
        # Create an expired token
        token_data = {
            "sub": "test_user",
            "role": "viewer",
            "exp": datetime.utcnow() - timedelta(minutes=1)  # Expired
        }
        token = jwt.encode(token_data, self.secret_key, algorithm=ALGORITHM)
        
        # Verify token is rejected
        with pytest.raises(Exception) as exc_info:
            self.auth_manager.verify_token(token)
        assert "expired" in str(exc_info.value).lower()

    def test_invalid_signature_rejection(self):
        """Test that tokens with invalid signatures are rejected"""
        # Create a token with wrong secret
        token_data = {
            "sub": "test_user",
            "role": "admin",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(token_data, "wrong_secret_key", algorithm=ALGORITHM)
        
        # Verify token is rejected
        with pytest.raises(Exception) as exc_info:
            self.auth_manager.verify_token(token)
        assert "invalid" in str(exc_info.value).lower()

    def test_malformed_token_rejection(self):
        """Test that malformed tokens are rejected"""
        malformed_tokens = [
            "not.a.token",
            "invalid_token_format",
            "",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
        ]
        
        for token in malformed_tokens:
            with pytest.raises(Exception):
                self.auth_manager.verify_token(token)

    def test_token_without_subject_rejection(self):
        """Test that tokens without required subject are rejected"""
        # Create a token without 'sub' claim
        token_data = {
            "role": "viewer",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(token_data, self.secret_key, algorithm=ALGORITHM)
        
        # Verify token is rejected
        with pytest.raises(Exception) as exc_info:
            self.auth_manager.verify_token(token)
        assert "invalid" in str(exc_info.value).lower()

    def test_token_blacklist(self):
        """Test that revoked tokens are rejected"""
        # Create a valid token
        token_data = {
            "sub": "test_user",
            "role": "viewer",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(token_data, self.secret_key, algorithm=ALGORITHM)
        
        # Verify token works initially
        decoded = self.auth_manager.verify_token(token)
        assert decoded.username == "test_user"
        
        # Revoke the token
        self.auth_manager.revoke_token(token)
        
        # Verify token is now rejected
        with pytest.raises(Exception) as exc_info:
            self.auth_manager.verify_token(token)
        assert "revoked" in str(exc_info.value).lower()


class TestSecureConfiguration:
    """Test secure configuration handling"""

    def test_encryption_decryption(self):
        """Test that encryption and decryption work correctly"""
        original_value = "my_secret_api_key"
        
        # Encrypt value
        encrypted = SecureConfig.encrypt_value(original_value)
        assert encrypted != original_value
        
        # Decrypt value
        decrypted = SecureConfig.decrypt_value(encrypted)
        assert decrypted == original_value

    def test_empty_value_handling(self):
        """Test that empty values are handled properly"""
        encrypted = SecureConfig.encrypt_value("")
        assert encrypted == ""
        
        decrypted = SecureConfig.decrypt_value("")
        assert decrypted == ""

    def test_secure_env_with_encrypted_prefix(self):
        """Test that ENC: prefix triggers decryption"""
        # This test verifies the ENC: prefix mechanism
        import os
        original_value = "test_secret"
        encrypted = SecureConfig.encrypt_value(original_value)
        
        # Simulate environment variable with ENC: prefix
        os.environ["TEST_SECRET"] = f"ENC:{encrypted}"
        
        # Get secure env value
        decrypted = SecureConfig.get_secure_env("TEST_SECRET")
        assert decrypted == original_value
        
        # Cleanup
        del os.environ["TEST_SECRET"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
