import os
import pytest
from playwright.async_api import async_playwright

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
SCREENSHOTS_DIR = os.path.join(REPORTS_DIR, "screenshots")
TRACES_DIR = os.path.join(REPORTS_DIR, "traces")


@pytest.fixture
async def page(request):
    """Create a new browser page for each test with screenshot-on-failure and tracing."""
    async with async_playwright() as p:
        headless = os.environ.get("HEADLESS", "false").lower() == "true"
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})

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

        await context.close()
        await browser.close()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Attach test outcome to the request node so the page fixture can read it."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
