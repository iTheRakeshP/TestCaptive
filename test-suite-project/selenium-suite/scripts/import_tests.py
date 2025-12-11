#!/usr/bin/env python3
"""
Script to import generated Selenium tests from Test-Code folder
Converts .txt files to proper Python test files
"""

import os
import re

SOURCE_DIR = os.path.join(os.path.dirname(__file__), '../../../Test-Code')
TARGET_DIR = os.path.join(os.path.dirname(__file__), '../tests')
SOURCE_FILE = 'Selenium.txt'
TARGET_FILE = 'test_generated.py'

def clean_test_content(content):
    """Clean up the test content and make it pytest compatible"""
    
    # Remove handlebars template artifacts and duplicate assertion blocks
    content = re.sub(r'\{\{[^}]*\}\}', '', content)
    
    lines = content.split('\n')
    processed_lines = []
    skip_until_next_comment = False
    last_comment = None
    
    # Add pytest imports
    processed_lines.append('import pytest')
    processed_lines.append('import json')
    processed_lines.append('import time')
    processed_lines.append('from selenium import webdriver')
    processed_lines.append('from selenium.webdriver.common.by import By')
    processed_lines.append('from selenium.webdriver.support.ui import WebDriverWait')
    processed_lines.append('from selenium.webdriver.support import expected_conditions as EC')
    processed_lines.append('')
    processed_lines.append('')
    
    for i, line in enumerate(lines):
        # Skip class definition and __init__
        if 'class TestCaptiveTest' in line or 'def __init__' in line:
            continue
        if 'self.driver = None' in line or 'self.data = None' in line:
            continue
            
        # Skip setup and teardown methods
        if 'def setup(self):' in line or 'def teardown(self):' in line:
            skip_until_next_comment = True
            continue
            
        # Detect start of test method
        if 'def test_recorded_flow(self):' in line:
            processed_lines.append('def test_recorded_flow(driver, test_data):')
            processed_lines.append('    """Generated test case from recorded interactions"""')
            skip_until_next_comment = False
            continue
        
        # Check if we hit a meaningful comment (action comment)
        if line.strip().startswith('#') and not line.strip().startswith('# Load') and not line.strip().startswith('# Setup') and not line.strip().startswith('# Initialize') and not line.strip().startswith('# Clean'):
            if skip_until_next_comment:
                skip_until_next_comment = False
            last_comment = line.strip()
            
        if skip_until_next_comment:
            continue
            
        # Remove setup/teardown calls and try/except blocks
        if 'self.setup()' in line or 'self.teardown()' in line:
            continue
        if line.strip() in ['try:', 'except Exception as e:', 'finally:']:
            continue
        if 'print(f"Test failed:' in line or 'print(f"\\nTest completed' in line:
            continue
            
        # Skip duplicate assertion blocks (those without actual element locators)
        if 'assert element.text ==' in line and 'element = ' not in lines[max(0, i-5):i]:
            continue
        if line.strip().startswith('element = ') and 'assertion.element.testid' in line:
            continue
            
        # Replace self references
        line = line.replace('self.driver', 'driver')
        line = line.replace('self.data', 'test_data')
        
        # Fix indentation - reduce by one level since we're not in a class
        if line.startswith('        '):
            line = line[4:]  # Remove 4 spaces
        elif line.startswith('    ') and line[4:].strip():
            pass  # Keep base indentation
            
        processed_lines.append(line)
    
    return '\n'.join(processed_lines)

def import_tests():
    """Import Selenium tests from Test-Code folder"""
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
        
        print('✅ Successfully imported Selenium tests!')
        print(f'📁 Source: {source_path}')
        print(f'📁 Target: {target_path}')
        print('\n🚀 You can now run the tests with:')
        print('   pytest tests/ -v     - Run all tests')
        print('   pytest tests/ -v -s  - Run with console output')
        return True
        
    except Exception as e:
        print(f'❌ Error importing tests: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    import_tests()
