# Playwright Python Test Template

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
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        yield page
        await browser.close()

@pytest.mark.asyncio
async def test_recorded_flow(page, test_data):
    """Generated test case from recorded interactions"""
    {{#events}}
    {{#if (eq event 'navigation')}}
    # Navigate to {{page.title}}
    {{#if isFirstNavigation}}
    await page.goto("{{page.url}}")
    {{else}}
    # Verify URL change
    await expect(page).to_have_url("{{page.url}}")
    {{/if}}
    
    {{else if (eq event 'click')}}
    # Click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").click()
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").click()
    {{else if element.id}}
    await page.click('#{{element.id}}')
    {{else if element.name}}
    await page.click('[name="{{element.name}}"]')
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').click()
    {{else}}
    await page.click('{{element.cssSelector}}')
    {{/if}}
    
    {{else if (or (eq event 'change') (eq event 'input'))}}
    # Enter text in {{#if element.name}}"{{element.name}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
    # Use test data from JSON file
    test_value = test_data.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}", "")
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").fill(test_value)
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").fill(test_value)
    {{else if element.id}}
    await page.fill('#{{element.id}}', test_value)
    {{else if element.name}}
    await page.fill('[name="{{element.name}}"]', test_value)
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').fill(test_value)
    {{else}}
    await page.fill('{{element.cssSelector}}', test_value)
    {{/if}}
    
    {{else if (eq event 'keydown')}}
    # Key press: {{value}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").press('{{value}}')
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").press('{{value}}')
    {{else if element.id}}
    await page.press('#{{element.id}}', '{{value}}')
    {{else if element.name}}
    await page.press('[name="{{element.name}}"]', '{{value}}')
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').press('{{value}}')
    {{else}}
    await page.press('{{element.cssSelector}}', '{{value}}')
    {{/if}}
    
    {{else if (eq event 'assertion')}}
    # Assertion: {{event.assertion.description}}
    {{#if (eq assertion.type 'text-equals')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_have_text("{{event.assertion.expectedValue}}")
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_have_text("{{event.assertion.expectedValue}}")
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_have_text("{{event.assertion.expectedValue}}")
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_have_text("{{event.assertion.expectedValue}}")
    {{/if}}
    
    {{else if (eq assertion.type 'text-contains')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_contain_text("{{event.assertion.expectedValue}}")
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_contain_text("{{event.assertion.expectedValue}}")
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_contain_text("{{event.assertion.expectedValue}}")
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_contain_text("{{event.assertion.expectedValue}}")
    {{/if}}
    
    {{else if (eq assertion.type 'visible')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_visible()
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_be_visible()
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_be_visible()
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_be_visible()
    {{/if}}
    
    {{else if (eq assertion.type 'not-visible')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).not_to_be_visible()
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).not_to_be_visible()
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).not_to_be_visible()
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).not_to_be_visible()
    {{/if}}
    
    {{else if (eq assertion.type 'enabled')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_enabled()
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_be_enabled()
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_be_enabled()
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_be_enabled()
    {{/if}}
    
    {{else if (eq assertion.type 'disabled')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_disabled()
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_be_disabled()
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_be_disabled()
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_be_disabled()
    {{/if}}
    
    {{else if (eq assertion.type 'url-contains')}}
    await expect(page).to_have_url(re.compile("{{event.assertion.expectedValue}}"))
    
    {{/if}}
    
    {{/if}}
    {{/events}}
    
    print("Test completed successfully!")


