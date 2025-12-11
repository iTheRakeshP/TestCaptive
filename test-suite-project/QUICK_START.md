# 🚀 Quick Start Guide - TestCaptive Test Suite Project

Get up and running in 5 minutes!

## ⚡ Fastest Path to Running Tests

### Step 1: Choose Your Framework

Pick one framework to start with (you can set up others later):

- **Cypress** - Great for JavaScript/TypeScript developers, excellent debugging
- **Playwright** - Modern, fast, supports multiple browsers
- **Selenium** - Industry standard, widely adopted

### Step 2: Setup (Choose One)

#### 🌲 Option A: Cypress

```bash
cd test-suite-project/cypress-suite
npm install

# Option 1: Manual Copy (Recommended if code is clean)
# Copy Test-Code/Cypress.txt to cypress/e2e/testcaptive-generated.cy.ts

# Option 2: Auto-Import (Cleans & converts)
npm run import:tests

npm run test:open
```

#### 🎭 Option B: Playwright

```bash
cd test-suite-project/playwright-suite
pip install -r requirements.txt
playwright install

# Option 1: Manual Copy (Recommended if code is clean)
# Copy Test-Code/Playwright.txt to tests/test_generated.py

# Option 2: Auto-Import (Cleans & converts)
python scripts/import_tests.py

pytest tests/ -v --headed
```

#### 🔧 Option C: Selenium

```bash
cd test-suite-project/selenium-suite
pip install -r requirements.txt

# Option 1: Manual Copy (Recommended if code is clean)
# Copy Test-Code/Selenium.txt to tests/test_generated.py

# Option 2: Auto-Import (Cleans & converts)
python scripts/import_tests.py

pytest tests/ -v
```

### Step 3: You're Done! 🎉

Tests should now be running with the data from your Test-Code folder.

---

## 📋 What Just Happened?

1. ✅ Installed framework dependencies
2. ✅ Imported your generated tests from `Test-Code/` folder
3. ✅ Converted tests to proper format
4. ✅ Loaded test data
5. ✅ Executed tests

---

## 🔄 Regular Workflow

### When You Generate New Tests:

1. **Capture interactions** using Chrome extension
2. **Generate code** using VS Code extension
3. **Add tests to suite** (choose one method):
   
   **Method A: Manual Copy (Simple & Direct)**
   ```bash
   # Cypress
   copy Test-Code\Cypress.txt cypress-suite\cypress\e2e\testcaptive-generated.cy.ts
   
   # Playwright
   copy Test-Code\Playwright.txt playwright-suite\tests\test_generated.py
   
   # Selenium
   copy Test-Code\Selenium.txt selenium-suite\tests\test_generated.py
   ```
   
   **Method B: Auto-Import (Cleans template artifacts)**
   ```bash
   # Cypress
   cd cypress-suite && npm run import:tests
   
   # Playwright
   cd playwright-suite && python scripts/import_tests.py
   
   # Selenium
   cd selenium-suite && python scripts/import_tests.py
   ```

4. **Run tests**:
   ```bash
   # Cypress
   npm test
   
   # Playwright/Selenium
   pytest tests/ -v
   ```

---

## 🎯 Common Commands

### Cypress
```bash
npm test              # Run headless
npm run test:headed   # Run with browser
npm run test:open     # Interactive mode
```

### Playwright
```bash
pytest tests/ -v              # Run headless
pytest tests/ -v --headed     # Run with browser
pytest tests/ -v -s           # With debug output
```

### Selenium
```bash
pytest tests/ -v      # Run tests
pytest tests/ -v -s   # With debug output
```

---

## ⚙️ Customization

### Update Test Data

Edit `test_data.json` in your framework's folder:

```json
{
  "input-first-name": "Your Name",
  "input-last-name": "Your Last Name",
  "input-email": "your.email@example.com"
}
```

### Change Browser

**Cypress**: Edit `cypress.config.ts`

**Playwright**: Modify `conftest.py` fixture

**Selenium**: Update `conftest.py` driver configuration

---

## 🆘 Troubleshooting

### Tests Won't Import

- ✅ Check that `Test-Code/` folder exists
- ✅ Verify `Cypress.txt`, `Playwright.txt`, or `Selenium.txt` exists
- ✅ Run import script from correct directory

### Tests Fail to Run

**Cypress:**
- Run `npm install` again
- Check `baseUrl` in `cypress.config.ts`

**Playwright:**
- Run `playwright install`
- Ensure Python 3.8+

**Selenium:**
- ChromeDriver installs automatically
- Check Chrome is installed

### Browser Doesn't Open

**Cypress:** Use `npm run test:open` or `npm run test:headed`

**Playwright:** Add `--headed` flag

**Selenium:** Remove `headless=True` from `conftest.py`

---

## 📚 Next Steps

1. **Read the full README** - `test-suite-project/README.md`
2. **Framework-specific docs** - Each suite has its own README
3. **Customize configurations** - Adjust to your needs
4. **Add CI/CD** - Examples included in docs

---

## 🎓 Tips

- Start with headed mode to see what's happening
- Use test:open (Cypress) for debugging
- Customize test data for your use cases
- Run import after each code generation
- Check individual suite READMEs for advanced features

---

**Happy Testing! 🚀**

Need help? Check the main README or framework-specific documentation.
