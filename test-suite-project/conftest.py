import os
import pytest
from playwright.async_api import async_playwright

@pytest.fixture
async def page():
    """Create a new browser page for each test"""
    async with async_playwright() as p:
        headless = os.environ.get("HEADLESS", "false").lower() == "true"
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        yield page
        await context.close()
        await browser.close()
