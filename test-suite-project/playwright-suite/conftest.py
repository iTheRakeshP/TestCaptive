import pytest
from playwright.async_api import async_playwright

@pytest.fixture(scope="session")
async def browser():
    """Create a browser instance for the test session"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser):
    """Create a new page for each test"""
    page = await browser.new_page()
    yield page
    await page.close()
