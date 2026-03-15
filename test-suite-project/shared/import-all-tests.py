#!/usr/bin/env python3
"""
Test importer for TestCaptive Playwright test suite
Imports tests from Test-Code folder into the Playwright framework
"""

import os
import sys
import subprocess

def run_command(command, cwd):
    """Run a command and return success status"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Error: {e}")
        return False

def import_playwright_tests():
    """Import tests for Playwright suite"""
    print("\n" + "="*60)
    print("📦 Importing Playwright Tests")
    print("="*60)
    
    playwright_dir = os.path.join(os.path.dirname(__file__), '../playwright-suite')
    return run_command('python scripts/import_tests.py', playwright_dir)

def main():
    """Main function to import Playwright tests"""
    print("🚀 TestCaptive Test Importer")
    print("="*60)
    
    success = import_playwright_tests()
    
    print("\n" + "="*60)
    print("📊 Import Summary")
    print("="*60)
    
    status = "✅ Success" if success else "❌ Failed"
    print(f"Playwright: {status}")
    
    if success:
        print("\n🎉 Tests imported successfully!")
        print("\nNext steps:")
        print("  1. Navigate to playwright-suite/")
        print("  2. Install dependencies: pip install -r requirements.txt && playwright install")
        print("  3. Run the tests: pytest tests/ -v")
    else:
        print("\n⚠️  Import failed. Check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
