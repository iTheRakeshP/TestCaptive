# Playwright Test Suite for TestCaptive

Modern web testing suite powered by Playwright and TestCaptive.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
playwright install
```

### 2. Import Generated Tests

```bash
python scripts/import_tests.py
```

This script automatically:
- Reads generated tests from `../../Test-Code/Playwright.txt`
- Converts them to pytest-compatible format
- Saves to `tests/test_generated.py`
- Cleans up template artifacts

### 3. Run Tests

```bash
# Run all tests (headless)
pytest tests/ -v

# Run with browser visible
pytest tests/ -v --headed

# Run with detailed output
pytest tests/ -v -s
```

## 📁 Project Structure

```
playwright-suite/
├── tests/                       # Your test files
│   └── test_generated.py
├── scripts/
│   └── import_tests.py          # Test import utility
├── conftest.py                  # Pytest fixtures and config
├── test_data.json              # Test data
├── pytest.ini                   # Pytest configuration
├── requirements.txt             # Python dependencies
└── package.json                 # NPM scripts (optional)
```

## 🔧 Configuration

### Pytest Config (`pytest.ini`)

```ini
[pytest]
asyncio_mode = auto              # Enable async tests
testpaths = tests                # Test directory
python_files = test_*.py         # Test file pattern
addopts = -v --tb=short         # Verbose with short tracebacks
```

### Fixtures (`conftest.py`)

Pre-configured fixtures:
- `browser`: Chromium browser instance (session-scoped)
- `page`: New page for each test
- `test_data`: Loaded test data from JSON

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

- ✅ Modern async/await Python syntax
- ✅ Automatic browser management
- ✅ Built-in waiting strategies
- ✅ Multiple browser support (Chromium, Firefox, WebKit)
- ✅ Mobile emulation ready
- ✅ Network interception
- ✅ Screenshot and video capture

## 📝 Writing Custom Tests

Create a new test in `tests/`:

```python
import pytest
from playwright.async_api import Page

@pytest.mark.asyncio
async def test_custom_flow(page: Page, test_data):
    """Your custom test"""
    await page.goto("https://example.com")
    await page.get_by_role("button", name="Submit").click()
    await page.wait_for_url("**/success")
```

## 🐛 Debugging

### Run in Debug Mode

```bash
# With detailed output
pytest tests/ -v -s

# With breakpoints
pytest tests/ -v -s --pdb
```

### Enable Video Recording

Modify `conftest.py`:

```python
@pytest.fixture(scope="session")
async def browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=1000  # Slow down for visibility
        )
        yield browser
        await browser.close()
```

### Common Issues

**Browser not found**: Run `playwright install`

**Timeout errors**: Increase timeout in test:
```python
await page.get_by_test_id("button").click(timeout=30000)
```

**Import fails**: Ensure `../../Test-Code/Playwright.txt` exists

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
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
      - run: playwright install --with-deps
      - run: pytest tests/ -v
```

### Docker Support

```dockerfile
FROM mcr.microsoft.com/playwright/python:v1.40.0-focal
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["pytest", "tests/", "-v"]
```

## 🌐 Multi-Browser Testing

Test across browsers by modifying fixtures:

```python
@pytest.fixture(params=["chromium", "firefox", "webkit"])
async def browser(request):
    async with async_playwright() as p:
        browser = await getattr(p, request.param).launch()
        yield browser
        await browser.close()
```

## 📈 Advanced Features

### Mobile Emulation

```python
@pytest.fixture
async def page(browser):
    context = await browser.new_context(
        viewport={'width': 375, 'height': 667},
        device_scale_factor=2,
        is_mobile=True
    )
    page = await context.new_page()
    yield page
    await context.close()
```

### Network Interception

```python
async def test_with_network(page: Page):
    # Mock API response
    await page.route("**/api/data", 
        lambda route: route.fulfill(json={"status": "ok"}))
    await page.goto("https://example.com")
```

## 🔄 Updating Tests

When you regenerate tests with TestCaptive:

1. New tests are saved to `../../Test-Code/Playwright.txt`
2. Run `python scripts/import_tests.py`
3. Tests are automatically updated
4. Run `pytest tests/ -v` to verify

## 🎓 Learn More

- [Playwright Python Documentation](https://playwright.dev/python/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Async/Await Guide](https://docs.python.org/3/library/asyncio.html)

---

**Ready to test!** 🚀
