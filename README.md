# TestCaptive - UI Behavior Recording & Test Generation

![TestCaptive](https://img.shields.io/badge/TestCaptive-v1.3.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

**TestCaptive** captures user interactions in Chrome and generates Playwright (Python) test scripts via a VS Code extension. No server, no WebSocket bridge — fully offline.

## Features

- **Smart Event Capture** — Records clicks, fills, selects, checkboxes, scrolls, and navigation with intelligent deduplication
- **Action-Based Recording** — Coalesces raw DOM events into high-level actions (fill, check, select) like Playwright Codegen
- **Assertion Capture** — Right-click context menu with 7 assertion types (text, visibility, state, URL, attribute, count)
- **Smart Selector Priority** — Prefers `data-testid` → `aria-label` → `id` → `name` → `xpath` → CSS fallback, with a 0–100 confidence score on every selector
- **Evidence Capture (v1.3)** — Network calls, console warnings/errors, page errors, storage snapshots, and implicit-wait hints recorded alongside user actions
- **Allure Reporting (v1.3)** — Every generated step is wrapped in `allure.step(...)` and console/network/page-errors/screenshots are auto-attached
- **Interactive Review Panel (v1.3)** — Per-step enable/disable checkboxes, selector-confidence pills, and a ▶ Run Test button that executes the test directly from VS Code
- **Playwright Code Generation** — Template-based engine with nesting-aware conditional processing
- **Automatic Test Data Extraction** — Captures form values as parameterized test data (JSON)
- **VS Code Integration** — Split-pane UI for session import, event review, and code export

## Project Structure

```
TestCaptive/
├── chrome-extension/           # Chrome Extension (Manifest V3)
│   ├── src/
│   │   ├── content.ts          # Event capture + evidence (network/console/errors/wait-hints)
│   │   ├── background.ts       # Service worker, session management
│   │   ├── popup.ts            # Extension popup UI
│   │   ├── types.ts            # Shared type definitions (incl. SelectorTier + evidence types)
│   │   └── utils.ts            # Utilities incl. generateSelectorWithMeta() (tier + confidence)
│   ├── dist/                   # Built extension (load unpacked from here)
│   ├── build.js                # Build script
│   ├── manifest.json
│   └── popup.html
│
├── vscode-extension/           # VS Code Extension
│   ├── src/
│   │   ├── extension.ts        # Extension entry point
│   │   ├── code-generator.ts   # Template engine + Allure step wrapping + evidence filter
│   │   ├── test-data-manager.ts # Session & test data management
│   │   ├── types.ts            # Type definitions
│   │   └── webview-ui/
│   │       └── review-panel.ts # Main UI: confidence pills, step toggles, Run Test button
│   ├── templates/
│   │   └── playwright_template.py  # Playwright + allure decorated template
│   └── out/                    # Compiled JS
│
├── test-suite-project/         # Pre-configured Playwright test runner
│   ├── conftest.py             # Allure attachments: console / network / errors / trace
│   ├── pytest.ini              # Allure + pytest-html dual reporting
│   ├── requirements.txt        # incl. allure-pytest>=2.13.5
│   ├── run-tests.bat           # Run pytest
│   ├── generate-report.bat     # NEW: build the Allure HTML report
│   └── reports/
│       ├── allure-results/     # Raw Allure data (per run)
│       ├── allure-html/        # Generated Allure report (open index.html)
│       └── report.html         # pytest-html legacy report
│
├── architecture/               # PlantUML architecture diagrams
├── demo.html                   # Demo page for testing
├── build-extensions.bat        # Build both extensions
├── CLEANUP_CANDIDATES.md       # Review-only list of files safe to remove (nothing auto-deleted)
└── package.json                # Root project scripts
```

## Prerequisites

- **Node.js** v16+ and npm
- **VS Code** v1.74+
- **Chrome** or Edge browser
- **Python** 3.8+ (for running generated tests)
- **Allure CLI** (optional, only required to render the HTML Allure report — install via `scoop install allure` or `npm i -g allure-commandline`)

## Installation

### Quick Build
```bash
build-extensions.bat
```

### Manual Setup

**Chrome Extension:**
```bash
cd chrome-extension
npm install
npm run build        # Build to dist/
npm run package      # Create ZIP for distribution
```

**VS Code Extension:**
```bash
cd vscode-extension
npm install
npm run compile      # Compile TypeScript
npm run package      # Create .vsix package
```

**Load Chrome Extension:**
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `chrome-extension/dist/`

**Install VS Code Extension:**
```bash
code --install-extension vscode-extension/testcaptive-1.0.0.vsix
```

## Usage

### 1. Record a Session (Chrome)
1. Click the TestCaptive icon → **Start Recording**
2. Interact with your web app (fill forms, click buttons, navigate)
3. Right-click elements to add **assertions** (text, visibility, state, URL)
4. Click **Stop Recording** — a JSON session file downloads automatically

### 2. Generate Code (VS Code)
1. Open **TestCaptive** panel (record icon in Activity Bar)
2. Drag & drop the session JSON into the import area
3. Events display with color-coded icons; test code generates automatically
4. **Review** each step — uncheck any to exclude it from the generated code; selector-confidence pills (green / orange / red) flag fragile selectors at a glance
5. **▶ Run Test** to execute the test directly from VS Code (output streams to the *TestCaptive: Test Run* Output channel), or **Copy** / **Export** the generated Playwright code

### 3. Run Tests
```bash
cd test-suite-project
pip install -r requirements.txt    # First time only (incl. allure-pytest)
playwright install                  # First time only
run-tests.bat                       # or: pytest
```

### 4. Generate Allure Report
```bash
cd test-suite-project
generate-report.bat                 # builds reports/allure-html/index.html and opens it
```
Requires the Allure CLI on `PATH` (install with `scoop install allure` or `npm i -g allure-commandline`). The legacy pytest-html report is still produced at `reports/report.html`.

## Example Output

```python
import pytest
from playwright.async_api import async_playwright, expect

@pytest.mark.asyncio
async def test_recorded_flow(page, test_data):
    await page.goto("http://localhost:8080", wait_until="domcontentloaded")

    # Fill form fields
    test_value = test_data.get("input-first-name", "")
    await page.get_by_test_id("input-first-name").fill(test_value)

    test_value = test_data.get("input-email", "")
    await page.get_by_test_id("input-email").fill(test_value)

    # Select dropdown
    test_value = test_data.get("select-country", "")
    await page.get_by_test_id("select-country").select_option(test_value)

    # Submit
    await page.get_by_test_id("btn-submit").click()

    # Assertion: Assert success message is visible
    await expect(page.locator('xpath=//*[@id="successPopup"]/h2[1]')).to_be_visible()
```

## Smart Event Capture

The Chrome extension uses action-based recording:
- **Fill events** — Debounced with 1500ms delay; consecutive fills to the same field are merged
- **Select events** — Captures selected option value; suppresses redundant click events
- **Checkbox/Radio** — Records `check` events; suppresses preceding click
- **Click suppression** — Clicks on text inputs and selects are suppressed (the fill/select action covers them)
- **Scroll** — Captures scroll position (Y offset)
- **Navigation** — First navigation marked with `isFirstNavigation` flag

## Selector Priority

The code generator selects the best locator for each element:

| Priority | Selector | Stability | Playwright API |
|----------|----------|-----------|----------------|
| 1 | `data-testid` | Highest | `page.get_by_test_id()` |
| 2 | `aria-label` | High | `page.get_by_label()` |
| 3 | `id` | Medium | `page.locator('#id')` |
| 4 | `name` | Medium | `page.locator('[name=""]')` |
| 5 | `xpath` | Low | `page.locator('xpath=...')` |
| 6 | CSS selector | Lowest | `page.locator('...')` |

## Template Engine

Code generation uses a custom nesting-aware template engine (`SimpleTemplateEngine`) that processes Handlebars-style templates through multiple passes:

1. **Event type selection** — `{{#if (eq event 'fill')}}...{{else if (eq event 'click')}}...{{/if}}`
2. **Element selector resolution** — `{{#if element.testid}}...{{else if element.xpath}}...{{/if}}`
3. **Assertion type selection** — `{{#if (eq assertion.type 'visible')}}...{{/if}}`
4. **Variable substitution** — `{{element.testid}}`, `{{page.url}}`, `{{value}}`

Templates are in `vscode-extension/templates/`. To customize output, edit the template file directly.

## Assertion Types

| Type | Description | Generated Code |
|------|-------------|----------------|
| Text Equals | Exact text match | `to_have_text("...")` |
| Text Contains | Partial text match | `to_contain_text("...")` |
| Visible | Element is visible | `to_be_visible()` |
| Not Visible | Element is hidden | `not_to_be_visible()` |
| Enabled | Element is enabled | `to_be_enabled()` |
| Disabled | Element is disabled | `to_be_disabled()` |
| URL Contains | URL pattern match | `to_have_url(re.compile("..."))` |

## Development

```bash
# Build everything
npm run build:all

# Package for distribution
npm run package:all

# Clean build artifacts
npm run clean:all
```

## Troubleshooting

- **Chrome not recording**: Reload extension at `chrome://extensions/`, check console for errors
- **VS Code extension issues**: Check developer tools (Help → Toggle Developer Tools)
- **Template issues**: Verify template syntax in `vscode-extension/templates/`
- **Selector problems**: Check element properties in session JSON

## License

MIT
