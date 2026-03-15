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
    {{#events}}
    {{#if (eq event 'navigation')}}
    # Navigate to {{page.title}}
    {{#if isFirstNavigation}}
    await page.goto("{{page.url}}", wait_until="domcontentloaded")
    {{else}}
    # Verify URL change
    await expect(page).to_have_url("{{page.url}}")
    {{/if}}
    
    {{else if (eq event 'spa-navigation')}}
    # SPA navigation detected
    await page.wait_for_url("{{page.url}}", wait_until="domcontentloaded")
    
    {{else if (eq event 'click')}}
    # Click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").click()
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").click()
    {{else if element.id}}
    await page.locator('#{{element.id}}').click()
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').click()
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').click()
    {{else}}
    await page.locator('{{element.cssSelector}}').click()
    {{/if}}
    
    {{else if (eq event 'dblclick')}}
    # Double-click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").dblclick()
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").dblclick()
    {{else if element.id}}
    await page.locator('#{{element.id}}').dblclick()
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').dblclick()
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').dblclick()
    {{else}}
    await page.locator('{{element.cssSelector}}').dblclick()
    {{/if}}
    
    {{else if (eq event 'fill')}}
    # Fill {{#if element.name}}"{{element.name}}"{{else if element.placeholder}}"{{element.placeholder}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
    test_value = TEST_DATA.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}", "")
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").fill(test_value)
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").fill(test_value)
    {{else if element.id}}
    await page.locator('#{{element.id}}').fill(test_value)
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').fill(test_value)
    {{else if element.placeholder}}
    await page.get_by_placeholder("{{element.placeholder}}").fill(test_value)
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').fill(test_value)
    {{else}}
    await page.locator('{{element.cssSelector}}').fill(test_value)
    {{/if}}
    
    {{else if (or (eq event 'change') (eq event 'input'))}}
    # Enter text in {{#if element.name}}"{{element.name}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
    test_value = TEST_DATA.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}", "")
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").fill(test_value)
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").fill(test_value)
    {{else if element.id}}
    await page.locator('#{{element.id}}').fill(test_value)
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').fill(test_value)
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').fill(test_value)
    {{else}}
    await page.locator('{{element.cssSelector}}').fill(test_value)
    {{/if}}
    
    {{else if (eq event 'select')}}
    # Select option in dropdown
    test_value = TEST_DATA.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}select_value{{/if}}", "")
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").select_option(test_value)
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").select_option(test_value)
    {{else if element.id}}
    await page.locator('#{{element.id}}').select_option(test_value)
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').select_option(test_value)
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').select_option(test_value)
    {{else}}
    await page.locator('{{element.cssSelector}}').select_option(test_value)
    {{/if}}
    
    {{else if (eq event 'check')}}
    # Toggle checkbox/radio
    {{#if element.testid}}
    {{#if value}}
    await page.get_by_test_id("{{element.testid}}").check()
    {{else}}
    await page.get_by_test_id("{{element.testid}}").uncheck()
    {{/if}}
    {{else if element.ariaLabel}}
    {{#if value}}
    await page.get_by_label("{{element.ariaLabel}}").check()
    {{else}}
    await page.get_by_label("{{element.ariaLabel}}").uncheck()
    {{/if}}
    {{else if element.id}}
    {{#if value}}
    await page.locator('#{{element.id}}').check()
    {{else}}
    await page.locator('#{{element.id}}').uncheck()
    {{/if}}
    {{else if element.name}}
    {{#if value}}
    await page.locator('[name="{{element.name}}"]').check()
    {{else}}
    await page.locator('[name="{{element.name}}"]').uncheck()
    {{/if}}
    {{else if element.xpath}}
    {{#if value}}
    await page.locator('xpath={{element.xpath}}').check()
    {{else}}
    await page.locator('xpath={{element.xpath}}').uncheck()
    {{/if}}
    {{else}}
    {{#if value}}
    await page.locator('{{element.cssSelector}}').check()
    {{else}}
    await page.locator('{{element.cssSelector}}').uncheck()
    {{/if}}
    {{/if}}
    
    {{else if (eq event 'keydown')}}
    # Key press: {{value}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").press('{{value}}')
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").press('{{value}}')
    {{else if element.id}}
    await page.locator('#{{element.id}}').press('{{value}}')
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').press('{{value}}')
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').press('{{value}}')
    {{else}}
    await page.locator('{{element.cssSelector}}').press('{{value}}')
    {{/if}}
    
    {{else if (eq event 'hover')}}
    # Hover over {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").hover()
    {{else if element.ariaLabel}}
    await page.get_by_label("{{element.ariaLabel}}").hover()
    {{else if element.id}}
    await page.locator('#{{element.id}}').hover()
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').hover()
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').hover()
    {{else}}
    await page.locator('{{element.cssSelector}}').hover()
    {{/if}}
    
    {{else if (eq event 'scroll')}}
    # Scroll page
    await page.evaluate("window.scrollTo(0, {{value}})")
    
    {{else if (eq event 'file-upload')}}
    # Upload file
    {{#if element.testid}}
    await page.get_by_test_id("{{element.testid}}").set_input_files("{{value}}")
    {{else if element.id}}
    await page.locator('#{{element.id}}').set_input_files("{{value}}")
    {{else if element.name}}
    await page.locator('[name="{{element.name}}"]').set_input_files("{{value}}")
    {{else if element.xpath}}
    await page.locator('xpath={{element.xpath}}').set_input_files("{{value}}")
    {{else}}
    await page.locator('{{element.cssSelector}}').set_input_files("{{value}}")
    {{/if}}
    
    {{else if (eq event 'drag-drop')}}
    # Drag and drop
    {{#if element.testid}}
    source = page.get_by_test_id("{{element.testid}}")
    {{else if element.id}}
    source = page.locator('#{{element.id}}')
    {{else if element.xpath}}
    source = page.locator('xpath={{element.xpath}}')
    {{else}}
    source = page.locator('{{element.cssSelector}}')
    {{/if}}
    await source.drag_to(page.locator('{{value}}'))
    
    {{else if (eq event 'dialog')}}
    # Handle browser dialog
    page.once("dialog", lambda dialog: dialog.accept())
    
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
    
    {{else if (eq assertion.type 'url-equals')}}
    await expect(page).to_have_url("{{event.assertion.expectedValue}}")
    
    {{else if (eq assertion.type 'attribute-equals')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_have_attribute("{{event.assertion.attributeName}}", "{{event.assertion.expectedValue}}")
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_have_attribute("{{event.assertion.attributeName}}", "{{event.assertion.expectedValue}}")
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_have_attribute("{{event.assertion.attributeName}}", "{{event.assertion.expectedValue}}")
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_have_attribute("{{event.assertion.attributeName}}", "{{event.assertion.expectedValue}}")
    {{/if}}
    
    {{else if (eq assertion.type 'count-equals')}}
    {{#if assertion.element.testid}}
    await expect(page.get_by_test_id("{{event.assertion.element.testid}}")).to_have_count({{event.assertion.expectedValue}})
    {{else if assertion.element.id}}
    await expect(page.locator('#{{event.assertion.element.id}}')).to_have_count({{event.assertion.expectedValue}})
    {{else if assertion.element.xpath}}
    await expect(page.locator('xpath={{event.assertion.element.xpath}}')).to_have_count({{event.assertion.expectedValue}})
    {{else}}
    await expect(page.locator('{{event.assertion.element.cssSelector}}')).to_have_count({{event.assertion.expectedValue}})
    {{/if}}
    
    {{/if}}
    
    {{/if}}
    {{/events}}


