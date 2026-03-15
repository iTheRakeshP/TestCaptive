# Playwright Python Test Template

import os
import pytest
import json
import re
from playwright.async_api import async_playwright, expect

@pytest.fixture(scope="module")
def test_data():
    """Load test data from JSON file"""
    with open('test_data.json', 'r') as f:
        return json.load(f)

@pytest.fixture
async def page():
    """Create a new page for each test"""
    async with async_playwright() as p:
        headless = os.environ.get("HEADLESS", "false").lower() == "true"
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        yield page
        await context.close()
        await browser.close()

@pytest.mark.asyncio
async def test_recorded_flow(page, test_data):
    """Generated test case from recorded interactions"""
        
    # Navigate to TestCaptive Demo Page
    
    await page.goto("file:///D:/Projects/Advance/TestCaptive/demo.html", wait_until="domcontentloaded")
    
    
    
    
    # Fill "Enter your first name"
    test_value = test_data.get("input-first-name", "")
    
    await page.get_by_test_id("input-first-name").fill(test_value)
    
    
    
    
    # Fill "Enter your last name"
    test_value = test_data.get("input-last-name", "")
    
    await page.get_by_test_id("input-last-name").fill(test_value)
    
    
    
    
    # Fill "your.email@example.com"
    test_value = test_data.get("input-email", "")
    
    await page.get_by_test_id("input-email").fill(test_value)
    
    
    
    
    # Fill "(555) 123-4567"
    test_value = test_data.get("input-phone", "")
    
    await page.get_by_test_id("input-phone").fill(test_value)
    
    
    
    
    # Select option in dropdown
    test_value = test_data.get("select-country", "")
    
    await page.get_by_test_id("select-country").select_option(test_value)
    
    
    
    
    # Fill "Any additional comments..."
    test_value = test_data.get("textarea-comments", "")
    
    await page.get_by_test_id("textarea-comments").fill(test_value)
    
    
    
    
    # Scroll page
    await page.evaluate("window.scrollTo(0, )")
    
    
    
    # Click element
    
    await page.get_by_test_id("checkbox-newsletter").click()
    
    
    
    
    # Toggle checkbox/radio
    
    
    await page.get_by_test_id("checkbox-newsletter").check()
    
    
    
    
    
    # Click "Validate Form"    
    await page.get_by_test_id("btn-validate").click()
    
    
    
    
    # Click "Submit Form"    
    await page.get_by_test_id("btn-submit").click()
    
    
    
    
    # Click "✅ Success!"    
    await page.locator('xpath=//*[@id="successPopup"]/h2[1]').click()
        await page.locator('h2').click()
    
    
    
    
    # Assertion: Assert "✅ Success!" is visible
    
    await expect(page.locator('h2')).to_have_text("{{event.assertion.expectedValue}}")
    
    
        
    await expect(page.locator('h2')).to_contain_text("{{event.assertion.expectedValue}}")
    
    
        
    await expect(page.locator('h2')).to_be_visible()
    
    
        
    await expect(page.locator('h2')).not_to_be_visible()
    
    
        
    await expect(page.locator('h2')).to_be_enabled()
    
    
        
    await expect(page.locator('h2')).to_be_disabled()
    
    
        await expect(page).to_have_url(re.compile("{{event.assertion.expectedValue}}"))
    
        await expect(page).to_have_url("{{event.assertion.expectedValue}}")
    
        
    await expect(page.locator('h2')).to_have_attribute("{{event.assertion.attributeName}}", "{{event.assertion.expectedValue}}")
    
    
        
    await expect(page.locator('h2')).to_have_count({{event.assertion.expectedValue}})
    
    
        
    
    
    # Click "Close"    
    await page.locator('xpath=//*[@id="successPopup"]/button[1]').click()
        await page.locator('button.testcaptive-recordable').click()
    
    
    
    
    print("Test completed successfully!")


