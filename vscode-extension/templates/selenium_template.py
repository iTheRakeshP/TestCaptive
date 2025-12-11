# Selenium Python Test Template

import pytest
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="module")
def test_data():
    """Load test data from JSON file"""
    with open('test_data.json', 'r') as f:
        return json.load(f)

@pytest.fixture
def driver():
    """Create a WebDriver instance for each test"""
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--start-maximized")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    yield driver
    
    driver.quit()

def test_recorded_flow(driver, test_data):
    """Generated test case from recorded interactions"""
    {{#events}}
    {{#if (eq event 'navigation')}}
    # Navigate to {{page.title}}
    {{#if isFirstNavigation}}
    driver.get("{{page.url}}")
    {{else}}
    # Verify URL change
    WebDriverWait(driver, 10).until(EC.url_contains("{{page.url}}"))
    {{/if}}
    time.sleep(2)
            
    {{else if (eq event 'click')}}
    # Click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    element = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="{{element.testid}}"]'))
    )
    {{else if element.id}}
    element = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "{{element.id}}"))
    )
    {{else if element.name}}
    element = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.NAME, "{{element.name}}"))
    )
    {{else}}
    element = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "{{element.xpath}}"))
    )
    {{/if}}
    element.click()
    time.sleep(1)
            
    {{else if (or (eq event 'change') (eq event 'input'))}}
    # Enter text in {{#if element.name}}"{{element.name}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
    {{#if element.testid}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="{{element.testid}}"]'))
    )
    {{else if element.id}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "{{element.id}}"))
    )
    {{else if element.name}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "{{element.name}}"))
    )
    {{else}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "{{element.xpath}}"))
    )
    {{/if}}
    element.clear()
    # Use test data from JSON file
    test_value = test_data.get("{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}", "")
    element.send_keys(test_value)
    time.sleep(0.5)
            
    {{else if (eq event 'keydown')}}
    # Key press: {{value}}
    from selenium.webdriver.common.keys import Keys
    {{#if element.id}}
    element = driver.find_element(By.ID, "{{element.id}}")
    {{else if element.name}}
    element = driver.find_element(By.NAME, "{{element.name}}")
    {{else}}
    element = driver.find_element(By.XPATH, "{{element.xpath}}")
    {{/if}}
    {{#if (eq value 'Enter')}}
    element.send_keys(Keys.RETURN)
    {{else if (eq value 'Tab')}}
    element.send_keys(Keys.TAB)
    {{else if (eq value 'Escape')}}
    element.send_keys(Keys.ESCAPE)
    {{else}}
    element.send_keys("{{value}}")
    {{/if}}
    time.sleep(0.5)
            
    {{else if (eq event 'assertion')}}
    # Assertion: {{event.assertion.description}}
    {{#if (eq assertion.type 'text-equals')}}
    {{#if assertion.element.testid}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]'))
    )
    assert element.text == "{{event.assertion.expectedValue}}", f"Expected '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{else if assertion.element.id}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "{{event.assertion.element.id}}"))
    )
    assert element.text == "{{event.assertion.expectedValue}}", f"Expected '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{else if assertion.element.xpath}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "{{event.assertion.element.xpath}}"))
    )
    assert element.text == "{{event.assertion.expectedValue}}", f"Expected '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{/if}}
    
    {{else if (eq assertion.type 'text-contains')}}
    {{#if assertion.element.testid}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]'))
    )
    assert "{{event.assertion.expectedValue}}" in element.text, f"Expected text to contain '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{else if assertion.element.id}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "{{event.assertion.element.id}}"))
    )
    assert "{{event.assertion.expectedValue}}" in element.text, f"Expected text to contain '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{else if assertion.element.xpath}}
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "{{event.assertion.element.xpath}}"))
    )
    assert "{{event.assertion.expectedValue}}" in element.text, f"Expected text to contain '{{event.assertion.expectedValue}}', got '{element.text}'"
    {{/if}}
    
    {{else if (eq assertion.type 'visible')}}
    {{#if assertion.element.testid}}
    element = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]'))
    )
    assert element.is_displayed(), "Element should be visible"
    {{else if assertion.element.id}}
    element = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "{{event.assertion.element.id}}"))
    )
    assert element.is_displayed(), "Element should be visible"
    {{else if assertion.element.xpath}}
    element = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "{{event.assertion.element.xpath}}"))
    )
    assert element.is_displayed(), "Element should be visible"
    {{/if}}
    
    {{else if (eq assertion.type 'not-visible')}}
    {{#if assertion.element.testid}}
    elements = driver.find_elements(By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]')
    assert len(elements) == 0 or not elements[0].is_displayed(), "Element should not be visible"
    {{else if assertion.element.id}}
    elements = driver.find_elements(By.ID, "{{event.assertion.element.id}}")
    assert len(elements) == 0 or not elements[0].is_displayed(), "Element should not be visible"
    {{else if assertion.element.xpath}}
    elements = driver.find_elements(By.XPATH, "{{event.assertion.element.xpath}}")
    assert len(elements) == 0 or not elements[0].is_displayed(), "Element should not be visible"
    {{/if}}
    
    {{else if (eq assertion.type 'enabled')}}
    {{#if assertion.element.testid}}
    element = driver.find_element(By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]')
    assert element.is_enabled(), "Element should be enabled"
    {{else if assertion.element.id}}
    element = driver.find_element(By.ID, "{{event.assertion.element.id}}")
    assert element.is_enabled(), "Element should be enabled"
    {{else if assertion.element.xpath}}
    element = driver.find_element(By.XPATH, "{{event.assertion.element.xpath}}")
    assert element.is_enabled(), "Element should be enabled"
    {{/if}}
    
    {{else if (eq assertion.type 'disabled')}}
    {{#if assertion.element.testid}}
    element = driver.find_element(By.CSS_SELECTOR, '[data-testid="{{event.assertion.element.testid}}"]')
    assert not element.is_enabled(), "Element should be disabled"
    {{else if assertion.element.id}}
    element = driver.find_element(By.ID, "{{event.assertion.element.id}}")
    assert not element.is_enabled(), "Element should be disabled"
    {{else if assertion.element.xpath}}
    element = driver.find_element(By.XPATH, "{{event.assertion.element.xpath}}")
    assert not element.is_enabled(), "Element should be disabled"
    {{/if}}
    
    {{else if (eq assertion.type 'url-contains')}}
    assert "{{event.assertion.expectedValue}}" in driver.current_url, f"Expected URL to contain '{{event.assertion.expectedValue}}', got '{driver.current_url}'"
    {{/if}}
    time.sleep(0.5)
            
    {{/if}}
    {{/events}}
    
    print("Test completed successfully!")

