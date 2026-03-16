import os
import pytest
from playwright.async_api import async_playwright

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
SCREENSHOTS_DIR = os.path.join(REPORTS_DIR, "screenshots")
STEP_SCREENSHOTS_DIR = os.path.join(SCREENSHOTS_DIR, "steps")
TRACES_DIR = os.path.join(REPORTS_DIR, "traces")

_step_counter = 0

async def capture_step(page, label: str):
    """Capture a full-page screenshot for visual step-by-step debugging.
    
    Call this from generated tests after navigation or click events.
    Screenshots are saved to reports/screenshots/steps/ with sequential numbering.
    """
    global _step_counter
    _step_counter += 1
    os.makedirs(STEP_SCREENSHOTS_DIR, exist_ok=True)
    filename = f"step_{_step_counter:03d}_{label}.png"
    await page.screenshot(path=os.path.join(STEP_SCREENSHOTS_DIR, filename), full_page=True)


@pytest.fixture
async def page(request):
    """Create a new browser page for each test with screenshot-on-failure and tracing.
    
    Modes:
      - Default: Launches a fresh Chromium browser.
      - CDP mode: Set CHROME_CDP_URL env var (e.g. http://localhost:9222) to connect
        to an already-running Chrome session (useful for SSO-authenticated VMs).
    """
    async with async_playwright() as p:
        cdp_url = os.environ.get("CHROME_CDP_URL")  # e.g. "http://localhost:9222"
        owns_browser = False

        if cdp_url:
            # Connect to existing Chrome with SSO session already active
            browser = await p.chromium.connect_over_cdp(cdp_url)
            context = browser.contexts[0] if browser.contexts else await browser.new_context(
                viewport={"width": 1280, "height": 720}
            )
        else:
            # Launch a fresh browser (default / local dev mode)
            headless = os.environ.get("HEADLESS", "false").lower() == "true"
            browser = await p.chromium.launch(headless=headless)
            context = await browser.new_context(viewport={"width": 1280, "height": 720})
            owns_browser = True

        # Start tracing for every test (captures DOM snapshots, network, console)
        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        pg = await context.new_page()
        yield pg

        # After test: check if it failed
        failed = request.node.rep_call.failed if hasattr(request.node, "rep_call") else False
        test_name = request.node.name

        # Always save screenshot (pass or fail) as visual proof
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{test_name}.png")
        await pg.screenshot(path=screenshot_path, full_page=True)

        if failed:
            # Save trace only on failure (openable via: playwright show-trace trace.zip)
            os.makedirs(TRACES_DIR, exist_ok=True)
            trace_path = os.path.join(TRACES_DIR, f"{test_name}.zip")
            await context.tracing.stop(path=trace_path)
        else:
            await context.tracing.stop()

        # Close the page we opened (not the browser — user may still be using it)
        await pg.close()

        if owns_browser:
            await context.close()
            await browser.close()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Attach test outcome to the request node so the page fixture can read it."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
