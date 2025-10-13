# A7 Debug & Flake Fixer - Quick Start Guide

## 🚀 Quick Start (3 minutes)

### Step 1: Check Current Status
```bash
cd mcp-server
python3 show_test_status.py
```

### Step 2: Analyze Tests
```bash
python3 debug_flake_fixer.py
```

### Step 3: Apply Fixes
```bash
python3 apply_test_fixes.py
```

### Step 4: Validate
```bash
python3 validate_a7_implementation.py
```

## 📊 View Reports

```bash
# View detailed failure analysis
cat ../reports/flake-log.md

# View CI/CD integration guide
cat ../reports/ci-cd-test-configuration.md

# View complete documentation
cat ../reports/README.md
```

## 🎮 Try the Demo

```bash
python3 demo_quarantine.py
```

## 🔧 CI/CD Integration

### For Pull Requests (exclude quarantined)
```bash
pytest -m "not quarantine" -v
```

### For Nightly Builds (include all)
```bash
pytest -v
pytest -m quarantine -v
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `debug_flake_fixer.py` | Analyze and classify test failures |
| `apply_test_fixes.py` | Apply minimal fixes to tests |
| `show_test_status.py` | Quick status dashboard |
| `demo_quarantine.py` | Interactive demo |
| `validate_a7_implementation.py` | Validate setup |
| `pytest.ini` | Test configuration |
| `/reports/flake-log.md` | Detailed analysis report |
| `/reports/ci-cd-test-configuration.md` | CI/CD setup |

## 🎯 What It Does

1. **Classifies** test failures by root cause
2. **Applies** minimal fixes to test files only
3. **Quarantines** tests that fail after 2 fix attempts
4. **Generates** comprehensive reports
5. **Integrates** with CI/CD pipelines

## ✅ Current Status

- Total Tests: 7
- Passing: 2 (28.6%)
- Skipped: 5 (71.4%) - Missing pandas, httpx
- Quarantined: 0 (0%)

## �� Full Documentation

See `/reports/README.md` for complete documentation.
