import os
import json
import pytest
import allure
from playwright.async_api import async_playwright

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
SCREENSHOTS_DIR = os.path.join(REPORTS_DIR, "screenshots")
STEP_SCREENSHOTS_DIR = os.path.join(SCREENSHOTS_DIR, "steps")
TRACES_DIR = os.path.join(REPORTS_DIR, "traces")

_step_counter = 0


async def capture_step(page, label: str):
    """Capture a full-page screenshot for visual step-by-step debugging.

    Saves to reports/screenshots/steps/ AND attaches to the active Allure step
    so the screenshot appears inline in the Allure report.
    """
    global _step_counter
    _step_counter += 1
    os.makedirs(STEP_SCREENSHOTS_DIR, exist_ok=True)
    filename = f"step_{_step_counter:03d}_{label}.png"
    path = os.path.join(STEP_SCREENSHOTS_DIR, filename)
    png_bytes = await page.screenshot(full_page=True)
    with open(path, "wb") as f:
        f.write(png_bytes)
    try:
        allure.attach(png_bytes, name=label, attachment_type=allure.attachment_type.PNG)
    except Exception:
        # Allure not running (e.g., user invoked pytest without --alluredir): swallow
        pass


@pytest.fixture
async def page(request):
    """Create a new browser page for each test with screenshot-on-failure and tracing.

    Modes:
      - Default: Launches a fresh Chromium browser.
      - CDP mode: Set CHROME_CDP_URL env var (e.g. http://localhost:9222) to connect
        to an already-running Chrome session (useful for SSO-authenticated VMs).

    Evidence captured per test (attached to Allure on failure):
      - Final screenshot
      - Playwright trace (.zip, openable with `playwright show-trace`)
      - Console log (warn + error)
      - Network log (method, url, status, duration)
      - Page errors (uncaught JS exceptions)
    """
    async with async_playwright() as p:
        cdp_url = os.environ.get("CHROME_CDP_URL")  # e.g. "http://localhost:9222"
        owns_browser = False

        if cdp_url:
            # Connect to existing Chrome with SSO session already active
            browser = await p.chromium.connect_over_cdp(cdp_url)
            context = browser.contexts[0] if browser.contexts else await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
        else:
            # Launch a fresh browser (default / local dev mode)
            headless = os.environ.get("HEADLESS", "false").lower() == "true"
            browser = await p.chromium.launch(headless=headless, args=["--start-maximized"])
            context = await browser.new_context(viewport={"width": 1920, "height": 1080})
            owns_browser = True

        # Start tracing for every test (captures DOM snapshots, network, console)
        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        pg = await context.new_page()

        # ---------- Evidence collectors (v1.3) ----------
        console_log: list[dict] = []
        network_log: list[dict] = []
        page_errors: list[dict] = []

        def _on_console(msg):
            try:
                if msg.type in ("warning", "error"):
                    console_log.append({"type": msg.type, "text": msg.text, "location": str(msg.location)})
            except Exception:
                pass

        def _on_pageerror(err):
            try:
                page_errors.append({"message": str(err)})
            except Exception:
                pass

        def _on_request_finished(req):
            try:
                resp = req.response_sync() if hasattr(req, "response_sync") else None
                # Use async-safe path: just record what we can synchronously read
                network_log.append({
                    "method": req.method,
                    "url": req.url,
                    "resource_type": req.resource_type,
                })
            except Exception:
                pass

        def _on_response(resp):
            try:
                network_log.append({
                    "method": resp.request.method,
                    "url": resp.url,
                    "status": resp.status,
                    "ok": resp.ok,
                })
            except Exception:
                pass

        pg.on("console", _on_console)
        pg.on("pageerror", _on_pageerror)
        pg.on("response", _on_response)

        # PRE-navigation: capture current step state when Next/Submit buttons are clicked
        async def capture_before_nav(source):
            global _step_counter
            _step_counter += 1
            os.makedirs(STEP_SCREENSHOTS_DIR, exist_ok=True)
            url_slug = pg.url.split("/")[-1].replace("#", "").replace("?", "_")[:40]
            filename = f"step_{_step_counter:03d}_before_{url_slug}.png"
            try:
                await pg.screenshot(path=os.path.join(STEP_SCREENSHOTS_DIR, filename), full_page=True)
            except Exception:
                pass

        await pg.expose_binding("__captureBeforeNav__", capture_before_nav)
        await pg.add_init_script("""
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('button, a');
                if (btn && /next|submit/i.test((btn.textContent || '').trim())) {
                    window.__captureBeforeNav__();
                }
            }, true);
        """)

        # POST-navigation: wait for Angular to render, then capture the loaded page
        async def on_navigation(frame):
            if frame == pg.main_frame:
                global _step_counter
                _step_counter += 1
                os.makedirs(STEP_SCREENSHOTS_DIR, exist_ok=True)
                url_slug = frame.url.split("/")[-1].replace("#", "").replace("?", "_")[:40]
                filename = f"step_{_step_counter:03d}_after_{url_slug}.png"
                try:
                    await pg.wait_for_load_state("networkidle", timeout=10000)
                    await pg.screenshot(path=os.path.join(STEP_SCREENSHOTS_DIR, filename), full_page=True)
                except Exception:
                    pass

        pg.on("framenavigated", on_navigation)

        yield pg

        # After test: check if it failed
        failed = request.node.rep_call.failed if hasattr(request.node, "rep_call") else False
        test_name = request.node.name

        # Always save screenshot (pass or fail) as visual proof
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{test_name}.png")
        try:
            png_bytes = await pg.screenshot(full_page=True)
            with open(screenshot_path, "wb") as f:
                f.write(png_bytes)
            # Attach final screenshot to Allure
            try:
                allure.attach(png_bytes, name="final-screenshot", attachment_type=allure.attachment_type.PNG)
            except Exception:
                pass
        except Exception:
            png_bytes = None

        # Attach console + network + page errors to Allure (always — useful for passing tests too)
        try:
            if console_log:
                allure.attach(json.dumps(console_log, indent=2), name="console-log",
                              attachment_type=allure.attachment_type.JSON)
            if network_log:
                allure.attach(json.dumps(network_log, indent=2), name="network-log",
                              attachment_type=allure.attachment_type.JSON)
            if page_errors:
                allure.attach(json.dumps(page_errors, indent=2), name="page-errors",
                              attachment_type=allure.attachment_type.JSON)
        except Exception:
            pass

        if failed:
            # Save trace only on failure (openable via: playwright show-trace trace.zip)
            os.makedirs(TRACES_DIR, exist_ok=True)
            trace_path = os.path.join(TRACES_DIR, f"{test_name}.zip")
            await context.tracing.stop(path=trace_path)
            try:
                with open(trace_path, "rb") as f:
                    allure.attach(f.read(), name="playwright-trace.zip",
                                  attachment_type=allure.attachment_type.ZIP)
            except Exception:
                pass
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
