import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="function")
def driver():
    """Create a WebDriver instance for each test"""
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--start-maximized")
    
    # Use webdriver-manager to automatically manage ChromeDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    yield driver
    
    driver.quit()

@pytest.fixture(scope="module")
def test_data():
    """Load test data from JSON file"""
    import json
    with open("test_data.json", "r") as f:
        return json.load(f)
