import os
import json
import re
import pytest
from playwright.async_api import expect

DATA_DIR = os.path.dirname(__file__)
with open(os.path.join(DATA_DIR, "test_data.json"), "r") as f:
    TEST_DATA = json.load(f)

@pytest.mark.asyncio
async def test_recorded_flow(page):
    """Generated test case from recorded interactions"""

    # Navigate to TestCaptive Demo Page

    await page.goto("file:///D:/Projects/Advance/TestCaptive/demo.html", wait_until="domcontentloaded")
    await page.wait_for_load_state("networkidle")

    # Fill "Enter your first name"
    test_value = TEST_DATA.get("input-first-name", "")

    await page.get_by_test_id("input-first-name").fill(test_value)

    # Fill "Enter your last name"
    test_value = TEST_DATA.get("input-last-name", "")

    await page.get_by_test_id("input-last-name").fill(test_value)

    # Fill "your.email@example.com"
    test_value = TEST_DATA.get("input-email", "")

    await page.get_by_test_id("input-email").fill(test_value)

    # Fill "(555) 123-4567"
    test_value = TEST_DATA.get("input-phone", "")

    await page.get_by_test_id("input-phone").fill(test_value)

    # Select option in dropdown
    test_value = TEST_DATA.get("select-country", "")

    await page.get_by_test_id("select-country").select_option(test_value)

    # Fill "Any additional comments..."
    test_value = TEST_DATA.get("textarea-comments", "")

    await page.get_by_test_id("textarea-comments").fill(test_value)

    # Scroll page
    await page.evaluate("window.scrollTo(0, 300)")

    # Toggle checkbox/radio

    await page.get_by_test_id("checkbox-newsletter").check()

    # Click "Validate Form"

    await page.get_by_test_id("btn-validate").click()

    await page.wait_for_load_state("domcontentloaded")

    # Click "Submit Form"

    await page.get_by_test_id("btn-submit").click()

    await page.wait_for_load_state("domcontentloaded")

    # Click "✅ Success!"

    await page.locator('xpath=//*[@id=\"successPopup\"]/h2[1]').click()

    # Assertion: Assert \"✅ Success!\" is visible

    await expect(page.locator('xpath=//*[@id=\"successPopup\"]/h2[1]')).to_be_visible()

