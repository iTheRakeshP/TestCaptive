#!/usr/bin/env python3
"""
Script to import generated Playwright tests from Test-Code folder
Converts .txt files to proper Python test files
"""

import os
import re
import shutil

SOURCE_DIR = os.path.join(os.path.dirname(__file__), '../../../Test-Code')
TARGET_DIR = os.path.join(os.path.dirname(__file__), '../tests')
SOURCE_FILE = 'Playwright.txt'
TARGET_FILE = 'test_generated.py'

def clean_test_content(content):
    """Clean up the test content and make it pytest compatible"""
    
    # Remove handlebars template artifacts
    content = re.sub(r'\{\{[^}]*\}\}', '', content)
    
    # Convert class-based test to pytest functions
    lines = content.split('\n')
    processed_lines = []
    in_class = False
    indent_level = 0
    
    # Add pytest imports
    processed_lines.append('import pytest')
    processed_lines.append('import json')
    processed_lines.append('from playwright.async_api import async_playwright, expect')
    processed_lines.append('')
    processed_lines.append('')
    
    # Add fixture for test data
    processed_lines.append('@pytest.fixture(scope="module")')
    processed_lines.append('def test_data():')
    processed_lines.append('    """Load test data from JSON file"""')
    processed_lines.append('    with open("test_data.json", "r") as f:')
    processed_lines.append('        return json.load(f)')
    processed_lines.append('')
    processed_lines.append('')
    
    for line in lines:
        # Skip class definition and __init__
        if 'class TestCaptiveTest' in line or 'def __init__' in line:
            continue
        if 'self.browser = None' in line or 'self.page = None' in line or 'self.data = None' in line:
            continue
            
        # Convert setup method
        if 'async def setup(self):' in line:
            # Skip setup, we'll use fixtures
            in_class = True
            continue
        if 'async def teardown(self):' in line:
            # Skip teardown, we'll use fixtures
            in_class = True
            continue
            
        # Convert test method
        if 'async def test_recorded_flow(self):' in line:
            processed_lines.append('@pytest.mark.asyncio')
            processed_lines.append('async def test_recorded_flow(page, test_data):')
            processed_lines.append('    """Generated test case from recorded interactions"""')
            in_class = False
            continue
            
        # Remove setup/teardown calls
        if 'await self.setup()' in line or 'await self.teardown()' in line:
            continue
            
        # Replace self references
        line = line.replace('self.page', 'page')
        line = line.replace('self.data', 'test_data')
        line = line.replace('self.browser', 'browser')
        
        # Adjust indentation for pytest
        if line.strip() and in_class:
            continue
        if line.strip().startswith('try:') or line.strip().startswith('except') or line.strip().startswith('finally'):
            continue
            
        processed_lines.append(line)
    
    return '\n'.join(processed_lines)

def import_tests():
    """Import Playwright tests from Test-Code folder"""
    try:
        # Ensure target directory exists
        os.makedirs(TARGET_DIR, exist_ok=True)
        
        # Read source file
        source_path = os.path.join(SOURCE_DIR, SOURCE_FILE)
        if not os.path.exists(source_path):
            print(f'❌ Source file not found: {source_path}')
            return False
        
        with open(source_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Clean and process content
        content = clean_test_content(content)
        
        # Write to target
        target_path = os.path.join(TARGET_DIR, TARGET_FILE)
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print('✅ Successfully imported Playwright tests!')
        print(f'📁 Source: {source_path}')
        print(f'📁 Target: {target_path}')
        print('\n🚀 You can now run the tests with:')
        print('   pytest tests/ -v          - Run all tests')
        print('   pytest tests/ -v --headed - Run with browser visible')
        return True
        
    except Exception as e:
        print(f'❌ Error importing tests: {str(e)}')
        return False

if __name__ == '__main__':
    import_tests()
