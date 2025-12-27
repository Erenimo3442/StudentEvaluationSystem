"""
Script to run tests with various options.

Usage:
    python run_tests.py                    # Run all tests with coverage
    python run_tests.py --core             # Run only core app tests
    python run_tests.py --evaluation       # Run only evaluation app tests
    python run_tests.py --users            # Run only users app tests
    python run_tests.py --verbose          # Run with verbose output
    python run_tests.py --no-cov           # Run without coverage
"""

import subprocess
import sys
from pathlib import Path


def run_tests(args):
    """Run pytest with given arguments."""
    base_dir = Path(__file__).parent
    test_dir = base_dir / "student_evaluation_system"

    cmd = ["pytest", str(test_dir)]

    # Add coverage by default
    if "--no-cov" not in args:
        cmd.extend([
            "--cov=student_evaluation_system",
            "--cov-report=html",
            "--cov-report=term-missing",
        ])

    # Add verbose flag if requested
    if "--verbose" in args:
        cmd.append("-vv")

    # Filter by app if specified
    if "--core" in args:
        cmd.append("student_evaluation_system/core/tests")
    elif "--evaluation" in args:
        cmd.append("student_evaluation_system/evaluation/tests")
    elif "--users" in args:
        cmd.append("student_evaluation_system/users/tests")

    # Remove our custom flags
    cmd = [arg for arg in cmd if arg not in ["--core", "--evaluation", "--users", "--verbose", "--no-cov"]]

    print(f"Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd, cwd=base_dir)
    return result.returncode


def main():
    """Main entry point."""
    args = sys.argv[1:] if len(sys.argv) > 1 else []

    if "--help" in args or "-h" in args:
        print(__doc__)
        return 0

    return run_tests(args)


if __name__ == "__main__":
    sys.exit(main())
