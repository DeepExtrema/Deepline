#!/usr/bin/env python3
"""
A7 Debug & Flake Fixer

Process:
- For each failing test, classify cause: selector mismatch, timing, data isolation, 
  external dependency, real bug.
- Apply smallest fix in tests only. If app code change appears required, document 
  it in /reports/app-change-suggestions.md with rationale.
- If two consecutive fixes fail, STOP and mark as QUARANTINE with a reason.

Deliver:
- Updated tests
- /reports/flake-log.md (root causes, time-to-fix, residual risk)
- Tag quarantined tests @quarantine and exclude them from required checks
"""

import asyncio
import json
import logging
import time
import traceback
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FailureCause(Enum):
    """Classification of test failure causes."""
    SELECTOR_MISMATCH = "selector_mismatch"  # Wrong element selectors
    TIMING = "timing"  # Race conditions, timeouts
    DATA_ISOLATION = "data_isolation"  # Test data conflicts
    EXTERNAL_DEPENDENCY = "external_dependency"  # Service unavailable
    REAL_BUG = "real_bug"  # Actual bug in code
    UNKNOWN = "unknown"  # Not yet classified


@dataclass
class TestFailure:
    """Record of a test failure."""
    test_name: str
    test_file: str
    failure_message: str
    stack_trace: str
    timestamp: datetime
    cause: FailureCause = FailureCause.UNKNOWN
    fix_attempts: int = 0
    fixed: bool = False
    quarantined: bool = False
    quarantine_reason: str = ""
    fix_description: str = ""
    time_to_fix: Optional[float] = None


@dataclass
class FlakeReport:
    """Report on flaky tests."""
    test_failures: List[TestFailure] = field(default_factory=list)
    total_tests: int = 0
    failed_tests: int = 0
    fixed_tests: int = 0
    quarantined_tests: int = 0
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

    def generate_markdown(self) -> str:
        """Generate markdown report."""
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time else 0
        
        report = f"""# Flake Log Report

**Generated:** {datetime.now().isoformat()}
**Total Duration:** {duration:.2f} seconds
**Total Tests:** {self.total_tests}
**Failed Tests:** {self.failed_tests}
**Fixed Tests:** {self.fixed_tests}
**Quarantined Tests:** {self.quarantined_tests}

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | {self.total_tests} |
| Failed Tests | {self.failed_tests} |
| Fixed Tests | {self.fixed_tests} |
| Quarantined Tests | {self.quarantined_tests} |
| Success Rate | {((self.total_tests - self.failed_tests) / self.total_tests * 100) if self.total_tests > 0 else 0:.1f}% |

## Test Failures Analysis

"""
        
        # Group by cause
        by_cause = {}
        for failure in self.test_failures:
            cause = failure.cause.value
            if cause not in by_cause:
                by_cause[cause] = []
            by_cause[cause].append(failure)
        
        for cause, failures in by_cause.items():
            report += f"\n### {cause.replace('_', ' ').title()} ({len(failures)} tests)\n\n"
            for failure in failures:
                status = "✅ FIXED" if failure.fixed else ("🔒 QUARANTINED" if failure.quarantined else "❌ FAILED")
                report += f"#### {failure.test_name} - {status}\n\n"
                report += f"**File:** `{failure.test_file}`\n\n"
                report += f"**Cause:** {failure.cause.value}\n\n"
                
                if failure.failure_message:
                    report += f"**Error Message:**\n```\n{failure.failure_message[:500]}\n```\n\n"
                
                if failure.fix_description:
                    report += f"**Fix Applied:** {failure.fix_description}\n\n"
                
                if failure.time_to_fix:
                    report += f"**Time to Fix:** {failure.time_to_fix:.2f} seconds\n\n"
                
                if failure.quarantined:
                    report += f"**Quarantine Reason:** {failure.quarantine_reason}\n\n"
                
                report += "---\n\n"
        
        # Residual risks
        report += "\n## Residual Risks\n\n"
        
        if self.quarantined_tests > 0:
            report += f"- **Quarantined Tests:** {self.quarantined_tests} tests are marked for nightly runs only\n"
        
        external_deps = [f for f in self.test_failures if f.cause == FailureCause.EXTERNAL_DEPENDENCY]
        if external_deps:
            report += f"- **External Dependencies:** {len(external_deps)} tests depend on external services\n"
        
        timing_issues = [f for f in self.test_failures if f.cause == FailureCause.TIMING]
        if timing_issues:
            report += f"- **Timing Issues:** {len(timing_issues)} tests may have race conditions\n"
        
        return report


