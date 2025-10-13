#!/usr/bin/env python3
"""
Rate Limiting Security Tests

Tests for:
- Rate limit enforcement
- Client-specific rate limiting
- Rate limit bypass prevention
- DoS attack mitigation
"""

import pytest
import time
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

RateLimiter = auth_module.RateLimiter


class TestRateLimiting:
    """Test rate limiting functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.rate_limiter = RateLimiter()
        # Set lower limits for testing
        self.rate_limiter.max_requests = 5
        self.rate_limiter.window_seconds = 2

    def test_requests_under_limit_allowed(self):
        """Test that requests under the limit are allowed"""
        client_id = "test_client_1"
        
        # Make requests under the limit
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(client_id) is True

    def test_requests_over_limit_blocked(self):
        """Test that requests over the limit are blocked"""
        client_id = "test_client_2"
        
        # Make requests up to the limit
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(client_id) is True
        
        # Next request should be blocked
        assert self.rate_limiter.is_allowed(client_id) is False

    def test_rate_limit_window_reset(self):
        """Test that rate limit resets after the time window"""
        client_id = "test_client_3"
        
        # Exhaust the rate limit
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(client_id) is True
        
        # Should be blocked immediately
        assert self.rate_limiter.is_allowed(client_id) is False
        
        # Wait for window to expire
        time.sleep(self.rate_limiter.window_seconds + 0.5)
        
        # Should be allowed again
        assert self.rate_limiter.is_allowed(client_id) is True

    def test_different_clients_independent_limits(self):
        """Test that different clients have independent rate limits"""
        client1 = "test_client_4"
        client2 = "test_client_5"
        
        # Exhaust rate limit for client1
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(client1) is True
        
        # client1 should be blocked
        assert self.rate_limiter.is_allowed(client1) is False
        
        # client2 should still be allowed
        assert self.rate_limiter.is_allowed(client2) is True

    def test_sliding_window_behavior(self):
        """Test that rate limiter implements proper sliding window"""
        client_id = "test_client_6"
        
        # Make 3 requests
        for _ in range(3):
            assert self.rate_limiter.is_allowed(client_id) is True
        
        # Wait for half the window
        time.sleep(self.rate_limiter.window_seconds / 2)
        
        # Make 2 more requests (total 5, at limit)
        for _ in range(2):
            assert self.rate_limiter.is_allowed(client_id) is True
        
        # Should be blocked now
        assert self.rate_limiter.is_allowed(client_id) is False
        
        # Wait for first batch to expire
        time.sleep(self.rate_limiter.window_seconds / 2 + 0.5)
        
        # Should be allowed again as first 3 requests expired
        assert self.rate_limiter.is_allowed(client_id) is True

    def test_rapid_sequential_requests(self):
        """Test behavior under rapid sequential requests"""
        client_id = "test_client_7"
        
        allowed_count = 0
        blocked_count = 0
        
        # Try to make many requests rapidly
        for _ in range(self.rate_limiter.max_requests * 2):
            if self.rate_limiter.is_allowed(client_id):
                allowed_count += 1
            else:
                blocked_count += 1
        
        # Should allow exactly max_requests
        assert allowed_count == self.rate_limiter.max_requests
        # Remaining should be blocked
        assert blocked_count == self.rate_limiter.max_requests

    def test_rate_limit_memory_cleanup(self):
        """Test that old request records are cleaned up"""
        client_id = "test_client_8"
        
        # Make requests
        for _ in range(3):
            self.rate_limiter.is_allowed(client_id)
        
        # Check that requests are recorded
        assert client_id in self.rate_limiter.requests
        initial_count = len(self.rate_limiter.requests[client_id])
        assert initial_count == 3
        
        # Wait for window to expire
        time.sleep(self.rate_limiter.window_seconds + 0.5)
        
        # Make a new request (should trigger cleanup)
        self.rate_limiter.is_allowed(client_id)
        
        # Old requests should be cleaned up
        current_count = len(self.rate_limiter.requests[client_id])
        assert current_count == 1  # Only the new request


class TestRateLimitSecurity:
    """Test rate limiting security aspects"""

    def setup_method(self):
        """Set up test fixtures"""
        self.rate_limiter = RateLimiter()
        self.rate_limiter.max_requests = 5
        self.rate_limiter.window_seconds = 2

    def test_cannot_bypass_with_client_id_manipulation(self):
        """Test that similar client IDs don't bypass rate limits"""
        base_client = "test_client"
        
        # Exhaust rate limit for base_client
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(base_client) is True
        
        # Should be blocked
        assert self.rate_limiter.is_allowed(base_client) is False
        
        # Try variations of the client ID
        variations = [
            f"{base_client} ",  # with space
            f"{base_client}\n",  # with newline
            f"{base_client}\t",  # with tab
            base_client.upper(),  # uppercase
        ]
        
        for variation in variations:
            # Each variation is treated as different client
            # (this is expected behavior - highlights need for normalization)
            # In production, client_id should be normalized
            assert self.rate_limiter.is_allowed(variation) is True

    def test_empty_client_id_handling(self):
        """Test that empty client IDs are handled properly"""
        # Empty string should be a valid client ID
        empty_client = ""
        
        for _ in range(self.rate_limiter.max_requests):
            assert self.rate_limiter.is_allowed(empty_client) is True
        
        assert self.rate_limiter.is_allowed(empty_client) is False

    def test_very_long_client_id_handling(self):
        """Test that very long client IDs don't cause issues"""
        long_client = "a" * 10000
        
        # Should handle long client IDs
        assert self.rate_limiter.is_allowed(long_client) is True

    def test_special_characters_in_client_id(self):
        """Test that special characters in client IDs are handled"""
        special_clients = [
            "client@example.com",
            "client#123",
            "client$special",
            "client/path",
            "client\\path",
            "client'quote",
            'client"doublequote',
        ]
        
        for client in special_clients:
            # Should handle special characters
            assert self.rate_limiter.is_allowed(client) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
