#!/usr/bin/env python3
"""
Apply Test Fixes

Applies fixes to test files based on the analysis from debug_flake_fixer.py
Makes minimal changes to mark tests appropriately.
"""

import re
import logging
from pathlib import Path
from typing import List, Dict, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestFixer:
    """Apply fixes to test files."""
    
    def __init__(self, test_dir: Path):
        self.test_dir = test_dir
        self.fixes_applied = []
    
    def add_pytest_skip_decorator(self, test_file: Path, reason: str) -> bool:
        """Add pytest.mark.skip decorator to a test file."""
        try:
            content = test_file.read_text()
            
            # Check if pytest is already imported
            has_pytest_import = 'import pytest' in content
            
            # Find the main function or first test function/class
            main_match = re.search(r'(async )?def main\(\)', content)
            class_match = re.search(r'class \w+.*?:', content)
            
            if not main_match and not class_match:
                logger.warning(f"Could not find main() or test class in {test_file.name}")
                return False
            
            # Add pytest import if not present
            if not has_pytest_import:
                # Find the last top-level import statement (not indented)
                lines = content.split('\n')
                last_import_idx = 0
                
                for i, line in enumerate(lines):
                    # Only consider non-indented import statements
                    if line.startswith(('import ', 'from ')) and not line.startswith('    '):
                        last_import_idx = i
                
                # Insert pytest import after last import
                lines.insert(last_import_idx + 1, 'import pytest')
                content = '\n'.join(lines)
            
            # Add skip decorator to the main function or class
            if main_match:
                # Add decorator before main function
                pattern = r'(async )?def main\(\)'
                replacement = f'@pytest.mark.skip(reason="{reason}")\n\\1def main()'
                content = re.sub(pattern, replacement, content, count=1)
            elif class_match:
                # Add decorator before class
                pattern = r'class (\w+)'
                replacement = f'@pytest.mark.skip(reason="{reason}")\nclass \\1'
                content = re.sub(pattern, replacement, content, count=1)
            
            test_file.write_text(content)
            logger.info(f"✅ Added skip decorator to {test_file.name}")
            self.fixes_applied.append(f"Added @pytest.mark.skip to {test_file.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error applying fix to {test_file.name}: {e}")
            return False
    
    def add_quarantine_marker(self, test_file: Path, reason: str) -> bool:
        """Add @quarantine marker to a test file."""
        try:
            content = test_file.read_text()
            
            # Add custom quarantine marker as a comment and pytest marker
            has_pytest_import = 'import pytest' in content
            
            # Find the main function or first test function/class
            main_match = re.search(r'(async )?def main\(\)', content)
            class_match = re.search(r'class \w+.*?:', content)
            
            if not main_match and not class_match:
                logger.warning(f"Could not find main() or test class in {test_file.name}")
                return False
            
            # Add pytest import if not present
            if not has_pytest_import:
                import_lines = []
                lines = content.split('\n')
                last_import_idx = 0
                
                for i, line in enumerate(lines):
                    if line.strip().startswith(('import ', 'from ')):
                        last_import_idx = i
                
                lines.insert(last_import_idx + 1, 'import pytest')
                content = '\n'.join(lines)
            
            # Add quarantine marker
            if main_match:
                pattern = r'(async )?def main\(\)'
                replacement = f'# @quarantine - {reason}\n@pytest.mark.quarantine\n@pytest.mark.skip(reason="Quarantined: {reason}")\n\\1def main()'
                content = re.sub(pattern, replacement, content, count=1)
            elif class_match:
                pattern = r'class (\w+)'
                replacement = f'# @quarantine - {reason}\n@pytest.mark.quarantine\n@pytest.mark.skip(reason="Quarantined: {reason}")\nclass \\1'
                content = re.sub(pattern, replacement, content, count=1)
            
            test_file.write_text(content)
            logger.info(f"🔒 Added quarantine marker to {test_file.name}")
            self.fixes_applied.append(f"Added @quarantine marker to {test_file.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error applying quarantine to {test_file.name}: {e}")
            return False
    
    def apply_fixes_from_report(self, report_path: Path):
        """Apply fixes based on the flake log report."""
        if not report_path.exists():
            logger.error(f"Report not found: {report_path}")
            return
        
        report_content = report_path.read_text()
        
        # Parse the report to find tests that need fixing
        # Look for external dependency tests - simpler pattern
        lines = report_content.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Look for test failure headers (with emoji)
            if line.startswith('#### ') and ('FAILED' in line or '❌' in line):
                test_name = line.split()[1]
                
                # Look ahead for file path and cause
                test_file_path = None
                cause = None
                
                for j in range(i+1, min(i+10, len(lines))):
                    if '**File:**' in lines[j]:
                        match = re.search(r'`([^`]+)`', lines[j])
                        if match:
                            test_file_path = match.group(1)
                    
                    if '**Cause:**' in lines[j]:
                        cause = lines[j].split('**Cause:**')[1].strip()
                
                if test_file_path and cause == 'external_dependency':
                    test_file = Path(test_file_path)
                    if test_file.exists():
                        self.add_pytest_skip_decorator(
                            test_file, 
                            "Requires additional Python packages or external services"
                        )
            
            # Look for quarantined tests
            elif line.startswith('#### ') and 'QUARANTINED' in line:
                test_name = line.split()[1]
                
                test_file_path = None
                reason = None
                
                for j in range(i+1, min(i+15, len(lines))):
                    if '**File:**' in lines[j]:
                        match = re.search(r'`([^`]+)`', lines[j])
                        if match:
                            test_file_path = match.group(1)
                    
                    if '**Quarantine Reason:**' in lines[j]:
                        reason = lines[j].split('**Quarantine Reason:**')[1].strip()
                
                if test_file_path and reason:
                    test_file = Path(test_file_path)
                    if test_file.exists():
                        self.add_quarantine_marker(test_file, reason)
            
            i += 1
        
        logger.info(f"\n✅ Applied {len(self.fixes_applied)} fixes")
        for fix in self.fixes_applied:
            logger.info(f"  - {fix}")


def main():
    """Main entry point."""
    base_dir = Path(__file__).parent
    project_root = base_dir.parent
    reports_dir = project_root / 'reports'
    report_path = reports_dir / 'flake-log.md'
    
    # Change to project root for path resolution
    import os
    os.chdir(project_root)
    
    fixer = TestFixer(base_dir)
    fixer.apply_fixes_from_report(report_path)
    
    return 0


if __name__ == "__main__":
    exit(main())
