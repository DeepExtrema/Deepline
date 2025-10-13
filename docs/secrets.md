# GitHub Encrypted Secrets Management

## Overview

This document outlines the security practices for managing secrets in the Sherlock Multiagent Data Scientist system, with a focus on GitHub Encrypted Secrets for CI/CD pipelines.

## Critical Security Principle

**NEVER commit secrets, API keys, passwords, or sensitive credentials to source code or configuration files.**

## GitHub Encrypted Secrets

### What are GitHub Encrypted Secrets?

GitHub Encrypted Secrets provide a secure way to store sensitive information needed for your CI/CD workflows. These secrets are:
- Encrypted at rest using [Libsodium sealed boxes](https://libsodium.gitbook.io/doc/public-key_cryptography/sealed_boxes)
- Only decrypted when used in GitHub Actions workflows
- Never exposed in logs or outputs
- Scoped to specific repositories or organizations

### Required Secrets for CI/CD

The following secrets must be configured in your GitHub repository settings:

#### Authentication & Encryption
- `JWT_SECRET_KEY` - Secret key for JWT token generation
- `ENCRYPTION_KEY` - Fernet encryption key for sensitive data at rest
- `REFRESH_TOKEN_SECRET` - Secret key for refresh token generation

#### Database Credentials
- `DATABASE_URL` - Connection string for production database
- `REDIS_PASSWORD` - Password for Redis cache
- `MONGO_PASSWORD` - Password for MongoDB (if used)

#### External Service Keys
- `AWS_ACCESS_KEY_ID` - AWS access key for S3, ECR, etc.
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token

#### API Keys
- `OPENAI_API_KEY` - OpenAI API key for LLM translation (if used)
- `ANTHROPIC_API_KEY` - Anthropic API key (if used)
- `SENDGRID_API_KEY` - Email service API key (if used)

### Setting Up GitHub Secrets

#### For Repository Secrets:
1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

#### For Organization Secrets:
1. Navigate to your organization settings
2. Go to **Secrets and variables** → **Actions**
3. Click **New organization secret**
4. Enter the secret name and value
5. Select repository access policy
6. Click **Add secret**

### Using Secrets in GitHub Actions

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests with secrets
        env:
          JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
          ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pytest tests/security/
      
      - name: Build Docker image
        run: |
          docker build -t myapp:latest .
      
      - name: Push to Docker Hub
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
        run: |
          echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
          docker push myapp:latest
```

### Secret Security Best Practices

#### 1. Rotation Policy
- Rotate secrets every 90 days
- Rotate immediately if:
  - A team member with access leaves
  - Suspected compromise
  - Found in logs or public repositories

#### 2. Access Control
- Limit secret access to necessary repositories only
- Use organization secrets for shared credentials
- Use repository secrets for repo-specific credentials
- Review access permissions quarterly

#### 3. Secret Naming Conventions
- Use UPPER_SNAKE_CASE for secret names
- Be descriptive: `PROD_DATABASE_URL` vs `DATABASE_URL`
- Include environment: `STAGING_API_KEY`, `PROD_API_KEY`

#### 4. Never Log Secrets
```yaml
# ❌ WRONG - Secret might be logged
- name: Debug
  run: echo "API Key is ${{ secrets.API_KEY }}"

# ✅ CORRECT - Never echo secrets
- name: Use API
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: |
    # Use API_KEY in application code
    python app.py
```

#### 5. Mask Secrets in Outputs
GitHub Actions automatically masks registered secrets in logs, but be cautious:
```yaml
- name: Safe usage
  env:
    SECRET: ${{ secrets.MY_SECRET }}
  run: |
    # This will be masked in logs
    echo "::add-mask::$SECRET"
    
    # Use the secret safely
    ./deploy.sh
```

## Local Development

### Environment Variables

For local development, use `.env` files (NEVER commit these):

```bash
# .env.example - Commit this template
JWT_SECRET_KEY=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
DATABASE_URL=your_database_url_here

# .env - NEVER commit this
JWT_SECRET_KEY=actual_secret_value_123
ENCRYPTION_KEY=actual_encryption_key_456
DATABASE_URL=postgresql://user:pass@localhost/db
```

Update `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Secrets
secrets/
*.key
*.pem
*.p12
```

### Generating Secure Secrets

```python
# Generate JWT secret
import secrets
jwt_secret = secrets.token_urlsafe(32)
print(f"JWT_SECRET_KEY={jwt_secret}")

# Generate encryption key (Fernet)
from cryptography.fernet import Fernet
encryption_key = Fernet.generate_key().decode()
print(f"ENCRYPTION_KEY={encryption_key}")

# Generate random password
password = secrets.token_urlsafe(24)
print(f"PASSWORD={password}")
```

## Audit and Compliance

### Regular Security Audits
- Review who has access to secrets monthly
- Audit secret usage in workflows quarterly
- Check for accidentally committed secrets using tools:
  - [git-secrets](https://github.com/awslabs/git-secrets)
  - [gitleaks](https://github.com/zricethezav/gitleaks)
  - [truffleHog](https://github.com/trufflesecurity/truffleHog)

### Incident Response

If a secret is compromised:
1. **Immediately** revoke/rotate the compromised secret
2. Update GitHub secret with new value
3. Review access logs for unauthorized usage
4. Investigate how the secret was exposed
5. Update procedures to prevent recurrence
6. Document the incident

### Secret Scanning

Enable GitHub's secret scanning:
1. Repository Settings → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection" to prevent accidental commits

## CI/CD Pipeline Security

### Principle of Least Privilege
- Workflows should only have access to secrets they need
- Use environment-specific secrets (dev, staging, prod)
- Separate read/write permissions

### Example Secure Workflow

```yaml
name: Secure CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    # Tests only need limited secrets
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests
        env:
          # Only provide secrets needed for testing
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        run: pytest tests/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    # Only deploy on main branch
    if: github.ref == 'refs/heads/main'
    # Deployment needs more secrets
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: ./deploy.sh
```

## Encryption at Rest

For additional security, encrypt sensitive values before storing as secrets:

```python
from cryptography.fernet import Fernet

# Generate a key (store this separately, not in code)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt a value
plaintext = b"my_secret_value"
encrypted = cipher.encrypt(plaintext)

# Store encrypted value as GitHub secret with "ENC:" prefix
# Example: ENC:gAAAAABf...
```

## References

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Support

For questions about secrets management:
- Security Team: security@example.com
- DevOps Team: devops@example.com

**Remember: When in doubt, treat it as a secret.**
