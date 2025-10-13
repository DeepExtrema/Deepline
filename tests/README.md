# Security Tests

This directory contains comprehensive security tests for the Sherlock Multiagent Data Scientist system.

## Test Coverage

### Authentication Tests (`security/test_authentication.py`)
- JWT token validation and verification
- Expired token rejection
- Invalid signature detection
- Malformed token handling
- Token blacklist enforcement
- Secure configuration (encryption/decryption)

**Tests:** 10

### Protected Routes Tests (`security/test_protected_routes.py`)
- Unauthenticated access prevention
- Role-based access control (RBAC)
- IDOR (Insecure Direct Object Reference) prevention
- Data leakage prevention in error responses
- Admin privilege enforcement
- PII protection

**Tests:** 15

### Rate Limiting Tests (`security/test_rate_limiting.py`)
- Rate limit enforcement
- Window-based limiting
- Client isolation
- Bypass prevention
- Memory cleanup
- Edge case handling

**Tests:** 10

**Total:** 35 security tests

## Running Tests

### Run all security tests:
```bash
cd /home/runner/work/Sherlock-Multiagent-Data-Scientist/Sherlock-Multiagent-Data-Scientist
export JWT_SECRET_KEY="test-secret-key"
pytest tests/security/ -v
```

### Run specific test file:
```bash
pytest tests/security/test_authentication.py -v
pytest tests/security/test_protected_routes.py -v
pytest tests/security/test_rate_limiting.py -v
```

### Run with coverage:
```bash
pytest tests/security/ -v --cov=mcp-server/security --cov-report=html
```

## Test Requirements

Dependencies:
- pytest
- pytest-asyncio
- httpx
- pyjwt
- bcrypt
- cryptography
- fastapi
- python-multipart

Install with:
```bash
pip install pytest pytest-asyncio httpx pyjwt bcrypt cryptography fastapi python-multipart
```

## CI/CD Integration

Security tests are automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Daily scheduled runs (2 AM UTC)

See `.github/workflows/security-tests.yml` for the full CI/CD pipeline.

## Test Structure

```
tests/
└── security/
    ├── __init__.py
    ├── test_authentication.py       # Authentication & token tests
    ├── test_protected_routes.py     # Authorization & IDOR tests
    └── test_rate_limiting.py        # Rate limiting tests
```

## Security Testing Methodology

Tests follow industry-standard security testing practices:
- **OWASP Testing Guide v4**
- **NIST SP 800-115**
- **SANS Penetration Testing methodology**

### Test Categories
1. **Authentication Bypass** - Attempts to access protected resources without valid credentials
2. **Authorization Boundary** - Tests role-based access control boundaries
3. **Session Management** - Token lifecycle and revocation
4. **Input Validation** - Token format and content validation
5. **Error Handling** - Information disclosure prevention
6. **IDOR Prevention** - Resource ownership validation

## Contributing

When adding new security tests:

1. **Follow existing patterns** - Use the same test structure and naming conventions
2. **Test both positive and negative cases** - Valid access AND invalid access attempts
3. **Check for data leakage** - Ensure error responses don't leak sensitive information
4. **Document expected behavior** - Add clear docstrings to test functions
5. **Run all tests** - Ensure new tests don't break existing ones

### Example Test Structure:

```python
def test_feature_security(self):
    """Test that feature X properly handles security scenario Y"""
    # Setup
    token = create_test_token("test_user", "viewer")
    
    # Execute
    response = self.client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    
    # Assert
    assert response.status_code == 200
    assert "sensitive_data" in response.json()
```

## Related Documentation

- [Security Report](/reports/security.md) - Full security assessment
- [Secrets Management](/docs/secrets.md) - GitHub secrets configuration
- [CODEOWNERS](/.github/CODEOWNERS) - Code review requirements
- [Security Testing Workflow](/.github/workflows/security-tests.yml) - CI/CD pipeline

## Support

For questions about security tests:
- Review the security report: `/reports/security.md`
- Check the CODEOWNERS file for security team contacts
- Open an issue with the `security` label
