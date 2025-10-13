# Test Scripts

This directory contains scripts for managing the test environment.

## seed-test-env.ts

Idempotent test data seeder that populates the test database with:
- Admin user (username: `admin`, password: `admin123`)
- Test user (username: `testuser`, password: `test123`)
- Sample dataset with 5 rows
- Sample workflow

### Usage

```bash
npm run seed:test
```

### Environment Variables

- `MONGO_URL`: MongoDB connection string (default: `mongodb://testuser:testpass@localhost:27017`)
- `MONGO_DB_NAME`: Database name (default: `sherlock_test`)

### Example

```bash
MONGO_URL=mongodb://testuser:testpass@localhost:27017 npm run seed:test
```

The script is idempotent - it will update existing records rather than creating duplicates if run multiple times.
