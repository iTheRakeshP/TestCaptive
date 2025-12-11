#!/usr/bin/env python3
"""
Universal test importer for TestCaptive test suites
Imports tests from Test-Code folder into all supported frameworks
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

def import_cypress_tests():
    """Import tests for Cypress suite"""
    print("\n" + "="*60)
    print("📦 Importing Cypress Tests")
    print("="*60)
    
    cypress_dir = os.path.join(os.path.dirname(__file__), '../cypress-suite')
    return run_command('node scripts/import-tests.js', cypress_dir)

def import_playwright_tests():
    """Import tests for Playwright suite"""
    print("\n" + "="*60)
    print("📦 Importing Playwright Tests")
    print("="*60)
    
    playwright_dir = os.path.join(os.path.dirname(__file__), '../playwright-suite')
    return run_command('python scripts/import_tests.py', playwright_dir)

def import_selenium_tests():
    """Import tests for Selenium suite"""
    print("\n" + "="*60)
    print("📦 Importing Selenium Tests")
    print("="*60)
    
    selenium_dir = os.path.join(os.path.dirname(__file__), '../selenium-suite')
    return run_command('python scripts/import_tests.py', selenium_dir)

def main():
    """Main function to import all tests"""
    print("🚀 TestCaptive Universal Test Importer")
    print("="*60)
    
    results = {
        'Cypress': import_cypress_tests(),
        'Playwright': import_playwright_tests(),
        'Selenium': import_selenium_tests()
    }
    
    print("\n" + "="*60)
    print("📊 Import Summary")
    print("="*60)
    
    for framework, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"{framework}: {status}")
    
    all_success = all(results.values())
    
    if all_success:
        print("\n🎉 All tests imported successfully!")
        print("\nNext steps:")
        print("  1. Navigate to the framework suite you want to run")
        print("  2. Install dependencies (see respective README files)")
        print("  3. Run the tests")
    else:
        print("\n⚠️  Some imports failed. Check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
