import os
import json
import re
import pytest
import allure
from playwright.async_api import expect
from conftest import capture_step

DATA_DIR = os.path.dirname(__file__)
with open(os.path.join(DATA_DIR, "test_data.json"), "r") as f:
    TEST_DATA = json.load(f)

@allure.feature("Recorded UI Flow")
@allure.severity(allure.severity_level.NORMAL)
@pytest.mark.asyncio
async def test_recorded_flow(page):
    """Generated test case from recorded interactions"""
        async with allure.step("1. Navigate to file:///D:/Projects/Advance/TestCaptive/demo.html"):

        # Navigate to TestCaptive Demo Page

        await page.goto("file:///D:/Projects/Advance/TestCaptive/demo.html", wait_until="domcontentloaded")
        await page.wait_for_load_state("networkidle")

    async with allure.step("2. Fill input-first-name"):

        # Fill "Enter your first name"
        test_value = TEST_DATA.get("input-first-name", "")

        await page.get_by_test_id("input-first-name").fill(test_value)

    async with allure.step("3. Fill input-last-name"):

        # Fill "Enter your last name"
        test_value = TEST_DATA.get("input-last-name", "")

        await page.get_by_test_id("input-last-name").fill(test_value)

    async with allure.step("4. Fill input-email"):

        # Fill "your.email@example.com"
        test_value = TEST_DATA.get("input-email", "")

        await page.get_by_test_id("input-email").fill(test_value)

    async with allure.step("5. Fill input-phone"):

        # Fill "(555) 123-4567"
        test_value = TEST_DATA.get("input-phone", "")

        await page.get_by_test_id("input-phone").fill(test_value)

    async with allure.step("6. Select us in Select Country\n                    Unite"):

        # Select option in dropdown
        test_value = TEST_DATA.get("select-country", "")

        _dropdown = page.get_by_test_id("select-country")

        await _dropdown.select_option(test_value)
        await page.wait_for_load_state("networkidle")
        await expect(_dropdown).to_have_value(test_value)

    async with allure.step("7. Fill textarea-comments"):

        # Fill "Any additional comments..."
        test_value = TEST_DATA.get("textarea-comments", "")

        await page.get_by_test_id("textarea-comments").fill(test_value)

    async with allure.step("8. Scroll page"):

        # Scroll page
        await page.evaluate("window.scrollTo(0, 300)")

    async with allure.step("9. Toggle checkbox-newsletter"):

        # Toggle checkbox/radio

        await page.get_by_test_id("checkbox-newsletter").check()

    async with allure.step("10. Click \"Validate Form\""):

        # Click "Validate Form"

        await page.get_by_test_id("btn-validate").click()

        await page.wait_for_load_state("domcontentloaded")

    async with allure.step("11. Click \"Submit Form\""):

        # Click "Submit Form"

        await page.get_by_test_id("btn-submit").click()

        await page.wait_for_load_state("domcontentloaded")

    async with allure.step("12. Click \"✅ Success!\""):

        # Click "✅ Success!"

        await page.locator('xpath=//*[@id=\"successPopup\"]/h2[1]').click()

    async with allure.step("13. Assert: Assert \"✅ Success!\" is visible"):

        # Assertion: Assert \"✅ Success!\" is visible

        await expect(page.locator('xpath=//*[@id=\"successPopup\"]/h2[1]')).to_be_visible()


