#!/usr/bin/env python3
"""
Show Test Status

Quick summary of test suite status based on latest flake-log.md
"""

import re
from pathlib import Path
from datetime import datetime


def parse_flake_log(report_path: Path):
    """Parse the flake log and extract key metrics."""
    
    if not report_path.exists():
        return None
    
    content = report_path.read_text()
    
    # Extract metrics with error handling
    try:
        total_match = re.search(r'\*\*Total Tests:\*\* (\d+)', content)
        failed_match = re.search(r'\*\*Failed Tests:\*\* (\d+)', content)
        quarantined_match = re.search(r'\*\*Quarantined Tests:\*\* (\d+)', content)
        
        if not (total_match and failed_match and quarantined_match):
            return None
        
        total_tests = int(total_match.group(1))
        failed_tests = int(failed_match.group(1))
        quarantined_tests = int(quarantined_match.group(1))
    except (AttributeError, ValueError) as e:
        return None
    
    # Extract test lists by cause
    causes = {
        'external_dependency': [],
        'timing': [],
        'data_isolation': [],
        'selector_mismatch': [],
        'real_bug': [],
        'unknown': []
    }
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('#### ') and ('FAILED' in line or '❌' in line or 'QUARANTINED' in line or '🔒' in line):
            test_name = line.split()[1]
            
            # Find cause
            for j in range(i+1, min(i+10, len(lines))):
                if '**Cause:**' in lines[j]:
                    cause = lines[j].split('**Cause:**')[1].strip()
                    if cause in causes:
                        status = '🔒' if 'QUARANTINED' in line or '🔒' in line else '❌'
                        causes[cause].append(f"{status} {test_name}")
                    break
    
    return {
        'total': total_tests,
        'failed': failed_tests,
        'quarantined': quarantined_tests,
        'passing': total_tests - failed_tests,
        'causes': causes
    }


def show_status():
    """Display test status summary."""
    
    base_dir = Path(__file__).parent
    reports_dir = base_dir.parent / 'reports'
    report_path = reports_dir / 'flake-log.md'
    
    print("\n" + "="*70)
    print(" "*20 + "TEST SUITE STATUS")
    print("="*70 + "\n")
    
    if not report_path.exists():
        print("⚠️  No flake-log.md found. Run debug_flake_fixer.py first.\n")
        return
    
    data = parse_flake_log(report_path)
    
    if not data:
        print("❌ Could not parse flake-log.md\n")
        return
    
    # Summary box
    total = data['total']
    passing = data['passing']
    failed = data['failed']
    quarantined = data['quarantined']
    
    print(f"📊 SUMMARY")
    print(f"   Total Tests:      {total:3d}")
    print(f"   ✅ Passing:       {passing:3d}  ({passing/total*100:.1f}%)")
    print(f"   ❌ Failed:        {failed:3d}  ({failed/total*100:.1f}%)")
    print(f"   🔒 Quarantined:   {quarantined:3d}  ({quarantined/total*100:.1f}%)")
    print()
    
    # Health indicator
    if passing == total:
        print("   Status: 🎉 All tests passing!")
    elif quarantined > 0:
        print(f"   Status: ⚠️  {quarantined} test(s) quarantined")
    elif failed > total * 0.5:
        print(f"   Status: 🔴 High failure rate ({failed/total*100:.0f}%)")
    elif failed > 0:
        print(f"   Status: 🟡 Some tests failing")
    
    print()
    print("-"*70)
    print()
    
    # Breakdown by cause
    print("📋 FAILURE BREAKDOWN BY CAUSE\n")
    
    for cause, tests in data['causes'].items():
        if tests:
            cause_name = cause.replace('_', ' ').title()
            print(f"   {cause_name} ({len(tests)} test(s)):")
            for test in tests[:5]:  # Show max 5 per cause
                print(f"      {test}")
            if len(tests) > 5:
                print(f"      ... and {len(tests) - 5} more")
            print()
    
    print("-"*70)
    print()
    
    # Actions
    print("💡 RECOMMENDED ACTIONS\n")
    
    if failed > 0 and quarantined == 0:
        print("   1. Run apply_test_fixes.py to apply suggested fixes")
        print("   2. Review app-change-suggestions.md for code changes")
        print("   3. Re-run debug_flake_fixer.py to verify fixes")
    elif quarantined > 0:
        print("   1. Review quarantined tests in flake-log.md")
        print("   2. Create issues for fixing quarantined tests")
        print("   3. Run nightly builds with: pytest -m quarantine")
    else:
        print("   ✅ All tests passing - no actions needed!")
    
    print()
    
    # Quick commands
    print("🔧 QUICK COMMANDS\n")
    print("   Analyze tests:        python3 debug_flake_fixer.py")
    print("   Apply fixes:          python3 apply_test_fixes.py")
    print("   Run passing tests:    pytest -m \"not quarantine\"")
    print("   Run quarantined:      pytest -m quarantine")
    print("   View full report:     cat ../reports/flake-log.md")
    print()
    
    print("="*70 + "\n")


if __name__ == "__main__":
    show_status()
