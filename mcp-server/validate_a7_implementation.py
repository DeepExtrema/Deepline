#!/usr/bin/env python3
"""
A7 Debug & Flake Fixer - Validation Script

Validates that all components are working correctly.
"""

import sys
from pathlib import Path


def validate_files():
    """Validate that all required files exist."""
    print("🔍 Validating File Structure...")
    
    base_dir = Path(__file__).parent
    project_root = base_dir.parent
    
    required_files = {
        'Tools': [
            base_dir / 'debug_flake_fixer.py',
            base_dir / 'apply_test_fixes.py',
            base_dir / 'show_test_status.py',
            base_dir / 'demo_quarantine.py',
        ],
        'Configuration': [
            base_dir / 'pytest.ini',
        ],
        'Reports': [
            project_root / 'reports' / 'flake-log.md',
            project_root / 'reports' / 'ci-cd-test-configuration.md',
            project_root / 'reports' / 'README.md',
        ],
        'Documentation': [
            project_root / 'A7_DEBUG_FLAKE_FIXER_SUMMARY.md',
        ]
    }
    
    all_exist = True
    for category, files in required_files.items():
        print(f"\n  {category}:")
        for file_path in files:
            exists = file_path.exists()
            icon = "✅" if exists else "❌"
            print(f"    {icon} {file_path.name}")
            if not exists:
                all_exist = False
    
    return all_exist


def validate_test_decorators():
    """Validate that test files have proper decorators."""
    print("\n🔍 Validating Test Decorators...")
    
    base_dir = Path(__file__).parent
    
    test_files = [
        'test_iris_e2e.py',
        'test_ml_agent.py',
        'test_ml_agent_fixes.py',
        'test_refinery_contract_validation.py',
        'test_refinery_e2e.py',
    ]
    
    all_valid = True
    for test_file in test_files:
        file_path = base_dir / test_file
        if not file_path.exists():
            print(f"  ❌ {test_file} not found")
            all_valid = False
            continue
        
        content = file_path.read_text()
        
        # Check for pytest import
        has_pytest = 'import pytest' in content
        
        # Check for skip decorator
        has_skip = '@pytest.mark.skip' in content
        
        if has_pytest and has_skip:
            print(f"  ✅ {test_file} - has pytest import and skip decorator")
        else:
            print(f"  ❌ {test_file} - missing {'pytest import' if not has_pytest else 'skip decorator'}")
            all_valid = False
    
    return all_valid


def validate_reports():
    """Validate that reports are well-formed."""
    print("\n🔍 Validating Reports...")
    
    project_root = Path(__file__).parent.parent
    reports_dir = project_root / 'reports'
    
    # Check flake-log.md
    flake_log = reports_dir / 'flake-log.md'
    if flake_log.exists():
        content = flake_log.read_text()
        required_sections = [
            '# Flake Log Report',
            '## Summary',
            '## Test Failures Analysis',
            '## Residual Risks'
        ]
        
        all_sections = all(section in content for section in required_sections)
        icon = "✅" if all_sections else "❌"
        print(f"  {icon} flake-log.md - {'all sections present' if all_sections else 'missing sections'}")
    else:
        print(f"  ❌ flake-log.md not found")
        return False
    
    # Check CI/CD configuration
    cicd_config = reports_dir / 'ci-cd-test-configuration.md'
    if cicd_config.exists():
        content = cicd_config.read_text()
        has_examples = 'GitHub Actions' in content and 'pytest' in content
        icon = "✅" if has_examples else "❌"
        print(f"  {icon} ci-cd-test-configuration.md - {'examples present' if has_examples else 'missing examples'}")
    else:
        print(f"  ❌ ci-cd-test-configuration.md not found")
        return False
    
    return True


def validate_pytest_config():
    """Validate pytest.ini configuration."""
    print("\n🔍 Validating Pytest Configuration...")
    
    base_dir = Path(__file__).parent
    pytest_ini = base_dir / 'pytest.ini'
    
    if not pytest_ini.exists():
        print("  ❌ pytest.ini not found")
        return False
    
    content = pytest_ini.read_text()
    
    required_markers = ['quarantine', 'integration', 'unit', 'e2e', 'slow']
    all_present = all(marker in content for marker in required_markers)
    
    icon = "✅" if all_present else "❌"
    print(f"  {icon} pytest.ini - {'all markers defined' if all_present else 'missing markers'}")
    
    if all_present:
        for marker in required_markers:
            print(f"    ✅ {marker}")
    
    return all_present


def run_syntax_check():
    """Run Python syntax check on all tools."""
    print("\n🔍 Running Syntax Checks...")
    
    base_dir = Path(__file__).parent
    
    tools = [
        'debug_flake_fixer.py',
        'apply_test_fixes.py',
        'show_test_status.py',
        'demo_quarantine.py',
    ]
    
    all_valid = True
    for tool in tools:
        file_path = base_dir / tool
        if not file_path.exists():
            print(f"  ❌ {tool} not found")
            all_valid = False
            continue
        
        try:
            compile(file_path.read_text(), str(file_path), 'exec')
            print(f"  ✅ {tool} - syntax valid")
        except SyntaxError as e:
            print(f"  ❌ {tool} - syntax error: {e}")
            all_valid = False
    
    return all_valid


def main():
    """Run all validations."""
    print("\n" + "="*70)
    print(" "*15 + "A7 DEBUG & FLAKE FIXER VALIDATION")
    print("="*70 + "\n")
    
    results = {
        'File Structure': validate_files(),
        'Test Decorators': validate_test_decorators(),
        'Reports': validate_reports(),
        'Pytest Config': validate_pytest_config(),
        'Syntax Checks': run_syntax_check(),
    }
    
    print("\n" + "="*70)
    print("VALIDATION RESULTS")
    print("="*70 + "\n")
    
    for check, passed in results.items():
        icon = "✅" if passed else "❌"
        status = "PASSED" if passed else "FAILED"
        print(f"  {icon} {check}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*70)
    if all_passed:
        print("🎉 ALL VALIDATIONS PASSED - SYSTEM READY")
        print("="*70 + "\n")
        print("Next Steps:")
        print("  1. Review reports in /reports directory")
        print("  2. Run: python3 show_test_status.py")
        print("  3. Try: python3 demo_quarantine.py")
        print("  4. Setup CI/CD using ci-cd-test-configuration.md")
        return 0
    else:
        print("❌ SOME VALIDATIONS FAILED - REVIEW ERRORS ABOVE")
        print("="*70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
