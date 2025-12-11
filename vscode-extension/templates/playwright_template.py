# Playwright Python Test Template

import json
import asyncio
import re
from playwright.async_api import async_playwright, expect

class TestCaptiveTest:
    def __init__(self):
        self.browser = None
        self.page = None
        self.data = None
        
    async def setup(self):
        """Setup test environment and load test data"""
        # Load test data
        with open('test_data.json', 'r') as f:
            self.data = json.load(f)
            
        # Launch browser
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=False)
        self.page = await self.browser.new_page()
        
    async def teardown(self):
        """Clean up after test"""
        if self.browser:
            await self.browser.close()
            
    async def test_recorded_flow(self):
        """Generated test case from recorded interactions"""
        try:
            await self.setup()
            
            {{#events}}
            {{#if (eq event 'navigation')}}
            # Navigate to {{page.title}}
            {{#if isFirstNavigation}}
            await self.page.goto("{{page.url}}")
            {{else}}
            # Verify URL change
            await expect(self.page).to_have_url("{{page.url}}")
            {{/if}}
            
            {{else if (eq event 'click')}}
            # Click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
            {{#if element.testid}}
            await self.page.get_by_test_id("{{element.testid}}").click()
            {{else if element.ariaLabel}}
            await self.page.get_by_label("{{element.ariaLabel}}").click()
            {{else if element.id}}
            await self.page.click('#{{element.id}}')
            {{else if element.name}}
            await self.page.click('[name="{{element.name}}"]')
            {{else if element.xpath}}
            await self.page.locator('xpath={{element.xpath}}').click()
            {{else}}
            await self.page.click('{{element.cssSelector}}')
            {{/if}}
            
            {{else if (or (eq event 'change') (eq event 'input'))}}
            # Enter text in {{#if element.name}}"{{element.name}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
            {{#if element.testid}}
            await self.page.get_by_test_id("{{element.testid}}").fill('')
            {{else if element.ariaLabel}}
            await self.page.get_by_label("{{element.ariaLabel}}").fill('')
            {{else if element.id}}
            await self.page.fill('#{{element.id}}', '')
            {{else if element.name}}
            await self.page.fill('[name="{{element.name}}"]', '')
            {{else if element.xpath}}
            await self.page.locator('xpath={{element.xpath}}').fill('')
            {{else}}
            await self.page.fill('{{element.cssSelector}}', '')
            {{/if}}
            {{#if value}}
            # Use test data from JSON file
            test_value = self.data.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}")
            
            {{#if element.testid}}
            await self.page.get_by_test_id("{{element.testid}}").fill(test_value)
            {{else if element.ariaLabel}}
            await self.page.get_by_label("{{element.ariaLabel}}").fill(test_value)
            {{else if element.id}}
            await self.page.fill('#{{element.id}}', test_value)
            {{else if element.name}}
            await self.page.fill('[name="{{element.name}}"]', test_value)
            {{else if element.xpath}}
            await self.page.locator('xpath={{element.xpath}}').fill(test_value)
            {{else}}
            await self.page.fill('{{element.cssSelector}}', test_value)
            {{/if}}
            {{else}}
            test_value = self.data.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}", "")
            {{#if element.testid}}
            await self.page.get_by_test_id("{{element.testid}}").fill(test_value)
            {{else if element.ariaLabel}}
            await self.page.get_by_label("{{element.ariaLabel}}").fill(test_value)
            {{else if element.id}}
            await self.page.fill('#{{element.id}}', test_value)
            {{else if element.name}}
            await self.page.fill('[name="{{element.name}}"]', test_value)
            {{else if element.xpath}}
            await self.page.locator('xpath={{element.xpath}}').fill(test_value)
            {{else}}
            await self.page.fill('{{element.cssSelector}}', test_value)
            {{/if}}
            {{/if}}
            
            {{else if (eq event 'keydown')}}
            # Key press: {{value}}
            {{#if element.testid}}
            await self.page.get_by_test_id("{{element.testid}}").press('{{value}}')
            {{else if element.ariaLabel}}
            await self.page.get_by_label("{{element.ariaLabel}}").press('{{value}}')
            {{else if element.id}}
            await self.page.press('#{{element.id}}', '{{value}}')
            {{else if element.name}}
            await self.page.press('[name="{{element.name}}"]', '{{value}}')
            {{else if element.xpath}}
            await self.page.locator('xpath={{element.xpath}}').press('{{value}}')
            {{else}}
            await self.page.press('{{element.cssSelector}}', '{{value}}')
            {{/if}}
            
            {{else if (eq event 'assertion')}}
            # Assertion: {{event.assertion.description}}
            {{#if (eq assertion.type 'text-equals')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).to_have_text("{{event.assertion.expectedValue}}")
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).to_have_text("{{event.assertion.expectedValue}}")
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).to_have_text("{{event.assertion.expectedValue}}")
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).to_have_text("{{event.assertion.expectedValue}}")
            {{/if}}
            
            {{else if (eq assertion.type 'text-contains')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).to_contain_text("{{event.assertion.expectedValue}}")
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).to_contain_text("{{event.assertion.expectedValue}}")
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).to_contain_text("{{event.assertion.expectedValue}}")
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).to_contain_text("{{event.assertion.expectedValue}}")
            {{/if}}
            
            {{else if (eq assertion.type 'visible')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_visible()
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).to_be_visible()
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).to_be_visible()
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).to_be_visible()
            {{/if}}
            
            {{else if (eq assertion.type 'not-visible')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).not_to_be_visible()
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).not_to_be_visible()
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).not_to_be_visible()
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).not_to_be_visible()
            {{/if}}
            
            {{else if (eq assertion.type 'enabled')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_enabled()
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).to_be_enabled()
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).to_be_enabled()
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).to_be_enabled()
            {{/if}}
            
            {{else if (eq assertion.type 'disabled')}}
            {{#if assertion.element.testid}}
            await expect(self.page.get_by_test_id("{{event.assertion.element.testid}}")).to_be_disabled()
            {{else if assertion.element.id}}
            await expect(self.page.locator('#{{event.assertion.element.id}}')).to_be_disabled()
            {{else if assertion.element.xpath}}
            await expect(self.page.locator('xpath={{event.assertion.element.xpath}}')).to_be_disabled()
            {{else}}
            await expect(self.page.locator('{{event.assertion.element.cssSelector}}')).to_be_disabled()
            {{/if}}
            
            {{else if (eq assertion.type 'url-contains')}}
            await expect(self.page).to_have_url(re.compile("{{event.assertion.expectedValue}}"))
            
            {{/if}}
            
            {{/if}}
            {{/events}}
            
            print("Test completed successfully!")
            
        except Exception as e:
            print(f"Test failed with error: {e}")
            raise
        finally:
            await self.teardown()

async def main():
    test = TestCaptiveTest()
    await test.test_recorded_flow()

if __name__ == "__main__":
    asyncio.run(main())