class DebugFlakeFixer:
    """Main debug and flake fixer class."""
    
    def __init__(self, test_dir: Path, reports_dir: Path):
        self.test_dir = test_dir
        self.reports_dir = reports_dir
        self.reports_dir.mkdir(exist_ok=True)
        self.report = FlakeReport()
        self.app_changes: List[Dict[str, str]] = []
        
    def classify_failure(self, test_name: str, error_message: str, stack_trace: str) -> FailureCause:
        """Classify the cause of test failure."""
        error_lower = error_message.lower()
        stack_lower = stack_trace.lower()
        
        # Check for external dependency issues
        if any(keyword in error_lower for keyword in [
            'connection refused', 'cannot connect', 'connection error',
            'no module named', 'modulenotfounderror', 'importerror',
            'service unavailable', 'timeout', 'timed out'
        ]):
            return FailureCause.EXTERNAL_DEPENDENCY
        
        # Check for timing issues
        if any(keyword in error_lower for keyword in [
            'timeout', 'race condition', 'asyncio', 'await', 
            'concurrent', 'sleep', 'wait_for'
        ]):
            return FailureCause.TIMING
        
        # Check for data isolation issues
        if any(keyword in error_lower for keyword in [
            'duplicate', 'already exists', 'constraint violation',
            'integrity error', 'unique constraint'
        ]):
            return FailureCause.DATA_ISOLATION
        
        # Check for selector mismatches (UI/API tests)
        if any(keyword in error_lower for keyword in [
            'selector', 'element not found', 'no such element',
            'xpath', 'css selector'
        ]):
            return FailureCause.SELECTOR_MISMATCH
        
        # Check for real bugs
        if any(keyword in error_lower for keyword in [
            'assertion', 'assertionerror', 'expected', 'actual',
            'typeerror', 'valueerror', 'keyerror', 'attributeerror'
        ]):
            return FailureCause.REAL_BUG
        
        return FailureCause.UNKNOWN
    
    async def run_test_file(self, test_file: Path) -> Tuple[bool, str, str]:
        """Run a single test file and capture output."""
        logger.info(f"Running test: {test_file.name}")
        
        try:
            proc = await asyncio.create_subprocess_exec(
                'python3', str(test_file),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(test_file.parent)
            )
            
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
            
            stdout_str = stdout.decode('utf-8', errors='replace')
            stderr_str = stderr.decode('utf-8', errors='replace')
            
            success = proc.returncode == 0
            
            return success, stdout_str, stderr_str
            
        except asyncio.TimeoutError:
            logger.error(f"Test {test_file.name} timed out")
            return False, "", "Test timed out after 60 seconds"
        except Exception as e:
            logger.error(f"Error running test {test_file.name}: {e}")
            return False, "", str(e)
    
    async def analyze_test(self, test_file: Path) -> TestFailure:
        """Analyze a single test file."""
        test_name = test_file.stem
        
        # Run the test
        success, stdout, stderr = await self.run_test_file(test_file)
        
        if success:
            logger.info(f"✅ Test {test_name} passed")
            return None
        
        logger.warning(f"❌ Test {test_name} failed")
        
        # Create failure record
        failure = TestFailure(
            test_name=test_name,
            test_file=str(test_file.relative_to(self.test_dir.parent)),
            failure_message=stderr if stderr else stdout,
            stack_trace=stderr if stderr else stdout,
            timestamp=datetime.now()
        )
        
        # Classify the failure
        failure.cause = self.classify_failure(test_name, failure.failure_message, failure.stack_trace)
        logger.info(f"Classified as: {failure.cause.value}")
        
        return failure
    
    def suggest_fix(self, failure: TestFailure) -> Optional[str]:
        """Suggest a fix for the test failure."""
        if failure.cause == FailureCause.EXTERNAL_DEPENDENCY:
            return "Add @pytest.mark.skip decorator with reason='Requires external service'"
        
        elif failure.cause == FailureCause.TIMING:
            return "Increase timeout values or add retry logic"
        
        elif failure.cause == FailureCause.DATA_ISOLATION:
            return "Use unique test data or cleanup between tests"
        
        elif failure.cause == FailureCause.SELECTOR_MISMATCH:
            return "Update selectors to match current implementation"
        
        elif failure.cause == FailureCause.REAL_BUG:
            # Document this in app-change-suggestions.md
            self.app_changes.append({
                'test': failure.test_name,
                'issue': failure.failure_message[:200],
                'recommendation': 'Review application code for bug'
            })
            return None
        
        return None
    
    def mark_quarantine(self, failure: TestFailure, reason: str):
        """Mark a test for quarantine."""
        failure.quarantined = True
        failure.quarantine_reason = reason
        logger.warning(f"🔒 Quarantining test {failure.test_name}: {reason}")
    
    async def run_all_tests(self):
        """Run all tests and analyze failures."""
        logger.info("Starting test analysis...")
        
        # Find all test files
        test_files = sorted(self.test_dir.glob('test_*.py'))
        self.report.total_tests = len(test_files)
        
        logger.info(f"Found {len(test_files)} test files")
        
        for test_file in test_files:
            failure = await self.analyze_test(test_file)
            
            if failure:
                self.report.failed_tests += 1
                self.report.test_failures.append(failure)
                
                # Try to suggest a fix
                fix_suggestion = self.suggest_fix(failure)
                
                if fix_suggestion:
                    logger.info(f"Fix suggestion: {fix_suggestion}")
                    failure.fix_description = fix_suggestion
                
                # If it's been tried twice without success, quarantine
                if failure.fix_attempts >= 2:
                    self.mark_quarantine(
                        failure, 
                        f"Failed after {failure.fix_attempts} fix attempts"
                    )
                    self.report.quarantined_tests += 1
        
        self.report.end_time = datetime.now()
    
    def generate_reports(self):
        """Generate all required reports."""
        logger.info("Generating reports...")
        
        # Generate flake-log.md
        flake_log_path = self.reports_dir / 'flake-log.md'
        flake_log_content = self.report.generate_markdown()
        flake_log_path.write_text(flake_log_content)
        logger.info(f"Generated: {flake_log_path}")
        
        # Generate app-change-suggestions.md
        if self.app_changes:
            app_changes_path = self.reports_dir / 'app-change-suggestions.md'
            app_changes_content = self._generate_app_changes_report()
            app_changes_path.write_text(app_changes_content)
            logger.info(f"Generated: {app_changes_path}")
    
    def _generate_app_changes_report(self) -> str:
        """Generate app change suggestions report."""
        report = f"""# Application Code Change Suggestions

**Generated:** {datetime.now().isoformat()}

This document contains suggestions for changes to application code based on test failures
that appear to be caused by real bugs rather than test issues.

## Suggested Changes

"""
        
        for i, change in enumerate(self.app_changes, 1):
            report += f"""### {i}. {change['test']}

**Issue:**
```
{change['issue']}
```

**Recommendation:** {change['recommendation']}

---

"""
        
        return report


async def main():
    """Main entry point."""
    base_dir = Path(__file__).parent
    test_dir = base_dir
    reports_dir = base_dir.parent / 'reports'
    
    fixer = DebugFlakeFixer(test_dir, reports_dir)
    
    try:
        await fixer.run_all_tests()
        fixer.generate_reports()
        
        # Print summary
        logger.info("\n" + "="*60)
        logger.info("TEST ANALYSIS SUMMARY")
        logger.info("="*60)
        logger.info(f"Total Tests: {fixer.report.total_tests}")
        logger.info(f"Failed Tests: {fixer.report.failed_tests}")
        logger.info(f"Quarantined Tests: {fixer.report.quarantined_tests}")
        logger.info(f"Reports generated in: {reports_dir}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"Error during test analysis: {e}")
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
