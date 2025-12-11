# Selenium Test Suite for TestCaptive

Reliable web testing suite powered by Selenium and TestCaptive.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

The `webdriver-manager` package automatically handles ChromeDriver installation and updates.

### 2. Import Generated Tests

```bash
python scripts/import_tests.py
```

This script automatically:
- Reads generated tests from `../../Test-Code/Selenium.txt`
- Converts them to pytest-compatible format
- Saves to `tests/test_generated.py`
- Cleans up template artifacts and duplicates

### 3. Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with detailed console output
pytest tests/ -v -s

# Run specific test
pytest tests/test_generated.py::test_recorded_flow -v
```

## 📁 Project Structure

```
selenium-suite/
├── tests/                       # Your test files
│   └── test_generated.py
├── scripts/
│   └── import_tests.py          # Test import utility
├── conftest.py                  # Pytest fixtures and config
├── test_data.json              # Test data
├── pytest.ini                   # Pytest configuration
├── requirements.txt             # Python dependencies
└── package.json                 # NPM scripts reference
```

## 🔧 Configuration

### Pytest Config (`pytest.ini`)

```ini
[pytest]
testpaths = tests                # Test directory
python_files = test_*.py         # Test file pattern
python_classes = Test*           # Test class pattern
python_functions = test_*        # Test function pattern
addopts = -v --tb=short         # Verbose with short tracebacks
```

### Fixtures (`conftest.py`)

Pre-configured fixtures:
- `driver`: Chrome WebDriver instance (function-scoped)
- `test_data`: Loaded test data from JSON

### WebDriver Options

Modify `conftest.py` to customize Chrome options:

```python
chrome_options = Options()
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_argument("--start-maximized")
# chrome_options.add_argument("--headless")  # Uncomment for headless mode
```

### Test Data (`test_data.json`)

Customize your test inputs:

```json
{
  "input-first-name": "John",
  "input-last-name": "Doe",
  "input-email": "john.doe@example.com"
}
```

## 🎯 Features

- ✅ Automatic WebDriver management (webdriver-manager)
- ✅ Chrome, Firefox, Edge support
- ✅ Explicit waits with WebDriverWait
- ✅ Page Object Model ready
- ✅ Screenshot capture
- ✅ Detailed error reporting
- ✅ CI/CD ready

## 📝 Writing Custom Tests

Create a new test in `tests/`:

```python
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login(driver, test_data):
    """Test user login"""
    driver.get("https://example.com/login")
    
    # Use explicit waits
    username_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "username"))
    )
    username_field.send_keys(test_data["username"])
    
    driver.find_element(By.ID, "password").send_keys(test_data["password"])
    driver.find_element(By.ID, "submit").click()
    
    # Assert success
    assert "Dashboard" in driver.title
```

## 🐛 Debugging

### Run in Debug Mode

```bash
# With detailed output and no capture
pytest tests/ -v -s

# With breakpoints
pytest tests/ -v -s --pdb

# Run and stop at first failure
pytest tests/ -v -x
```

### Take Screenshots

Add to your test:

```python
def test_example(driver):
    driver.get("https://example.com")
    driver.save_screenshot("screenshot.png")
```

### Enable Browser Visibility

Tests run with browser visible by default. To run headless, modify `conftest.py`:

```python
chrome_options.add_argument("--headless")
```

### Common Issues

**ChromeDriver version mismatch**: 
- The `webdriver-manager` handles this automatically
- If issues persist, run: `pip install --upgrade webdriver-manager`

**Element not found**: 
- Check if element is in an iframe
- Ensure proper waits are used
- Verify selector is correct

**Timeout errors**: 
- Increase wait time in `WebDriverWait`
- Check if page is loading properly

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Selenium Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
```

### Jenkins Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'pip install -r requirements.txt'
                sh 'pytest tests/ -v --junitxml=results.xml'
            }
        }
    }
    post {
        always {
            junit 'results.xml'
        }
    }
}
```

## 🌐 Multi-Browser Testing

Test across browsers by adding fixtures:

```python
# In conftest.py
@pytest.fixture(params=["chrome", "firefox"])
def driver(request):
    if request.param == "chrome":
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install())
        )
    elif request.param == "firefox":
        driver = webdriver.Firefox(
            service=Service(GeckoDriverManager().install())
        )
    
    driver.maximize_window()
    yield driver
    driver.quit()
```

## 📈 Advanced Features

### Page Object Model

Create page objects for better maintainability:

```python
# pages/login_page.py
from selenium.webdriver.common.by import By

class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.username_field = (By.ID, "username")
        self.password_field = (By.ID, "password")
        self.submit_button = (By.ID, "submit")
    
    def login(self, username, password):
        self.driver.find_element(*self.username_field).send_keys(username)
        self.driver.find_element(*self.password_field).send_keys(password)
        self.driver.find_element(*self.submit_button).click()

# In test
def test_login(driver):
    login_page = LoginPage(driver)
    login_page.login("user", "pass")
```

### Custom Waits

```python
from selenium.webdriver.support.ui import WebDriverWait

def wait_for_element_text(driver, locator, text, timeout=10):
    """Wait for element to contain specific text"""
    return WebDriverWait(driver, timeout).until(
        lambda d: text in d.find_element(*locator).text
    )
```

### Parallel Execution

Install pytest-xdist:

```bash
pip install pytest-xdist
pytest tests/ -v -n 4  # Run on 4 cores
```

## 🔄 Updating Tests

When you regenerate tests with TestCaptive:

1. New tests are saved to `../../Test-Code/Selenium.txt`
2. Run `python scripts/import_tests.py`
3. Tests are automatically updated
4. Run `pytest tests/ -v` to verify

## 📋 Test Reports

### HTML Reports

```bash
pip install pytest-html
pytest tests/ -v --html=report.html
```

### Allure Reports

```bash
pip install allure-pytest
pytest tests/ -v --alluredir=./allure-results
allure serve ./allure-results
```

## 🎓 Learn More

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [Pytest Documentation](https://docs.pytest.org/)
- [WebDriver Manager](https://github.com/SergeyPirogov/webdriver_manager)
- [Selenium Best Practices](https://www.selenium.dev/documentation/test_practices/)

---

**Ready to test!** 🚀
